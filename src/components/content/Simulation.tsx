"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface SimulationProps {
    objectiveId: string;
    userId: string;
    initialConfig: {
        type: "code" | "physics" | "chemistry";
        parameters: Record<string, any>;
    };
}

export function Simulation({ objectiveId, userId, initialConfig }: SimulationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [interactions, setInteractions] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
    const [config, setConfig] = useState(initialConfig);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let lastTime = 0;

        const animate = (currentTime: number) => {
            if (!isRunning) return;

            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update simulation based on type
            switch (config.type) {
                case "code":
                    updateCodeSimulation(ctx, deltaTime);
                    break;
                case "physics":
                    updatePhysicsSimulation(ctx, deltaTime);
                    break;
                case "chemistry":
                    updateChemistrySimulation(ctx, deltaTime);
                    break;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        if (isRunning) {
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isRunning, config]);

    const updateCodeSimulation = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
        // TODO: Implement code execution visualization
        ctx.fillStyle = "#4F46E5";
        ctx.fillRect(50, 50, 100, 100);
    };

    const updatePhysicsSimulation = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
        // TODO: Implement physics simulation
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.arc(100, 100, 50, 0, Math.PI * 2);
        ctx.fill();
    };

    const updateChemistrySimulation = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
        // TODO: Implement chemistry simulation
        ctx.fillStyle = "#EF4444";
        ctx.fillRect(75, 75, 150, 150);
    };

    const handleInteraction = async (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        setInteractions(prev => prev + 1);

        // Update simulation parameters based on interaction
        setConfig(prev => ({
            ...prev,
            parameters: {
                ...prev.parameters,
                lastInteraction: { x, y },
            },
        }));

        // Track interaction
        try {
            await api.progress.update({
                userId,
                objectiveId,
                interactionType: "simulation",
                interactionData: { x, y },
            });
        } catch (error) {
            console.error("Hiba történt az interakció mentése közben:", error);
        }
    };

    const handleStart = () => {
        setIsRunning(true);
        setLastUpdateTime(Date.now());
    };

    const handleStop = () => {
        setIsRunning(false);
    };

    const handleReset = () => {
        setConfig(initialConfig);
        setInteractions(0);
        setIsRunning(false);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full"
                    onClick={handleInteraction}
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        onClick={handleStart}
                        disabled={isRunning}
                    >
                        Indítás
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        onClick={handleStop}
                        disabled={!isRunning}
                    >
                        Leállítás
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        onClick={handleReset}
                    >
                        Újraindítás
                    </button>
                </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                <span>Interakciók: {interactions}</span>
                <span>Szimuláció típusa: {config.type}</span>
            </div>
        </div>
    );
} 