import { 
    KnowledgeItem, 
    PerformanceRecord, 
    ReviewSchedule, 
    LearningPlan, 
    AlgorithmParameters,
    UserProgress
} from '@/types/spacedRepetition';

const DEFAULT_PARAMETERS: AlgorithmParameters = {
    initialEaseFactor: 2.5,
    minimumEaseFactor: 1.3,
    maximumEaseFactor: 2.5,
    difficultyWeight: 0.3,
    performanceWeight: 0.5,
    responseTimeWeight: 0.2,
    intervalModifier: 1.0,
    newItemsPerDay: 20,
    maxReviewsPerDay: 100
};

export class SpacedRepetitionService {
    private parameters: AlgorithmParameters;

    constructor(parameters: Partial<AlgorithmParameters> = {}) {
        this.parameters = { ...DEFAULT_PARAMETERS, ...parameters };
    }

    public calculateNextInterval(
        item: KnowledgeItem,
        performance: PerformanceRecord
    ): number {
        const { easeFactor, interval, repetitions } = item.metadata;
        const { rating, difficulty, responseTime } = performance;

        // Alap SM-2 intervallum számítás
        let newInterval: number;
        if (rating >= 3) {
            if (repetitions === 0) {
                newInterval = 1;
            } else if (repetitions === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(interval * easeFactor);
            }
        } else {
            newInterval = 1;
        }

        // Nehézség súlyozása
        const difficultyModifier = 1 + (difficulty - 3) * this.parameters.difficultyWeight;
        
        // Teljesítmény súlyozása
        const performanceModifier = 1 + (rating - 3) * this.parameters.performanceWeight;
        
        // Válaszidő súlyozása (optimalizált válaszidő: 5 másodperc)
        const responseTimeModifier = 1 + (5 - responseTime) * this.parameters.responseTimeWeight;

        // Végleges intervallum számítása
        return Math.round(
            newInterval * 
            difficultyModifier * 
            performanceModifier * 
            responseTimeModifier * 
            this.parameters.intervalModifier
        );
    }

    public updateEaseFactor(
        currentEaseFactor: number,
        performance: PerformanceRecord
    ): number {
        const { rating, difficulty } = performance;
        let newEaseFactor = currentEaseFactor;

        // SM-2 alapú ease factor módosítás
        if (rating >= 3) {
            newEaseFactor += 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02);
        } else {
            newEaseFactor -= 0.2;
        }

        // Nehézség alapú módosítás
        newEaseFactor -= (difficulty - 3) * 0.1;

        // Korlátozás a megengedett tartományban
        return Math.max(
            this.parameters.minimumEaseFactor,
            Math.min(this.parameters.maximumEaseFactor, newEaseFactor)
        );
    }

    public generateLearningPlan(
        items: KnowledgeItem[],
        date: Date = new Date()
    ): LearningPlan {
        const newItems = this.selectNewItems(items);
        const reviews = this.scheduleReviews(items, date);

        return {
            date,
            newItems,
            reviews,
            estimatedDuration: this.calculateEstimatedDuration(newItems, reviews)
        };
    }

    private selectNewItems(items: KnowledgeItem[]): KnowledgeItem[] {
        return items
            .filter(item => item.metadata.repetitions === 0)
            .sort((a, b) => b.metadata.difficulty - a.metadata.difficulty)
            .slice(0, this.parameters.newItemsPerDay);
    }

    private scheduleReviews(
        items: KnowledgeItem[],
        date: Date
    ): ReviewSchedule[] {
        return items
            .filter(item => {
                const nextReview = new Date(item.metadata.nextReview);
                return nextReview <= date;
            })
            .sort((a, b) => {
                const aDate = new Date(a.metadata.nextReview);
                const bDate = new Date(b.metadata.nextReview);
                return aDate.getTime() - bDate.getTime();
            })
            .slice(0, this.parameters.maxReviewsPerDay)
            .map(item => ({
                id: crypto.randomUUID(),
                itemId: item.id,
                scheduledDate: new Date(item.metadata.nextReview),
                completed: false
            }));
    }

    private calculateEstimatedDuration(
        newItems: KnowledgeItem[],
        reviews: ReviewSchedule[]
    ): number {
        const newItemTime = newItems.length * 2; // 2 perc új tétel
        const reviewTime = reviews.length * 1; // 1 perc ismétlés
        return newItemTime + reviewTime;
    }

    public calculateUserProgress(items: KnowledgeItem[]): UserProgress {
        const masteredItems = items.filter(
            item => item.metadata.easeFactor >= this.parameters.maximumEaseFactor * 0.9
        );

        const performanceHistory = items.flatMap(
            item => item.metadata.performanceHistory
        );

        const averageRating = this.calculateAverage(
            performanceHistory.map(p => p.rating)
        );

        const averageResponseTime = this.calculateAverage(
            performanceHistory.map(p => p.responseTime)
        );

        const averageDifficulty = this.calculateAverage(
            performanceHistory.map(p => p.difficulty)
        );

        const successRate = performanceHistory.filter(
            p => p.rating >= 3
        ).length / performanceHistory.length;

        return {
            totalItems: items.length,
            masteredItems: masteredItems.length,
            averageEaseFactor: this.calculateAverage(
                items.map(item => item.metadata.easeFactor)
            ),
            averageInterval: this.calculateAverage(
                items.map(item => item.metadata.interval)
            ),
            dailyStreak: this.calculateDailyStreak(items),
            lastReviewDate: this.getLastReviewDate(items),
            upcomingReviews: this.getUpcomingReviews(items),
            performanceMetrics: {
                averageRating,
                averageResponseTime,
                averageDifficulty,
                successRate
            }
        };
    }

    private calculateAverage(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    private calculateDailyStreak(items: KnowledgeItem[]): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let currentDate = new Date(today);

        while (true) {
            const hasReview = items.some(item => {
                const reviewDate = new Date(item.metadata.lastReviewed);
                reviewDate.setHours(0, 0, 0, 0);
                return reviewDate.getTime() === currentDate.getTime();
            });

            if (!hasReview) break;

            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    }

    private getLastReviewDate(items: KnowledgeItem[]): Date {
        const dates = items.map(item => new Date(item.metadata.lastReviewed));
        return new Date(Math.max(...dates.map(date => date.getTime())));
    }

    private getUpcomingReviews(items: KnowledgeItem[]): ReviewSchedule[] {
        const today = new Date();
        return items
            .filter(item => new Date(item.metadata.nextReview) > today)
            .map(item => ({
                id: crypto.randomUUID(),
                itemId: item.id,
                scheduledDate: new Date(item.metadata.nextReview),
                completed: false
            }))
            .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    }
} 