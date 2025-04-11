import { Message, UserPreferences, AIContext } from '../types/learning';
import { GameMechanics, UserProgress } from '../types/immersive';

class AIService {
    private static instance: AIService;
    private cache: Map<string, any> = new Map();
    private readonly CACHE_TTL = 1000 * 60 * 60; // 1 óra

    private constructor() { }

    static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    async generateResponse(
        messages: Message[],
        context: AIContext
    ): Promise<{ response: string; error?: string }> {
        try {
            const cacheKey = this.generateCacheKey(messages, context);
            const cachedResponse = this.getCachedResponse(cacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    context,
                }),
            });

            if (!response.ok) {
                throw new Error('Hiba történt a válasz generálása során');
            }

            const data = await response.json();
            this.cacheResponse(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Hiba a válasz generálása során:', error);
            return {
                response: 'Elnézést, hiba történt a válasz generálása során.',
                error: error instanceof Error ? error.message : 'Ismeretlen hiba',
            };
        }
    }

    async analyzeUserPreferences(messages: Message[]): Promise<UserPreferences> {
        try {
            const response = await fetch('/api/analyze-preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages }),
            });

            if (!response.ok) {
                throw new Error('Hiba történt a preferenciák elemzése során');
            }

            return await response.json();
        } catch (error) {
            console.error('Hiba a preferenciák elemzése során:', error);
            return {
                learningStyle: 'visual',
                difficultyLevel: 'medium',
                topics: [],
            };
        }
    }

    async generatePersonalizedContent(
        preferences: UserPreferences,
        progress: UserProgress[]
    ): Promise<string> {
        try {
            const response = await fetch('/api/generate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    preferences,
                    progress,
                }),
            });

            if (!response.ok) {
                throw new Error('Hiba történt a tartalom generálása során');
            }

            return await response.json();
        } catch (error) {
            console.error('Hiba a tartalom generálása során:', error);
            return 'Elnézést, hiba történt a tartalom generálása során.';
        }
    }

    async suggestNextSteps(
        mechanics: GameMechanics,
        progress: UserProgress[]
    ): Promise<string[]> {
        try {
            const response = await fetch('/api/suggest-steps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mechanics,
                    progress,
                }),
            });

            if (!response.ok) {
                throw new Error('Hiba történt a javaslatok generálása során');
            }

            return await response.json();
        } catch (error) {
            console.error('Hiba a javaslatok generálása során:', error);
            return ['Elnézést, hiba történt a javaslatok generálása során.'];
        }
    }

    async analyzeProgress(
        progress: UserProgress[],
        mechanics: GameMechanics
    ): Promise<{
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    }> {
        try {
            const response = await fetch('/api/analyze-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    progress,
                    mechanics,
                }),
            });

            if (!response.ok) {
                throw new Error('Hiba történt az előrehaladás elemzése során');
            }

            return await response.json();
        } catch (error) {
            console.error('Hiba az előrehaladás elemzése során:', error);
            return {
                strengths: [],
                weaknesses: [],
                recommendations: ['Elnézést, hiba történt az elemzés során.'],
            };
        }
    }

    private generateCacheKey(messages: Message[], context: AIContext): string {
        return JSON.stringify({ messages, context });
    }

    private getCachedResponse(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        return null;
    }

    private cacheResponse(key: string, data: any): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
}

export const aiService = AIService.getInstance(); 