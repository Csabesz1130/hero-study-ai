// src/lib/ai/content-generator.ts
import { mapKnowledge, generateVideoScript, cachedMapKnowledge } from './openai';
import { textToSpeech, optimizeTextForTTS, AvailableVoice } from './elevenlabs';
import { ContentGenerationRequest, VideoScriptResult, AIServiceResponse } from './types';
import { logger } from '@/lib/logger'; // Assuming you have a logger service

/**
 * Generates complete educational video content with script and narration
 */
export async function generateVideoContent(
    request: ContentGenerationRequest
): Promise<AIServiceResponse<VideoScriptResult>> {
    // Default to 60 seconds if not specified
    const durationSeconds = request.durationSeconds || 60;

    logger.info('Starting video content generation', { request });
    const startTime = Date.now();

    try {
        // Step 1: Map the learning objective to knowledge points
        const knowledgeMapResult = await cachedMapKnowledge(
            request.learningObjective,
            request.userLevel
        );

        if (!knowledgeMapResult.success || !knowledgeMapResult.data) {
            return {
                success: false,
                error: knowledgeMapResult.error || {
                    message: 'Failed to map knowledge',
                    code: 'KNOWLEDGE_MAPPING_FAILED'
                },
            };
        }

        logger.debug('Knowledge map generated', { knowledgeMap: knowledgeMapResult.data });

        // Step 2: Generate video script based on knowledge map
        const scriptResult = await generateVideoScript(
            knowledgeMapResult.data,
            durationSeconds,
            request.userLevel,
            request.preferences?.style || 'conversational'
        );

        if (!scriptResult.success || !scriptResult.data) {
            return {
                success: false,
                error: scriptResult.error || {
                    message: 'Failed to generate script',
                    code: 'SCRIPT_GENERATION_FAILED'
                },
            };
        }

        logger.debug('Video script generated', { sectionsCount: scriptResult.data.length });

        // Combine all sections into a full narration script
        const fullScript = scriptResult.data
            .map(section => section.content)
            .join('\n\n');

        // Step 3: Generate audio narration if requested
        let narrationAudioUrl: string | undefined;
        let voiceId: string | undefined;

        if (request.preferences?.voice) {
            // Optimize text for better speech synthesis
            const optimizedScript = optimizeTextForTTS(fullScript);

            const speechResult = await textToSpeech(
                optimizedScript,
                request.preferences.voice as AvailableVoice
            );

            if (speechResult.success && speechResult.data) {
                narrationAudioUrl = speechResult.data.audioUrl;
                voiceId = request.preferences.voice;
                logger.debug('Narration audio generated', {
                    characterCount: speechResult.data.metadata.text_character_count
                });
            } else {
                logger.warn('Failed to generate audio narration', { error: speechResult.error });
            }
        }

        // Step 4: Compile the complete result
        const result: VideoScriptResult = {
            title: `Learning ${knowledgeMapResult.data.mainConcept}`,
            description: `An educational video about ${knowledgeMapResult.data.mainConcept} for ${request.userLevel} level learners.`,
            sections: scriptResult.data,
            fullScript,
            narrationAudioUrl,
            voiceId,
            totalDurationSeconds: durationSeconds,
            targetLevel: request.userLevel,
            engagementFeatures: [
                'attention_hooks',
                'misconception_corrections',
                'spaced_repetition_prompts'
            ],
            knowledgeMap: knowledgeMapResult.data,
        };

        logger.info('Video content generation completed', {
            objective: request.learningObjective,
            duration: Date.now() - startTime
        });

        return {
            success: true,
            data: result,
            metadata: {
                processingTimeMs: Date.now() - startTime,
            },
        };
    } catch (error: any) {
        logger.error('Error generating video content', { error, request });

        return {
            success: false,
            error: {
                message: error.message || 'Failed to generate video content',
                code: error.code || 'CONTENT_GENERATION_ERROR',
                originalError: error,
            },
            metadata: {
                processingTimeMs: Date.now() - startTime,
            },
        };
    }
}

/**
 * Regenerates a specific section of a video script
 */
export async function regenerateScriptSection(
    scriptResult: VideoScriptResult,
    sectionIndex: number,
    instructions?: string
): Promise<AIServiceResponse<VideoScriptSection>> {
    // Implementation for regenerating a specific section
    // This would be useful for iterative improvements

    // For brevity, I'm not including the full implementation here
    // but it would follow a similar pattern to the other methods

    return {
        success: false,
        error: {
            message: 'Not implemented',
            code: 'NOT_IMPLEMENTED',
        },
    };
}