// src/lib/ai/quiz/generator.ts
import OpenAI from 'openai';
import { QuizGenerationRequest, QuizGenerationResponse } from './types';
import { QuizQuestion } from '@/types/quiz';
import { mapKnowledge, cachedMapKnowledge } from '../openai';
import { logger } from '@/lib/logger';
import { generateId } from '@/lib/utils';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

try {
    openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION,
    });
} catch (error) {
    logger.error('Failed to initialize OpenAI client', { error });
}

/**
 * Generates an adaptive quiz based on a learning objective and user parameters
 */
export async function generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    try {
        if (!openaiClient) {
            throw new Error('OpenAI client not initialized');
        }

        logger.info('Generating quiz', { request: { ...request, userLevel: request.userLevel } });
        const startTime = Date.now();

        // Step 1: If no knowledge map is provided, generate one
        let knowledgeMap = request.knowledgeMap;
        if (!knowledgeMap) {
            const knowledgeMapResult = await cachedMapKnowledge(
                request.learningObjective,
                request.userLevel
            );

            if (!knowledgeMapResult.success || !knowledgeMapResult.data) {
                throw new Error('Failed to generate knowledge map');
            }

            knowledgeMap = knowledgeMapResult.data;
            logger.debug('Generated knowledge map', { knowledgeMap });
        }

        // Step 2: Calculate difficulty distribution based on user level and adaptive settings
        const difficultyDistribution = calculateDifficultyDistribution(
            request.userLevel,
            request.adaptiveDifficulty || false,
            request.previousCorrectAnswers?.length || 0,
            request.previousIncorrectAnswers?.length || 0
        );

        logger.debug('Calculated difficulty distribution', { difficultyDistribution });

        // Step 3: Generate quiz questions using OpenAI
        const questionPrompt = createQuizPrompt(
            request,
            knowledgeMap,
            difficultyDistribution
        );

        logger.debug('Generated question prompt', { questionPrompt: questionPrompt.slice(0, 200) + '...' });

        // Step 4: Call OpenAI to generate questions
        const completion = await openaiClient.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are an educational content expert who specializes in creating adaptive quiz questions that effectively test understanding and identify knowledge gaps.'
                },
                {
                    role: 'user',
                    content: questionPrompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const responseText = completion.choices[0].message.content;
        if (!responseText) {
            throw new Error('Empty response from OpenAI');
        }

        // Step 5: Parse the response and format questions
        const parsedResponse = JSON.parse(responseText);
        const questions: QuizQuestion[] = (parsedResponse.questions || []).map((q: any, index: number) => ({
            id: generateId(),
            question: q.question,
            options: q.options || [],
            correctAnswerIndex: q.correctAnswerIndex || 0,
            explanation: q.explanation || 'No explanation provided.',
            difficulty: q.difficulty || 'medium',
            type: q.type || 'multiple_choice',
            knowledgePointReference: q.knowledgePointReference || `concept-${index}`,
            tags: q.tags || []
        }));

        // Sort questions by increasing difficulty
        questions.sort((a, b) => {
            const difficultyOrder = { 'easy': 0, 'medium': 1, 'hard': 2 };
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        });

        // Step 6: Create and return the quiz
        const result: QuizGenerationResponse = {
            id: generateId(),
            title: `Quiz: ${knowledgeMap.mainConcept}`,
            description: `Test your knowledge of ${knowledgeMap.mainConcept} with this adaptive quiz.`,
            questions,
            targetLevel: request.userLevel,
            learningObjective: request.learningObjective,
            generatedAt: new Date().toISOString(),
            estimatedTimeMinutes: Math.round(questions.length * 1.5), // Estimate 1.5 minutes per question
            difficultyDistribution,
        };

        logger.info('Quiz generation completed', {
            questionCount: questions.length,
            executionTime: Date.now() - startTime
        });

        return result;
    } catch (error) {
        logger.error('Error generating quiz', { error });
        throw error;
    }
}

/**
 * Creates a detailed prompt for quiz question generation
 */
function createQuizPrompt(
    request: QuizGenerationRequest,
    knowledgeMap: any,
    difficultyDistribution: { easy: number; medium: number; hard: number }
): string {
    const prompt = `Generate ${request.questionCount} unique quiz questions about ${request.learningObjective} for a ${request.userLevel} level student.
    
Based on this knowledge map:
- Main concept: ${knowledgeMap.mainConcept}
- Key points: ${knowledgeMap.keyPoints.join(', ')}
- Common misconceptions: ${knowledgeMap.commonMisconceptions.join(', ')}

Use this difficulty distribution:
- Easy questions: ${difficultyDistribution.easy}%
- Medium questions: ${difficultyDistribution.medium}%
- Hard questions: ${difficultyDistribution.hard}%

For each question, provide:
1. A clear, concise question text
2. Four answer options (with one correct answer)
3. The index of the correct answer (0-3)
4. A brief explanation of the correct answer
5. Difficulty level (easy, medium, or hard)
6. Question type (multiple_choice, true_false, or fill_in_blank)
7. The specific knowledge point this question tests
8. Tags related to the question (2-3 tags)

Format your response as a valid JSON object with a "questions" array containing question objects.`;

    // Add information about previously answered questions if available
    if (request.previousCorrectAnswers?.length || request.previousIncorrectAnswers?.length) {
        return `${prompt}

The user has previously answered questions correctly on these topics: ${request.previousCorrectAnswers?.join(', ') || 'none'}

The user has struggled with these topics: ${request.previousIncorrectAnswers?.join(', ') || 'none'}

Focus more on topics the user has struggled with and include fewer questions on topics they already know well.`;
    }

    // Add preferences for question types if specified
    if (request.preferredQuestionTypes?.length) {
        return `${prompt}

Prefer these question types: ${request.preferredQuestionTypes.join(', ')}`;
    }

    return prompt;
}

/**
 * Calculates difficulty distribution based on user level and adaptive settings
 */
function calculateDifficultyDistribution(
    userLevel: 'beginner' | 'intermediate' | 'advanced',
    isAdaptive: boolean,
    correctAnswersCount: number,
    incorrectAnswersCount: number
): { easy: number; medium: number; hard: number } {
    // Base distribution by user level
    let distribution = {
        'beginner': { easy: 70, medium: 20, hard: 10 },
        'intermediate': { easy: 30, medium: 50, hard: 20 },
        'advanced': { easy: 10, medium: 30, hard: 60 },
    }[userLevel];

    // If adaptive learning is enabled, adjust based on previous performance
    if (isAdaptive && (correctAnswersCount > 0 || incorrectAnswersCount > 0)) {
        const totalAnswers = correctAnswersCount + incorrectAnswersCount;
        const correctRatio = totalAnswers > 0 ? correctAnswersCount / totalAnswers : 0;

        // If user is doing well, increase difficulty
        if (correctRatio > 0.8) {
            distribution.easy = Math.max(0, distribution.easy - 20);
            distribution.medium = distribution.medium;
            distribution.hard = Math.min(100, 100 - distribution.easy - distribution.medium);
        }
        // If user is struggling, decrease difficulty
        else if (correctRatio < 0.5) {
            distribution.hard = Math.max(0, distribution.hard - 10);
            distribution.medium = Math.max(10, distribution.medium - 10);
            distribution.easy = Math.min(100, 100 - distribution.medium - distribution.hard);
        }
    }

    return distribution;
}