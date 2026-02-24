"use server";

import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, writeBatch, serverTimestamp } from "firebase/firestore";

export interface ManualQuizJSON {
    topic: string;
    level: string;
    questions: {
        id: number;
        difficulty: "LOW" | "MEDIUM" | "HIGH";
        question: string;
        options: {
            A: string;
            B: string;
            C: string;
            D: string;
        };
        correctAnswer: string;
        explanation: string;
    }[];
}

export async function publishManualQuizAction(data: ManualQuizJSON) {
    try {
        const slug = data.topic.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        const batch = writeBatch(db);

        // 1. Check/Prepare Category using slug as ID for fixed-time lookup
        const categoryRef = doc(db, "categories", slug);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
            batch.set(categoryRef, {
                name: data.topic,
                slug: slug,
                createdAt: serverTimestamp()
            });
        }

        // 2. Prepare Quiz document
        const quizzesRef = collection(db, "quizzes");
        const newQuizRef = doc(quizzesRef);

        batch.set(newQuizRef, {
            title: `${data.topic} - ${data.level}`,
            categoryId: slug, // Using slug as the ID consistently
            published: true,
            createdAt: serverTimestamp(),
            level: data.level,
            questions: data.questions.map(q => ({
                questionText: q.question,
                options: [q.options.A, q.options.B, q.options.C, q.options.D],
                correctIndex: ["A", "B", "C", "D"].indexOf(q.correctAnswer),
                difficulty: q.difficulty,
                explanation: q.explanation
            }))
        });

        // 3. Commit all changes in a single round-trip
        await batch.commit();

        return { success: true, quizId: newQuizRef.id };
    } catch (error: any) {
        console.error("Publish error:", error);
        return { success: false, error: error.message };
    }
}
