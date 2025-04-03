// src/lib/ai/quiz/types.ts
import { QuizQuestion } from "@/types/quiz";
import { KnowledgeMap } from "../types";

export interface QuizGenerationRequest {
    learningObjective: string;
    userLevel: 'beginner' | 'intermediate' | 'advanced';
    knowledgeMap?: KnowledgeMap;
    questionCount: number;
    previousCorrectAnswers?: string[]; // IDs of previously answered questions
    previousIncorrectAnswers?: string[]; // IDs of previously incorrect questions
    preferredQuestionTypes?: ('multiple_choice' | 'true_false' | 'fill_in_blank')[];
    adaptiveDifficulty?: boolean;
}

export interface QuizGenerationResponse {
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    targetLevel: 'beginner' | 'intermediate' | 'advanced';
    learningObjective: string;
    generatedAt: string;
    estimatedTimeMinutes: number;
    difficultyDistribution: {
        easy: number;
        medium: number;
        hard: number;
    };
}

export interface QuizEvaluationRequest {
    questionId: string;
    selectedAnswerIndex: number;
    timeSpentSeconds: number;
}

export interface QuizEvaluationResponse {
    isCorrect: boolean;
    explanation: string;
    feedback: string;
    masteryLevel: number; // 0-100
}

export interface QuizAnalyticsRequest {
    quizId: string;
    userId: string;
    answers: {
        questionId: string;
        selectedAnswerIndex: number;
        isCorrect: boolean;
        timeSpentSeconds: number;
    }[];
}

export interface QuizAnalyticsResponse {
    score: number;
    masteryLevel: number;
    completionTime: number;
    difficultConcepts: string[];
    recommendedReview: string[];
    strengths: string[];
    weaknesses: string[];
    nextSteps: {
        type: 'content' | 'quiz' | 'review';
        description: string;
        priority: number;
    }[];
}