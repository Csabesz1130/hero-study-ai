// src/lib/ai/types.ts
export interface KnowledgeMap {
    mainConcept: string;
    keyPoints: string[];
    commonMisconceptions: string[];
    engagementHooks: string[];
    difficultyCurve: number; // 1-10
}

export interface ContentGenerationRequest {
    learningObjective: string;
    userLevel: 'beginner' | 'intermediate' | 'advanced';
    format: 'video' | 'quiz' | 'simulation';
    durationSeconds?: number;
    preferences?: {
        style?: 'conversational' | 'academic' | 'storytelling';
        voice?: string;
        includeHooks?: boolean;
        addressMisconceptions?: boolean;
    };
}

export interface VideoScriptSection {
    type: 'opening' | 'introduction' | 'mainContent' | 'misconception' | 'application' | 'closing';
    title: string;
    content: string;
    durationSeconds: number;
    visualNotes?: string;
}

export interface VideoScriptResult {
    title: string;
    description: string;
    sections: VideoScriptSection[];
    fullScript: string;
    narrationAudioUrl?: string;
    voiceId?: string;
    totalDurationSeconds: number;
    targetLevel: 'beginner' | 'intermediate' | 'advanced';
    engagementFeatures: string[];
    knowledgeMap: KnowledgeMap;
}

export interface AIServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        originalError?: any;
    };
    metadata?: {
        processingTimeMs: number;
        tokenUsage?: {
            prompt: number;
            completion: number;
            total: number;
        };
    };
}