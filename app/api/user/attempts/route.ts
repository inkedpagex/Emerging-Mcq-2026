export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const guestSessionId = searchParams.get("guestSessionId");

    if (!db) {
        return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    if (!userId && !guestSessionId) {
        return NextResponse.json({ error: "Missing user identification" }, { status: 400 });
    }

    try {
        const attemptsRef = collection(db, "attempts");
        let q;
        if (userId) {
            q = query(attemptsRef, where("userId", "==", userId));
        } else {
            q = query(attemptsRef, where("guestSessionId", "==", guestSessionId));
        }

        const snapshot = await getDocs(q);
        const completedQuizIds = new Set<string>();
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.quizId) {
                completedQuizIds.add(data.quizId);
            }
        });

        return NextResponse.json({
            completedQuizIds: Array.from(completedQuizIds)
        });
    } catch (error) {
        console.error("Fetch user attempts error:", error);
        return NextResponse.json({ error: "Failed to fetch user attempts" }, { status: 500 });
    }
}
