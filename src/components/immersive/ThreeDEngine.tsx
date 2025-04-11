import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { PositionalAudio } from 'three';

interface ThreeDEngineProps {
    sceneId: string;
    onProgress?: (progress: number) => void;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

const ThreeDEngine: React.FC<ThreeDEngineProps> = ({
    sceneId,
    onProgress,
    onLoad,
    onError
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVRSupported, setIsVRSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        containerRef.current.appendChild(renderer.domElement);

        // VR support check
        const checkVRSupport = async () => {
            if ('xr' in navigator) {
                const supported = await navigator.xr.isSessionSupported('immersive-vr');
                setIsVRSupported(supported);
                if (supported) {
                    document.body.appendChild(VRButton.createButton(renderer));
                }
            }
        };
        checkVRSupport();

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        scene.add(directionalLight);

        // Audio setup
        const audioListener = new THREE.AudioListener();
        camera.add(audioListener);

        // Model loading
        const loader = new GLTFLoader();
        const loadingManager = new THREE.LoadingManager(
            () => {
                setIsLoading(false);
                onLoad?.();
            },
            (url, loaded, total) => {
                const progress = (loaded / total) * 100;
                setProgress(progress);
                onProgress?.(progress);
            },
            (error) => {
                console.error('Error loading model:', error);
                onError?.(error);
            }
        );

        loader.setLoadingManager(loadingManager);

        // Load scene model
        loader.load(
            `/models/${sceneId}.glb`,
            (gltf) => {
                scene.add(gltf.scene);
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
                onError?.(error);
            }
        );

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            containerRef.current?.removeChild(renderer.domElement);
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach((material) => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        };
    }, [sceneId, onProgress, onLoad, onError]);

    return (
        <div className="three-d-engine">
            <div ref={containerRef} className="renderer-container" />
            {isLoading && (
                <div className="loading-overlay">
                    <div className="progress-bar">
                        <div
                            className="progress"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p>Betöltés: {Math.round(progress)}%</p>
                </div>
            )}
            {isVRSupported && (
                <div className="vr-info">
                    VR mód elérhető
                </div>
            )}
        </div>
    );
};

export default ThreeDEngine; 