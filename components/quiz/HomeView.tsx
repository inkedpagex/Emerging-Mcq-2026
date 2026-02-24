"use client";

import { useState, useEffect } from "react";
import { useQuizStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

interface Category {
    id: string;
    name: string;
    slug: string;
    quizzes?: { 
        id: string; 
        title: string; 
        level?: string; 
        questionCount?: number; 
        timeLimit?: number | null 
    }[];
}

export default function HomeView() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([]);
    const [topRankers, setTopRankers] = useState<any[]>([]);
    const [loadingRankers, setLoadingRankers] = useState(true);
    const { user } = useAuth();
    const guestSessionId = useQuizStore(state => state.guestSessionId);
    const startQuiz = useQuizStore((state) => state.startQuiz);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await fetch("/api/categories");
                const resClone = res.clone();
                console.log("Fetch categories response status:", res.status, res.ok);
                const rawText = await resClone.text();
                console.log("Fetch categories raw text:", rawText);
                const data = await res.json();
                console.log("Fetch categories data:", data);
                if (Array.isArray(data)) {
                    setCategories(data);
                } else {
                    console.error("Fetched categories is not an array:", data);
                    setCategories([]); // Fallback to empty array
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                setCategories([]); // Fallback to empty array
            }
        };
        fetchCats();
    }, []);

    useEffect(() => {
        const fetchTopRankers = async () => {
            if (!db) return;
            try {
                const attemptsRef = collection(db, "attempts");
                // Fetch more than 3 to aggregate by user if needed, 
                // but let's keep it simple for preview: top 3 unique users from recent attempts
                const q = query(attemptsRef, orderBy("scoreFinal", "desc"), limit(20));
                const snapshot = await getDocs(q);
                
                const userMap = new Map();
                snapshot.docs.forEach(doc => {
                    const d = doc.data();
                    const uid = d.userId || d.guestSessionId || "Anonymous";
                    if (!userMap.has(uid)) {
                        userMap.set(uid, {
                            name: d.userName || "Player",
                            score: d.scoreFinal || 0
                        });
                    }
                });

                const sorted = Array.from(userMap.values())
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map((item, idx) => ({
                        ...item,
                        rank: idx + 1,
                        emoji: idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"
                    }));
                
                setTopRankers(sorted);
            } catch (err) {
                console.error("Top rankers fetch error:", err);
            } finally {
                setLoadingRankers(false);
            }
        };
        fetchTopRankers();
    }, []);

    const categoryIcons: Record<string, string> = {
        "aptitude": "📊",
        "reasoning": "🧠",
        "computer": "💻",
        "os": "⚙️",
        "dbms": "🗄️",
        "cn": "🌐",
        "default": "📝"
    };

    const getIcon = (name: string) => {
        const lower = name.toLowerCase();
        for (const key in categoryIcons) {
            if (lower.includes(key)) return categoryIcons[key];
        }
        return categoryIcons["default"];
    };

    const levels = [
        { id: "EASY", name: "Easy", desc: "Basic concepts and fundamental questions", color: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300" },
        { id: "MEDIUM", name: "Medium", desc: "Intermediate level covering core topics", color: "bg-green-50 text-green-600 border-green-100 hover:border-green-300" },
        { id: "HARD", name: "Hard", desc: "Advanced scenarios and complex problems", color: "bg-red-50 text-red-600 border-red-100 hover:border-red-300" },
        { id: "MIX", name: "Mix", desc: "Balanced set: 20 Easy, 20 Med, 10 Hard", color: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300" },
    ];

    if (selectedCategory) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-gray-400 hover:text-green-600 mb-6 flex items-center gap-2 font-bold transition"
                    >
                        <span className="text-xl">←</span> Back to Categories
                    </button>

                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center text-3xl">
                            {getIcon(selectedCategory.name)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">{selectedCategory.name}</h2>
                            <p className="text-sm text-gray-400 font-medium">Select a quiz to begin your practice</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedCategory.quizzes && selectedCategory.quizzes.length > 0 ? (
                            selectedCategory.quizzes.map((quiz: any, idx) => {
                                const isCompleted = completedQuizIds.includes(quiz.id);
                                return (
                                    <button
                                        key={quiz.id}
                                        onClick={() => setSelectedQuizId(quiz.id)}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 group relative flex items-center justify-between ${selectedQuizId === quiz.id
                                            ? `ring-4 ring-green-600/10 border-green-600 bg-green-50/30`
                                            : `bg-white border-gray-100 hover:border-gray-200`
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black
                                                ${quiz.level === 'EASY' || quiz.level === 'LOW' ? 'bg-blue-50 text-blue-600' : 
                                                  quiz.level === 'HARD' || quiz.level === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}
                                            `}>
                                                Q{idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 text-sm">Quiz {idx + 1}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{quiz.level || 'MEDIUM'}</span>
                                                    <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{quiz.questionCount || 0} Questions</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {isCompleted && (
                                                <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm shadow-green-100">
                                                    ✓
                                                </div>
                                            )}
                                            {selectedQuizId === quiz.id && !isCompleted && (
                                                <div className="h-6 w-6 bg-white border-2 border-green-600 rounded-full flex items-center justify-center text-green-600 text-[10px]">
                                                    ●
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400 font-medium italic">No quizzes available for this category yet.</p>
                            </div>
                        )}
                    </div>

                    <button
                        disabled={!selectedQuizId}
                        onClick={() => startQuiz(selectedQuizId, selectedCategory.slug, null, "INSTANT")}
                        className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        Start Practicing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans text-gray-900 bg-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-36">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-green-50 rounded-full blur-[120px] opacity-60"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-green-50 rounded-full blur-[100px] opacity-40"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-green-200">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        500+ Questions • CBT Mode • Free
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tighter leading-[1.1]">
                        Welcome to <span className="text-green-600">Emerging MCQ</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto mb-12">
                        Practice smart. Perform better. The ultimate practice platform for competitive exams and technical assessments.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto bg-green-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition shadow-xl shadow-green-100"
                        >
                            Start Free Test
                        </button>
                        <a href="#categories" className="w-full sm:w-auto bg-white text-gray-600 border-2 border-gray-100 px-10 py-5 rounded-2xl font-black text-lg hover:border-green-200 transition">
                            Explore Categories
                        </a>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section id="categories" className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Browse Exam Categories</h2>
                        <p className="text-gray-400 font-medium">Choose your target area and begin practicing with the latest exam pattern</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                            >
                                <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300">
                                    <span className="group-hover:filter group-hover:brightness-0 group-hover:invert transition duration-300">
                                        {getIcon(cat.name)}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-green-600 transition">{cat.name}</h3>
                                <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">
                                    Sharpen your skills in {cat.name} with focused MCQ sets designed by experts.
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="inline-block bg-gray-50 text-gray-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-tight group-hover:bg-green-50 group-hover:text-green-600 transition">
                                        {(cat.quizzes?.length || 0)} Quizzes
                                    </span>
                                    <span className="text-green-600 font-black text-sm uppercase flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Start <span className="text-lg">→</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">How It Works</h2>
                        <p className="text-gray-400 font-medium">Three simple steps to mastery</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { step: "01", title: "Choose Topic & Level", desc: "Select from our vast range of topics and set your desired difficulty level." },
                            { step: "02", title: "Attempt CBT-style Test", desc: "Take a real-time test with our immersive computer-based interface." },
                            { step: "03", title: "View Result & Analysis", desc: "Get instant results, detailed explanations, and check your rank." }
                        ].map((item, idx) => (
                            <div key={idx} className="relative group">
                                <span className="text-8xl font-black text-gray-50 absolute -top-12 -left-4 z-0 group-hover:text-green-50 transition-colors">{item.step}</span>
                                <div className="relative z-10 pl-6 border-l-4 border-green-600/10 group-hover:border-green-600 transition-colors">
                                    <h3 className="text-2xl font-black text-gray-900 mb-4">{item.title}</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Exam Interface Preview Section */}
            <section className="py-24 bg-gray-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.05)_0%,transparent_100%)]"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">Elite Exam Interface</h2>
                            <p className="text-gray-400 text-lg font-medium mb-10 leading-relaxed">
                                Our platform mimics real-world exam environments (CBT) to help you build focus and speed. Experience a distraction-free terminal for serious learning.
                            </p>
                            <ul className="space-y-4 mb-10">
                                {["Real-time Timer", "Question Palette", "Instant Answer Keys", "Mark for Review"].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-white font-bold">
                                        <div className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center text-xs">✓</div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-green-700 transition">Experience CBT Now</button>
                        </div>
                        <div className="lg:w-1/2 w-full">
                            <div className="bg-white rounded-3xl p-4 shadow-2xl shadow-green-900/40 border border-gray-800 rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                                <div className="bg-gray-100 rounded-2xl p-6 border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-black">Q 18 of 50</span>
                                        <span className="text-xs font-black text-red-500 flex items-center gap-1">
                                            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                                            42:15 Left
                                        </span>
                                    </div>
                                    <p className="text-lg font-black text-gray-800 mb-8 leading-tight">
                                        Which of the following is a key feature of Next.js for high-performance websites?
                                    </p>
                                    <div className="space-y-3">
                                        {["Client-side only rendering", "Automatic code splitting", "Manual CSS injection", "Strict typing only"].map((opt, i) => (
                                            <div key={i} className={`p-4 rounded-xl border-2 font-bold text-sm ${i === 1 ? "border-green-600 bg-green-50 text-green-700" : "border-gray-50 bg-white text-gray-400"}`}>
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Platform Stats Section */}
            <section className="py-24 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { val: "10,000+", label: "Questions" },
                            { val: "500+", label: "Students" },
                            { val: "2024", label: "Pattern" },
                            { val: "100%", label: "Free Access" }
                        ].map((stat, idx) => (
                            <div key={idx}>
                                <p className="text-4xl md:text-5xl font-black text-green-600 mb-2 leading-none">{stat.val}</p>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leaderboard Preview Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Today's Top Rankers</h2>
                        <p className="text-gray-400 font-medium">Outstanding performers in the last 24 hours</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-10">
                        <div className="divide-y divide-gray-50">
                            {loadingRankers ? (
                                <div className="p-12 text-center text-gray-400 font-bold">
                                    Loading rankers...
                                </div>
                            ) : topRankers.length > 0 ? (
                                topRankers.map((u) => (
                                    <div key={u.rank} className="p-6 flex items-center justify-between hover:bg-green-50/30 transition">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{u.emoji}</span>
                                            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-400 border border-gray-100">
                                                {u.name[0]}
                                            </div>
                                            <p className="font-black text-gray-800">{u.name}</p>
                                        </div>
                                        <p className="text-xl font-black text-green-600 tracking-tighter">{Math.round(u.score).toLocaleString()}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-gray-400 italic">
                                    No rankings yet. Start a quiz to be the first!
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center">
                        <a href="/leaderboard" className="inline-flex items-center gap-2 text-green-600 font-black uppercase text-sm tracking-widest group">
                            View Full Leaderboard <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 bg-gray-900 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-black text-xl">E</span>
                                </div>
                                <span className="font-black text-2xl text-white tracking-tight">Emerging MCQ</span>
                            </div>
                            <p className="text-gray-500 font-medium leading-relaxed max-w-sm">
                                Practice makes perfect. Emerging MCQ is a dedicated platform for students to test their knowledge and improve their performance in competitive exams.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Quick Links</h4>
                            <ul className="space-y-4">
                                <li><a href="/" className="text-gray-500 hover:text-green-500 font-bold transition">Home</a></li>
                                <li><a href="/leaderboard" className="text-gray-500 hover:text-green-500 font-bold transition">Leaderboard</a></li>
                                <li><a href="#" className="text-gray-500 hover:text-green-500 font-bold transition">About Us</a></li>
                                <li><a href="#" className="text-gray-500 hover:text-green-500 font-bold transition">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Support</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-gray-500 hover:text-green-500 font-bold transition">Disclaimer</a></li>
                                <li><a href="#" className="text-gray-500 hover:text-green-500 font-bold transition">Terms of Use</a></li>
                                <li><a href="#" className="text-gray-500 hover:text-green-500 font-bold transition">Privacy Policy</a></li>
                                <li><a href="#" className="text-gray-500 hover:text-green-500 font-bold transition">FAQ</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-gray-600 text-sm font-bold">
                            © 2026 Emerging MCQ. All rights reserved.
                        </p>
                        <p className="text-gray-600 text-xs font-medium italic">
                            "This is a practice platform, not an official exam."
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
