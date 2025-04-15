import { User } from "@prisma/client";

export interface CollaborationSession {
    id: string;
    title: string;
    description: string;
    createdBy: User;
    participants: User[];
    maxParticipants: number;
    status: "active" | "completed" | "cancelled";
    startTime: Date;
    endTime: Date | null;
    chatMessages: ChatMessage[];
    sharedResources: SharedResource[];
    progress: CollaborationProgress;
    settings: CollaborationSettings;
    tags: string[];
    category: "study" | "practice" | "discussion" | "project";
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedDuration: number; // percekben
    prerequisites: string[];
    learningObjectives: string[];
}

export interface ChatMessage {
    id: string;
    content: string;
    sender: User;
    timestamp: Date;
    type: "text" | "resource" | "progress";
    metadata?: {
        resourceId?: string;
        progressType?: string;
        progressValue?: number;
    };
}

export interface SharedResource {
    id: string;
    type: "transformation" | "note" | "bookmark" | "highlight" | "question" | "solution" | "example";
    resourceId: string;
    sharedBy: User;
    sharedAt: Date;
    description?: string;
    reactions: Reaction[];
    comments: Comment[];
    visibility: "all" | "participants" | "specific_users";
    visibleTo?: string[]; // felhasználói ID-k
    metadata: {
        title?: string;
        url?: string;
        format?: string;
        size?: number;
        duration?: number;
        tags?: string[];
        difficulty?: "beginner" | "intermediate" | "advanced";
    };
}

export interface Reaction {
    id: string;
    type: "like" | "love" | "insightful" | "question";
    user: User;
    timestamp: Date;
}

export interface Comment {
    id: string;
    content: string;
    user: User;
    timestamp: Date;
    replies: Comment[];
}

export interface CollaborationProgress {
    individualProgress: {
        [userId: string]: {
            completedSteps: number;
            totalSteps: number;
            lastActive: Date;
            contributions: number;
            achievements: Achievement[];
            learningPath: {
                currentModule: string;
                completedModules: string[];
                nextMilestone: string;
            };
            metrics: {
                participationRate: number;
                resourceContributions: number;
                helpfulnessScore: number;
                engagementLevel: number;
            };
        };
    };
    groupProgress: {
        completedSteps: number;
        totalSteps: number;
        averageCompletion: number;
        lastUpdated: Date;
        milestones: {
            id: string;
            title: string;
            description: string;
            completed: boolean;
            completedAt?: Date;
        }[];
        metrics: {
            overallEngagement: number;
            collaborationScore: number;
            averageResponseTime: number;
            resourceUtilization: number;
        };
    };
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    type: "participation" | "contribution" | "milestone" | "helping" | "streak";
    earnedAt: Date;
    icon: string;
    level: number;
    progress: number;
    requirements: {
        type: string;
        value: number;
    }[];
}

export interface CollaborationSettings {
    allowChat: boolean;
    allowResourceSharing: boolean;
    allowProgressSharing: boolean;
    requireApproval: boolean;
    autoAccept: boolean;
    maxParticipants: number;
    sessionDuration: number;
    notificationPreferences: {
        onMessage: boolean;
        onResourceShare: boolean;
        onProgressUpdate: boolean;
        onParticipantJoin: boolean;
        onAchievement: boolean;
        onMilestone: boolean;
    };
    privacySettings: {
        allowAnonymous: boolean;
        showOnlineStatus: boolean;
        showProgress: boolean;
        showAchievements: boolean;
    };
    moderationSettings: {
        enableWordFilter: boolean;
        requireModeration: boolean;
        autoModerate: boolean;
        moderators: string[]; // felhasználói ID-k
    };
    gamificationSettings: {
        enablePoints: boolean;
        enableAchievements: boolean;
        enableLeaderboard: boolean;
        pointsMultiplier: number;
    };
    learningSettings: {
        enableSpacedRepetition: boolean;
        enableQuizzes: boolean;
        enableFeedback: boolean;
        adaptiveDifficulty: boolean;
    };
} 