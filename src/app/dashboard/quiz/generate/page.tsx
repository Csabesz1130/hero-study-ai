// src/app/dashboard/quiz/generate/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import QuizGenerator from "@/components/quiz/QuizGenerator";

export default function GenerateQuizPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                router.push("/auth/login");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!userId) {
        return null; // Handled by the useEffect redirect
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Generate Quiz</h1>
                    <Button onClick={() => router.push("/dashboard/quiz")}>
                        Back to Quizzes
                    </Button>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <QuizGenerator userId={userId} />
            </main>
        </div>
    );
}