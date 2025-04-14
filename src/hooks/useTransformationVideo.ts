import { useState, useRef, useEffect, useCallback } from 'react';
import { TransformationSequence, TransformationStep, AhaMomentConfig } from '../types/transformation';

export const useTransformationVideo = (sequence: TransformationSequence) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<Error | null>(null);
    const timerRef = useRef<NodeJS.Timeout>();
    const audioRef = useRef<HTMLAudioElement>();
    const isMounted = useRef<boolean>(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = undefined;
            }
        };
    }, []);

    const playStep = useCallback((step: TransformationStep) => {
        try {
            // Hanghatások lejátszása
            step.audioCues.forEach(cue => {
                const audio = new Audio(cue.file);
                audio.volume = cue.volume;
                audioRef.current = audio;

                audio.addEventListener('error', (e) => {
                    console.error('Hangfájl betöltési hiba:', e);
                });

                setTimeout(() => {
                    if (isMounted.current) {
                        audio.play().catch(err => {
                            console.error('Hang lejátszási hiba:', err);
                        });
                    }
                }, cue.timing);
            });

            // Vizuális effektek alkalmazása
            step.visualElements.forEach(element => {
                element.effects.forEach(effect => {
                    setTimeout(() => {
                        if (isMounted.current) {
                            applyVisualEffect(element, effect);
                        }
                    }, effect.timing);
                });
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Ismeretlen hiba történt'));
        }
    }, []);

    const applyVisualEffect = useCallback((element: any, effect: any) => {
        try {
            // Vizuális effekt implementációja
            console.log(`Applying ${effect.type} to element ${element.id}`);
        } catch (err) {
            console.error('Vizuális effekt alkalmazási hiba:', err);
        }
    }, []);

    const playSequence = useCallback(() => {
        if (!isMounted.current) return;

        setIsPlaying(true);
        setError(null);
        let currentTime = 0;

        sequence.steps.forEach((step, index) => {
            setTimeout(() => {
                if (!isMounted.current) return;

                setCurrentStep(index);
                playStep(step);

                const stepProgress = (index + 1) / sequence.steps.length;
                setProgress(stepProgress);
            }, currentTime);

            currentTime += step.duration;
        });

        setTimeout(() => {
            if (isMounted.current) {
                setIsPlaying(false);
                setCurrentStep(0);
                setProgress(0);
            }
        }, currentTime);
    }, [sequence.steps, playStep]);

    const pauseSequence = useCallback(() => {
        setIsPlaying(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = undefined;
        }
    }, []);

    const optimizeAhaMoment = useCallback((config: AhaMomentConfig) => {
        try {
            const { buildUpDuration, revealDuration, impactDuration } = config;

            setTimeout(() => {
                if (!isMounted.current) return;
                console.log('Building up to aha moment...');
            }, buildUpDuration);

            setTimeout(() => {
                if (!isMounted.current) return;
                console.log('Revealing the insight...');
            }, buildUpDuration + revealDuration);

            setTimeout(() => {
                if (!isMounted.current) return;
                console.log('Impact moment...');
            }, buildUpDuration + revealDuration + impactDuration);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Aha-moment optimalizálási hiba'));
        }
    }, []);

    return {
        currentStep,
        isPlaying,
        progress,
        error,
        playSequence,
        pauseSequence,
        optimizeAhaMoment
    };
}; 