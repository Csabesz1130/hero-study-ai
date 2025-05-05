import { NextResponse } from "next/server";
import { Analytics } from "@/types";
// import { db } from "@/lib/firebase"; // TÖRÖLVE
// import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore"; // TÖRÖLVE

// TODO: Itt szerveroldali adatbázis vagy admin SDK-t kellene használni

export async function GET(request: Request) {
    return NextResponse.json({ error: "Firestore csak kliensoldalon támogatott. Használj szerveroldali adatbázist vagy firebase-admin-t!" }, { status: 500 });
}

export async function POST(request: Request) {
    return NextResponse.json({ error: "Firestore csak kliensoldalon támogatott. Használj szerveroldali adatbázist vagy firebase-admin-t!" }, { status: 500 });
} 