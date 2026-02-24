export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level"); // EASY, MEDIUM, HARD, MIX
    const limitParam = parseInt(searchParams.get("limit") || "50");

    if (!category || !level) {
        return NextResponse.json({ error: "Missing category or level" }, { status: 400 });
    }

    try {
        // 1. Try to find the actual category ID if 'category' is a slug
        let categoryId = category;
        const catsRef = collection(db, "categories");
        const slugQ = query(catsRef, where("slug", "==", category));
        const slugSnap = await getDocs(slugQ);

        if (!slugSnap.empty) {
            categoryId = slugSnap.docs[0].id;
        }

        // 2. Fetch all quizzes for this category (using either slug or Resolved ID)
        const quizzesRef = collection(db, "quizzes");
        const q = query(quizzesRef, where("categoryId", "==", categoryId));
        const querySnapshot = await getDocs(q);

        let allQuestions: any[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.questions && Array.isArray(data.questions)) {
                const questionsWithMeta = data.questions.map((q: any, idx: number) => ({
                    ...q,
                    id: `${doc.id}-${idx}`,
                    quizId: doc.id
                }));
                allQuestions = [...allQuestions, ...questionsWithMeta];
            }
        });

        // 3. Find questions by resolved ID if no questions were found with slug
        if (allQuestions.length === 0 && categoryId !== category) {
            const q2 = query(quizzesRef, where("categoryId", "==", category));
            const snap2 = await getDocs(q2);
            snap2.forEach((doc) => {
                const data = doc.data();
                if (data.questions && Array.isArray(data.questions)) {
                    const questionsWithMeta = data.questions.map((q: any, idx: number) => ({
                        ...q,
                        id: `${doc.id}-${idx}`,
                        quizId: doc.id
                    }));
                    allQuestions = [...allQuestions, ...questionsWithMeta];
                }
            });
        }

        if (allQuestions.length === 0) {
            return NextResponse.json({ error: `No quizzes found for category '${category}'. Please ensure quizzes are published and linked correctly.`, questions: [] });
        }

        const mapLevel = (l: string) => {
            const up = l.toUpperCase();
            if (up === "EASY") return "LOW";
            if (up === "MEDIUM") return "MEDIUM";
            if (up === "HARD") return "HIGH";
            return up;
        };

        let filtered: any[] = [];

        if (level === "MIX") {
            const easy = allQuestions.filter(q => q.difficulty?.toUpperCase() === "LOW");
            const med = allQuestions.filter(q => q.difficulty?.toUpperCase() === "MEDIUM");
            const hard = allQuestions.filter(q => q.difficulty?.toUpperCase() === "HIGH");

            const selectedEasy = shuffle(easy).slice(0, 20);
            const selectedMed = shuffle(med).slice(0, 20);
            const selectedHard = shuffle(hard).slice(0, 10);

            filtered = [...selectedEasy, ...selectedMed, ...selectedHard];

            if (filtered.length < limitParam) {
                const usedIds = new Set(filtered.map(q => q.id));
                const remaining = allQuestions.filter(q => !usedIds.has(q.id));
                filtered = [...filtered, ...shuffle(remaining).slice(0, limitParam - filtered.length)];
            }
        } else {
            const targetDifficulty = mapLevel(level);
            filtered = allQuestions.filter(q => q.difficulty?.toUpperCase() === targetDifficulty);

            if (filtered.length === 0) {
                // Fallback: If no questions match specific difficulty, return any questions from this category
                filtered = shuffle(allQuestions).slice(0, limitParam);
            } else {
                filtered = shuffle(filtered).slice(0, limitParam);
            }
        }

        return NextResponse.json({
            category,
            level,
            questions: filtered
        });

    } catch (error) {
        console.error("Fetch questions error:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}

function shuffle(array: any[]) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}
