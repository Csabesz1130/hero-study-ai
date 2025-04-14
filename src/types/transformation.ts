export interface TransformationSequence {
    id: string;
    type: TransformationType;
    title: string;
    description: string;
    steps: TransformationStep[];
    duration: number;
    effects: VisualEffect[];
    timing: TimingConfig;
}

export type TransformationType =
    | 'beforeAfter'
    | 'misconceptionToUnderstanding'
    | 'conceptConstruction'
    | 'simplificationToComplexity'
    | 'problemSolution'
    | 'abstractToConcrete'
    | 'comparison'
    | 'historicalEvolution'
    | 'complexityBreakdown'
    | 'ahaMoment';

export interface TransformationStep {
    id: string;
    title: string;
    content: string;
    visualElements: VisualElement[];
    audioCues: AudioCue[];
    duration: number;
    transition: TransitionEffect;
}

export interface VisualElement {
    type: 'image' | '3dModel' | 'animation' | 'text' | 'diagram';
    content: string;
    position: Position;
    scale: number;
    opacity: number;
    effects: VisualEffect[];
}

export interface AudioCue {
    type: 'music' | 'soundEffect' | 'narration';
    file: string;
    volume: number;
    timing: number;
}

export interface VisualEffect {
    type: 'fade' | 'scale' | 'rotate' | 'highlight' | 'particle';
    duration: number;
    intensity: number;
    timing: number;
}

export interface TransitionEffect {
    type: 'fade' | 'slide' | 'zoom' | 'dissolve' | 'custom';
    duration: number;
    direction?: 'left' | 'right' | 'up' | 'down';
}

export interface Position {
    x: number;
    y: number;
    z?: number;
}

export interface TimingConfig {
    totalDuration: number;
    stepDurations: number[];
    transitionDurations: number[];
    effectTimings: number[];
}

export interface AhaMomentConfig {
    buildUpDuration: number;
    revealDuration: number;
    impactDuration: number;
    soundEffect: string;
    visualEffect: VisualEffect;
    timing: number;
} 