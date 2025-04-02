"use client";

import { useState, useEffect, useRef } from "react";
import { SimulationContent, SimulationState, SimulationEvent, ContentProgress } from "@/types/content";
import { toast } from "react-hot-toast";

interface SimulationProps {
    content: SimulationContent;
    onProgressUpdate: (progress: ContentProgress) => void;
}

export function Simulation({ content, onProgressUpdate }: SimulationProps) {
    const [currentState, setCurrentState] = useState<SimulationState>(content.initialState);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [interactions, setInteractions] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Canvas inicializálása
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Canvas méretezése
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    useEffect(() => {
        // Szimuláció állapotának frissítése
        const currentStep = content.steps[currentStepIndex];
        if (!currentStep) return;

        // Validációk ellenőrzése
        const validationResults = currentStep.validation.map(rule => {
            try {
                const isValid = evaluateCondition(rule.condition, currentState.variables);
                return { rule, isValid };
            } catch (error) {
                console.error("Hiba a validáció során:", error);
                return { rule, isValid: false };
            }
        });

        // Feedback megjelenítése
        validationResults.forEach(({ rule, isValid }) => {
            if (isValid) {
                toast.success(rule.feedback);
                if (rule.nextStep) {
                    const nextStepIndex = content.steps.findIndex(step => step.id === rule.nextStep);
                    if (nextStepIndex !== -1) {
                        setCurrentStepIndex(nextStepIndex);
                    }
                }
            }
        });

        // Progress frissítése
        const progress = ((currentStepIndex + 1) / content.steps.length) * 100;
        onProgressUpdate({
            contentId: content.id,
            type: "simulation",
            progress,
            completed: progress >= 100,
            lastAccessed: new Date(),
            engagement: {
                interactions,
            },
        });

        // Szimuláció befejezésének ellenőrzése
        if (currentStepIndex === content.steps.length - 1) {
            setIsComplete(true);
            toast.success("Gratulálok! Teljesítetted a szimulációt!");
        }
    }, [currentStepIndex, currentState, content, interactions, onProgressUpdate]);

    const evaluateCondition = (condition: string, variables: Record<string, any>): boolean => {
        // Biztonságos feltétel kiértékelése
        try {
            const safeEval = new Function("variables", `return ${condition}`);
            return safeEval(variables);
        } catch (error) {
            console.error("Hiba a feltétel kiértékelése során:", error);
            return false;
        }
    };

    const handleUserAction = (action: string, data: Record<string, any>) => {
        setInteractions(prev => prev + 1);

        // Esemény rögzítése
        const event: SimulationEvent = {
            id: `event-${Date.now()}`,
            type: "userAction",
            timestamp: Date.now(),
            data: { action, ...data },
        };

        setCurrentState(prev => ({
            ...prev,
            events: [...prev.events, event],
        }));

        // Feedback szabályok ellenőrzése
        content.feedbackRules.forEach(rule => {
            if (evaluateCondition(rule.condition, { ...currentState.variables, ...data })) {
                toast(rule.message, {
                    type: rule.type === "success" ? "success" : rule.type === "warning" ? "warning" : "error",
                });
            }
        });
    };

    const renderSimulation = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        // Canvas törlése
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Szimuláció renderelése az aktuális állapot alapján
        const currentStep = content.steps[currentStepIndex];
        if (!currentStep) return;

        // Példa renderelés (ezt a valós implementációban kell testreszabni)
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Interaktív elemek renderelése
        currentStep.actions.forEach(action => {
            switch (action.type) {
                case "button":
                    renderButton(ctx, action);
                    break;
                case "input":
                    renderInput(ctx, action);
                    break;
                case "select":
                    renderSelect(ctx, action);
                    break;
                case "drag":
                    renderDraggable(ctx, action);
                    break;
            }
        });
    };

    const renderButton = (ctx: CanvasRenderingContext2D, action: any) => {
        // Button renderelési logika
    };

    const renderInput = (ctx: CanvasRenderingContext2D, action: any) => {
        // Input renderelési logika
    };

    const renderSelect = (ctx: CanvasRenderingContext2D, action: any) => {
        // Select renderelési logika
    };

    const renderDraggable = (ctx: CanvasRenderingContext2D, action: any) => {
        // Draggable elem renderelési logika
    };

    useEffect(() => {
        renderSimulation();
    }, [currentState, currentStepIndex]);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
                <p className="text-gray-400">{content.description}</p>
            </div>

            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    onClick={(e) => {
                        // Kattintás kezelése
                        const rect = canvasRef.current?.getBoundingClientRect();
                        if (!rect) return;

                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;

                        handleUserAction("click", { x, y });
                    }}
                />
            </div>

            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">
                    {content.steps[currentStepIndex]?.title}
                </h3>
                <p className="text-gray-300">
                    {content.steps[currentStepIndex]?.description}
                </p>
            </div>

            <div className="mt-4 text-center text-gray-400">
                <p>Interakciók száma: {interactions}</p>
                <p>Haladás: {Math.round((currentStepIndex + 1) / content.steps.length * 100)}%</p>
            </div>
        </div>
    );
} 