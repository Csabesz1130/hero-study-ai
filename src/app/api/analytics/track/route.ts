import { NextResponse } from "next/server";
import { db } from "@/db/production";
import { analyticsEvents } from "@/db/schema";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
    const data = await request.json();

    // Elvárt mezők: userId, type, data, sessionId, metadata, anonymized
    const {
        userId,
        type,
        data: eventData,
        sessionId = null,
        metadata = null,
        anonymized = false,
    } = data;

    if (!userId || !type || !eventData) {
        return NextResponse.json({ error: "userId, type és data mező kötelező!" }, { status: 400 });
    }

    await db.insert(analyticsEvents).values({
        id: randomUUID(),
        userId,
        type,
        data: eventData,
        sessionId,
        metadata,
        anonymized,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
} 