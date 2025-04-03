// src/types/quiz.ts
export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'multiple_choice' | 'true_false' | 'fill_in_blank';
    knowledgePointReference: string;
    tags: string[];
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    targetLevel: 'beginner' | 'intermediate' | 'advanced';
    learningObjective: string;
    createdAt: string;
    createdBy: string;
    estimatedTimeMinutes: number;
    difficultyDistribution: {
        easy: number;
        medium: number;
        hard: number;
    };
    passingScore: number;
    adaptiveDifficulty: boolean;
}

export interface QuizAttempt {
    id: string;
    quizId: string;
    userId: string;
    startedAt: string;
    completedAt?: string;
    score?: number;
    answers: QuizAnswer[];
    masteryLevel?: number;
}

export interface QuizAnswer {
    questionId: string;
    selectedAnswerIndex: number;
    isCorrect: boolean;
    timeSpentSeconds: number;
}

export interface QuizAnalytics {
    quizId: string;
    userId: string;
    completionTime: number;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    difficultConcepts: string[];
    recommendedReview: string[];
    masteryLevel: number;
}