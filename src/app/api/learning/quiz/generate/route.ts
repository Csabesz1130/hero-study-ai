// src/app/api/learning/quiz/generate/route.ts
import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai/quiz";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
// import { db } from "@/lib/firebase"; // TÖRÖLVE
// import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // TÖRÖLVE

// TODO: Itt szerveroldali adatbázis vagy admin SDK-t kellene használni

export async function POST(request: Request) {
    return NextResponse.json({ error: "Firestore csak kliensoldalon támogatott. Használj szerveroldali adatbázist vagy firebase-admin-t!" }, { status: 500 });
}