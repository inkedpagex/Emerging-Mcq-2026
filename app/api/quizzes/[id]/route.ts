export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!db) {
        return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    try {
        const quizRef = doc(db, "quizzes", id);
        const quizSnap = await getDoc(quizRef);

        if (!quizSnap.exists()) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: quizSnap.id,
            ...quizSnap.data()
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
    }
}
