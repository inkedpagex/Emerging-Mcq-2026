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
    correct: number;
    incorrect: number;
    accuracy: number;
}

export default function LeaderboardPage() {
    const router = useRouter();
    const [data, setData] = useState<LeaderboardRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            if (!db) return;
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
                        correct: entry.totalCorrect,
                        incorrect: entry.totalAttempted - entry.totalCorrect,
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
        <div className="min-h-screen bg-gray-950/20 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => router.push("/")}
                    className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-green-500 hover:bg-white/10 font-bold transition-all group"
                >
                    <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Home
                </button>
                
                <div className="mb-12">
                    <h1 className="text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                        Leaderboard
                    </h1>
                    <p className="text-gray-400 font-medium text-lg italic">Top performers across the community</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
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
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="py-6 px-8 text-xs font-bold text-gray-400 uppercase tracking-widest">Rank</th>
                                        <th className="py-6 px-8 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                                        <th className="py-6 px-8 text-xs font-bold text-gray-400 uppercase tracking-widest">Progress & Accuracy</th>
                                        <th className="py-6 px-8 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">XP</th>
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
                                            <td className="py-6 px-8 min-w-[180px]">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-black text-gray-800">{row.attempted} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Total Q</span></span>
                                                        <span className="text-[10px] font-black text-gray-400">{(row.accuracy * 100).toFixed(0)}%</span>
                                                    </div>
                                                    
                                                    {/* Minimalist Progress Bar */}
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                                        <div 
                                                            className="h-full bg-green-500 transition-all duration-500" 
                                                            style={{ width: `${row.accuracy * 100}%` }}
                                                        ></div>
                                                        <div 
                                                            className="h-full bg-red-400 transition-all duration-500" 
                                                            style={{ width: `${(1 - row.accuracy) * (row.incorrect / row.attempted || 1) * 100}%` }}
                                                        ></div>
                                                    </div>

                                                    <div className="flex gap-3 text-[10px] items-center font-black">
                                                        <span className="text-green-600 flex items-center gap-1">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                                            {row.correct} Correct
                                                        </span>
                                                        <span className="text-red-400 flex items-center gap-1">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                                                            {row.incorrect} Incorrect
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <span className="text-2xl font-black text-gray-900 group-hover:text-green-600 transition tracking-tighter">
                                                    {Math.floor(row.score).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {data.map((row) => (
                                <div key={row.rank} className="p-4 flex items-center justify-between hover:bg-green-50/20 transition">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs
                                            ${row.rank === 1 ? "bg-yellow-100 text-yellow-600" : ""}
                                            ${row.rank === 2 ? "bg-gray-100 text-gray-600" : ""}
                                            ${row.rank === 3 ? "bg-orange-100 text-orange-600" : ""}
                                            ${row.rank > 3 ? "bg-gray-50 text-gray-400" : ""}
                                        `}>
                                            {row.rank}
                                        </div>
                                        <div className="h-8 w-8 bg-gray-100 rounded-full border border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                                            {row.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-tight">{row.name}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{(row.accuracy * 100).toFixed(0)}% acc • {row.attempted}Q</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-green-600 tabular-nums">
                                            {Math.floor(row.score).toLocaleString()}
                                        </p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">XP</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                </div>
            </div>
        </div>
    );
}
