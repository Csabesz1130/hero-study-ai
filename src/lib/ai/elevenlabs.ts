// src/lib/ai/elevenlabs.ts
import { AIServiceResponse } from './types';

interface VoiceOptions {
    voice_id: string;
    model_id: string;
    voice_settings?: {
        stability: number;
        similarity_boost: number;
        style: number;
        use_speaker_boost: boolean;
    };
}

interface TextToSpeechResponse {
    audioUrl: string;
    metadata: {
        text_character_count: number;
        processing_time_ms: number;
    };
}

// Available voices
export const AVAILABLE_VOICES = {
    'adam': 'pNInz6obpgDQGcFmaJgB', // Male, conversational
    'rachel': 'D38z5RcWu1voky8WS1ja', // Female, professional
    'antoni': 'ErXwobaYiN019PkySvjV', // Male, warm
    'bella': 'EXAVITQu4vr4xnSDxMaL', // Female, warm
    'josh': 'TxGEqnHWrfWFTfGW9XjX', // Male, deep
    'elli': 'MF3mGyEYCl7XYWbV9V6O', // Female, young
} as const;

export type AvailableVoice = keyof typeof AVAILABLE_VOICES;

// Default voice settings
const DEFAULT_VOICE_SETTINGS = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.3,
    use_speaker_boost: true,
};

// The default voice to use if not specified
const DEFAULT_VOICE: AvailableVoice = 'rachel';

/**
 * Converts text to speech using ElevenLabs API
 */
export async function textToSpeech(
    text: string,
    voiceId: AvailableVoice = DEFAULT_VOICE,
    optimize_streaming_latency: number = 0 // 0-4, higher means more compression
): Promise<AIServiceResponse<TextToSpeechResponse>> {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: {
                message: 'ElevenLabs API key not configured',
                code: 'ELEVENLABS_NOT_CONFIGURED',
            },
        };
    }

    const startTime = Date.now();

    try {
        const voice_id = AVAILABLE_VOICES[voiceId];

        if (!voice_id) {
            throw new Error(`Voice "${voiceId}" not found`);
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: DEFAULT_VOICE_SETTINGS,
                    optimize_streaming_latency,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`);
        }

        // Get the audio data as a blob
        const audioBlob = await response.blob();

        // Convert to base64 for storage or direct URL
        const buffer = await audioBlob.arrayBuffer();
        const base64Audio = Buffer.from(buffer).toString('base64');
        const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

        return {
            success: true,
            data: {
                audioUrl,
                metadata: {
                    text_character_count: text.length,
                    processing_time_ms: Date.now() - startTime,
                },
            },
            metadata: {
                processingTimeMs: Date.now() - startTime,
            },
        };
    } catch (error: any) {
        console.error('Error generating speech with ElevenLabs:', error);

        return {
            success: false,
            error: {
                message: error.message || 'Failed to convert text to speech',
                code: error.code || 'ELEVENLABS_ERROR',
                originalError: error,
            },
            metadata: {
                processingTimeMs: Date.now() - startTime,
            },
        };
    }
}

/**
 * Optimizes text for TTS by adding pauses, emphasis, and pronunciation fixes
 */
export function optimizeTextForTTS(text: string): string {
    // Add pauses with commas and periods
    let optimized = text.replace(/([.!?])\s+/g, '$1 ');

    // Add pronunciation guides for technical terms
    // This is a simplified example - a real implementation would have a dictionary of terms
    const pronunciationGuides: Record<string, string> = {
        'AI': 'A. I.',
        'UI': 'U. I.',
        'API': 'A. P. I.',
        'SQL': 'S. Q. L.',
        'HTML': 'H. T. M. L.',
        'CSS': 'C. S. S.',
    };

    // Replace terms with pronunciation guides
    Object.entries(pronunciationGuides).forEach(([term, pronunciation]) => {
        const regex = new RegExp(`\\b${term}\\b`, 'g');
        optimized = optimized.replace(regex, pronunciation);
    });

    return optimized;
}