// src/lib/ai/quiz/analytics.ts
import { QuizAnalyticsRequest, QuizAnalyticsResponse } from './types';
import { QuizQuestion } from '@/types/quiz';
import { logger } from '@/lib/logger';

/**
 * Analyzes quiz performance and provides personalized insights
 */
export async function analyzQuizPerformance(
    request: QuizAnalyticsRequest,
    questions: QuizQuestion[]
): Promise<QuizAnalyticsResponse> {
    try {
        logger.info('Analyzing quiz performance', {
            quizId: request.quizId,
            userId: request.userId,
            answerCount: request.answers.length
        });

        // Calculate basic metrics
        const startTime = request.answers.length > 0 ? 0 : 0;
        const completionTime = request.answers.reduce((total, answer) =>
            total + answer.timeSpentSeconds, 0);

        const correctAnswers = request.answers.filter(a => a.isCorrect).length;
        const score = (correctAnswers / questions.length) * 100;

        // Identify difficult concepts
        const difficultConcepts: string[] = [];
        const conceptDifficulties: Record<string, number> = {};

        for (const answer of request.answers) {
            const question = questions.find(q => q.id === answer.questionId);
            if (!question) continue;

            const concept = question.knowledgePointReference;
            if (!conceptDifficulties[concept]) {
                conceptDifficulties[concept] = 0;
            }

            if (!answer.isCorrect) {
                conceptDifficulties[concept]++;
            }
        }

        // Sort concepts by difficulty and get the top most difficult ones
        Object.entries(conceptDifficulties)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .forEach(([concept]) => difficultConcepts.push(concept));

        // Generate recommendations
        const recommendedReview = difficultConcepts.slice(0, 3);

        // Identify strengths
        const strengths: string[] = Object.entries(conceptDifficulties)
            .filter(([, errorCount]) => errorCount === 0)
            .map(([concept]) => concept)
            .slice(0, 3);

        // Calculate weaknesses
        const weaknesses = difficultConcepts;

        // Calculate mastery level with weighted difficulty
        const weightedCorrectCount = request.answers.reduce((total, answer) => {
            const question = questions.find(q => q.id === answer.questionId);
            if (!question) return total;

            // Weight by difficulty
            let weight = 1;
            if (question.difficulty === 'medium') weight = 1.5;
            if (question.difficulty === 'hard') weight = 2;

            return total + (answer.isCorrect ? weight : 0);
        }, 0);

        const totalWeight = questions.reduce((total, q) => {
            let weight = 1;
            if (q.difficulty === 'medium') weight = 1.5;
            if (q.difficulty === 'hard') weight = 2;
            return total + weight;
        }, 0);

        const masteryLevel = Math.round((weightedCorrectCount / totalWeight) * 100);

        // Generate next steps recommendations
        const nextSteps = [];

        if (weaknesses.length > 0) {
            nextSteps.push({
                type: 'review' as const,
                description: `Review the concept: ${weaknesses[0]}`,
                priority: 10
            });
        }

        if (score < 70) {
            nextSteps.push({
                type: 'quiz' as const,
                description: 'Take another quiz focusing on the difficult concepts',
                priority: 8
            });
        } else {
            nextSteps.push({
                type: 'content' as const,
                description: 'Explore advanced content in this subject area',
                priority: 7
            });
        }

        logger.debug('Analysis completed', {
            score,
            masteryLevel,
            difficultConcepts,
            strengths
        });

        return {
            score,
            masteryLevel,
            completionTime,
            difficultConcepts,
            recommendedReview,
            strengths,
            weaknesses,
            nextSteps
        };
    } catch (error) {
        logger.error('Error analyzing quiz performance', { error });
        throw error;
    }
}