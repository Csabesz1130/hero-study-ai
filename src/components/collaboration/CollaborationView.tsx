import React, { useEffect, useRef } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { CollaborationSession } from '@/types/collaboration';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';
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
        cleanupResources
    } = useCollaboration(sessionId);

    const messageInputRef = useRef<HTMLTextAreaElement>(null);

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

    const handleShareResource = async (resourceId: string, type: 'transformation' | 'progress' | 'resource') => {
        await shareResource(resourceId, type);
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
                    <h1>{collaborationSession.title}</h1>
                    <p>{collaborationSession.description}</p>
                    <div className={styles.participants}>
                        <span>Résztvevők: {collaborationSession.participants.length}/{collaborationSession.maxParticipants}</span>
                    </div>
                </div>

                <div className={styles.content}>
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
                                                <button
                                                    onClick={() => handleShareResource(message.metadata.resourceId, 'resource')}
                                                    className={styles.shareButton}
                                                >
                                                    Megosztás
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.sidebar}>
                        <div className={styles.resources}>
                            <h2>Megosztott erőforrások</h2>
                            {collaborationSession.sharedResources.map(resource => (
                                <div key={resource.id} className={styles.resource}>
                                    <h3>{resource.type}</h3>
                                    <p>{resource.description}</p>
                                    <div className={styles.resourceMeta}>
                                        <span>Megosztotta: {resource.sharedBy.name}</span>
                                        <span>{new Date(resource.sharedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.progress}>
                            <h2>Haladás</h2>
                            <div className={styles.progressStats}>
                                <div>
                                    <span>Egyéni haladás:</span>
                                    <span>{collaborationSession.progress.individualProgress}%</span>
                                </div>
                                <div>
                                    <span>Csoport haladás:</span>
                                    <span>{collaborationSession.progress.groupProgress}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.inputArea}>
                    <textarea
                        ref={messageInputRef}
                        placeholder="Írd be az üzeneted..."
                        className={styles.messageInput}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSendMessage();
                            }
                        }}
                    />
                    <button onClick={handleSendMessage} className={styles.sendButton}>
                        Küldés
                    </button>
                </div>
            </div>
        </ErrorBoundary>
    );
}; 