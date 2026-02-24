"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    const [scope, setScope] = useState("GLOBAL");

    useEffect(() => {
        // Fetch leaderboard data (Mocking for now with Indian names)
        const mockData: LeaderboardRow[] = [
            { rank: 1, name: "Aryan Sharma", score: 8520.5, attempted: 450, accuracy: 0.92 },
            { rank: 2, name: "Sneha Kapur", score: 7240.2, attempted: 380, accuracy: 0.88 },
            { rank: 3, name: "Ishan Patel", score: 6150.8, attempted: 320, accuracy: 0.85 },
            { rank: 4, name: "Priya Malhotra", score: 5800.0, attempted: 350, accuracy: 0.78 },
            { rank: 5, name: "Rohan Das", score: 4200.5, attempted: 200, accuracy: 0.95 },
        ];
        setData(mockData);
    }, [scope]);

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
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                    {["GLOBAL", "CATEGORY", "QUIZ"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setScope(s)}
                            className={`px-6 py-2 rounded-xl font-bold transition ${scope === s ? "bg-green-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-50 overflow-hidden">
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

                <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <button className="text-green-600 font-bold hover:underline">Load More Rankings</button>
                </div>
            </div>
        </div>
    );
}
