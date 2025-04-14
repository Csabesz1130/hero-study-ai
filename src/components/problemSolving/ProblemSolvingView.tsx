import React, { useEffect } from 'react';
import { ProblemSolvingSession } from '../../types/problemSolving';
import { useProblemSolving } from '../../hooks/useProblemSolving';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProblemSolvingViewProps {
    session: ProblemSolvingSession;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export const ProblemSolvingView: React.FC<ProblemSolvingViewProps> = ({
    session,
    onComplete,
    onError
}) => {
    const {
        currentViewpoint,
        currentApproach,
        currentStep,
        isPaused,
        hintLevel,
        errorState,
        decisionState,
        obstacleState,
        resourceUsage,
        switchViewpoint,
        switchApproach,
        nextStep,
        previousStep,
        togglePause,
        requestHint,
        handleError,
        recoverFromError,
        makeDecision,
        handleObstacle,
        useResource,
        checkProgress
    } = useProblemSolving(session);

    const currentStepData = currentApproach.steps[currentStep];
    const { isComplete, nextStep: hasNextStep, previousStep: hasPreviousStep } = checkProgress();

    useEffect(() => {
        if (isComplete && !hasNextStep && onComplete) {
            onComplete();
        }
    }, [isComplete, hasNextStep, onComplete]);

    const renderThoughtProcess = () => {
        return currentViewpoint.thoughtProcess.map((thought, index) => (
            <div key={index} className="thought-step">
                <div className="thought-content">{thought.content}</div>
                <div className="thought-confidence">
                    Bizalom: {thought.confidence}%
                </div>
                {thought.visualization && (
                    <div className="thought-visualization">
                        {/* Vizuális elemek renderelése */}
                    </div>
                )}
            </div>
        ));
    };

    const renderCurrentStep = () => {
        return (
            <div className="step-container">
                <h3>{currentStepData.description}</h3>
                <p className="micro-goal">{currentStepData.microGoal}</p>
                {currentStepData.visualization && (
                    <div className="step-visualization">
                        {/* Lépés vizualizációja */}
                    </div>
                )}
                <div className="success-criteria">
                    {currentStepData.successCriteria.map((criterion, index) => (
                        <div key={index} className="criterion">
                            <input
                                type="checkbox"
                                checked={isComplete}
                                readOnly
                            />
                            {criterion}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDecisionPoint = () => {
        if (!decisionState) return null;

        return (
            <div className="decision-point">
                <h3>{decisionState.description}</h3>
                <div className="options">
                    {decisionState.options.map(option => (
                        <button
                            key={option.id}
                            onClick={() => makeDecision(option.id)}
                            className="option-button"
                        >
                            <h4>{option.description}</h4>
                            <div className="pros-cons">
                                <div className="pros">
                                    <h5>Előnyök</h5>
                                    <ul>
                                        {option.pros.map((pro, index) => (
                                            <li key={index}>{pro}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="cons">
                                    <h5>Hátrányok</h5>
                                    <ul>
                                        {option.cons.map((con, index) => (
                                            <li key={index}>{con}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderObstacle = () => {
        if (!obstacleState) return null;

        return (
            <div className="obstacle">
                <h3>{obstacleState.description}</h3>
                <div className="preparation">
                    <h4>Felkészülés</h4>
                    <ul>
                        {obstacleState.preparation.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="solution">
                    <h4>Megoldás</h4>
                    <p>{obstacleState.solution}</p>
                </div>
            </div>
        );
    };

    return (
        <ErrorBoundary onError={onError}>
            <div className="problem-solving-view">
                <div className="viewpoint-controls">
                    <button
                        onClick={() => switchViewpoint('expert')}
                        className={currentViewpoint.type === 'expert' ? 'active' : ''}
                    >
                        Szakértő nézőpont
                    </button>
                    <button
                        onClick={() => switchViewpoint('novice')}
                        className={currentViewpoint.type === 'novice' ? 'active' : ''}
                    >
                        Kezdő nézőpont
                    </button>
                </div>

                <div className="thought-process">
                    {renderThoughtProcess()}
                </div>

                <div className="step-navigation">
                    <button
                        onClick={previousStep}
                        disabled={!hasPreviousStep}
                    >
                        Előző lépés
                    </button>
                    <button onClick={togglePause}>
                        {isPaused ? 'Folytatás' : 'Szünet'}
                    </button>
                    <button
                        onClick={nextStep}
                        disabled={!hasNextStep}
                    >
                        Következő lépés
                    </button>
                </div>

                <div className="current-step">
                    {renderCurrentStep()}
                </div>

                <div className="hint-system">
                    <button onClick={requestHint}>
                        Segítség kérése
                    </button>
                    {hintLevel > 0 && (
                        <div className="hint-content">
                            {session.hints.levels[hintLevel - 1].content}
                        </div>
                    )}
                </div>

                {renderDecisionPoint()}
                {renderObstacle()}

                <div className="resources">
                    <h3>Elérhető erőforrások</h3>
                    <div className="resource-list">
                        {session.resources.map(resource => (
                            <button
                                key={resource.id}
                                onClick={() => useResource(resource.id)}
                                className="resource-button"
                            >
                                {resource.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}; 