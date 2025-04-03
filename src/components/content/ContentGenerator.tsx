// src/components/content/ContentGenerator.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { VideoScriptResult, ContentGenerationRequest } from "@/lib/ai/types";
import { AVAILABLE_VOICES } from "@/lib/ai/elevenlabs";
import { toast } from "react-hot-toast";

export function ContentGenerator() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VideoScriptResult | null>(null);
    const [request, setRequest] = useState<ContentGenerationRequest>({
        learningObjective: "",
        userLevel: "beginner",
        format: "video",
        durationSeconds: 60,
        preferences: {
            style: "conversational",
            voice: "rachel",
            includeHooks: true,
            addressMisconceptions: true,
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/learning/generate-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate content");
            }

            const data = await response.json();
            setResult(data.data);
            toast.success("Content generated successfully!");
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
            console.error("Error generating content:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Educational Content</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="objective" className="text-sm font-medium">
                                Learning Objective
                            </label>
                            <Input
                                id="objective"
                                value={request.learningObjective}
                                onChange={(e) =>
                                    setRequest({ ...request, learningObjective: e.target.value })
                                }
                                placeholder="E.g., Understanding how photosynthesis works"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="level" className="text-sm font-medium">
                                    User Level
                                </label>
                                <select
                                    id="level"
                                    value={request.userLevel}
                                    onChange={(e) =>
                                        setRequest({
                                            ...request,
                                            userLevel: e.target.value as "beginner" | "intermediate" | "advanced",
                                        })
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="duration" className="text-sm font-medium">
                                    Duration (seconds)
                                </label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min={30}
                                    max={300}
                                    value={request.durationSeconds}
                                    onChange={(e) =>
                                        setRequest({
                                            ...request,
                                            durationSeconds: parseInt(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="style" className="text-sm font-medium">
                                    Style
                                </label>
                                <select
                                    id="style"
                                    value={request.preferences?.style}
                                    onChange={(e) =>
                                        setRequest({
                                            ...request,
                                            preferences: {
                                                ...request.preferences,
                                                style: e.target.value as "conversational" | "academic" | "storytelling",
                                            },
                                        })
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
                                >
                                    <option value="conversational">Conversational</option>
                                    <option value="academic">Academic</option>
                                    <option value="storytelling">Storytelling</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="voice" className="text-sm font-medium">
                                    Voice
                                </label>
                                <select
                                    id="voice"
                                    value={request.preferences?.voice}
                                    onChange={(e) =>
                                        setRequest({
                                            ...request,
                                            preferences: {
                                                ...request.preferences,
                                                voice: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
                                >
                                    {Object.keys(AVAILABLE_VOICES).map((voiceKey) => (
                                        <option key={voiceKey} value={voiceKey}>
                                            {voiceKey.charAt(0).toUpperCase() + voiceKey.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            disabled={loading || !request.learningObjective}
                            className="w-full"
                        >
                            {loading ? "Generating..." : "Generate Content"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {result && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>{result.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Description</h3>
                            <p className="text-gray-300">{result.description}</p>
                        </div>

                        {result.narrationAudioUrl && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Audio Narration</h3>
                                <audio
                                    controls
                                    src={result.narrationAudioUrl}
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Script Sections</h3>
                            <div className="space-y-4">
                                {result.sections.map((section, index) => (
                                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold">{section.title}</h4>
                                            <span className="text-sm text-gray-400">
                                                {section.durationSeconds}s
                                            </span>
                                        </div>
                                        <p className="text-gray-300 mb-2">{section.content}</p>
                                        {section.visualNotes && (
                                            <div className="mt-2 pt-2 border-t border-gray-700">
                                                <p className="text-sm text-gray-400">
                                                    <span className="font-semibold">Visual:</span>{" "}
                                                    {section.visualNotes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}