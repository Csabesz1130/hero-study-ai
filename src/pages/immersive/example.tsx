import React, { useState } from 'react';
import { ExampleGameScene } from '../../components/immersive/GameScene';
import { useLearning } from '../../contexts/LearningContext';
import { useGameMechanics } from '../../hooks/useGameMechanics';
import { Message } from '../../types/learning';
import '../../styles/GameScene.css';

const ExamplePage: React.FC = () => {
    const { messages, sendMessage } = useLearning();
    const { mechanics, progress } = useGameMechanics();
    const [userInput, setUserInput] = useState('');

    const handleSendMessage = async () => {
        if (userInput.trim()) {
            await sendMessage(userInput);
            setUserInput('');
        }
    };

    return (
        <div className="immersive-page">
            <div className="game-container">
                <ExampleGameScene />
            </div>

            <div className="ai-assistant">
                <h2>AI Tanulási Asszisztens</h2>
                <div className="chat-container">
                    {messages.map((message: Message, index: number) => (
                        <div key={index} className={`message ${message.role}`}>
                            {message.content}
                        </div>
                    ))}
                </div>
                <div className="input-container">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Kérdezz az AI-tól..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage}>Küldés</button>
                </div>
            </div>

            <div className="progress-overview">
                <h2>Előrehaladás</h2>
                <div className="progress-stats">
                    <div className="stat-item">
                        <h3>Teljesített célok</h3>
                        <p>{progress.reduce((acc, p) => acc + p.completedObjectives.length, 0)}</p>
                    </div>
                    <div className="stat-item">
                        <h3>Összpontszám</h3>
                        <p>{progress.reduce((acc, p) => acc + p.score, 0)}</p>
                    </div>
                    <div className="stat-item">
                        <h3>Tanulási idő</h3>
                        <p>{progress.reduce((acc, p) => acc + p.timeSpent, 0)} másodperc</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamplePage; 