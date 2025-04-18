export interface MicroLearningContent {
    id: string;
    title: string;
    description: string;
    duration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    format: 'video' | 'article' | 'quiz' | 'interactive';
    url: string;
    thumbnail?: string;
    completionCriteria: {
        type: 'time' | 'quiz' | 'interaction';
        value: number;
    };
    prerequisites?: string[];
    relatedContent?: string[];
}

export interface UserEngagement {
    userId: string;
    contentId: string;
    progress: number;
    lastAccessed: Date;
    completed: boolean;
    timeSpent: number;
    quizScore?: number;
    interactions: {
        type: string;
        timestamp: Date;
        data: any;
    }[];
}

export interface LearningStreak {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    totalCompleted: number;
    dailyGoal: number;
}

export interface UserPreferences {
    userId: string;
    preferredFormats: ('video' | 'article' | 'quiz' | 'interactive')[];
    preferredDifficulty: ('beginner' | 'intermediate' | 'advanced')[];
    preferredDuration: number;
    topics: string[];
    learningGoals: string[];
    notificationSettings: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        timeOfDay: string;
    };
}

export interface Achievement {
    id: string;
    userId: string;
    type: 'completion' | 'streak' | 'mastery' | 'social';
    title: string;
    description: string;
    icon: string;
    earnedAt: Date;
    progress?: {
        current: number;
        total: number;
    };
}

export interface Recommendation {
    content: MicroLearningContent;
    score: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}

export interface ContentRecommendation {
    contentId: string;
    score: number;
    reasons: string[];
    context: {
        timeOfDay: string;
        userState: 'focused' | 'distracted' | 'tired';
        lastTopic: string;
    };
}

export interface SpacedRepetitionSchedule {
    contentId: string;
    userId: string;
    nextReview: Date;
    interval: number; // napokban
    easeFactor: number;
    repetitions: number;
} 