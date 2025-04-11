import React from 'react';
import { LearningProvider } from '../../contexts/LearningContext';
import { GameMechanicsProvider } from '../../components/immersive/GameMechanics';
import AIAssistant from '../../components/immersive/AIAssistant';
import GameScene from '../../components/immersive/GameScene';
import { Objective } from '../../types/immersive';
import '../../styles/ImmersivePage.css';

const demoObjectives: Objective[] = [
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

const DemoPage: React.FC = () => {
    return (
        <LearningProvider>
            <GameMechanicsProvider>
                <div className="demo-page">
                    <div className="demo-header">
                        <h1>HeroStudy AI Demo</h1>
                        <p>Bemutató oldal az AI asszisztens és játékjelenet működéséhez</p>
                    </div>

                    <div className="demo-content">
                        <div className="game-section">
                            <h2>Játékjelenet</h2>
                            <GameScene
                                sceneId="demo-scene"
                                objectives={demoObjectives}
                            >
                                <div className="game-content">
                                    <h3>Üdvözöllek a demo jelenetben!</h3>
                                    <p>
                                        Ez egy példa jelenet, ahol bemutatjuk a játékmechanikákat
                                        és az AI asszisztens működését.
                                    </p>
                                </div>
                            </GameScene>
                        </div>

                        <div className="ai-section">
                            <h2>AI Asszisztens</h2>
                            <AIAssistant
                                mechanics={{
                                    objectives: demoObjectives,
                                    scoring: {
                                        pointsPerObjective: 10,
                                        timeBonus: 5,
                                        skillBonus: 3
                                    }
                                }}
                                progress={[]}
                            />
                        </div>
                    </div>
                </div>
            </GameMechanicsProvider>
        </LearningProvider>
    );
};

export default DemoPage; 