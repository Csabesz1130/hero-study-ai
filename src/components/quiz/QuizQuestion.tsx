// src/components/quiz/QuizQuestion.tsx
import { QuizQuestion } from "@/types/quiz";

interface QuizQuestionProps {
    question: QuizQuestion;
    selectedAnswerIndex: number | null;
    evaluation: {
        isCorrect: boolean;
        explanation: string;
        feedback: string;
        masteryLevel: number;
    } | null;
    onSelectAnswer: (index: number) => void;
    disabled?: boolean;
}

export default function QuizQuestionComponent({
    question,
    selectedAnswerIndex,
    evaluation,
    onSelectAnswer,
    disabled = false
}: QuizQuestionProps) {
    return (
        <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">{question.question}</h3>

                {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {question.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onSelectAnswer(index)}
                        disabled={evaluation !== null || disabled}
                        className={`w-full p-4 text-left rounded-lg transition-colors ${selectedAnswerIndex === index
                            ? evaluation
                                ? index === question.correctAnswerIndex
                                    ? "bg-green-500 text-white"
                                    : index === selectedAnswerIndex
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-700 hover:bg-gray-600 text-white"
                                : "bg-blue-600 text-white"
                            : "bg-gray-700 hover:bg-gray-600 text-white"
                            }`}
                    >
                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                    </button>
                ))}
            </div>

            {evaluation && (
                <div
                    className={`p-4 rounded-lg ${evaluation.isCorrect ? "bg-green-900/50" : "bg-red-900/50"
                        }`}
                >
                    <p className="font-semibold mb-2">
                        {evaluation.isCorrect ? "Correct!" : "Incorrect"}
                    </p>
                    <p className="text-gray-300 mb-2">{evaluation.explanation}</p>
                    <p className="text-gray-400 italic">{evaluation.feedback}</p>
                </div>
            )}
        </div>
    );
}