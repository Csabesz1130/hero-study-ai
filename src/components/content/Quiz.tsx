"use client";

import { useState, useEffect } from "react";
import { QuizContent, QuizQuestion, ContentProgress } from "@/types/content";
import { toast } from "react-hot-toast";

interface QuizProps {
    content: QuizContent;
    onProgressUpdate: (progress: ContentProgress) => void;
}

export function Quiz({ content, onProgressUpdate }: QuizProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>(content.questions);

    useEffect(() => {
        // Kérdések nehézségének adaptálása
        if (content.adaptiveDifficulty) {
            const adaptedQuestions = adaptQuestions(content.questions);
            setQuestions(adaptedQuestions);
        }

        // Időzítő beállítása
        if (content.questions[currentQuestionIndex].timeLimit) {
            setTimeLeft(content.questions[currentQuestionIndex].timeLimit);
        }
    }, [content, currentQuestionIndex]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
            }, 1000);

            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            handleTimeUp();
        }
    }, [timeLeft]);

    const adaptQuestions = (questions: QuizQuestion[]): QuizQuestion[] => {
        return questions.map((question, index) => {
            if (index === 0) return question;

            const previousQuestion = questions[index - 1];
            const previousCorrect = previousQuestion.correctAnswer === selectedAnswer;

            if (previousCorrect) {
                // Nehezebb kérdés
                return {
                    ...question,
                    difficulty: increaseDifficulty(question.difficulty),
                };
            } else {
                // Könnyebb kérdés
                return {
                    ...question,
                    difficulty: decreaseDifficulty(question.difficulty),
                };
            }
        });
    };

    const increaseDifficulty = (current: QuizQuestion["difficulty"]): QuizQuestion["difficulty"] => {
        switch (current) {
            case "easy":
                return "medium";
            case "medium":
                return "hard";
            default:
                return "hard";
        }
    };

    const decreaseDifficulty = (current: QuizQuestion["difficulty"]): QuizQuestion["difficulty"] => {
        switch (current) {
            case "hard":
                return "medium";
            case "medium":
                return "easy";
            default:
                return "easy";
        }
    };

    const handleAnswerSelect = (answerIndex: number) => {
        if (selectedAnswer !== null) return;

        setSelectedAnswer(answerIndex);
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = answerIndex === currentQuestion.correctAnswer;

        if (isCorrect) {
            setScore((prev) => prev + 1);
            toast.success("Helyes válasz!");
        } else {
            toast.error("Helytelen válasz!");
        }

        setShowExplanation(true);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
            if (questions[currentQuestionIndex + 1].timeLimit) {
                setTimeLeft(questions[currentQuestionIndex + 1].timeLimit);
            }
        } else {
            handleQuizComplete();
        }
    };

    const handleTimeUp = () => {
        toast.error("Lejárt az idő!");
        setShowExplanation(true);
    };

    const handleQuizComplete = () => {
        const finalScore = (score / questions.length) * 100;
        const passed = finalScore >= content.passingScore;

        onProgressUpdate({
            contentId: content.id,
            type: "quiz",
            progress: 100,
            completed: passed,
            lastAccessed: new Date(),
            engagement: {
                score: finalScore,
                attempts: attempts + 1,
            },
        });

        if (passed) {
            toast.success(`Gratulálok! Teljesítetted a kvízt ${finalScore.toFixed(1)}% eredménnyel!`);
        } else {
            toast.error(`Nem sikerült teljesíteni a kvízt. Eredmény: ${finalScore.toFixed(1)}%`);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
                <p className="text-gray-400">{content.description}</p>
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">
                        Kérdés {currentQuestionIndex + 1} / {questions.length}
                    </span>
                    {timeLeft !== null && (
                        <span className="text-gray-400">Hátralévő idő: {timeLeft}s</span>
                    )}
                </div>

                <div className="bg-gray-700 p-6 rounded-lg mb-6">
                    <h3 className="text-xl text-white mb-4">{currentQuestion.question}</h3>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={selectedAnswer !== null}
                                className={`w-full p-4 text-left rounded-lg transition-colors ${selectedAnswer === null
                                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                                        : selectedAnswer === index
                                            ? index === currentQuestion.correctAnswer
                                                ? "bg-green-600 text-white"
                                                : "bg-red-600 text-white"
                                            : index === currentQuestion.correctAnswer
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-600 text-white"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {showExplanation && (
                    <div className="bg-gray-700 p-4 rounded-lg mb-6">
                        <h4 className="text-lg font-semibold text-white mb-2">Magyarázat</h4>
                        <p className="text-gray-300">{currentQuestion.explanation}</p>
                    </div>
                )}

                {showExplanation && (
                    <button
                        onClick={handleNext}
                        className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        {currentQuestionIndex < questions.length - 1 ? "Következő kérdés" : "Kvíz befejezése"}
                    </button>
                )}
            </div>

            <div className="text-center text-gray-400">
                <p>Jelenlegi pontszám: {score}</p>
                <p>Próbálkozások száma: {attempts}</p>
            </div>
        </div>
    );
} 