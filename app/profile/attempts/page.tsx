"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

interface Attempt {
    id: string;
    quizId: string | null;
    category: string | null;
    level: string | null;
    totalAttempted: number;
    totalCorrect: number;
    scoreFinal: number;
    mode: string;
    finishedAt: any;
}

export default function AttemptsPage() {
    const { user } = useAuth();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttempts = async () => {
            if (!user || !db) return;
            try {
                const q = query(
                    collection(db, "attempts"),
                    where("userId", "==", user.uid),
                    orderBy("finishedAt", "desc")
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Attempt[];
                setAttempts(data);
            } catch (error) {
                console.error("Error fetching attempts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttempts();
    }, [user]);

    if (loading) return <div className="animate-pulse space-y-4 pt-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-3xl"></div>)}
    </div>;

    if (attempts.length === 0) {
        return (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4">
                <div className="text-5xl">🎯</div>
                <h3 className="text-xl font-bold text-gray-900">No attempts yet</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Start your first quiz to see your performance history here!</p>
                <a href="/#categories" className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-100">Browse Categories</a>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-4">
            <h1 className="text-2xl font-black text-gray-900 px-2">Quiz History</h1>
            <div className="grid gap-4">
                {attempts.map((attempt) => (
                    <div key={attempt.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-green-100 transition-all flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 w-full">
                            <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center text-2xl ${attempt.scoreFinal > 80 ? "bg-green-50 text-green-600" :
                                attempt.scoreFinal > 50 ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                                }`}>
                                {attempt.scoreFinal > 80 ? "🔥" : attempt.scoreFinal > 50 ? "⚡" : "📚"}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 truncate uppercase tracking-tight">
                                    {attempt.category || "General Quiz"}
                                </h3>
                                <div className="flex items-center gap-2 text-xs font-bold mt-1">
                                    <span className="text-gray-400">{attempt.level || "MIX"}</span>
                                    <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
                                    <span className="text-gray-400">{attempt.finishedAt?.toDate().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 sm:text-right w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</p>
                                <p className="text-2xl font-black text-gray-900">{attempt.scoreFinal}</p>
                            </div>
                            <div className="h-8 w-[1px] bg-gray-100"></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
                                <p className="text-2xl font-black text-green-600">
                                    {Math.round((attempt.totalCorrect / attempt.totalAttempted) * 100)}%
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
