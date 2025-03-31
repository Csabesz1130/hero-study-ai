import { NextResponse } from "next/server";
import { LearningObjective } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

export async function GET() {
    try {
        const objectivesRef = collection(db, "objectives");
        const snapshot = await getDocs(objectivesRef);
        const objectives = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as LearningObjective[];

        return NextResponse.json(
            { message: "Learning objectives retrieved successfully", data: objectives },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching objectives:", error);
        return NextResponse.json(
            { error: "Failed to fetch learning objectives" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body: Omit<LearningObjective, "id" | "createdAt" | "updatedAt"> = await request.json();

        const objectivesRef = collection(db, "objectives");
        const newObjective = {
            ...body,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(objectivesRef, newObjective);

        return NextResponse.json(
            {
                message: "Learning objective created successfully",
                data: { id: docRef.id, ...body }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating objective:", error);
        return NextResponse.json(
            { error: "Failed to create learning objective" },
            { status: 500 }
        );
    }
} 