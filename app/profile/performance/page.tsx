"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface PerfStats {
    totalQuizzes: number;
    avgAccuracy: number;
    highestScore: number;
    byCategory: Record<string, { count: number; accuracy: number }>;
}

export default function PerformancePage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<PerfStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const q = query(collection(db, "attempts"), where("userId", "==", user.uid));
                const snap = await getDocs(q);

                if (snap.empty) {
                    setStats(null);
                    setLoading(false);
                    return;
                }

                let totalAcc = 0;
                let high = 0;
                const catMap: Record<string, { count: number; scoreSum: number }> = {};

                snap.docs.forEach(doc => {
                    const d = doc.data();
                    const acc = (d.totalCorrect / d.totalAttempted) * 100;
                    totalAcc += acc;
                    if (d.scoreFinal > high) high = d.scoreFinal;

                    const cat = d.category || "General";
                    if (!catMap[cat]) catMap[cat] = { count: 0, scoreSum: 0 };
                    catMap[cat].count++;
                    catMap[cat].scoreSum += acc;
                });

                const byCategory: Record<string, { count: number; accuracy: number }> = {};
                Object.entries(catMap).forEach(([cat, data]) => {
                    byCategory[cat] = {
                        count: data.count,
                        accuracy: Math.round(data.scoreSum / data.count)
                    };
                });

                setStats({
                    totalQuizzes: snap.size,
                    avgAccuracy: Math.round(totalAcc / snap.size),
                    highestScore: high,
                    byCategory
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    if (loading) return <div className="p-12 animate-pulse space-y-6">
        <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-50 rounded-3xl"></div>
            <div className="h-32 bg-gray-50 rounded-3xl"></div>
            <div className="h-32 bg-gray-50 rounded-3xl"></div>
        </div>
        <div className="h-64 bg-gray-50 rounded-3xl"></div>
    </div>;

    if (!stats) return (
        <div className="bg-white p-20 rounded-3xl border border-gray-100 text-center">
            <h3 className="text-xl font-bold text-gray-900">No data to analyze yet 📈</h3>
            <p className="text-gray-400 text-sm mt-2">Complete some quizzes to see your skills breakdown!</p>
        </div>
    );

    return (
        <div className="space-y-8 pt-4">
            <h1 className="text-2xl font-black text-gray-900 px-2">Performance Analytics</h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Quizzes</p>
                    <p className="text-4xl font-black text-gray-900">{stats.totalQuizzes}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-green-50 shadow-sm text-center bg-green-50/20">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Avg Accuracy</p>
                    <p className="text-4xl font-black text-green-600">{stats.avgAccuracy}%</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-blue-50 shadow-sm text-center bg-blue-50/20">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Peak Score</p>
                    <p className="text-4xl font-black text-blue-600">{stats.highestScore}</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    Skills Breakdown
                </h3>
                <div className="space-y-6">
                    {Object.entries(stats.byCategory).map(([cat, data]) => (
                        <div key={cat} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="font-bold text-gray-900 uppercase tracking-tight text-sm">{cat}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{data.count} ATTEMPTS</p>
                                </div>
                                <p className="font-black text-gray-900">{data.accuracy}%</p>
                            </div>
                            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${data.accuracy}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
