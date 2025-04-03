// src/lib/ai/quiz/evaluator.ts
import { QuizQuestion } from '@/types/quiz';
import { QuizEvaluationResponse } from './types';
import { logger } from '@/lib/logger';

/**
 * Evaluates a user's answer to a quiz question
 */
export async function evaluateQuizAnswer(
    question: QuizQuestion,
    selectedAnswerIndex: number,
    timeSpentSeconds: number
): Promise<QuizEvaluationResponse> {
    try {
        logger.info('Evaluating quiz answer', {
            questionId: question.id,
            selectedAnswerIndex,
            timeSpentSeconds
        });

        const isCorrect = selectedAnswerIndex === question.correctAnswerIndex;

        // Calculate mastery level based on correctness, difficulty, and time spent
        let masteryLevel = isCorrect ? 80 : 30;

        // Adjust based on difficulty
        if (question.difficulty === 'easy') {
            masteryLevel = isCorrect ? 70 : 20;
        } else if (question.difficulty === 'medium') {
            masteryLevel = isCorrect ? 85 : 40;
        } else if (question.difficulty === 'hard') {
            masteryLevel = isCorrect ? 95 : 60;
        }

        // Adjust based on time spent
        // Fast and correct = good understanding
        // Fast and incorrect = guessing or misunderstanding
        // Slow and correct = uncertain but figuring it out
        // Slow and incorrect = struggling with the concept
        const expectedTimeSeconds = 20; // Average expected time per question
        if (isCorrect && timeSpentSeconds < expectedTimeSeconds * 0.7) {
            masteryLevel += 10; // Fast and correct
        } else if (!isCorrect && timeSpentSeconds < expectedTimeSeconds * 0.5) {
            masteryLevel -= 10; // Fast and incorrect (likely guessing)
        } else if (isCorrect && timeSpentSeconds > expectedTimeSeconds * 1.5) {
            masteryLevel -= 5; // Slow but correct
        } else if (!isCorrect && timeSpentSeconds > expectedTimeSeconds * 1.5) {
            masteryLevel -= 15; // Slow and incorrect
        }

        // Cap mastery level between 0-100
        masteryLevel = Math.min(100, Math.max(0, masteryLevel));

        // Generate personalized feedback
        let feedback = '';
        if (isCorrect) {
            if (masteryLevel > 90) {
                feedback = 'Excellent! You have a strong understanding of this concept.';
            } else if (masteryLevel > 75) {
                feedback = 'Good job! You seem to understand this concept well.';
            } else {
                feedback = 'Correct! Continue practicing to strengthen your understanding.';
            }
        } else {
            if (masteryLevel < 30) {
                feedback = `This concept seems challenging for you. The correct answer is "${question.options[question.correctAnswerIndex]}". Let's review this topic more thoroughly.`;
            } else if (masteryLevel < 50) {
                feedback = `Not quite. The correct answer is "${question.options[question.correctAnswerIndex]}". Review this area to improve your understanding.`;
            } else {
                feedback = `Almost there! The correct answer is "${question.options[question.correctAnswerIndex]}". You're on the right track.`;
            }
        }

        logger.debug('Evaluation completed', {
            isCorrect,
            masteryLevel
        });

        return {
            isCorrect,
            explanation: question.explanation,
            feedback,
            masteryLevel,
        };
    } catch (error) {
        logger.error('Error evaluating quiz answer', { error });
        throw error;
    }
}