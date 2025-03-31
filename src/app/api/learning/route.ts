import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        { message: "Learning Pipeline API Endpoint is Ready" },
        { status: 200 }
    );
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        return NextResponse.json(
            { message: "Learning Pipeline API Endpoint is Ready", data: body },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }
} 