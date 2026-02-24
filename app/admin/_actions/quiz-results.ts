"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Weighted Score Formula:
 * Score = (A ^ 0.7) * (0.5 + acc/2) * 100
 * where A = totalAttempted, acc = accuracy (totalCorrect / totalAttempted)
 */
async function calculateWeightedScore(totalAttempted: number, totalCorrect: number) {
    if (totalAttempted === 0) return 0;
    const acc = totalCorrect / totalAttempted;
    const score = Math.pow(totalAttempted, 0.7) * (0.5 + acc / 2) * 100;
    return Math.round(score * 100) / 100;
}


export async function saveAttemptAction(data: {
    userId?: string;
    userName?: string;
    guestSessionId?: string;
    quizId: string | null;
    category?: string | null;
    level?: string | null;
    answers: { questionId: string; selectedIndex: number; isCorrect: boolean; timeSpent: number }[];
    mode: string;
}) {
    const totalAttempted = data.answers.length;
    const totalCorrect = data.answers.filter(a => a.isCorrect).length;
    const timeTakenSec = data.answers.reduce((acc, curr) => acc + curr.timeSpent, 0);
    const scoreFinal = await calculateWeightedScore(totalAttempted, totalCorrect);

    try {
        const attemptsRef = collection(db, "attempts");
        const attempt = await addDoc(attemptsRef, {
            userId: data.userId || null,
            userName: data.userName || null,

            guestSessionId: data.guestSessionId || null,
            quizId: data.quizId,
            category: data.category || null,
            level: data.level || null,
            totalAttempted,
            totalCorrect,
            timeTakenSec,
            scoreFinal,
            mode: data.mode,
            finishedAt: serverTimestamp(),
            answers: data.answers.map(a => ({
                questionId: a.questionId,
                selectedIndex: a.selectedIndex,
                isCorrect: a.isCorrect,
                timeSpentSec: a.timeSpent
            }))
        });

        return { success: true, attemptId: attempt.id, score: scoreFinal };
    } catch (error) {
        console.error("Save Attempt Error:", error);
        return { success: false, error: "Failed to save results." };
    }
}
