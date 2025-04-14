import { useState, useEffect, useCallback, useRef } from 'react';
import { CollaborationSession, ChatMessage, SharedResource, CollaborationSettings } from '@/types/collaboration';
import { useSession } from 'next-auth/react';
import { useResourceCache } from './useResourceCache';

export const useCollaboration = (sessionId: string) => {
    const { data: userSession } = useSession();
    const { getResource, cacheResource } = useResourceCache();

    const [collaborationSession, setCollaborationSession] = useState<CollaborationSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const chatRef = useRef<HTMLDivElement>(null);
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
    const animationRefs = useRef<Map<string, Animation>>(new Map());

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

    const sendMessage = useCallback(async (content: string, type: ChatMessage['type'] = 'text', metadata?: ChatMessage['metadata']) => {
        if (!userSession?.user) return;

        try {
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

            // Automatikus görgetés az új üzenethez
            if (chatRef.current) {
                chatRef.current.scrollTop = chatRef.current.scrollHeight;
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to send message'));
        }
    }, [sessionId, userSession]);

    const shareResource = useCallback(async (resourceId: string, type: SharedResource['type'], description?: string) => {
        if (!userSession?.user) return;

        try {
            const response = await fetch(`/api/collaboration/${sessionId}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId, type, description })
            });

            if (!response.ok) throw new Error('Failed to share resource');

            const newResource = await response.json();
            setCollaborationSession(prev => prev ? {
                ...prev,
                sharedResources: [...prev.sharedResources, newResource]
            } : null);

            // Gyorsítótárazás az új erőforráshoz
            cacheResource(resourceId, newResource);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to share resource'));
        }
    }, [sessionId, userSession, cacheResource]);

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

        // WebSocket kapcsolat a valós idejű frissítésekhez
        const ws = new WebSocket(`ws://${window.location.host}/api/collaboration/${sessionId}/ws`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setCollaborationSession(prev => prev ? {
                ...prev,
                ...data
            } : null);
        };

        return () => {
            ws.close();
            cleanupResources();
        };
    }, [sessionId, fetchSession, cleanupResources]);

    return {
        collaborationSession,
        isLoading,
        error,
        chatRef,
        sendMessage,
        shareResource,
        updateProgress,
        cleanupResources
    };
}; 