import { useContext } from 'react';
import { GameMechanicsContext } from '../components/immersive/GameMechanics';
import { GameMechanics, UserProgress } from '../types/immersive';

export const useGameMechanics = () => {
    const context = useContext(GameMechanicsContext);
    if (!context) {
        throw new Error('useGameMechanics must be used within a GameMechanicsProvider');
    }
    return context;
};

export const useGameProgress = (sceneId: string) => {
    const { progress, updateProgress, completeObjective, addScore, resetProgress } = useGameMechanics();

    const currentProgress = progress.find(p => p.sceneId === sceneId);

    const updateSceneProgress = (newProgress: Partial<UserProgress>) => {
        updateProgress(sceneId, newProgress);
    };

    const completeSceneObjective = (objectiveId: string) => {
        completeObjective(sceneId, objectiveId);
    };

    const addSceneScore = (points: number) => {
        addScore(sceneId, points);
    };

    const resetSceneProgress = () => {
        resetProgress(sceneId);
    };

    return {
        currentProgress,
        updateSceneProgress,
        completeSceneObjective,
        addSceneScore,
        resetSceneProgress
    };
}; 