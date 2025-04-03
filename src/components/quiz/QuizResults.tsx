// src/components/quiz/QuizResults.tsx
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { QuizQuestion } from "@/types/quiz";

interface QuizResultsProps {
    quizId: string;
    title: string;
    analytics: {
        score: number;
        masteryLevel: number;
        completionTime: number;
        difficultConcepts: string[];
        recommendedReview: string[];
        strengths: string[];
        weaknesses: string[];
        nextSteps: {
            type: string;
            description: string;
            priority: number;
        }[];
    };
    answers: {
        questionId: string;
        selectedAnswerIndex: number;
        isCorrect: boolean;
        timeSpentSeconds: number;
    }[];
    questions: QuizQuestion[];
    onReturnToDashboard: () => void;
}

export default function QuizResultsComponent({
    quizId,
    title,
    analytics,
    answers,
    questions,
    onReturnToDashboard
}: QuizResultsProps) {
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Quiz Completed!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 bg-gray-800 rounded-lg text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Your Results</h3>
                    <p className="text-4xl font-bold text-primary-500 mb-4">
                        {Math.round(analytics.score)}%
                    </p>
                    <p className="text-gray-300">
                        You answered {answers.filter(a => a.isCorrect).length} out of {questions.length} questions correctly.
                    </p>
                    <p className="text-gray-400 mt-2">
                        Time taken: {formatTime(analytics.completionTime)}
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Mastery Level</h3>
                    <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-primary-500"
                            style={{ width: `${analytics.masteryLevel}%` }}
                        />
                    </div>
                    <p className="text-gray-300">
                        Your mastery level for this topic is {analytics.masteryLevel}%
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Your Strengths</h3>
                        {analytics.strengths.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {analytics.strengths.map((strength, index) => (
                                    <li key={index} className="text-gray-300">{strength}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No specific strengths identified</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Areas to Improve</h3>
                        {analytics.weaknesses.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {analytics.weaknesses.map((weakness, index) => (
                                    <li key={index} className="text-gray-300">{weakness}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No specific weaknesses identified</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Recommended Next Steps</h3>
                    <div className="space-y-2">
                        {analytics.nextSteps.map((step, index) => (
                            <div key={index} className="p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center">
                                    <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded mr-2">
                                        {step.type}
                                    </span>
                                    <span className="text-gray-300">{step.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={onReturnToDashboard} className="w-full">
                    Return to Dashboard
                </Button>
            </CardFooter>
        </Card>
    );
}