import React, { useEffect, useRef } from 'react';
import { TransformationSequence } from '../../types/transformation';
import { useTransformationVideo } from '../../hooks/useTransformationVideo';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface TransformationVideoProps {
    sequence: TransformationSequence;
    onComplete?: () => void;
}

export const TransformationVideo: React.FC<TransformationVideoProps> = ({ sequence, onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
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
            <div
                key={index}
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
                {element.type === 'image' && <img src={element.content} alt="" />}
                {element.type === '3dModel' && (
                    <Canvas>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <OrbitControls />
                        {/* 3D modell betöltése */}
                    </Canvas>
                )}
            </div>
        ));
    };

    return (
        <div className="transformation-video">
            <div className="video-container" ref={canvasRef}>
                {renderVisualElements()}
            </div>

            <div className="controls">
                <button onClick={() => isPlaying ? pauseSequence() : playSequence()}>
                    {isPlaying ? 'Szünet' : 'Lejátszás'}
                </button>

                <div className="progress-bar">
                    <div
                        className="progress"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            </div>

            <div className="step-indicator">
                {sequence.steps.map((_, index) => (
                    <div
                        key={index}
                        className={`step-dot ${index === currentStep ? 'active' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
}; 