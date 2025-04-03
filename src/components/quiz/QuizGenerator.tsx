// src/components/quiz/QuizGenerator.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { toast } from "react-hot-toast";

interface QuizGeneratorProps {
    userId: string;
}

export default function QuizGenerator({ userId }: QuizGeneratorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        learningObjective: "",
        userLevel: "beginner" as "beginner" | "intermediate" | "advanced",
        questionCount: 5,
        adaptiveDifficulty: true,
        questionTypes: ["multiple_choice", "true_false"] as string[],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/learning/quiz/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    learningObjective: formData.learningObjective,
                    userLevel: formData.userLevel,
                    questionCount: formData.questionCount,
                    adaptiveDifficulty: formData.adaptiveDifficulty,
                    preferredQuestionTypes: formData.questionTypes,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate quiz");
            }

            const data = await response.json();
            toast.success("Quiz generated successfully!");

            // Navigate to the generated quiz
            router.push(`/dashboard/quiz/${data.data.id}`);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestionType = (type: string) => {
        setFormData(prev => {
            const types = [...prev.questionTypes];
            const index = types.indexOf(type);

            if (index === -1) {
                types.push(type);
            } else if (types.length > 1) { // Ensure at least one type is selected
                types.splice(index, 1);
            }

            return {
                ...prev,
                questionTypes: types
            };
        });
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Generate Adaptive Quiz</CardTitle>
                <CardDescription>
                    Create a personalized quiz based on your learning objective
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="objective" className="text-sm font-medium">
                            Learning Objective
                        </label>
                        <Input
                            id="objective"
                            placeholder="e.g., Understanding photosynthesis"
                            value={formData.learningObjective}
                            onChange={(e) =>
                                setFormData({ ...formData, learningObjective: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="userLevel" className="text-sm font-medium">
                                Your Level
                            </label>
                            <select
                                id="userLevel"
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
                                value={formData.userLevel}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        userLevel: e.target.value as "beginner" | "intermediate" | "advanced",
                                    })
                                }
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="questionCount" className="text-sm font-medium">
                                Number of Questions
                            </label>
                            <Input
                                id="questionCount"
                                type="number"
                                min={3}
                                max={15}
                                value={formData.questionCount}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        questionCount: parseInt(e.target.value) || 5,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Question Types</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-full text-sm ${formData.questionTypes.includes("multiple_choice")
                                    ? "bg-primary-500 text-white"
                                    : "bg-gray-700 text-gray-300"
                                    }`}
                                onClick={() => toggleQuestionType("multiple_choice")}
                            >
                                Multiple Choice
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-full text-sm ${formData.questionTypes.includes("true_false")
                                    ? "bg-primary-500 text-white"
                                    : "bg-gray-700 text-gray-300"
                                    }`}
                                onClick={() => toggleQuestionType("true_false")}
                            >
                                True/False
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-full text-sm ${formData.questionTypes.includes("fill_in_blank")
                                    ? "bg-primary-500 text-white"
                                    : "bg-gray-700 text-gray-300"
                                    }`}
                                onClick={() => toggleQuestionType("fill_in_blank")}
                            >
                                Fill in Blank
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            id="adaptive"
                            type="checkbox"
                            checked={formData.adaptiveDifficulty}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    adaptiveDifficulty: e.target.checked,
                                })
                            }
                            className="rounded border-gray-700 bg-gray-800 text-primary-500"
                        />
                        <label htmlFor="adaptive" className="text-sm">
                            Enable adaptive difficulty
                        </label>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || !formData.learningObjective}
                    >
                        {loading ? "Generating Quiz..." : "Generate Quiz"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}