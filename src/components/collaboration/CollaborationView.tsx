import React, { useEffect, useRef, useState } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { CollaborationSession, SharedResource } from '@/types/collaboration';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { NotificationToast } from '../common/NotificationToast';
import { AchievementBadge } from '../common/AchievementBadge';
import { ResourceCard } from '../common/ResourceCard';
import { ProgressChart } from '../common/ProgressChart';
import { MilestoneTracker } from '../common/MilestoneTracker';
import { LeaderboardPanel } from '../common/LeaderboardPanel';
import styles from './CollaborationView.module.css';

interface CollaborationViewProps {
    sessionId: string;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export const CollaborationView: React.FC<CollaborationViewProps> = ({ sessionId, onComplete, onError }) => {
    const {
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
    } = useCollaboration(sessionId);

    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const [selectedResource, setSelectedResource] = useState<SharedResource | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    useEffect(() => {
        if (error && onError) {
            onError(error);
        }
    }, [error, onError]);

    useEffect(() => {
        if (collaborationSession?.status === 'completed' && onComplete) {
            onComplete();
        }
    }, [collaborationSession?.status, onComplete]);

    const handleSendMessage = async () => {
        if (!messageInputRef.current?.value.trim()) return;

        await sendMessage(messageInputRef.current.value);
        messageInputRef.current.value = '';
    };

    const handleShareResource = async (resourceId: string, type: SharedResource['type'], metadata?: any) => {
        await shareResource(resourceId, type, undefined, 'all', metadata);
    };

    const handleUpdateProgress = async (progress: Partial<CollaborationSession['progress']>) => {
        await updateProgress(progress);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!collaborationSession) {
        return <div className={styles.error}>Nem sikerült betölteni a közös tanulási folyamatot.</div>;
    }

    return (
        <ErrorBoundary>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerMain}>
                        <h1>{collaborationSession.title}</h1>
                        <p>{collaborationSession.description}</p>
                        <div className={styles.tags}>
                            {collaborationSession.tags.map(tag => (
                                <span key={tag} className={styles.tag}>{tag}</span>
                            ))}
                        </div>
                    </div>
                    <div className={styles.headerInfo}>
                        <div className={styles.participants}>
                            <span>Résztvevők: {collaborationSession.participants.length}/{collaborationSession.maxParticipants}</span>
                            <div className={styles.participantAvatars}>
                                {collaborationSession.participants.map(participant => (
                                    <div key={participant.id} className={styles.avatar} title={participant.name}>
                                        {participant.name[0]}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.sessionMeta}>
                            <span>Nehézség: {collaborationSession.difficulty}</span>
                            <span>Időtartam: {collaborationSession.estimatedDuration} perc</span>
                        </div>
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.mainContent}>
                        <div className={styles.chat} ref={chatRef}>
                            {collaborationSession.chatMessages.map(message => (
                                <div key={message.id} className={`${styles.message} ${message.sender.id === collaborationSession.createdBy.id ? styles.own : ''}`}>
                                    <div className={styles.messageHeader}>
                                        <span className={styles.sender}>{message.sender.name}</span>
                                        <span className={styles.timestamp}>{new Date(message.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className={styles.messageContent}>
                                        {message.type === 'text' ? (
                                            <p>{message.content}</p>
                                        ) : message.type === 'resource' ? (
                                            <div className={styles.resourceMessage}>
                                                <p>{message.content}</p>
                                                {message.metadata?.resourceId && (
                                                    <ResourceCard
                                                        resource={collaborationSession.sharedResources.find(r => r.id === message.metadata?.resourceId)}
                                                        onShare={() => handleShareResource(message.metadata!.resourceId!, 'resource')}
                                                    />
                                                )}
                                            </div>
                                        ) : message.type === 'progress' ? (
                                            <div className={styles.progressMessage}>
                                                <p>{message.content}</p>
                                                <ProgressChart
                                                    progress={message.metadata?.progressValue || 0}
                                                    type={message.metadata?.progressType}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.inputArea}>
                            <textarea
                                ref={messageInputRef}
                                placeholder="Írd be az üzeneted..."
                                className={styles.messageInput}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button onClick={handleSendMessage} className={styles.sendButton}>
                                Küldés
                            </button>
                        </div>
                    </div>

                    <div className={styles.sidebar}>
                        {collaborationSession.settings.gamificationSettings.enableAchievements && (
                            <div className={styles.achievements}>
                                <h2>Eredmények</h2>
                                <div className={styles.achievementList}>
                                    {achievements.map(achievement => (
                                        <AchievementBadge
                                            key={achievement.id}
                                            achievement={achievement}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.resources}>
                            <h2>Megosztott erőforrások</h2>
                            {collaborationSession.sharedResources.map(resource => (
                                <ResourceCard
                                    key={resource.id}
                                    resource={resource}
                                    onShare={() => handleShareResource(resource.id, resource.type)}
                                    onClick={() => setSelectedResource(resource)}
                                />
                            ))}
                        </div>

                        <div className={styles.progress}>
                            <h2>Haladás</h2>
                            <MilestoneTracker
                                milestones={collaborationSession.progress.groupProgress.milestones}
                                currentProgress={collaborationSession.progress.groupProgress.completedSteps}
                                totalSteps={collaborationSession.progress.groupProgress.totalSteps}
                            />
                            <div className={styles.progressStats}>
                                <div>
                                    <span>Egyéni haladás:</span>
                                    <ProgressChart
                                        progress={collaborationSession.progress.individualProgress[collaborationSession.createdBy.id].completedSteps}
                                        total={collaborationSession.progress.individualProgress[collaborationSession.createdBy.id].totalSteps}
                                    />
                                </div>
                                <div>
                                    <span>Csoport haladás:</span>
                                    <ProgressChart
                                        progress={collaborationSession.progress.groupProgress.completedSteps}
                                        total={collaborationSession.progress.groupProgress.totalSteps}
                                    />
                                </div>
                            </div>
                        </div>

                        {collaborationSession.settings.gamificationSettings.enableLeaderboard && (
                            <button
                                className={styles.leaderboardButton}
                                onClick={() => setShowLeaderboard(!showLeaderboard)}
                            >
                                Ranglista megjelenítése
                            </button>
                        )}
                    </div>
                </div>

                {notifications.map(notification => (
                    <NotificationToast
                        key={notification.id}
                        type={notification.type}
                        message={notification.message}
                    />
                ))}

                {showLeaderboard && (
                    <LeaderboardPanel
                        participants={collaborationSession.participants}
                        progress={collaborationSession.progress}
                        onClose={() => setShowLeaderboard(false)}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}; 