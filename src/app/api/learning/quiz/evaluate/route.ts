// src/app/api/learning/quiz/evaluate/route.ts
import { NextResponse } from "next/server";
import { evaluateQuizAnswer } from "@/lib/ai/quiz";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        // Apply rate limiting
        const rateLimitResult = await rateLimiter.check(request);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Try again later." },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate required fields
        if (!body.quizId || !body.userId || !body.questionId || body.selectedAnswerIndex === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get the quiz and question
        const quizDoc = await getDoc(doc(db, "quizzes", body.quizId));

        if (!quizDoc.exists()) {
            return NextResponse.json(
                { error: "Quiz not found" },
                { status: 404 }
            );
        }

        const quizData = quizDoc.data();
        const question = quizData.questions.find((q: any) => q.id === body.questionId);

        if (!question) {
            return NextResponse.json(
                { error: "Question not found" },
                { status: 404 }
            );
        }

        // Evaluate the answer
        const evaluation = await evaluateQuizAnswer(
            question,
            body.selectedAnswerIndex,
            body.timeSpentSeconds || 0
        );

        // Store the answer in Firestore
        try {
            const answersRef = collection(db, "quiz_answers");
            const answerData = {
                quizId: body.quizId,
                userId: body.userId,
                questionId: body.questionId,
                selectedAnswerIndex: body.selectedAnswerIndex,
                isCorrect: evaluation.isCorrect,
                timeSpentSeconds: body.timeSpentSeconds || 0,
                masteryLevel: evaluation.masteryLevel,
                createdAt: serverTimestamp(),
            };

            await addDoc(answersRef, answerData);
        } catch (dbError) {
            logger.error("Failed to store answer in database", { error: dbError });
            // Continue anyway since we can still return the evaluation
        }

        // Return the evaluation
        return NextResponse.json({
            message: "Answer evaluated successfully",
            data: evaluation
        });
    } catch (error) {
        logger.error("Error evaluating answer", { error });
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to evaluate answer" },
            { status: 500 }
        );
    }
}