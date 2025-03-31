import { NextResponse } from "next/server";
import { LearningProgress } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

export async function GET() {
    try {
        const progressRef = collection(db, "progress");
        const snapshot = await getDocs(progressRef);
        const progress = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as LearningProgress[];

        return NextResponse.json(
            { message: "Learning progress retrieved successfully", data: progress },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching progress:", error);
        return NextResponse.json(
            { error: "Failed to fetch learning progress" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body: Omit<LearningProgress, "lastAttempted"> = await request.json();

        const progressRef = collection(db, "progress");
        const newProgress = {
            ...body,
            lastAttempted: serverTimestamp(),
        };

        const docRef = await addDoc(progressRef, newProgress);

        return NextResponse.json(
            {
                message: "Learning progress updated successfully",
                data: { id: docRef.id, ...body }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error updating progress:", error);
        return NextResponse.json(
            { error: "Failed to update learning progress" },
            { status: 500 }
        );
    }
} 