import React, { useEffect } from 'react';
import { useGameProgress } from '../../hooks/useGameMechanics';
import { GameMechanicsProvider } from './GameMechanics';
import { Objective } from '../../types/immersive';

interface GameSceneProps {
    sceneId: string;
    objectives: Objective[];
    children: React.ReactNode;
}

const GameScene: React.FC<GameSceneProps> = ({ sceneId, objectives, children }) => {
    const {
        currentProgress,
        updateSceneProgress,
        completeSceneObjective,
        addSceneScore,
        resetSceneProgress
    } = useGameProgress(sceneId);

    // Idő követése
    useEffect(() => {
        const timer = setInterval(() => {
            updateSceneProgress({
                timeSpent: (currentProgress?.timeSpent || 0) + 1
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentProgress?.timeSpent]);

    // Célok ellenőrzése
    const checkObjectives = () => {
        objectives.forEach(objective => {
            if (!currentProgress?.completedObjectives.includes(objective.id)) {
                // Példa: ha a felhasználó megszerezte a szükséges készségeket
                if (objective.completionCriteria.type === 'skill' &&
                    objective.completionCriteria.target === 'required') {
                    completeSceneObjective(objective.id);
                    addSceneScore(objective.points);
                }
            }
        });
    };

    return (
        <div className="game-scene">
            <div className="game-header">
                <h2>Jelenet: {sceneId}</h2>
                <div className="game-stats">
                    <p>Pontszám: {currentProgress?.score || 0}</p>
                    <p>Idő: {currentProgress?.timeSpent || 0} másodperc</p>
                </div>
            </div>

            <div className="game-content">
                {children}
            </div>

            <div className="game-objectives">
                <h3>Célok:</h3>
                <ul>
                    {objectives.map(objective => (
                        <li key={objective.id} className={
                            currentProgress?.completedObjectives.includes(objective.id)
                                ? 'completed'
                                : ''
                        }>
                            {objective.title}
                            {currentProgress?.completedObjectives.includes(objective.id) &&
                                <span className="checkmark">✓</span>
                            }
                        </li>
                    ))}
                </ul>
            </div>

            <button
                onClick={resetSceneProgress}
                className="reset-button"
            >
                Jelenet újrakezdése
            </button>
        </div>
    );
};

// Példa használat:
export const ExampleGameScene: React.FC = () => {
    const exampleObjectives: Objective[] = [
        {
            id: 'obj1',
            title: 'Alapvető készségek elsajátítása',
            description: 'Tanuld meg az alapvető készségeket',
            points: 10,
            completionCriteria: {
                type: 'skill',
                target: 'required'
            }
        },
        {
            id: 'obj2',
            title: 'Haladó technikák',
            description: 'Tanuld meg a haladó technikákat',
            points: 20,
            completionCriteria: {
                type: 'skill',
                target: 'required'
            }
        }
    ];

    return (
        <GameMechanicsProvider>
            <GameScene
                sceneId="example-scene"
                objectives={exampleObjectives}
            >
                <div className="game-content">
                    <h1>Üdvözöllek a példa jelenetben!</h1>
                    <p>Itt tanulhatod meg az új készségeket.</p>
                </div>
            </GameScene>
        </GameMechanicsProvider>
    );
};

export default GameScene; 