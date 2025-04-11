import React, { createContext, useContext, useState, useCallback } from 'react';
import { Message, UserPreferences } from '../types/learning';
import { aiService } from '../services/ai-service';

interface LearningContextType {
    messages: Message[];
    preferences: UserPreferences;
    sendMessage: (content: string) => Promise<void>;
    updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [preferences, setPreferences] = useState<UserPreferences>({
        learningStyle: 'visual',
        difficultyLevel: 'medium',
        topics: []
    });

    const sendMessage = useCallback(async (content: string) => {
        const newMessage: Message = {
            role: 'user',
            content
        };

        setMessages(prev => [...prev, newMessage]);

        try {
            const response = await aiService.generateResponse(
                [...messages, newMessage],
                { preferences }
            );

            if (response.error) {
                throw new Error(response.error);
            }

            const aiMessage: Message = {
                role: 'assistant',
                content: response.response
            };

            setMessages(prev => [...prev, aiMessage]);

            // Preferenciák frissítése
            const updatedPreferences = await aiService.analyzeUserPreferences([
                ...messages,
                newMessage,
                aiMessage
            ]);

            setPreferences(updatedPreferences);
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }, [messages, preferences]);

    const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
        setPreferences(prev => ({ ...prev, ...newPreferences }));
    }, []);

    return (
        <LearningContext.Provider value={{
            messages,
            preferences,
            sendMessage,
            updatePreferences
        }}>
            {children}
        </LearningContext.Provider>
    );
};

export const useLearning = () => {
    const context = useContext(LearningContext);
    if (!context) {
        throw new Error('useLearning must be used within a LearningProvider');
    }
    return context;
}; 