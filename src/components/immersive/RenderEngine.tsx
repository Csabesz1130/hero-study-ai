import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PerformanceSettings } from '@/types/immersive';

interface RenderEngineProps {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    settings: PerformanceSettings;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

export const RenderEngine: React.FC<RenderEngineProps> = ({
    scene,
    camera,
    settings,
    onLoad,
    onError
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const controlsRef = useRef<OrbitControls>();
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        if (!containerRef.current) return;

        // Renderer inicializálása
        const renderer = new THREE.WebGLRenderer({
            antialias: settings.antialiasing,
            powerPreference: 'high-performance'
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = settings.shadows;
        rendererRef.current = renderer;
        containerRef.current.appendChild(renderer.domElement);

        // OrbitControls inicializálása
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        // Scene beállítása
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 10, 100);

        // Fényforrások
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = settings.shadows;
        scene.add(directionalLight);

        // Animáció loop
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [scene, camera, settings]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}; 