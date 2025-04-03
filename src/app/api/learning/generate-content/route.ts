// src/app/api/learning/generate-content/route.ts
import { NextResponse } from "next/server";
import { generateVideoContent } from "@/lib/ai/content-generator";
import { ContentGenerationRequest } from "@/lib/ai/types";
import { rateLimiter } from "@/lib/rate-limiter"; // Assuming you have a rate limiter

export async function POST(request: Request) {
    try {
        // Apply rate limiting
        const rateLimit = await rateLimiter.check(request);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Try again later." },
                { status: 429 }
            );
        }

        // Parse request body
        const body: ContentGenerationRequest = await request.json();

        // Validate required fields
        if (!body.learningObjective || !body.userLevel || !body.format) {
            return NextResponse.json(
                { error: "Missing required fields: learningObjective, userLevel, format" },
                { status: 400 }
            );
        }

        // Only support video format for now
        if (body.format !== 'video') {
            return NextResponse.json(
                { error: "Currently only 'video' format is supported" },
                { status: 400 }
            );
        }

        // Generate content
        const result = await generateVideoContent(body);

        if (!result.success) {
            // Return appropriate error response
            return NextResponse.json(
                { error: result.error?.message || "Content generation failed" },
                { status: 500 }
            );
        }

        // Return successful response
        return NextResponse.json({
            message: "Content generated successfully",
            data: result.data,
            metadata: result.metadata
        });
    } catch (error: any) {
        console.error("Error in content generation API:", error);

        return NextResponse.json(
            { error: error.message || "An unexpected error occurred" },
            { status: 500 }
        );
    }
}