// src/app/dashboard/quiz/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import AdaptiveQuiz from "@/components/quiz/AdaptiveQuiz";
import { toast } from "react-hot-toast";

export default function QuizPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [quiz, setQuiz] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                loadQuiz(params.id);
            } else {
                router.push("/auth/login");
            }
        });

        return () => unsubscribe();
    }, [params.id, router]);

    const loadQuiz = async (quizId: string) => {
        try {
            setLoading(true);
            const quizDoc = await getDoc(doc(db, "quizzes", quizId));

            if (!quizDoc.exists()) {
                setError("Quiz not found");
                return;
            }

            const quizData = quizDoc.data();
            setQuiz({
                id: quizId,
                ...quizData
            });
        } catch (error) {
            console.error(error);
            setError("Failed to load quiz");
            toast.error("Failed to load quiz");
        } finally {
            setLoading(false);
        }
    };

    const handleQuizComplete = (results: any) => {
        // Update any necessary state or redirect
        console.log("Quiz completed:", results);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-white">Loading quiz...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
                <div className="text-white text-center mb-4">{error}</div>
                <Button onClick={() => router.push("/dashboard/quiz")}>
                    Return to Quizzes
                </Button>
            </div>
        );
    }

    if (!quiz || !userId) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Taking Quiz</h1>
                    <Button onClick={() => router.push("/dashboard/quiz")}>
                        Exit Quiz
                    </Button>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <AdaptiveQuiz
                    quizId={quiz.id}
                    userId={userId}
                    title={quiz.title}
                    description={quiz.description}
                    questions={quiz.questions}
                    onComplete={handleQuizComplete}
                />
            </main>
        </div>
    );
}