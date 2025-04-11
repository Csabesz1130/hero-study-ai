import { Vector3, Euler } from 'three';

export interface ImmersiveScene {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    objectives: string[];
    assets: {
        models: string[];
        textures: string[];
        audio: string[];
    };
}

export interface UserProgress {
    sceneId: string;
    completedObjectives: string[];
    timeSpent: number;
    score: number;
    lastPosition?: Vector3;
    lastRotation?: Euler;
}

export interface MultiplayerState {
    users: {
        id: string;
        position: Vector3;
        rotation: Euler;
        avatar: string;
        status: 'active' | 'inactive';
    }[];
    chat: {
        userId: string;
        message: string;
        timestamp: number;
    }[];
}

export interface Objective {
    id: string;
    title: string;
    description: string;
    points: number;
    requiredItems?: string[];
    requiredSkills?: string[];
    completionCriteria: {
        type: 'interaction' | 'collection' | 'skill' | 'time';
        target: string | number;
    };
}

export interface GameMechanics {
    objectives: Objective[];
    scoring: {
        basePoints: number;
        timeBonus: number;
        skillBonus: number;
        completionBonus: number;
    };
    timeLimit?: number;
    difficulty: 'easy' | 'medium' | 'hard';
    allowedSkills: string[];
    availableItems: string[];
}

export interface AudioCue {
    id: string;
    source: string;
    position: Vector3;
    volume: number;
    loop: boolean;
    triggerDistance: number;
}

export interface PerformanceSettings {
    quality: 'low' | 'medium' | 'high';
    shadows: boolean;
    antialiasing: boolean;
    postProcessing: boolean;
    maxFPS: number;
    mobileOptimizations: boolean;
}

export interface Scene {
    id: string;
    title: string;
    description: string;
    mechanics: GameMechanics;
    environment: {
        background: string;
        lighting: string;
        objects: string[];
    };
    interactions: {
        type: 'click' | 'drag' | 'hover';
        target: string;
        action: string;
    }[];
} 