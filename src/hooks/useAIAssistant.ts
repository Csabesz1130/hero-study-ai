import { useState, useCallback, useEffect } from 'react';
import { Message, UserPreferences } from '../types/learning';
import { GameMechanics, UserProgress } from '../types/immersive';
import { aiService } from '../services/ai-service';

interface AIAssistantState {
    messages: Message[];
    preferences: UserPreferences;
    isLoading: boolean;
    error: string | null;
    suggestions: string[];
    analysis: {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    } | null;
}

export const useAIAssistant = (mechanics: GameMechanics, progress: UserProgress[]) => {
    const [state, setState] = useState<AIAssistantState>({
        messages: [],
        preferences: {
            learningStyle: 'visual',
            difficultyLevel: 'medium',
            topics: []
        },
        isLoading: false,
        error: null,
        suggestions: [],
        analysis: null
    });

    const sendMessage = useCallback(async (content: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Új üzenet hozzáadása
            const newMessage: Message = {
                role: 'user',
                content
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, newMessage]
            }));

            // AI válasz generálása
            const response = await aiService.generateResponse(
                [...state.messages, newMessage],
                {
                    mechanics,
                    progress,
                    preferences: state.preferences
                }
            );

            if (response.error) {
                throw new Error(response.error);
            }

            const aiMessage: Message = {
                role: 'assistant',
                content: response.response
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, aiMessage],
                isLoading: false
            }));

            // Preferenciák frissítése
            const updatedPreferences = await aiService.analyzeUserPreferences([
                ...state.messages,
                newMessage,
                aiMessage
            ]);

            setState(prev => ({
                ...prev,
                preferences: updatedPreferences
            }));

        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
                isLoading: false
            }));
        }
    }, [mechanics, progress, state.messages, state.preferences]);

    const getSuggestions = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const suggestions = await aiService.suggestNextSteps(mechanics, progress);
            setState(prev => ({
                ...prev,
                suggestions,
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
                isLoading: false
            }));
        }
    }, [mechanics, progress]);

    const analyzeProgress = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const analysis = await aiService.analyzeProgress(progress, mechanics);
            setState(prev => ({
                ...prev,
                analysis,
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
                isLoading: false
            }));
        }
    }, [mechanics, progress]);

    const generateContent = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const content = await aiService.generatePersonalizedContent(
                state.preferences,
                progress
            );

            const aiMessage: Message = {
                role: 'assistant',
                content
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, aiMessage],
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
                isLoading: false
            }));
        }
    }, [progress, state.preferences]);

    // Automatikus elemzés és javaslatok betöltése
    useEffect(() => {
        if (progress.length > 0) {
            analyzeProgress();
            getSuggestions();
        }
    }, [progress.length]);

    return {
        ...state,
        sendMessage,
        getSuggestions,
        analyzeProgress,
        generateContent
    };
}; 