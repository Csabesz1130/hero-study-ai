import React, { useState, useEffect, useRef } from 'react';
import { TransformationContent, Transformation, Comparison } from '../../types/transformation';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TransformationViewProps {
    content: TransformationContent;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export const TransformationView: React.FC<TransformationViewProps> = ({
    content,
    onComplete,
    onError
}) => {
    const [currentTransformation, setCurrentTransformation] = useState<Transformation | null>(null);
    const [currentComparison, setCurrentComparison] = useState<Comparison | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isRevealed, setIsRevealed] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const timerRef = useRef<NodeJS.Timeout>();
    const isMounted = useRef<boolean>(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const startTransformation = (transformation: Transformation) => {
        setCurrentTransformation(transformation);
        setCurrentStep(0);
        setIsRevealed(false);
        setIsPlaying(true);

        if (transformation.revealStrategy.type === 'progressive') {
            startProgressiveReveal(transformation);
        }
    };

    const startProgressiveReveal = (transformation: Transformation) => {
        const { steps } = transformation;
        let currentIndex = 0;

        const revealNextStep = () => {
            if (!isMounted.current) return;

            if (currentIndex < steps.length) {
                setCurrentStep(currentIndex);
                const step = steps[currentIndex];

                if (step.revealTrigger.type === 'time') {
                    timerRef.current = setTimeout(() => {
                        revealNextStep();
                    }, step.revealTrigger.threshold);
                }

                currentIndex++;
            } else {
                setIsRevealed(true);
                setIsPlaying(false);
                if (onComplete) onComplete();
            }
        };

        revealNextStep();
    };

    const renderTransformation = () => {
        if (!currentTransformation) return null;

        return (
            <div className="transformation-container">
                <div className="state-comparison">
                    <div className="before-state">
                        <h3>Kezdeti állapot</h3>
                        <div className="visualization">
                            {renderVisualization(currentTransformation.beforeState.visualization)}
                        </div>
                        <p>{currentTransformation.beforeState.description}</p>
                        {renderEmotions(currentTransformation.beforeState.emotions)}
                    </div>

                    <div className="transformation-arrow">→</div>

                    <div className="after-state">
                        <h3>Végső állapot</h3>
                        <div className="visualization">
                            {renderVisualization(currentTransformation.afterState.visualization)}
                        </div>
                        <p>{currentTransformation.afterState.description}</p>
                        {renderEmotions(currentTransformation.afterState.emotions)}
                    </div>
                </div>

                <div className="transformation-steps">
                    {currentTransformation.steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                        >
                            <div className="step-visualization">
                                {renderVisualization(step.visualization)}
                            </div>
                            <p>{step.description}</p>
                            {step.interaction && renderInteraction(step.interaction)}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderComparison = () => {
        if (!currentComparison) return null;

        return (
            <div className="comparison-container">
                <div className="comparison-items">
                    <div className="before-item">
                        <h3>{currentComparison.before.title}</h3>
                        <div className="visualization">
                            {renderVisualization(currentComparison.before.visualization)}
                        </div>
                        <p>{currentComparison.before.description}</p>
                        <ul>
                            {currentComparison.before.characteristics.map((char, index) => (
                                <li key={index}>{char}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="comparison-arrow">vs</div>

                    <div className="after-item">
                        <h3>{currentComparison.after.title}</h3>
                        <div className="visualization">
                            {renderVisualization(currentComparison.after.visualization)}
                        </div>
                        <p>{currentComparison.after.description}</p>
                        <ul>
                            {currentComparison.after.characteristics.map((char, index) => (
                                <li key={index}>{char}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="differences">
                    <h3>Különbségek</h3>
                    {currentComparison.differences.map((diff, index) => (
                        <div key={index} className="difference-item">
                            <h4>{diff.aspect}</h4>
                            <div className="before-after">
                                <span className="before">{diff.before}</span>
                                <span className="arrow">→</span>
                                <span className="after">{diff.after}</span>
                            </div>
                            <p className="significance">{diff.significance}</p>
                        </div>
                    ))}
                </div>

                <div className="insights">
                    <h3>Megállapítások</h3>
                    <ul>
                        {currentComparison.insights.map((insight, index) => (
                            <li key={index}>{insight}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    const renderVisualization = (visualization: Visualization) => {
        switch (visualization.type) {
            case 'image':
                return <img src={visualization.content} alt={visualization.content} style={JSON.parse(visualization.style)} />;
            case 'animation':
                return <div className="animation" style={JSON.parse(visualization.style)}>{visualization.content}</div>;
            case '3d':
                return <div className="3d-model" style={JSON.parse(visualization.style)}>{visualization.content}</div>;
            case 'interactive':
                return <div className="interactive" style={JSON.parse(visualization.style)}>{visualization.content}</div>;
            default:
                return null;
        }
    };

    const renderEmotions = (emotions: Emotion[]) => {
        return (
            <div className="emotions">
                {emotions.map((emotion, index) => (
                    <div key={index} className={`emotion ${emotion.type}`}>
                        <span className="type">{emotion.type}</span>
                        <div className="intensity-bar" style={{ width: `${emotion.intensity}%` }} />
                        <p>{emotion.description}</p>
                    </div>
                ))}
            </div>
        );
    };

    const renderInteraction = (interaction: Interaction) => {
        return (
            <div className="interaction">
                <button
                    className={`interaction-button ${interaction.type}`}
                    onClick={() => handleInteraction(interaction)}
                >
                    {interaction.target}
                </button>
                {interaction.feedback && <p className="feedback">{interaction.feedback}</p>}
            </div>
        );
    };

    const handleInteraction = (interaction: Interaction) => {
        // Interakció kezelése
        console.log('Interaction:', interaction);
    };

    return (
        <ErrorBoundary onError={onError}>
            <div className="transformation-view">
                <h1>{content.title}</h1>
                <p className="description">{content.description}</p>

                <div className="content-selector">
                    {content.transformations.map((transformation) => (
                        <button
                            key={transformation.id}
                            onClick={() => startTransformation(transformation)}
                            className={`transformation-button ${currentTransformation?.id === transformation.id ? 'active' : ''}`}
                        >
                            {transformation.type}
                        </button>
                    ))}
                </div>

                {isPlaying && <LoadingSpinner />}

                {renderTransformation()}
                {renderComparison()}

                <div className="controls">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="play-pause-button"
                    >
                        {isPlaying ? 'Szünet' : 'Lejátszás'}
                    </button>
                    <button
                        onClick={() => setIsRevealed(!isRevealed)}
                        className="reveal-button"
                    >
                        {isRevealed ? 'Elrejtés' : 'Felfedés'}
                    </button>
                </div>
            </div>
        </ErrorBoundary>
    );
}; 