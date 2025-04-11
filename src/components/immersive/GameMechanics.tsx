import React, { createContext, useContext, useState, useCallback } from 'react';
import { GameMechanics, UserProgress } from '../../types/immersive';

interface GameMechanicsContextType {
    mechanics: GameMechanics;
    progress: UserProgress[];
    updateProgress: (sceneId: string, newProgress: Partial<UserProgress>) => void;
    completeObjective: (sceneId: string, objectiveId: string) => void;
    addScore: (sceneId: string, points: number) => void;
    resetProgress: (sceneId: string) => void;
}

const GameMechanicsContext = createContext<GameMechanicsContextType | undefined>(undefined);

export const GameMechanicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mechanics, setMechanics] = useState<GameMechanics>({
        objectives: [],
        scoring: {
            pointsPerObjective: 10,
            timeBonus: 5,
            skillBonus: 3
        }
    });

    const [progress, setProgress] = useState<UserProgress[]>([]);

    const updateProgress = useCallback((sceneId: string, newProgress: Partial<UserProgress>) => {
        setProgress(prev => {
            const existing = prev.find(p => p.sceneId === sceneId);
            if (existing) {
                return prev.map(p =>
                    p.sceneId === sceneId
                        ? { ...p, ...newProgress }
                        : p
                );
            }
            return [...prev, { sceneId, ...newProgress } as UserProgress];
        });
    }, []);

    const completeObjective = useCallback((sceneId: string, objectiveId: string) => {
        setProgress(prev => {
            const existing = prev.find(p => p.sceneId === sceneId);
            if (existing) {
                return prev.map(p =>
                    p.sceneId === sceneId
                        ? {
                            ...p,
                            completedObjectives: [...p.completedObjectives, objectiveId],
                            score: p.score + (mechanics.scoring.pointsPerObjective || 0)
                        }
                        : p
                );
            }
            return [...prev, {
                sceneId,
                completedObjectives: [objectiveId],
                score: mechanics.scoring.pointsPerObjective || 0
            }];
        });
    }, [mechanics.scoring.pointsPerObjective]);

    const addScore = useCallback((sceneId: string, points: number) => {
        setProgress(prev => {
            const existing = prev.find(p => p.sceneId === sceneId);
            if (existing) {
                return prev.map(p =>
                    p.sceneId === sceneId
                        ? { ...p, score: p.score + points }
                        : p
                );
            }
            return [...prev, { sceneId, score: points, completedObjectives: [] }];
        });
    }, []);

    const resetProgress = useCallback((sceneId: string) => {
        setProgress(prev => prev.filter(p => p.sceneId !== sceneId));
    }, []);

    return (
        <GameMechanicsContext.Provider value={{
            mechanics,
            progress,
            updateProgress,
            completeObjective,
            addScore,
            resetProgress
        }}>
            {children}
        </GameMechanicsContext.Provider>
    );
};

export { GameMechanicsContext }; 