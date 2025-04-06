export type CommunicationStyle = 'formal' | 'casual' | 'balanced';
export type LearningSpeed = 'slow' | 'medium' | 'fast';

export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

export interface UserPreferences {
    communicationStyle: CommunicationStyle;
    learningSpeed: LearningSpeed;
}

export interface LearningSession {
    id: string;
    topic: string;
    startTime: Date;
    endTime?: Date;
    messages: Message[];
    preferences: UserPreferences;
}

export interface LearningContextType {
    currentSession: LearningSession | null;
    messages: Message[];
    preferences: UserPreferences;
    addMessage: (message: Message) => void;
    updatePreferences: (preferences: Partial<UserPreferences>) => void;
    startSession: (topic: string) => void;
    endSession: () => void;
    clearMessages: () => void;
    loadSession: (sessionId: string) => void;
} 