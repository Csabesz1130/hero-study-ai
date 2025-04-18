import React, { useState, useEffect, useCallback } from 'react';
import { MicroLearningContent, UserEngagement, LearningStreak, Achievement } from '@/types/microLearning';
import { useNotification } from '@/hooks/useNotification';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import styles from './MicroLearningModule.module.css';

interface MicroLearningModuleProps {
    content: MicroLearningContent;
    onComplete: (engagement: UserEngagement) => void;
    onAchievement: (achievement: Achievement) => void;
}

export const MicroLearningModule: React.FC<MicroLearningModuleProps> = ({
    content,
    onComplete,
    onAchievement
}) => {
    const [currentStep, setCurrentStep] = useState<'content' | 'quiz' | 'feedback'>('content');
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<{ difficulty: number; relevance: number; comments?: string }>();
    const [streak, setStreak] = useState<LearningStreak>({
        userId: 'current-user',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        totalCompleted: 0,
        dailyGoal: 3
    });

    const { showNotification } = useNotification();
    const { saveContent, getContent } = useOfflineStorage();
    const { scheduleReview } = useSpacedRepetition();

    useEffect(() => {
        // Tartalom offline mentése
        saveContent(content);

        // Értesítés beállítása
        showNotification({
            title: 'Új mikro-tanulási tartalom',
            body: content.title,
            data: { contentId: content.id }
        });
    }, [content]);

    const handleQuizSubmit = useCallback(() => {
        if (!content.quiz) return;

        const score = quizAnswers.reduce((acc, answer, index) => {
            return acc + (answer === content.quiz!.questions[index].correctAnswer ? 1 : 0);
        }, 0);

        const engagement: UserEngagement = {
            userId: 'current-user',
            contentId: content.id,
            timestamp: new Date(),
            duration: content.duration,
            completionStatus: 'completed',
            quizScore: score / content.quiz.questions.length,
            feedback
        };

        onComplete(engagement);

        // Streak frissítése
        const newStreak = {
            ...streak,
            currentStreak: streak.currentStreak + 1,
            totalCompleted: streak.totalCompleted + 1,
            lastActivityDate: new Date()
        };

        if (newStreak.currentStreak > streak.longestStreak) {
            newStreak.longestStreak = newStreak.currentStreak;

            // Achievement kiosztása
            onAchievement({
                id: crypto.randomUUID(),
                userId: 'current-user',
                type: 'streak',
                title: 'Új rekord!',
                description: `${newStreak.currentStreak} napos streak`,
                earnedAt: new Date(),
                points: newStreak.currentStreak * 10,
                shared: false
            });
        }

        setStreak(newStreak);
        setCurrentStep('feedback');

        // Spaced repetition ütemezés
        scheduleReview(content.id, score / content.quiz.questions.length);
    }, [quizAnswers, content, feedback, streak]);

    const handleShare = useCallback(() => {
        if (navigator.share) {
            navigator.share({
                title: 'Mikro-tanulási teljesítmény',
                text: `Teljesítettem a(z) ${content.title} mikro-tanulási modult! Streak: ${streak.currentStreak} nap`,
                url: window.location.href
            });
        }
    }, [content, streak]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>{content.title}</h1>
                <div className={styles.streak}>
                    <span>Streak: {streak.currentStreak} nap</span>
                    <span>Teljesítve: {streak.totalCompleted}</span>
                </div>
            </div>

            {currentStep === 'content' && (
                <div className={styles.content}>
                    <p className={styles.summary}>{content.summary}</p>
                    <div className={styles.mainContent}>
                        {content.content.split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                    {content.mediaUrls?.map((url, index) => (
                        <img key={index} src={url} alt={`Tartalom illusztráció ${index + 1}`} />
                    ))}
                    <button
                        className={styles.nextButton}
                        onClick={() => setCurrentStep('quiz')}
                    >
                        Tovább a kvízhez
                    </button>
                </div>
            )}

            {currentStep === 'quiz' && content.quiz && (
                <div className={styles.quiz}>
                    {content.quiz.questions.map((question, index) => (
                        <div key={index} className={styles.question}>
                            <h3>{question.text}</h3>
                            <div className={styles.options}>
                                {question.options.map((option, optionIndex) => (
                                    <button
                                        key={optionIndex}
                                        className={`${styles.option} ${quizAnswers[index] === optionIndex ? styles.selected : ''
                                            }`}
                                        onClick={() => {
                                            const newAnswers = [...quizAnswers];
                                            newAnswers[index] = optionIndex;
                                            setQuizAnswers(newAnswers);
                                        }}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button
                        className={styles.submitButton}
                        onClick={handleQuizSubmit}
                        disabled={quizAnswers.length !== content.quiz.questions.length}
                    >
                        Beküldés
                    </button>
                </div>
            )}

            {currentStep === 'feedback' && (
                <div className={styles.feedback}>
                    <h2>Visszajelzés</h2>
                    <div className={styles.feedbackForm}>
                        <label>
                            Nehézség:
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={feedback?.difficulty || 3}
                                onChange={(e) => setFeedback({
                                    ...feedback,
                                    difficulty: parseInt(e.target.value)
                                })}
                            />
                        </label>
                        <label>
                            Relevancia:
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={feedback?.relevance || 3}
                                onChange={(e) => setFeedback({
                                    ...feedback,
                                    relevance: parseInt(e.target.value)
                                })}
                            />
                        </label>
                        <textarea
                            placeholder="Megjegyzések..."
                            value={feedback?.comments || ''}
                            onChange={(e) => setFeedback({
                                ...feedback,
                                comments: e.target.value
                            })}
                        />
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.shareButton} onClick={handleShare}>
                            Megosztás
                        </button>
                        <button className={styles.completeButton} onClick={handleQuizSubmit}>
                            Befejezés
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}; 