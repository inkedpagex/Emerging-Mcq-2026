"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * "Nice" Scoring Formula:
 * - Base: 100 points per correct answer.
 * - Speed Bonus: Up to 50 points (linearly decays from 2s to 30s).
 * - Multiplier: EASY (1.0x), MEDIUM (1.2x), HARD (1.5x).
 */
async function calculateNiceScore(
    answers: { isCorrect: boolean; timeSpent: number }[],
    level: string | null
) {
    let rawScore = 0;
    
    answers.forEach(a => {
        if (!a.isCorrect) return;
        
        // Base points
        let questionScore = 100;
        
        // Speed bonus: max 50 points if answered in <= 2s, 0 pts if >= 30s
        const timeSpent = a.timeSpent || 15; // Fallback to 15s if missing
        const speedBonus = Math.max(0, Math.min(50, 50 * (1 - (timeSpent - 2) / 28)));
        questionScore += speedBonus;
        
        rawScore += questionScore;
    });

    const multipliers: Record<string, number> = {
        "EASY": 1.0,
        "LOW": 1.0,
        "MEDIUM": 1.2,
        "HARD": 1.5,
        "HIGH": 1.5,
        "MIX": 1.2
    };

    const multiplier = multipliers[(level || "MEDIUM").toUpperCase()] || 1.2;
    return Math.round(rawScore * multiplier);
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
    const scoreFinal = await calculateNiceScore(data.answers, data.level || null);

    try {
        console.log("Saving Attempt Debug:", {
            userId: data.userId || "GUEST",
            quizId: data.quizId,
            level: data.level,
            score: scoreFinal,
            answersLength: data.answers.length
        });

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
    } catch (error: any) {
        console.error("CRITICAL Save Attempt Error:", error);
        return { 
            success: false, 
            error: `Failed to save results: ${error?.message || "Internal Error"}` 
        };
    }
}
