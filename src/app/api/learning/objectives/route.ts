import { NextResponse } from "next/server";
import { LearningObjective } from "@/types";
// import { db } from "@/lib/firebase"; // TÖRÖLVE
// import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"; // TÖRÖLVE

// TODO: Itt szerveroldali adatbázis vagy admin SDK-t kellene használni

export async function GET() {
    return NextResponse.json({ error: "Firestore csak kliensoldalon támogatott. Használj szerveroldali adatbázist vagy firebase-admin-t!" }, { status: 500 });
}

export async function POST(request: Request) {
    return NextResponse.json({ error: "Firestore csak kliensoldalon támogatott. Használj szerveroldali adatbázist vagy firebase-admin-t!" }, { status: 500 });
} 