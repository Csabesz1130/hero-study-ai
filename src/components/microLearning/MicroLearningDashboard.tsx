import React, { useState, useEffect, useCallback } from 'react';
import { MicroLearningContent, UserEngagement, UserPreferences, Achievement, Recommendation } from '@/types/microLearning';
import { MicroLearningModule } from './MicroLearningModule';
import { ContentCondenser } from '@/services/contentCondenser';
import { ContentRecommender } from '@/services/contentRecommender';
import { notificationService } from '@/services/notificationService';
import { offlineStorage } from '@/services/offlineStorage';
import styles from './MicroLearningDashboard.module.css';

interface MicroLearningDashboardProps {
    userId: string;
    onContentSelect: (content: MicroLearningContent) => void;
}

export const MicroLearningDashboard: React.FC<MicroLearningDashboardProps> = ({ userId, onContentSelect }) => {
    const [contents, setContents] = useState<MicroLearningContent[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>({
        userId: 'current-user',
        preferredTimes: [
            { day: 'weekday', time: '9-12' },
            { day: 'weekday', time: '15-18' }
        ],
        notificationEnabled: true,
        preferredDuration: 5,
        topics: [],
        difficultyPreference: 'intermediate',
        offlineMode: true,
        socialSharing: true
    });
    const [engagements, setEngagements] = useState<UserEngagement[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadInitialData();
        setupNotifications();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);

            // Offline tartalom betöltése
            const offlineContents = await offlineStorage.getAllContent();
            if (offlineContents.length > 0) {
                setContents(offlineContents);
            } else {
                // Ha nincs offline tartalom, betöltjük a szerverről
                const response = await fetch('/api/contents');
                const serverContents = await response.json();
                setContents(serverContents);

                // Offline mentés
                for (const content of serverContents) {
                    await offlineStorage.saveContent(content);
                }
            }

            // Felhasználói preferenciák betöltése
            const preferencesResponse = await fetch('/api/users/current/preferences');
            const serverPreferences = await preferencesResponse.json();
            setUserPreferences(serverPreferences);

            // Interakciók betöltése
            const engagementsResponse = await fetch('/api/engagements');
            const serverEngagements = await engagementsResponse.json();
            setEngagements(serverEngagements);

            // Achievement-ök betöltése
            const achievementsResponse = await fetch('/api/achievements');
            const serverAchievements = await achievementsResponse.json();
            setAchievements(serverAchievements);

            // Ajánlások generálása
            updateRecommendations(serverContents, serverEngagements, serverPreferences);
        } catch (error) {
            setError('Adatok betöltése sikertelen');
            console.error('Adatok betöltése sikertelen:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupNotifications = async () => {
        try {
            const permission = await notificationService.requestPermission();
            if (permission) {
                notificationService.setupMessageHandler(handleNotification);
            }
        } catch (error) {
            console.error('Értesítések beállítása sikertelen:', error);
        }
    };

    const handleNotification = (payload: any) => {
        // Értesítés kezelése
        console.log('Értesítés érkezett:', payload);
    };

    const updateRecommendations = useCallback((
        contents: MicroLearningContent[],
        engagements: UserEngagement[],
        preferences: UserPreferences
    ) => {
        const recommendations = ContentRecommender.recommendContent(
            contents,
            engagements,
            preferences
        );

        setRecommendations(recommendations
            .slice(0, 3)
            .map(rec => ({
                content: contents.find(c => c.id === rec.contentId)!,
                recommendation: rec
            }))
            .filter(Boolean)
        );
    }, []);

    const handleContentComplete = async (engagement: UserEngagement) => {
        try {
            // Interakció mentése
            setEngagements(prev => [...prev, engagement]);
            await offlineStorage.saveEngagement(engagement);
            await offlineStorage.queueSync({
                type: 'engagement',
                action: 'create',
                data: engagement
            });

            // Ajánlások frissítése
            updateRecommendations(contents, [...engagements, engagement], userPreferences);

            // Értesítés küldése
            await notificationService.scheduleNotification(
                {
                    title: 'Gratulálunk!',
                    body: 'Sikeresen teljesítetted a mikro-tanulási modult!'
                },
                userPreferences
            );
        } catch (error) {
            console.error('Interakció mentése sikertelen:', error);
        }
    };

    const handleAchievement = async (achievement: Achievement) => {
        try {
            // Achievement mentése
            setAchievements(prev => [...prev, achievement]);

            // Értesítés küldése
            await notificationService.scheduleNotification(
                {
                    title: 'Új achievement!',
                    body: achievement.title
                },
                userPreferences
            );

            // Megosztás, ha engedélyezve van
            if (userPreferences.socialSharing && achievement.shared) {
                if (navigator.share) {
                    await navigator.share({
                        title: 'Új achievement!',
                        text: `${achievement.title} - ${achievement.description}`,
                        url: window.location.href
                    });
                }
            }
        } catch (error) {
            console.error('Achievement mentése sikertelen:', error);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Betöltés...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Mikro-tanulási Irányítópult</h1>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{engagements.filter(e => e.completed).length}</span>
                        <span className={styles.statLabel}>Befejezett tartalom</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>
                            {Math.round(engagements.reduce((acc, e) => acc + e.timeSpent, 0) / 60)} perc
                        </span>
                        <span className={styles.statLabel}>Tanulási idő</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{achievements.length}</span>
                        <span className={styles.statLabel}>Elért eredmények</span>
                    </div>
                </div>
            </header>

            <section className={styles.recommendations}>
                <h2>Ajánlott tartalmak</h2>
                <div className={styles.recommendationGrid}>
                    {recommendations.map(recommendation => (
                        <div
                            key={recommendation.content.id}
                            className={styles.recommendationCard}
                            onClick={() => onContentSelect(recommendation.content)}
                        >
                            <img
                                src={recommendation.content.thumbnail}
                                alt={recommendation.content.title}
                                className={styles.thumbnail}
                            />
                            <div className={styles.content}>
                                <h3>{recommendation.content.title}</h3>
                                <p>{recommendation.content.description}</p>
                                <div className={styles.meta}>
                                    <span className={styles.duration}>{recommendation.content.duration} perc</span>
                                    <span className={styles.difficulty}>{recommendation.content.difficulty}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.achievements}>
                <h2>Elért eredmények</h2>
                <div className={styles.achievementGrid}>
                    {achievements.map(achievement => (
                        <div key={achievement.id} className={styles.achievementCard}>
                            <img src={achievement.icon} alt={achievement.title} className={styles.achievementIcon} />
                            <div className={styles.achievementContent}>
                                <h3>{achievement.title}</h3>
                                <p>{achievement.description}</p>
                                {achievement.progress && (
                                    <div className={styles.progress}>
                                        <div
                                            className={styles.progressBar}
                                            style={{ width: `${(achievement.progress.current / achievement.progress.total) * 100}%` }}
                                        />
                                        <span>{achievement.progress.current}/{achievement.progress.total}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}; 