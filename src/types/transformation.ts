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

export interface TransformationContent {
    id: string;
    title: string;
    description: string;
    type: 'knowledge' | 'misconception' | 'problem' | 'comparison';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    timeEstimate: number;
    transformations: Transformation[];
    comparisons: Comparison[];
    visualizations: Visualization[];
    revealTiming: RevealTiming;
}

export interface Transformation {
    id: string;
    type: 'knowledge' | 'misconception' | 'problem';
    beforeState: State;
    afterState: State;
    steps: TransformationStep[];
    revealStrategy: RevealStrategy;
}

export interface State {
    description: string;
    visualization: Visualization;
    emotions: Emotion[];
    confidence: number;
    misconceptions?: string[];
}

export interface Comparison {
    id: string;
    title: string;
    before: ComparisonItem;
    after: ComparisonItem;
    differences: Difference[];
    insights: string[];
}

export interface ComparisonItem {
    title: string;
    description: string;
    visualization: Visualization;
    characteristics: string[];
}

export interface Difference {
    aspect: string;
    before: string;
    after: string;
    significance: string;
}

export interface Visualization {
    type: 'image' | 'animation' | '3d' | 'interactive';
    content: string;
    style: string;
    timing: number;
}

export interface Emotion {
    type: 'confusion' | 'frustration' | 'realization' | 'satisfaction';
    intensity: number;
    description: string;
}

export interface Interaction {
    type: 'click' | 'drag' | 'hover' | 'input';
    target: string;
    feedback: string;
}

export interface RevealStrategy {
    type: 'progressive' | 'dramatic' | 'interactive';
    timing: number;
    triggers: RevealTrigger[];
}

export interface RevealTrigger {
    type: 'time' | 'interaction' | 'scroll' | 'completion';
    threshold: number;
    action: string;
}

export interface RevealTiming {
    initialDelay: number;
    stepDelay: number;
    finalDelay: number;
    transitionDuration: number;
} 