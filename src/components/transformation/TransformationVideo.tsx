import React, { useEffect, useRef } from 'react';
import { TransformationSequence } from '../../types/transformation';
import { useTransformationVideo } from '../../hooks/useTransformationVideo';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TransformationVideoProps {
    sequence: TransformationSequence;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export const TransformationVideo: React.FC<TransformationVideoProps> = ({
    sequence,
    onComplete,
    onError
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const {
        currentStep,
        isPlaying,
        progress,
        playSequence,
        pauseSequence,
        optimizeAhaMoment
    } = useTransformationVideo(sequence);

    useEffect(() => {
        if (progress === 1 && onComplete) {
            onComplete();
        }
    }, [progress, onComplete]);

    const renderVisualElements = () => {
        const currentStepData = sequence.steps[currentStep];
        return currentStepData.visualElements.map((element, index) => (
            <ErrorBoundary key={index} onError={onError}>
                <div
                    className={`visual-element ${element.type}`}
                    style={{
                        position: 'absolute',
                        left: `${element.position.x}%`,
                        top: `${element.position.y}%`,
                        transform: `scale(${element.scale})`,
                        opacity: element.opacity
                    }}
                >
                    {element.type === 'text' && <p>{element.content}</p>}
                    {element.type === 'image' && (
                        <img
                            src={element.content}
                            alt={element.content}
                            loading="lazy"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/fallback.png';
                            }}
                        />
                    )}
                    {element.type === '3dModel' && (
                        <Canvas
                            camera={{ position: [0, 0, 5], fov: 75 }}
                            gl={{ antialias: true }}
                        >
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} />
                            <OrbitControls enableDamping />
                            {/* 3D modell betöltése */}
                        </Canvas>
                    )}
                </div>
            </ErrorBoundary>
        ));
    };

    return (
        <div className="transformation-video">
            <div className="video-container" ref={containerRef}>
                {isPlaying ? renderVisualElements() : <LoadingSpinner />}
            </div>

            <div className="controls">
                <button
                    onClick={() => isPlaying ? pauseSequence() : playSequence()}
                    aria-label={isPlaying ? 'Szünet' : 'Lejátszás'}
                >
                    {isPlaying ? 'Szünet' : 'Lejátszás'}
                </button>

                <div className="progress-bar">
                    <div
                        className="progress"
                        style={{ width: `${progress * 100}%` }}
                        role="progressbar"
                        aria-valuenow={progress * 100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>
            </div>

            <div className="step-indicator" role="tablist">
                {sequence.steps.map((_, index) => (
                    <div
                        key={index}
                        className={`step-dot ${index === currentStep ? 'active' : ''}`}
                        role="tab"
                        aria-selected={index === currentStep}
                    />
                ))}
            </div>
        </div>
    );
}; 