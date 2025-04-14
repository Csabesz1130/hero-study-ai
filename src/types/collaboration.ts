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
    type: "transformation" | "note" | "bookmark" | "highlight";
    resourceId: string;
    sharedBy: User;
    sharedAt: Date;
    description?: string;
    reactions: Reaction[];
    comments: Comment[];
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
        };
    };
    groupProgress: {
        completedSteps: number;
        totalSteps: number;
        averageCompletion: number;
        lastUpdated: Date;
    };
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
    };
} 