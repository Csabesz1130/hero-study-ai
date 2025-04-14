import { useState, useRef, useEffect } from 'react';
import { TransformationSequence, TransformationStep, AhaMomentConfig } from '../types/transformation';

export const useTransformationVideo = (sequence: TransformationSequence) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout>();
    const audioRef = useRef<HTMLAudioElement>();

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (audioRef.current) audioRef.current.pause();
        };
    }, []);

    const playStep = (step: TransformationStep) => {
        // Hanghatások lejátszása
        step.audioCues.forEach(cue => {
            const audio = new Audio(cue.file);
            audio.volume = cue.volume;
            setTimeout(() => audio.play(), cue.timing);
        });

        // Vizuális effektek alkalmazása
        step.visualElements.forEach(element => {
            element.effects.forEach(effect => {
                setTimeout(() => {
                    // Effekt alkalmazása a megfelelő elemre
                    applyVisualEffect(element, effect);
                }, effect.timing);
            });
        });
    };

    const applyVisualEffect = (element: any, effect: any) => {
        // Vizuális effekt implementációja
        console.log(`Applying ${effect.type} to element ${element.id}`);
    };

    const playSequence = () => {
        setIsPlaying(true);
        let currentTime = 0;

        sequence.steps.forEach((step, index) => {
            setTimeout(() => {
                setCurrentStep(index);
                playStep(step);

                // Progress frissítése
                const stepProgress = (index + 1) / sequence.steps.length;
                setProgress(stepProgress);
            }, currentTime);

            currentTime += step.duration;
        });

        setTimeout(() => {
            setIsPlaying(false);
            setCurrentStep(0);
            setProgress(0);
        }, currentTime);
    };

    const pauseSequence = () => {
        setIsPlaying(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (audioRef.current) audioRef.current.pause();
    };

    const optimizeAhaMoment = (config: AhaMomentConfig) => {
        // Aha-moment optimalizálása
        const { buildUpDuration, revealDuration, impactDuration } = config;

        // Fokozatos felépítés
        setTimeout(() => {
            // Felépítés effektek
            console.log('Building up to aha moment...');
        }, buildUpDuration);

        // Felfedés
        setTimeout(() => {
            // Felfedés effektek
            console.log('Revealing the insight...');
        }, buildUpDuration + revealDuration);

        // Hatás
        setTimeout(() => {
            // Hatás effektek
            console.log('Impact moment...');
        }, buildUpDuration + revealDuration + impactDuration);
    };

    return {
        currentStep,
        isPlaying,
        progress,
        playSequence,
        pauseSequence,
        optimizeAhaMoment
    };
}; 