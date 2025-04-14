export interface ProblemSolvingSession {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    timeEstimate: number;
    viewpoints: Viewpoint[];
    approaches: Approach[];
    hints: HintSystem;
    commonErrors: CommonError[];
    resources: Resource[];
    decisionPoints: DecisionPoint[];
    obstacles: Obstacle[];
}

export interface Viewpoint {
    type: 'expert' | 'novice';
    thoughtProcess: ThoughtStep[];
    actions: Action[];
    emotions: Emotion[];
    decisions: Decision[];
}

export interface ThoughtStep {
    id: string;
    content: string;
    timestamp: number;
    confidence: number;
    connections: string[];
    visualization: Visualization;
}

export interface Action {
    id: string;
    type: 'physical' | 'mental' | 'reference';
    description: string;
    duration: number;
    outcome: string;
    reflection: string;
}

export interface Emotion {
    type: 'frustration' | 'confusion' | 'excitement' | 'satisfaction';
    intensity: number;
    trigger: string;
    impact: string;
}

export interface Decision {
    id: string;
    options: string[];
    chosenOption: string;
    reasoning: string;
    consequences: string[];
}

export interface Approach {
    id: string;
    name: string;
    steps: Step[];
    advantages: string[];
    disadvantages: string[];
    prerequisites: string[];
}

export interface Step {
    id: string;
    description: string;
    microGoal: string;
    timeEstimate: number;
    successCriteria: string[];
    visualization: Visualization;
}

export interface HintSystem {
    levels: HintLevel[];
    triggers: HintTrigger[];
    delivery: HintDelivery;
}

export interface HintLevel {
    level: number;
    content: string;
    directness: number;
    timing: number;
}

export interface HintTrigger {
    type: 'time' | 'struggle' | 'error' | 'request';
    threshold: number;
    action: string;
}

export interface HintDelivery {
    method: 'text' | 'visual' | 'audio' | 'interactive';
    timing: number;
    style: string;
}

export interface CommonError {
    id: string;
    description: string;
    cause: string;
    impact: string;
    recoveryPath: RecoveryStep[];
    prevention: string[];
}

export interface RecoveryStep {
    id: string;
    action: string;
    explanation: string;
    visualization: Visualization;
}

export interface Resource {
    id: string;
    type: 'reference' | 'tool' | 'example' | 'formula';
    name: string;
    content: string;
    usageContext: string;
    effectiveness: number;
}

export interface DecisionPoint {
    id: string;
    description: string;
    options: DecisionOption[];
    criteria: string[];
    visualization: Visualization;
}

export interface DecisionOption {
    id: string;
    description: string;
    pros: string[];
    cons: string[];
    probability: number;
}

export interface Obstacle {
    id: string;
    type: 'conceptual' | 'technical' | 'procedural' | 'psychological';
    description: string;
    anticipation: string;
    preparation: string[];
    solution: string;
}

export interface Visualization {
    type: 'diagram' | 'animation' | '3dModel' | 'text';
    content: string;
    style: string;
    timing: number;
} 