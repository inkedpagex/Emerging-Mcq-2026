"use server";

import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    writeBatch,
    serverTimestamp
} from "firebase/firestore";

interface QuizUpdateData {
    title?: string;
    level?: string;
    timeLimit?: number;
    published?: boolean;
    questions?: any[];
}

/**
 * Update Category Details
 */
export async function updateCategoryAction(id: string, name: string, slug: string) {
    try {
        const catRef = doc(db, "categories", id);
        await updateDoc(catRef, {
            name,
            slug,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete Category and its associated quizzes (optional but recommended)
 */
export async function deleteCategoryAction(id: string) {
    try {
        // First check if there are quizzes
        const q = query(collection(db, "quizzes"), where("categoryId", "==", id));
        const snap = await getDocs(q);

        if (!snap.empty) {
            return { success: false, error: "Cannot delete category with associated quizzes. Delete quizzes first." };
        }

        await deleteDoc(doc(db, "categories", id));
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update Quiz Data
 */
export async function updateQuizAction(id: string, data: QuizUpdateData) {
    try {
        const quizRef = doc(db, "quizzes", id);
        await updateDoc(quizRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete Quiz
 */
export async function deleteQuizAction(id: string) {
    try {
        await deleteDoc(doc(db, "quizzes", id));
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Leaderboard Moderation: Delete an attempt
 */
export async function deleteAttemptAction(id: string) {
    try {
        await deleteDoc(doc(db, "attempts", id));
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
