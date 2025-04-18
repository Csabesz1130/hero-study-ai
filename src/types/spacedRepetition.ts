export interface KnowledgeItem {
    id: string;
    question: string;
    answer: string;
    tags: string[];
    metadata: {
        created: Date;
        lastReviewed: Date;
        nextReview: Date;
        easeFactor: number;
        interval: number;
        repetitions: number;
        difficulty: number;
        performanceHistory: PerformanceRecord[];
    };
}

export interface PerformanceRecord {
    date: Date;
    rating: number; // 0-5 skála
    responseTime: number; // másodpercben
    difficulty: number; // 1-5 skála
}

export interface ReviewSchedule {
    id: string;
    itemId: string;
    scheduledDate: Date;
    completed: boolean;
    actualDate?: Date;
    performance?: PerformanceRecord;
}

export interface LearningPlan {
    date: Date;
    newItems: KnowledgeItem[];
    reviews: ReviewSchedule[];
    estimatedDuration: number; // percben
}

export interface AlgorithmParameters {
    initialEaseFactor: number;
    minimumEaseFactor: number;
    maximumEaseFactor: number;
    difficultyWeight: number;
    performanceWeight: number;
    responseTimeWeight: number;
    intervalModifier: number;
    newItemsPerDay: number;
    maxReviewsPerDay: number;
}

export interface UserProgress {
    totalItems: number;
    masteredItems: number;
    averageEaseFactor: number;
    averageInterval: number;
    dailyStreak: number;
    lastReviewDate: Date;
    upcomingReviews: ReviewSchedule[];
    performanceMetrics: {
        averageRating: number;
        averageResponseTime: number;
        averageDifficulty: number;
        successRate: number;
    };
} 