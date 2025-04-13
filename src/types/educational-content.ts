export interface EducationalContent {
    id: string;
    title: string;
    originalText: string;
    formats: ContentFormat[];
    targetGeneration: Generation;
    engagementMetrics: EngagementMetrics;
    accessibilityOptions: AccessibilityOptions;
}

export interface ContentFormat {
    type: 'visual' | 'audio' | 'interactive' | 'spatial' | 'video';
    content: string;
    metadata: FormatMetadata;
    engagementScore: number;
    lastUsed: Date;
}

export interface FormatMetadata {
    visual?: {
        type: 'infographic' | 'animation' | 'diagram';
        style: string;
        colorScheme: string;
        complexity: number;
    };
    audio?: {
        voiceType: string;
        speed: number;
        pitch: number;
        emphasisPoints: number[];
    };
    interactive?: {
        type: 'simulation' | 'game' | 'quiz';
        interactivityLevel: number;
        feedbackMechanisms: string[];
    };
    spatial?: {
        type: '3d-model' | 'ar' | 'vr';
        navigation: string[];
        interactionPoints: number;
    };
    video?: {
        duration: number;
        captionStyle: string;
        annotationDensity: number;
    };
}

export type Generation = 'GenZ' | 'Alpha' | 'Beta';

export interface EngagementMetrics {
    attentionSpan: number;
    retentionRate: number;
    interactionFrequency: number;
    formatPreferences: {
        [key in ContentFormat['type']]: number;
    };
}

export interface AccessibilityOptions {
    captionStyle: string;
    textSize: number;
    contrast: number;
    audioDescription: boolean;
    interactionAssistance: boolean;
}

export interface ContentTransformation {
    sourceFormat: ContentFormat['type'];
    targetFormat: ContentFormat['type'];
    transformationRules: TransformationRule[];
    successRate: number;
}

export interface TransformationRule {
    condition: string;
    action: string;
    priority: number;
}

export interface LearningPreference {
    generation: Generation;
    preferredFormats: ContentFormat['type'][];
    attentionPatterns: {
        peakTimes: number[];
        averageDuration: number;
        breakFrequency: number;
    };
    interactionStyle: {
        type: 'exploratory' | 'guided' | 'collaborative';
        feedbackPreference: 'immediate' | 'delayed' | 'cumulative';
    };
} 