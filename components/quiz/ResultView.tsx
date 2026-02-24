"use client";

import { useQuizStore } from "@/lib/store";

interface ResultProps {
    score: number;
    accuracy: number;
    totalAttempted: number;
    totalCorrect: number;
    timeTaken: number;
}

export default function ResultView({ score, accuracy, totalAttempted, totalCorrect, timeTaken }: ResultProps) {
    const resetQuiz = useQuizStore((state) => state.resetQuiz);

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 animate-in zoom-in duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-50 overflow-hidden">
                {/* Header */}
                <div className="bg-green-600 p-12 text-center text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold opacity-80 mb-2 uppercase tracking-widest">Quiz Completed!</h2>
                        <div className="text-7xl font-black mb-4 tracking-tighter">{score}</div>
                        <p className="text-green-100 font-medium">Your Weighted Final Score</p>
                    </div>
                    {/* Decorative background circle */}
                    <div className="absolute -top-12 -right-12 h-64 w-64 bg-green-500 rounded-full opacity-50 blur-3xl"></div>
                </div>

                {/* Stats Grid */}
                <div className="p-10 grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Accuracy</p>
                        <p className="text-2xl font-black text-gray-800">{(accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Time Taken</p>
                        <p className="text-2xl font-black text-gray-800">{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Correct</p>
                        <p className="text-2xl font-black text-green-600">{totalCorrect} / {totalAttempted}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Rank Est.</p>
                        <p className="text-2xl font-black text-gray-800">#--</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-10 pt-0 flex flex-col gap-4">
                    <button
                        onClick={() => window.location.href = "/leaderboard"}
                        className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-black transition shadow-xl"
                    >
                        Check Leaderboard
                    </button>
                    <button
                        onClick={resetQuiz}
                        className="w-full bg-white text-gray-400 py-3 rounded-2xl font-bold hover:text-gray-600 transition"
                    >
                        Take Another Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}
