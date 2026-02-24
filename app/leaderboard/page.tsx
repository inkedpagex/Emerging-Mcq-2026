"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

interface LeaderboardRow {
    rank: number;
    name: string;
    score: number;
    attempted: number;
    accuracy: number;
}

export default function LeaderboardPage() {
    const router = useRouter();
    const [data, setData] = useState<LeaderboardRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const attemptsRef = collection(db, "attempts");
                const q = query(attemptsRef, orderBy("scoreFinal", "desc"), limit(50));
                const snapshot = await getDocs(q);

                // Aggregate scores by userId
                const userMap = new Map<string, { name: string; totalScore: number; totalAttempted: number; totalCorrect: number }>();

                snapshot.docs.forEach((doc) => {
                    const d = doc.data();
                    const userId = d.userId || d.guestSessionId || "Anonymous";
                    const displayName = d.userName || null;
                    const existing = userMap.get(userId);

                    if (existing) {
                        existing.totalScore += d.scoreFinal || 0;
                        existing.totalAttempted += d.totalAttempted || 0;
                        existing.totalCorrect += d.totalCorrect || 0;
                        // Update name if we find a real userName in any attempt
                        if (displayName && existing.name.startsWith("Player")) {
                            existing.name = displayName;
                        }
                    } else {
                        userMap.set(userId, {
                            name: displayName || "Player",
                            totalScore: d.scoreFinal || 0,
                            totalAttempted: d.totalAttempted || 0,
                            totalCorrect: d.totalCorrect || 0,
                        });
                    }
                });

                // Sort by total score and convert to array
                const sorted = Array.from(userMap.values())
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((entry, index) => ({
                        rank: index + 1,
                        name: entry.name,
                        score: Math.round(entry.totalScore * 100) / 100,
                        attempted: entry.totalAttempted,
                        accuracy: entry.totalAttempted > 0 ? entry.totalCorrect / entry.totalAttempted : 0,
                    }));

                setData(sorted);
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, []);

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <button
                onClick={() => router.push("/")}
                className="mb-8 flex items-center gap-2 text-gray-400 hover:text-green-600 font-bold transition group"
            >
                <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                Back to Home
            </button>
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Leaderboard</h1>
                    <p className="text-gray-400 font-medium">Top performers across the community</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-50 overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center">
                        <div className="inline-block h-8 w-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400 font-bold">Loading rankings...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-16 text-center">
                        <p className="text-4xl mb-4">🏆</p>
                        <p className="text-gray-900 font-bold text-lg">No rankings yet</p>
                        <p className="text-gray-400 text-sm mt-1">Be the first to take a quiz and appear here!</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-6 px-8 text-xs font-bold text-gray-400 uppercase tracking-widest">Rank</th>
                                <th className="py-6 px-8 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                                <th className="py-6 px-8 text-xs font-bold text-gray-400 uppercase tracking-widest">A / C</th>
                                <th className="py-6 px-8 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.map((row) => (
                                <tr key={row.rank} className="hover:bg-green-50/30 transition group">
                                    <td className="py-6 px-8">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black 
                                            ${row.rank === 1 ? "bg-yellow-100 text-yellow-600" : ""}
                                            ${row.rank === 2 ? "bg-gray-100 text-gray-600" : ""}
                                            ${row.rank === 3 ? "bg-orange-100 text-orange-600" : ""}
                                            ${row.rank > 3 ? "text-gray-300" : ""}
                                        `}>
                                            {row.rank}
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-gray-100 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-xs font-bold text-gray-400 capitalize">
                                                {row.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{row.name}</p>
                                                <p className="text-xs text-gray-400">{(row.accuracy * 100).toFixed(0)}% accuracy</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <p className="font-bold text-gray-800">{row.attempted}</p>
                                        <p className="text-xs text-gray-400 tracking-tighter uppercase font-bold">Total Q</p>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                        <span className="text-2xl font-black text-gray-900 group-hover:text-green-600 transition tracking-tighter">
                                            {row.score.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
