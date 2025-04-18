import { MicroLearningContent, UserEngagement, UserPreferences, ContentRecommendation } from '@/types/microLearning';

export class ContentRecommender {
    private static readonly TIME_WEIGHT = 0.3;
    private static readonly TOPIC_WEIGHT = 0.4;
    private static readonly DIFFICULTY_WEIGHT = 0.3;
    private static readonly ENGAGEMENT_THRESHOLD = 0.7;

    public static recommendContent(
        contents: MicroLearningContent[],
        userEngagements: UserEngagement[],
        userPreferences: UserPreferences,
        currentTime: Date = new Date()
    ): ContentRecommendation[] {
        return contents.map(content => {
            const score = this.calculateContentScore(
                content,
                userEngagements,
                userPreferences,
                currentTime
            );

            const reasons = this.generateRecommendationReasons(
                content,
                score,
                userPreferences,
                currentTime
            );

            return {
                contentId: content.id,
                score,
                reasons,
                context: {
                    timeOfDay: this.getTimeOfDay(currentTime),
                    userState: this.estimateUserState(userEngagements),
                    lastTopic: this.getLastTopic(userEngagements)
                }
            };
        }).sort((a, b) => b.score - a.score);
    }

    private static calculateContentScore(
        content: MicroLearningContent,
        userEngagements: UserEngagement[],
        userPreferences: UserPreferences,
        currentTime: Date
    ): number {
        let score = 0;

        // Időpont alapú pontozás
        const timeScore = this.calculateTimeScore(content, userPreferences, currentTime);
        score += timeScore * this.TIME_WEIGHT;

        // Téma alapú pontozás
        const topicScore = this.calculateTopicScore(content, userPreferences);
        score += topicScore * this.TOPIC_WEIGHT;

        // Nehézség alapú pontozás
        const difficultyScore = this.calculateDifficultyScore(content, userPreferences);
        score += difficultyScore * this.DIFFICULTY_WEIGHT;

        // Korábbi interakciók figyelembe vétele
        const engagementScore = this.calculateEngagementScore(content, userEngagements);
        score *= engagementScore;

        return Math.min(Math.max(score, 0), 1);
    }

    private static calculateTimeScore(
        content: MicroLearningContent,
        userPreferences: UserPreferences,
        currentTime: Date
    ): number {
        const currentHour = currentTime.getHours();
        const preferredTimes = userPreferences.preferredTimes;

        // Ellenőrizzük, hogy az aktuális időpont egyezik-e a preferált időpontokkal
        const isPreferredTime = preferredTimes.some(time => {
            const [startHour, endHour] = time.time.split('-').map(Number);
            return currentHour >= startHour && currentHour <= endHour;
        });

        return isPreferredTime ? 1 : 0.5;
    }

    private static calculateTopicScore(
        content: MicroLearningContent,
        userPreferences: UserPreferences
    ): number {
        const userTopics = new Set(userPreferences.topics);
        const contentTopics = new Set(content.tags);

        // Közös témák számának kiszámítása
        const commonTopics = [...userTopics].filter(topic => contentTopics.has(topic));
        const topicOverlap = commonTopics.length / Math.max(userTopics.size, contentTopics.size);

        return topicOverlap;
    }

    private static calculateDifficultyScore(
        content: MicroLearningContent,
        userPreferences: UserPreferences
    ): number {
        const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
        const contentLevel = difficultyLevels.indexOf(content.difficulty);
        const userLevel = difficultyLevels.indexOf(userPreferences.difficultyPreference);

        // Nehézségi szint különbség alapján pontozás
        const levelDiff = Math.abs(contentLevel - userLevel);
        return 1 - (levelDiff * 0.5);
    }

    private static calculateEngagementScore(
        content: MicroLearningContent,
        userEngagements: UserEngagement[]
    ): number {
        const contentEngagements = userEngagements.filter(
            engagement => engagement.contentId === content.id
        );

        if (contentEngagements.length === 0) return 1;

        // Átlagos teljesítmény kiszámítása
        const averageScore = contentEngagements.reduce((sum, engagement) => {
            return sum + (engagement.quizScore || 0);
        }, 0) / contentEngagements.length;

        // Ha az átlagos teljesítmény alacsony, csökkentjük a pontszámot
        return averageScore < this.ENGAGEMENT_THRESHOLD ? 0.5 : 1;
    }

    private static generateRecommendationReasons(
        content: MicroLearningContent,
        score: number,
        userPreferences: UserPreferences,
        currentTime: Date
    ): string[] {
        const reasons: string[] = [];

        // Időpont alapú indoklás
        const timeScore = this.calculateTimeScore(content, userPreferences, currentTime);
        if (timeScore === 1) {
            reasons.push('Optimális időpont a tanuláshoz');
        }

        // Téma alapú indoklás
        const topicScore = this.calculateTopicScore(content, userPreferences);
        if (topicScore > 0.7) {
            reasons.push('Erősen kapcsolódik az érdeklődési körödhöz');
        }

        // Nehézség alapú indoklás
        const difficultyScore = this.calculateDifficultyScore(content, userPreferences);
        if (difficultyScore > 0.8) {
            reasons.push('Megfelelő nehézségi szint');
        }

        // Általános indoklás
        if (score > 0.8) {
            reasons.push('Kiválóan illeszkedik a tanulási profilodhoz');
        }

        return reasons;
    }

    private static getTimeOfDay(date: Date): string {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    private static estimateUserState(userEngagements: UserEngagement[]): 'focused' | 'distracted' | 'tired' {
        if (userEngagements.length === 0) return 'focused';

        const recentEngagements = userEngagements
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 3);

        const averageDuration = recentEngagements.reduce((sum, engagement) =>
            sum + engagement.duration, 0) / recentEngagements.length;

        if (averageDuration < 2) return 'distracted';
        if (averageDuration > 10) return 'tired';
        return 'focused';
    }

    private static getLastTopic(userEngagements: UserEngagement[]): string {
        if (userEngagements.length === 0) return '';

        const lastEngagement = userEngagements
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        return lastEngagement.contentId;
    }
} 