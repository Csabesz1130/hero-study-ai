export interface MemoryPalace {
    id: string;
    userId: string;
    name: string;
    description: string;
    locations: MemoryLocation[];
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryLocation {
    id: string;
    palaceId: string;
    name: string;
    description: string;
    position: {
        x: number;
        y: number;
        z: number;
    };
    associations: MemoryAssociation[];
}

export interface MemoryAssociation {
    id: string;
    locationId: string;
    conceptId: string;
    imagery: string;
    story: string;
    sensoryDetails: {
        visual: string[];
        auditory: string[];
        kinesthetic: string[];
        olfactory: string[];
        gustatory: string[];
    };
    strength: number;
    lastReviewed: Date;
    nextReview: Date;
}

export interface MemoryConcept {
    id: string;
    userId: string;
    name: string;
    description: string;
    category: string;
    difficulty: number;
    relatedConcepts: string[];
    mnemonicDevices: MnemonicDevice[];
}

export interface MnemonicDevice {
    id: string;
    conceptId: string;
    type: 'imagery' | 'story' | 'acronym' | 'rhyme' | 'association';
    content: string;
    effectiveness: number;
    lastUsed: Date;
}

export interface SpacedRepetitionSchedule {
    id: string;
    userId: string;
    conceptId: string;
    intervals: number[];
    currentInterval: number;
    nextReview: Date;
    retentionScore: number;
}

export interface MemorySession {
    id: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    conceptsReviewed: string[];
    performance: {
        recallAccuracy: number;
        responseTime: number;
        confidence: number;
    };
    feedback: string;
} 