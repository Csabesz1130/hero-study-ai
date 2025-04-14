import { useState, useRef, useEffect, useCallback } from 'react';
import {
    ProblemSolvingSession,
    Viewpoint,
    Approach,
    HintSystem,
    CommonError,
    DecisionPoint,
    Obstacle
} from '../types/problemSolving';

export const useProblemSolving = (session: ProblemSolvingSession) => {
    const [currentViewpoint, setCurrentViewpoint] = useState<Viewpoint>(session.viewpoints[0]);
    const [currentApproach, setCurrentApproach] = useState<Approach>(session.approaches[0]);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [hintLevel, setHintLevel] = useState<number>(0);
    const [errorState, setErrorState] = useState<CommonError | null>(null);
    const [decisionState, setDecisionState] = useState<DecisionPoint | null>(null);
    const [obstacleState, setObstacleState] = useState<Obstacle | null>(null);
    const [resourceUsage, setResourceUsage] = useState<boolean>(false);

    const timerRef = useRef<NodeJS.Timeout>();
    const isMounted = useRef<boolean>(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const switchViewpoint = useCallback((type: 'expert' | 'novice') => {
        const viewpoint = session.viewpoints.find(v => v.type === type);
        if (viewpoint) {
            setCurrentViewpoint(viewpoint);
        }
    }, [session.viewpoints]);

    const switchApproach = useCallback((approachId: string) => {
        const approach = session.approaches.find(a => a.id === approachId);
        if (approach) {
            setCurrentApproach(approach);
            setCurrentStep(0);
        }
    }, [session.approaches]);

    const nextStep = useCallback(() => {
        if (currentStep < currentApproach.steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, currentApproach.steps.length]);

    const previousStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const togglePause = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);

    const requestHint = useCallback(() => {
        if (hintLevel < session.hints.levels.length - 1) {
            setHintLevel(prev => prev + 1);
        }
    }, [hintLevel, session.hints.levels.length]);

    const handleError = useCallback((errorId: string) => {
        const error = session.commonErrors.find(e => e.id === errorId);
        if (error) {
            setErrorState(error);
        }
    }, [session.commonErrors]);

    const recoverFromError = useCallback(() => {
        setErrorState(null);
    }, []);

    const makeDecision = useCallback((optionId: string) => {
        if (decisionState) {
            const option = decisionState.options.find(o => o.id === optionId);
            if (option) {
                // Döntés következményeinek kezelése
                console.log('Döntés meghozva:', option);
                setDecisionState(null);
            }
        }
    }, [decisionState]);

    const handleObstacle = useCallback((obstacleId: string) => {
        const obstacle = session.obstacles.find(o => o.id === obstacleId);
        if (obstacle) {
            setObstacleState(obstacle);
        }
    }, [session.obstacles]);

    const useResource = useCallback((resourceId: string) => {
        const resource = session.resources.find(r => r.id === resourceId);
        if (resource) {
            setResourceUsage(true);
            // Erőforrás használatának kezelése
            console.log('Erőforrás használat:', resource);
        }
    }, [session.resources]);

    const checkProgress = useCallback(() => {
        const currentStepData = currentApproach.steps[currentStep];
        return {
            isComplete: currentStepData.successCriteria.every(criterion => {
                // Teljesítési feltételek ellenőrzése
                return true;
            }),
            nextStep: currentStep < currentApproach.steps.length - 1,
            previousStep: currentStep > 0
        };
    }, [currentApproach.steps, currentStep]);

    return {
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
    };
}; 