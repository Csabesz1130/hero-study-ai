// src/lib/ai/openai.ts
import OpenAI from 'openai';
import { KnowledgeMap, VideoScriptSection, AIServiceResponse } from './types';
import { cache } from 'react';

// Initialize OpenAI with error handling
let openaiInstance: OpenAI | null = null;

try {
    openaiInstance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION,
    });
} catch (error) {
    console.error('Failed to initialize OpenAI', error);
}

/**
 * Breaks down a learning objective into a detailed knowledge map
 */
export async function mapKnowledge(
    objective: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<AIServiceResponse<KnowledgeMap>> {
    if (!openaiInstance) {
        return {
            success: false,
            error: {
                message: 'OpenAI service not initialized',
                code: 'OPENAI_NOT_INITIALIZED',
            },
        };
    }

    const startTime = Date.now();

    try {
        const completion = await openaiInstance.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are an educational content expert who specializes in breaking down complex topics into clear, teachable components.'
                },
                {
                    role: 'user',
                    content: `Break down the following learning objective into a detailed knowledge map for a ${userLevel} level student: "${objective}". 
          Include:
          1. The main concept
          2. 3-5 key points to understand
          3. 2-3 common misconceptions
          4. 3 engaging hooks or interesting facts
          5. A difficulty rating from 1-10 (1 being easiest, 10 being hardest)
          
          Format your response as structured data that can be parsed as JSON.`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
        });

        const responseText = completion.choices[0].message.content;

        if (!responseText) {
            throw new Error('Empty response from OpenAI');
        }

        const knowledgeMap = JSON.parse(responseText) as KnowledgeMap;

        return {
            success: true,
            data: knowledgeMap,
            metadata: {
                processingTimeMs: Date.now() - startTime,
                tokenUsage: {
                    prompt: completion.usage?.prompt_tokens || 0,
                    completion: completion.usage?.completion_tokens || 0,
                    total: completion.usage?.total_tokens || 0,
                },
            },
        };
    } catch (error: any) {
        console.error('Error mapping knowledge with OpenAI:', error);

        return {
            success: false,
            error: {
                message: error.message || 'Failed to map knowledge',
                code: error.code || 'OPENAI_ERROR',
                originalError: error,
            },
            metadata: {
                processingTimeMs: Date.now() - startTime,
            },
        };
    }
}

/**
 * Generates a script for an educational video based on knowledge map
 */
export async function generateVideoScript(
    knowledgeMap: KnowledgeMap,
    durationSeconds: number = 60,
    userLevel: 'beginner' | 'intermediate' | 'advanced',
    style: 'conversational' | 'academic' | 'storytelling' = 'conversational'
): Promise<AIServiceResponse<VideoScriptSection[]>> {
    if (!openaiInstance) {
        return {
            success: false,
            error: {
                message: 'OpenAI service not initialized',
                code: 'OPENAI_NOT_INITIALIZED',
            },
        };
    }

    const startTime = Date.now();

    try {
        const stylePrompts = {
            conversational: 'Use a friendly, conversational tone with simple language and relatable examples.',
            academic: 'Use a formal, educational tone with precise language and detailed explanations.',
            storytelling: 'Frame the content as a narrative with a clear beginning, middle, and end. Use scenarios and characters if appropriate.'
        };

        // Calculate time distribution based on total duration
        const timeDistribution = {
            opening: Math.round(durationSeconds * 0.1),
            introduction: Math.round(durationSeconds * 0.15),
            mainContent: Math.round(durationSeconds * 0.5),
            misconception: Math.round(durationSeconds * 0.15),
            closing: Math.round(durationSeconds * 0.1)
        };

        const completion = await openaiInstance.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert educational script writer specializing in creating engaging, concise video scripts. ${stylePrompts[style]}`
                },
                {
                    role: 'user',
                    content: `Create a ${durationSeconds}-second educational video script about "${knowledgeMap.mainConcept}" for ${userLevel} level students.
          
          Use this knowledge map:
          - Key points: ${knowledgeMap.keyPoints.join(', ')}
          - Common misconceptions: ${knowledgeMap.commonMisconceptions.join(', ')}
          - Engagement hooks: ${knowledgeMap.engagementHooks.join(', ')}
          
          Structure the script with these sections and time allocations:
          1. Opening hook (${timeDistribution.opening} seconds)
          2. Introduction to the concept (${timeDistribution.introduction} seconds)
          3. Main content explanation (${timeDistribution.mainContent} seconds)
          4. Addressing misconceptions (${timeDistribution.misconception} seconds)
          5. Closing and call to action (${timeDistribution.closing} seconds)
          
          For each section, include:
          - Section title
          - Script content (what the narrator will say)
          - Brief visual notes (what should be shown)
          
          Format your response as structured data that can be parsed as JSON, with an array of sections.`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const responseText = completion.choices[0].message.content;

        if (!responseText) {
            throw new Error('Empty response from OpenAI');
        }

        const scriptData = JSON.parse(responseText) as { sections: VideoScriptSection[] };

        return {
            success: true,
            data: scriptData.sections,
            metadata: {
                processingTimeMs: Date.now() - startTime,
                tokenUsage: {
                    prompt: completion.usage?.prompt_tokens || 0,
                    completion: completion.usage?.completion_tokens || 0,
                    total: completion.usage?.total_tokens || 0,
                },
            },
        };
    } catch (error: any) {
        console.error('Error generating video script with OpenAI:', error);

        return {
            success: false,
            error: {
                message: error.message || 'Failed to generate video script',
                code: error.code || 'OPENAI_ERROR',
                originalError: error,
            },
            metadata: {
                processingTimeMs: Date.now() - startTime,
            },
        };
    }
}

// Add caching for frequently requested knowledge maps
export const cachedMapKnowledge = cache(mapKnowledge);