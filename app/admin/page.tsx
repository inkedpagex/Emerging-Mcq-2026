"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { publishManualQuizAction, ManualQuizJSON } from "./_actions/quiz-actions";
import {
    updateCategoryAction,
    deleteCategoryAction,
    updateQuizAction,
    deleteQuizAction,
    deleteAttemptAction
} from "./_actions/admin-actions";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";

type Tab = "IMPORT" | "CATEGORIES" | "QUIZZES" | "LEADERBOARD";

export default function AdminDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("IMPORT");

    // Auth Guard
    if (authLoading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
            <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-slate-950">
                <div className="bg-slate-900 text-indigo-100 p-8 rounded-[3rem] border border-slate-800 shadow-2xl max-w-md">
                    <div className="h-20 w-20 bg-indigo-950 text-indigo-400 rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto">🚫</div>
                    <h2 className="text-3xl font-black mb-2">Access Denied</h2>
                    <p className="mb-8 opacity-60 font-medium">This terminal is restricted to administrators only.</p>
                    <button onClick={() => router.push("/")} className="w-full bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-950/50">Return to Safety</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <div className="max-w-7xl mx-auto p-4 sm:p-12">
                <header className="mb-16 relative">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute -top-12 right-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px]"></div>
                    
                    <div className="relative">
                        <span className="text-indigo-500 font-black tracking-[0.3em] uppercase text-[10px] mb-4 block">System Command Centre</span>
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter">
                            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">Dashboard</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg max-w-xl">
                            Control the intelligence flow. Manage quizzes, curate categories, and monitor global performance.
                        </p>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className="flex flex-wrap gap-2 mb-12 bg-slate-900/50 p-2 rounded-[2rem] border border-slate-800/50 w-fit backdrop-blur-xl">
                    {(["IMPORT", "CATEGORIES", "QUIZZES", "LEADERBOARD"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab
                                ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-950"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <main className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="bg-slate-900/30 rounded-[3rem] border border-slate-800/50 p-1 backdrop-blur-sm">
                        {activeTab === "IMPORT" && <ImportSection />}
                        {activeTab === "CATEGORIES" && <CategoriesSection />}
                        {activeTab === "QUIZZES" && <QuizzesSection />}
                        {activeTab === "LEADERBOARD" && <LeaderboardSection />}
                    </div>
                </main>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function ImportSection() {
    const [jsonText, setJsonText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [parsedData, setParsedData] = useState<ManualQuizJSON | null>(null);

    const handleValidate = () => {
        setError("");
        try {
            const data = JSON.parse(jsonText) as ManualQuizJSON;
            if (!data.topic || !data.level || !Array.isArray(data.questions)) throw new Error("Missing topic, level, or questions.");
            setParsedData(data);
        } catch (err: any) {
            setError(err.message || "Invalid JSON.");
            setParsedData(null);
        }
    };

    const handlePublish = async () => {
        if (!parsedData) return;
        setLoading(true);
        const result = await publishManualQuizAction(parsedData);
        if (result.success) {
            alert("Quiz Published Successfully! Check Quizzes tab.");
            setParsedData(null);
            setJsonText("");
        } else setError(result.error || "Failed to publish.");
        setLoading(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 px-1">
            <div className="bg-slate-900 p-8 rounded-[2.8rem] space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center text-xl font-bold">{}</div>
                    <h2 className="text-xl font-black text-white">Upload Schema</h2>
                </div>
                <textarea
                    className="w-full h-[500px] font-mono text-xs p-6 rounded-[2rem] bg-black/40 text-indigo-300 border-2 border-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder='{ 
  "topic": "Quantum Computing", 
  "level": "Hard", 
  "questions": [...] 
}'
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                />
                <button 
                    onClick={handleValidate} 
                    className="w-full bg-slate-800 text-indigo-400 rounded-2xl py-5 font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all active:scale-[0.98]"
                >
                    Initialise Validator
                </button>
                {error && <div className="p-6 bg-red-500/10 text-red-400 rounded-[2rem] border border-red-500/20 text-xs font-bold leading-relaxed whitespace-pre-wrap">⚠️ {error}</div>}
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.8rem] flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-xl font-bold">{}</div>
                    <h2 className="text-xl font-black text-white">Preview Output</h2>
                </div>
                
                <div className="flex-1 bg-black/20 rounded-[2.5rem] border border-slate-800 p-8">
                    {parsedData ? (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Metadata</span>
                                <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                                    <h2 className="text-3xl font-black text-white">{parsedData.topic}</h2>
                                    <span className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight">{parsedData.questions.length} Questions</span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-2xl">
                                    <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">L</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Difficulty</p>
                                        <p className="text-sm font-bold text-white uppercase">{parsedData.level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12">
                                <button 
                                    onClick={handlePublish} 
                                    disabled={loading} 
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-3xl py-6 font-black text-lg shadow-2xl shadow-emerald-950/40 hover:emerald-400 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {loading ? "TRANSMITTING DATA..." : "PUBLISH TO CLOUD 🚀"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 grayscale opacity-40">
                            <div className="text-6xl text-slate-800 font-black">?</div>
                            <p className="text-slate-500 font-medium italic">Pending validation of source JSON...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CategoriesSection() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any | null>(null);

    const refresh = async () => {
        setLoading(true);
        const snap = await getDocs(query(collection(db, "categories"), orderBy("name", "asc")));
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
    };

    useEffect(() => { refresh(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("This will erase the category. Quizzes must be deleted first. Proceed?")) return;
        const res = await deleteCategoryAction(id);
        if (res.success) refresh();
        else alert(res.error);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        const res = await updateCategoryAction(editing.id, editing.name, editing.slug);
        if (res.success) {
            setEditing(null);
            refresh();
        } else alert(res.error);
    };

    return (
        <div className="bg-slate-900 rounded-[2.8rem] overflow-hidden">
            {editing && (
                <div className="p-8 bg-indigo-600/10 border-b border-indigo-500/20 animate-in slide-in-from-top duration-300">
                    <form onSubmit={handleUpdate} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-3">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-2">Edit Category Name</label>
                            <input 
                                className="w-full bg-slate-950 border-2 border-indigo-500/30 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500"
                                value={editing.name} 
                                onChange={e => setEditing({...editing, name: e.target.value})}
                                placeholder="Clear Name (e.g., Computer Science)"
                            />
                        </div>
                        <div className="flex-1 space-y-3">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-2">Slug (URL Index)</label>
                            <input 
                                className="w-full bg-slate-950 border-2 border-indigo-500/30 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500"
                                value={editing.slug} 
                                onChange={e => setEditing({...editing, slug: e.target.value})}
                                placeholder="clear-slug"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-950">Update</button>
                            <button type="button" onClick={() => setEditing(null)} className="bg-slate-800 text-slate-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-white">Category Index</h2>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{items.length} ACTIVE CLUSTERS</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(cat => (
                        <div key={cat.id} className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                            <h3 className="text-lg font-black text-white mb-2 group-hover:text-indigo-400 transition">{cat.name}</h3>
                            <code className="text-[10px] text-slate-600 font-mono tracking-widest uppercase mb-6 block">{cat.slug}</code>
                            <div className="flex gap-4 border-t border-slate-900 pt-4 mt-auto">
                                <button 
                                    onClick={() => setEditing(cat)} 
                                    className="text-indigo-400 hover:text-indigo-300 font-black text-[10px] uppercase tracking-widest"
                                >
                                    Refine
                                </button>
                                <button 
                                    onClick={() => handleDelete(cat.id)} 
                                    className="text-slate-600 hover:text-red-500 font-black text-[10px] uppercase tracking-widest ml-auto"
                                >
                                    Erase
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function QuizzesSection() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingQuiz, setEditingQuiz] = useState<any | null>(null);

    const refresh = async () => {
        setLoading(true);
        const snap = await getDocs(query(collection(db, "quizzes"), orderBy("createdAt", "desc")));
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
    };

    useEffect(() => { refresh(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Confirm complete erasure of this quiz asset?")) return;
        const res = await deleteQuizAction(id);
        if (res.success) refresh();
        else alert(res.error);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await updateQuizAction(editingQuiz.id, {
            title: editingQuiz.title,
            level: editingQuiz.level,
            timeLimit: Number(editingQuiz.timeLimit) || 0
        });
        if (res.success) {
            setEditingQuiz(null);
            refresh();
        } else alert(res.error);
    };

    const togglePublish = async (id: string, current: boolean) => {
        await updateQuizAction(id, { published: !current });
        refresh();
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-white">Quiz Repositories</h2>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{items.length} SECURE ASSETS</span>
            </div>

            {editingQuiz && (
                <div className="bg-indigo-600/5 p-8 rounded-[3rem] border-2 border-indigo-500 shadow-2xl mb-12 animate-in zoom-in duration-300">
                    <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block pl-1">Knowledge Title</label>
                                <input
                                    className="w-full bg-black/40 p-5 rounded-2xl border-2 border-slate-800 text-white font-bold outline-none focus:border-indigo-500"
                                    value={editingQuiz.title}
                                    onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block pl-1">Complexity</label>
                                    <select
                                        className="w-full bg-black/40 p-5 rounded-2xl border-2 border-slate-800 text-white font-bold outline-none focus:border-indigo-500 appearance-none"
                                        value={editingQuiz.level}
                                        onChange={e => setEditingQuiz({ ...editingQuiz, level: e.target.value })}
                                    >
                                        <option value="EASY">EASY</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HARD">HARD</option>
                                        <option value="MIX">MIX</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block pl-1">Temporal Limit (Min)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/40 p-5 rounded-2xl border-2 border-slate-800 text-white font-bold outline-none focus:border-indigo-500"
                                        value={editingQuiz.timeLimit || ""}
                                        onChange={e => setEditingQuiz({ ...editingQuiz, timeLimit: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 justify-end">
                            <button type="submit" className="bg-indigo-600 text-white rounded-2xl py-5 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-950">Commit Changes</button>
                            <button type="button" onClick={() => setEditingQuiz(null)} className="bg-slate-800 text-slate-500 rounded-2xl py-5 font-black text-xs uppercase tracking-widest">Abort</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {items.map((quiz, idx) => (
                    <div key={quiz.id} className="bg-slate-950 p-6 rounded-[2.5rem] border border-slate-900 group flex items-center justify-between hover:bg-slate-900 hover:border-indigo-500/30 transition-all duration-300">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xl italic tracking-tighter shadow-inner">
                                {idx + 1}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition">{quiz.title}</h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest border border-slate-800 px-2 py-0.5 rounded-md">{quiz.categoryId}</span>
                                    <span className="h-1 w-1 bg-slate-800 rounded-full"></span>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{quiz.level}</span>
                                    <span className="h-1 w-1 bg-slate-800 rounded-full"></span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{quiz.questions?.length || 0} ITEMS</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 opacity-40 group-hover:opacity-100 transition-all duration-300">
                            <button
                                onClick={() => setEditingQuiz(quiz)}
                                className="text-indigo-500 font-black text-[10px] uppercase tracking-widest hover:text-indigo-400"
                            >
                                Refactor
                            </button>
                            <button
                                onClick={() => togglePublish(quiz.id, quiz.published)}
                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${quiz.published 
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950" 
                                    : "bg-slate-800 text-slate-500"
                                }`}
                            >
                                {quiz.published ? "Active" : "Stable"}
                            </button>
                            <button onClick={() => handleDelete(quiz.id)} className="text-slate-800 hover:text-red-500 font-black text-[10px] uppercase tracking-widest">Erase</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LeaderboardSection() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        const snap = await getDocs(query(collection(db, "attempts"), orderBy("finishedAt", "desc"), limit(50)));
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
    };

    useEffect(() => { refresh(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Permanently remove this telemetry record?")) return;
        const res = await deleteAttemptAction(id);
        if (res.success) refresh();
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-white">Telemetry Logs</h2>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">REAL-TIME DATA FLOW</span>
            </div>
            
            <div className="bg-slate-950 rounded-[2.5rem] border border-slate-900 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-900 bg-black/20">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-600 tracking-widest">Operative</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-600 tracking-widest">Metadata</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-600 tracking-widest">Accuracy</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-600 tracking-widest text-right">Command</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {items.map(at => (
                            <tr key={at.id} className="hover:bg-slate-900/40 transition">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center text-[10px] font-black">{}</div>
                                        <p className="font-bold text-slate-300 truncate max-w-[120px]">{at.userId || at.userName || "Unknown"}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-slate-500 uppercase font-black text-[10px] tracking-tighter">{at.category} • {at.level}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="font-black text-emerald-400 text-lg tabular-nums tracking-tighter">{at.scoreFinal}</span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button onClick={() => handleDelete(at.id)} className="text-slate-800 hover:text-red-500 font-black uppercase text-[10px] tracking-widest transition">Purge</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {items.length === 0 && !loading && (
                    <div className="py-20 text-center text-slate-600 italic text-sm">No telemetry packets found.</div>
                )}
            </div>
        </div>
    );
}
