import { NextResponse } from "next/server";
import { Analytics } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get("timeRange") || "week";
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const analyticsRef = collection(db, "analytics");
        let q = query(
            analyticsRef,
            where("userId", "==", userId),
            orderBy("date", "desc")
        );

        // Add time range filter
        const now = new Date();
        let startDate = new Date();
        switch (timeRange) {
            case "week":
                startDate.setDate(now.getDate() - 7);
                break;
            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        q = query(q, where("date", ">=", startDate));

        const snapshot = await getDocs(q);
        const analytics = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Analytics[];

        return NextResponse.json(
            {
                message: "Analytics data retrieved successfully",
                timeRange,
                data: analytics
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics data" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body: Omit<Analytics, "id" | "date"> = await request.json();

        const analyticsRef = collection(db, "analytics");
        const newAnalytics = {
            ...body,
            date: serverTimestamp(),
        };

        const docRef = await addDoc(analyticsRef, newAnalytics);

        return NextResponse.json(
            {
                message: "Analytics data updated successfully",
                data: { id: docRef.id, ...body }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error updating analytics:", error);
        return NextResponse.json(
            { error: "Failed to update analytics data" },
            { status: 500 }
        );
    }
} 