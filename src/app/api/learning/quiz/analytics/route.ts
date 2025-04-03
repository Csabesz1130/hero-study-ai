// src/app/api/learning/quiz/analytics/route.ts
import { NextResponse } from "next/server";
import { analyzQuizPerformance } from "@/lib/ai/quiz";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
        if (!body.quizId || !body.userId || !body.answers) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get the quiz
        const quizDoc = await getDoc(doc(db, "quizzes", body.quizId));

        if (!quizDoc.exists()) {
            return NextResponse.json(
                { error: "Quiz not found" },
                { status: 404 }
            );
        }

        const quizData = quizDoc.data();

        // Analyze the quiz performance
        const analytics = await analyzQuizPerformance(
            {
                quizId: body.quizId,
                userId: body.userId,
                answers: body.answers
            },
            quizData.questions
        );

        // Store the analytics in Firestore
        try {
            const analyticsRef = collection(db, "quiz_analytics");
            const analyticsData = {
                ...analytics,
                quizId: body.quizId,
                userId: body.userId,
                createdAt: serverTimestamp(),
            };

            await addDoc(analyticsRef, analyticsData);
        } catch (dbError) {
            logger.error("Failed to store quiz analytics in database", { error: dbError });
            // Continue anyway since we can still return the analytics
        }

        // Return the analytics
        return NextResponse.json({
            message: "Quiz analytics generated successfully",
            data: analytics
        });
    } catch (error) {
        logger.error("Error generating quiz analytics", { error });
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate quiz analytics" },
            { status: 500 }
        );
    }
}