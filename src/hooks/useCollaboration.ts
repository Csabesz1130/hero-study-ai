import { useState, useEffect, useCallback, useRef } from 'react';
import { CollaborationSession, ChatMessage, SharedResource, CollaborationSettings, Achievement } from '@/types/collaboration';
import { useSession } from 'next-auth/react';
import { useResourceCache } from './useResourceCache';
import { useSpacedRepetition } from './useSpacedRepetition';

export const useCollaboration = (sessionId: string) => {
    const { data: userSession } = useSession();
    const { getResource, cacheResource } = useResourceCache();
    const { scheduleReview } = useSpacedRepetition();

    const [collaborationSession, setCollaborationSession] = useState<CollaborationSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [notifications, setNotifications] = useState<{ id: string; type: string; message: string }[]>([]);

    const chatRef = useRef<HTMLDivElement>(null);
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
    const animationRefs = useRef<Map<string, Animation>>(new Map());
    const wsRef = useRef<WebSocket | null>(null);

    const cleanupResources = useCallback(() => {
        // Hangfájlok felszabadítása
        audioRefs.current.forEach(audio => {
            audio.pause();
            audio.src = '';
            audio.load();
        });
        audioRefs.current.clear();

        // Animációk leállítása
        animationRefs.current.forEach(animation => {
            animation.cancel();
        });
        animationRefs.current.clear();
    }, []);

    const fetchSession = useCallback(async () => {
        try {
            const response = await fetch(`/api/collaboration/${sessionId}`);
            if (!response.ok) throw new Error('Failed to fetch session');

            const data = await response.json();
            setCollaborationSession(data);

            // Gyorsítótárazás a megosztott erőforrásokhoz
            data.sharedResources.forEach((resource: SharedResource) => {
                cacheResource(resource.resourceId, resource);
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, cacheResource]);

    const handleAchievement = useCallback((achievement: Achievement) => {
        setAchievements(prev => [...prev, achievement]);
        if (collaborationSession?.settings.notificationPreferences.onAchievement) {
            setNotifications(prev => [...prev, {
                id: achievement.id,
                type: 'achievement',
                message: `Új eredmény: ${achievement.title}`
            }]);
        }
    }, [collaborationSession?.settings.notificationPreferences.onAchievement]);

    const checkMilestones = useCallback(() => {
        if (!collaborationSession || !userSession?.user) return;

        const userProgress = collaborationSession.progress.individualProgress[userSession.user.id];
        const milestones = collaborationSession.progress.groupProgress.milestones;

        milestones.forEach(milestone => {
            if (!milestone.completed && userProgress.completedSteps >= milestone.requirements) {
                updateProgress({
                    groupProgress: {
                        ...collaborationSession.progress.groupProgress,
                        milestones: milestones.map(m =>
                            m.id === milestone.id
                                ? { ...m, completed: true, completedAt: new Date() }
                                : m
                        )
                    }
                });

                if (collaborationSession.settings.notificationPreferences.onMilestone) {
                    setNotifications(prev => [...prev, {
                        id: milestone.id,
                        type: 'milestone',
                        message: `Mérföldkő elérve: ${milestone.title}`
                    }]);
                }
            }
        });
    }, [collaborationSession, userSession?.user, updateProgress]);

    const handleModeration = useCallback(async (content: string): Promise<boolean> => {
        if (!collaborationSession?.settings.moderationSettings.enableWordFilter) return true;

        try {
            const response = await fetch('/api/moderation/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (!response.ok) throw new Error('Moderation check failed');

            const { isAllowed } = await response.json();
            return isAllowed;
        } catch (err) {
            console.error('Moderation error:', err);
            return collaborationSession?.settings.moderationSettings.autoModerate ?? false;
        }
    }, [collaborationSession?.settings.moderationSettings]);

    const sendMessage = useCallback(async (content: string, type: ChatMessage['type'] = 'text', metadata?: ChatMessage['metadata']) => {
        if (!userSession?.user || !collaborationSession) return;

        try {
            // Moderáció ellenőrzése
            const isAllowed = await handleModeration(content);
            if (!isAllowed) {
                setError(new Error('Az üzenet nem felel meg a moderációs szabályoknak'));
                return;
            }

            const response = await fetch(`/api/collaboration/${sessionId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, type, metadata })
            });

            if (!response.ok) throw new Error('Failed to send message');

            const newMessage = await response.json();
            setCollaborationSession(prev => prev ? {
                ...prev,
                chatMessages: [...prev.chatMessages, newMessage]
            } : null);

            // Gamification pontok hozzáadása
            if (collaborationSession.settings.gamificationSettings.enablePoints) {
                const points = 10 * collaborationSession.settings.gamificationSettings.pointsMultiplier;
                updateProgress({
                    individualProgress: {
                        [userSession.user.id]: {
                            ...collaborationSession.progress.individualProgress[userSession.user.id],
                            contributions: collaborationSession.progress.individualProgress[userSession.user.id].contributions + points
                        }
                    }
                });
            }

            if (chatRef.current) {
                chatRef.current.scrollTop = chatRef.current.scrollHeight;
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to send message'));
        }
    }, [sessionId, userSession, collaborationSession, handleModeration, updateProgress]);

    const shareResource = useCallback(async (resourceId: string, type: SharedResource['type'], description?: string, visibility: SharedResource['visibility'] = 'all', metadata?: SharedResource['metadata']) => {
        if (!userSession?.user || !collaborationSession) return;

        try {
            const response = await fetch(`/api/collaboration/${sessionId}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resourceId,
                    type,
                    description,
                    visibility,
                    metadata,
                    visibleTo: visibility === 'specific_users' ? metadata?.visibleTo : undefined
                })
            });

            if (!response.ok) throw new Error('Failed to share resource');

            const newResource = await response.json();
            setCollaborationSession(prev => prev ? {
                ...prev,
                sharedResources: [...prev.sharedResources, newResource]
            } : null);

            // Gamification pontok hozzáadása
            if (collaborationSession.settings.gamificationSettings.enablePoints) {
                const points = 20 * collaborationSession.settings.gamificationSettings.pointsMultiplier;
                updateProgress({
                    individualProgress: {
                        [userSession.user.id]: {
                            ...collaborationSession.progress.individualProgress[userSession.user.id],
                            contributions: collaborationSession.progress.individualProgress[userSession.user.id].contributions + points
                        }
                    }
                });
            }

            cacheResource(resourceId, newResource);

            // Ismétlés ütemezése, ha engedélyezve van
            if (collaborationSession.settings.learningSettings.enableSpacedRepetition) {
                scheduleReview(resourceId, {
                    initialDifficulty: metadata?.difficulty || 'intermediate',
                    type: type
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to share resource'));
        }
    }, [sessionId, userSession, collaborationSession, cacheResource, scheduleReview]);

    const updateProgress = useCallback(async (progress: Partial<CollaborationSession['progress']>) => {
        if (!userSession?.user) return;

        try {
            const response = await fetch(`/api/collaboration/${sessionId}/progress`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(progress)
            });

            if (!response.ok) throw new Error('Failed to update progress');

            const updatedProgress = await response.json();
            setCollaborationSession(prev => prev ? {
                ...prev,
                progress: updatedProgress
            } : null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update progress'));
        }
    }, [sessionId, userSession]);

    useEffect(() => {
        fetchSession();

        wsRef.current = new WebSocket(`ws://${window.location.host}/api/collaboration/${sessionId}/ws`);

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'achievement') {
                handleAchievement(data.achievement);
            } else if (data.type === 'session_update') {
                setCollaborationSession(prev => prev ? {
                    ...prev,
                    ...data.session
                } : null);
            }
        };

        const checkAchievementsInterval = setInterval(() => {
            if (collaborationSession?.settings.gamificationSettings.enableAchievements) {
                checkMilestones();
            }
        }, 60000); // Percenként ellenőrzi a mérföldköveket

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            clearInterval(checkAchievementsInterval);
            cleanupResources();
        };
    }, [sessionId, fetchSession, cleanupResources, handleAchievement, checkMilestones, collaborationSession?.settings.gamificationSettings.enableAchievements]);

    return {
        collaborationSession,
        isLoading,
        error,
        chatRef,
        sendMessage,
        shareResource,
        updateProgress,
        cleanupResources,
        achievements,
        notifications,
        handleModeration
    };
}; 