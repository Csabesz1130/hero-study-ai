import React, { useState, useRef, useEffect } from 'react';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { GameMechanics, UserProgress } from '../../types/immersive';
import '../../styles/AIAssistant.css';

interface AIAssistantProps {
    mechanics: GameMechanics;
    progress: UserProgress[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ mechanics, progress }) => {
    const {
        messages,
        isLoading,
        error,
        suggestions,
        analysis,
        sendMessage,
        getSuggestions,
        analyzeProgress,
        generateContent
    } = useAIAssistant(mechanics, progress);

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (input.trim()) {
            await sendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="ai-assistant-container">
            <div className="ai-header">
                <h2>AI Tanulási Asszisztens</h2>
                <div className="ai-actions">
                    <button onClick={getSuggestions} disabled={isLoading}>
                        Javaslatok
                    </button>
                    <button onClick={analyzeProgress} disabled={isLoading}>
                        Elemzés
                    </button>
                    <button onClick={generateContent} disabled={isLoading}>
                        Új tartalom
                    </button>
                </div>
            </div>

            <div className="chat-container">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                        {message.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="message assistant loading">
                        Válasz generálása...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Kérdezz az AI-tól..."
                    disabled={isLoading}
                />
                <button onClick={handleSendMessage} disabled={isLoading}>
                    Küldés
                </button>
            </div>

            {suggestions.length > 0 && (
                <div className="suggestions-container">
                    <h3>Javaslatok</h3>
                    <ul>
                        {suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
            )}

            {analysis && (
                <div className="analysis-container">
                    <h3>Előrehaladás elemzése</h3>
                    <div className="analysis-section">
                        <h4>Erősségek</h4>
                        <ul>
                            {analysis.strengths.map((strength, index) => (
                                <li key={index}>{strength}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="analysis-section">
                        <h4>Fejlesztendő területek</h4>
                        <ul>
                            {analysis.weaknesses.map((weakness, index) => (
                                <li key={index}>{weakness}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="analysis-section">
                        <h4>Javaslatok</h4>
                        <ul>
                            {analysis.recommendations.map((recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAssistant; 