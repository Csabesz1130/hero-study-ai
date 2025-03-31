"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    explanation: string;
}

interface QuizProps {
    objectiveId: string;
    userId: string;
    initialDifficulty: "beginner" | "intermediate" | "advanced";
}

export function Quiz({ objectiveId, userId, initialDifficulty }: QuizProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [difficulty, setDifficulty] = useState(initialDifficulty);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuestions();
    }, [difficulty]);

    const loadQuestions = async () => {
        try {
            // TODO: Implement question fetching from API
            const mockQuestions: Question[] = [
                {
                    id: "1",
                    text: "Mi a JavaScript alapvető adattípusa?",
                    options: ["String", "Number", "Boolean", "Mindegyik"],
                    correctAnswer: 3,
                    difficulty: "beginner",
                    explanation: "A JavaScript-ben mindhárom alapvető adattípus létezik.",
                },
                // Add more mock questions here
            ];
            setQuestions(mockQuestions);
        } catch (error) {
            console.error("Hiba történt a kérdések betöltése közben:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (index: number) => {
        setSelectedAnswer(index);
        setShowExplanation(true);

        const isCorrect = index === questions[currentQuestionIndex].correctAnswer;
        if (isCorrect) {
            setScore(score + 1);
        }

        // Adjust difficulty based on performance
        if (isCorrect && difficulty !== "advanced") {
            setDifficulty(
                difficulty === "beginner" ? "intermediate" : "advanced"
            );
        } else if (!isCorrect && difficulty !== "beginner") {
            setDifficulty(
                difficulty === "advanced" ? "intermediate" : "beginner"
            );
        }
    };

    const handleNext = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            // Quiz completed
            try {
                await api.progress.update({
                    userId,
                    objectiveId,
                    quizScore: score,
                    difficulty,
                });
            } catch (error) {
                console.error("Hiba történt az eredmény mentése közben:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-white">Kérdések betöltése...</div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Kvíz</span>
                    <span className="text-sm text-gray-400">
                        {currentQuestionIndex + 1} / {questions.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <p className="text-lg text-white">{currentQuestion.text}</p>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                className={`w-full p-4 text-left rounded-lg transition-colors ${selectedAnswer === index
                                        ? index === currentQuestion.correctAnswer
                                            ? "bg-green-500 text-white"
                                            : "bg-red-500 text-white"
                                        : "bg-gray-700 hover:bg-gray-600 text-white"
                                    }`}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={selectedAnswer !== null}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    {showExplanation && (
                        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                            <p className="text-white">{currentQuestion.explanation}</p>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-400">
                            Nehézség: {difficulty}
                        </div>
                        <Button
                            onClick={handleNext}
                            disabled={selectedAnswer === null}
                        >
                            {currentQuestionIndex === questions.length - 1
                                ? "Befejezés"
                                : "Következő"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 