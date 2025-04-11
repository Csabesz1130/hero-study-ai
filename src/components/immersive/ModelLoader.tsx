import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

interface ModelLoaderProps {
    url: string;
    onLoad: (model: THREE.Group) => void;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({
    url,
    onLoad,
    onProgress,
    onError
}) => {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();

        // DRACO tömörítés beállítása
        dracoLoader.setDecoderPath('/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(
            url,
            (gltf) => {
                setLoading(false);
                onLoad(gltf.scene);
            },
            (xhr) => {
                const progress = (xhr.loaded / xhr.total) * 100;
                setProgress(progress);
                onProgress?.(progress);
            },
            (error) => {
                setLoading(false);
                onError?.(error);
            }
        );

        return () => {
            loader.dispose();
            dracoLoader.dispose();
        };
    }, [url, onLoad, onProgress, onError]);

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="progress-bar">
                    <div
                        className="progress"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p>Modell betöltése: {Math.round(progress)}%</p>
            </div>
        );
    }

    return null;
}; 