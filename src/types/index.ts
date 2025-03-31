export interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
}

export interface LearningObjective {
    id: string;
    title: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    status: "active" | "completed" | "archived";
    createdAt: Date;
    updatedAt: Date;
    progress: number;
}

export interface KnowledgePoint {
    id: string;
    objectiveId: string;
    title: string;
    content: string;
    type: "video" | "quiz" | "simulation";
    order: number;
    metadata: {
        duration?: number;
        questions?: QuizQuestion[];
        simulationData?: any;
    };
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export interface LearningProgress {
    userId: string;
    objectiveId: string;
    knowledgePointId: string;
    status: "not_started" | "in_progress" | "completed";
    score?: number;
    lastAttempted: Date;
    timeSpent: number;
}

export interface Analytics {
    id: string;
    userId: string;
    date: Date;
    learningTime: number; // in minutes
    completionRate: number; // percentage
    averageScore: number;
    lastActivity: Date;
} 