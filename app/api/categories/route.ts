export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export async function GET() {
    console.log("API: Fetching categories, db state:", !!db);
    if (!db) {
        return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }
    try {
        // 1. Fetch all categories
        const categoriesRef = collection(db, "categories");
        const catSnap = await getDocs(query(categoriesRef, orderBy("name", "asc")));

        // 2. Fetch all quizzes
        const quizzesRef = collection(db, "quizzes");
        const quizSnap = await getDocs(quizzesRef);

        // 3. Map quizzes to their categories
        const quizzesByCat: Record<string, any[]> = {};
        quizSnap.docs.forEach(doc => {
            const data = doc.data();
            const catId = data.categoryId;
            if (!quizzesByCat[catId]) quizzesByCat[catId] = [];
            quizzesByCat[catId].push({
                id: doc.id,
                title: data.title,
                level: data.level || "MEDIUM",
                questionCount: data.questions?.length || 0,
                timeLimit: data.timeLimit || null
            });
        });

        // 4. Combine
        const categories = catSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                slug: data.slug || doc.id,
                quizzes: quizzesByCat[doc.id] || []
            };
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Categories Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}
