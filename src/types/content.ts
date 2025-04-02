export interface VideoContent {
    id: string;
    title: string;
    url: string;
    duration: number;
    thumbnailUrl?: string;
    description?: string;
    engagementPoints: {
        timestamp: number;
        type: 'question' | 'highlight' | 'note';
        content: string;
    }[];
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    timeLimit?: number;
}

export interface QuizContent {
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    adaptiveDifficulty: boolean;
    passingScore: number;
    maxAttempts?: number;
}

export interface SimulationState {
    id: string;
    variables: Record<string, any>;
    events: SimulationEvent[];
    currentStep: number;
    completed: boolean;
}

export interface SimulationEvent {
    id: string;
    type: 'userAction' | 'systemUpdate' | 'feedback';
    timestamp: number;
    data: Record<string, any>;
}

export interface SimulationContent {
    id: string;
    title: string;
    description: string;
    initialState: SimulationState;
    steps: SimulationStep[];
    feedbackRules: FeedbackRule[];
}

export interface SimulationStep {
    id: string;
    title: string;
    description: string;
    actions: SimulationAction[];
    validation: ValidationRule[];
}

export interface SimulationAction {
    id: string;
    type: 'input' | 'select' | 'drag' | 'click';
    target: string;
    options?: Record<string, any>;
}

export interface ValidationRule {
    id: string;
    condition: string;
    feedback: string;
    nextStep?: string;
}

export interface FeedbackRule {
    id: string;
    condition: string;
    message: string;
    type: 'success' | 'warning' | 'error';
}

export interface ContentProgress {
    contentId: string;
    type: 'video' | 'quiz' | 'simulation';
    progress: number;
    completed: boolean;
    lastAccessed: Date;
    engagement: {
        watchTime?: number;
        score?: number;
        attempts?: number;
        interactions?: number;
    };
} 