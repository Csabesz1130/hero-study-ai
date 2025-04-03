// src/app/api/learning/quiz/generate/route.ts
import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai/quiz";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        // Apply rate limiting
        const rateLimitResult = await rateLimiter.check(request);
        if (!rateLimitResult.success) {
            logger.warn("Rate limit exceeded for quiz generation");
            return NextResponse.json(
                { error: "Rate limit exceeded. Try again later." },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate required fields
        if (!body.learningObjective || !body.userLevel) {
            return NextResponse.json(
                { error: "Missing required fields: learningObjective, userLevel" },
                { status: 400 }
            );
        }

        // Generate the quiz
        const quiz = await generateQuiz({
            learningObjective: body.learningObjective,
            userLevel: body.userLevel,
            questionCount: body.questionCount || 5,
            adaptiveDifficulty: body.adaptiveDifficulty || false,
            preferredQuestionTypes: body.preferredQuestionTypes || ["multiple_choice"],
            previousCorrectAnswers: body.previousCorrectAnswers,
            previousIncorrectAnswers: body.previousIncorrectAnswers,
        });

        // Store the quiz in Firestore
        try {
            const quizzesRef = collection(db, "quizzes");
            const quizData = {
                ...quiz,
                userId: body.userId,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(quizzesRef, quizData);

            // Return the quiz with Firestore ID
            return NextResponse.json({
                message: "Quiz generated successfully",
                data: {
                    ...quiz,
                    id: docRef.id,
                }
            });
        } catch (dbError) {
            logger.error("Failed to store quiz in database", { error: dbError });
            // Continue anyway and return the generated quiz
            return NextResponse.json({
                message: "Quiz generated successfully, but failed to save",
                data: quiz
            });
        }
    } catch (error) {
        logger.error("Error generating quiz", { error });
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate quiz" },
            { status: 500 }
        );
    }
}