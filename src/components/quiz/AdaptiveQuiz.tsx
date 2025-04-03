// src/components/quiz/AdaptiveQuiz.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { QuizQuestion } from "@/types/quiz";
import QuizResultsComponent from "./QuizResults";
import QuizQuestionComponent from "./QuizQuestion";
import { toast } from "react-hot-toast";

interface AdaptiveQuizProps {
    quizId: string;
    userId: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    onComplete?: (results: any) => void;
}

export default function AdaptiveQuiz({
    quizId,
    userId,
    title,
    description,
    questions,
    onComplete
}: AdaptiveQuizProps) {
    const router = useRouter();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<{
        questionId: string;
        selectedAnswerIndex: number;
        isCorrect: boolean;
        timeSpentSeconds: number;
    }[]>([]);
    const [evaluation, setEvaluation] = useState<{
        isCorrect: boolean;
        explanation: string;
        feedback: string;
        masteryLevel: number;
    } | null>(null);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizAnalytics, setQuizAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Reset timer when moving to a new question
        setStartTime(Date.now());
    }, [currentQuestionIndex]);

    const handleAnswerSelect = (answerIndex: number) => {
        if (evaluation) return; // Don't allow changing answers after evaluation
        setSelectedAnswer(answerIndex);
    };

    const handleSubmitAnswer = async () => {
        if (selectedAnswer === null || !questions[currentQuestionIndex]) return;
        setIsLoading(true);

        try {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);

            const response = await fetch(`/api/learning/quiz/evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quizId,
                    userId,
                    questionId: questions[currentQuestionIndex].id,
                    selectedAnswerIndex: selectedAnswer,
                    timeSpentSeconds: timeSpent,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to evaluate answer");
            }

            const data = await response.json();
            setEvaluation(data.data);

            // Add answer to list
            const newAnswer = {
                questionId: questions[currentQuestionIndex].id,
                selectedAnswerIndex: selectedAnswer,
                isCorrect: data.data.isCorrect,
                timeSpentSeconds: timeSpent,
            };

            setAnswers([...answers, newAnswer]);
        } catch (error) {
            console.error(error);
            toast.error("Error evaluating answer");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setEvaluation(null);
        } else {
            completeQuiz();
        }
    };

    const completeQuiz = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`/api/learning/quiz/analytics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quizId,
                    userId,
                    answers,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to analyze quiz results");
            }

            const data = await response.json();
            setQuizAnalytics(data.data);
            setQuizCompleted(true);

            if (onComplete) {
                onComplete(data.data);
            }

            toast.success("Quiz completed!");
        } catch (error) {
            console.error(error);
            toast.error("Error completing quiz");
        } finally {
            setIsLoading(false);
        }
    };

    // If quiz is completed, show results
    if (quizCompleted && quizAnalytics) {
        return (
            <QuizResultsComponent
                quizId={quizId}
                title={title}
                analytics={quizAnalytics}
                answers={answers}
                questions={questions}
                onReturnToDashboard={() => router.push("/dashboard")}
            />
        );
    }

    // Loading state
    if (questions.length === 0) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardContent className="p-8">
                    <div className="flex justify-center items-center h-40">
                        <p className="text-lg text-gray-400">Loading quiz questions...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + (evaluation ? 1 : 0)) / questions.length) * 100;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{title}</span>
                    <span className="text-sm text-gray-400">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress bar */}
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Question component */}
                <QuizQuestionComponent
                    question={currentQuestion}
                    selectedAnswerIndex={selectedAnswer}
                    evaluation={evaluation}
                    onSelectAnswer={handleAnswerSelect}
                    disabled={isLoading}
                />
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="text-sm text-gray-400">
                    Difficulty: {currentQuestion.difficulty}
                </div>
                {evaluation ? (
                    <Button
                        onClick={handleNextQuestion}
                        disabled={isLoading}
                    >
                        {currentQuestionIndex < questions.length - 1
                            ? "Next Question"
                            : "Complete Quiz"}
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmitAnswer}
                        disabled={selectedAnswer === null || isLoading}
                    >
                        {isLoading ? "Submitting..." : "Submit Answer"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}