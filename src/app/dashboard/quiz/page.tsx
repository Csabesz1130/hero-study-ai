// src/app/dashboard/quiz/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default function QuizDashboardPage() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                loadQuizzes(user.uid);
            } else {
                router.push("/auth/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const loadQuizzes = async (uid: string) => {
        try {
            setLoading(true);
            const quizzesRef = collection(db, "quizzes");
            const q = query(
                quizzesRef,
                where("userId", "==", uid),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);
            const quizData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            setQuizzes(quizData);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load quizzes");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = () => {
        router.push("/dashboard/quiz/generate");
    };

    const handleTakeQuiz = (quizId: string) => {
        router.push(`/dashboard/quiz/${quizId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Quiz Dashboard</h1>
                    <div className="flex space-x-2">
                        <Button onClick={() => router.push("/dashboard")}>
                            Dashboard
                        </Button>
                        <Button onClick={handleCreateQuiz}>
                            Create New Quiz
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Your Quizzes</h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Loading quizzes...</p>
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="bg-gray-800 p-8 rounded-lg text-center">
                            <p className="text-gray-300 mb-4">You haven't created any quizzes yet.</p>
                            <Button onClick={handleCreateQuiz}>
                                Create Your First Quiz
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quizzes.map((quiz) => (
                                <Card key={quiz.id}>
                                    <CardHeader>
                                        <CardTitle>{quiz.title}</CardTitle>
                                        <CardDescription>
                                            {quiz.questions.length} questions • {quiz.targetLevel} level
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-300 mb-4">{quiz.description}</p>
                                        <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                                            <span>Created: {new Date(quiz.generatedAt).toLocaleDateString()}</span>
                                            <span>{quiz.estimatedTimeMinutes} min</span>
                                        </div>
                                        <Button
                                            onClick={() => handleTakeQuiz(quiz.id)}
                                            className="w-full"
                                        >
                                            Take Quiz
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}