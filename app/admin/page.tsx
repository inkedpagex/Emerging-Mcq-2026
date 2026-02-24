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
    if (authLoading) return <div className="p-12 text-center text-gray-400">Loading checking access...</div>;
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 max-w-md">
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="mb-6 opacity-80">You do not have administrative privileges to access this panel.</p>
                    <button onClick={() => router.push("/")} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition">Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 mb-2">Admin Control Center</h1>
                <p className="text-gray-400 font-medium">Manage your quizzes, categories, and performance data.</p>
            </header>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 w-fit">
                {(["IMPORT", "CATEGORIES", "QUIZZES", "LEADERBOARD"] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                            ? "bg-white text-green-600 shadow-sm border border-gray-100"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === "IMPORT" && <ImportSection />}
                {activeTab === "CATEGORIES" && <CategoriesSection />}
                {activeTab === "QUIZZES" && <QuizzesSection />}
                {activeTab === "LEADERBOARD" && <LeaderboardSection />}
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
            alert("Quiz Published!");
            setParsedData(null);
            setJsonText("");
        } else setError(result.error || "Failed");
        setLoading(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <textarea
                    className="w-full h-[500px] font-mono text-sm p-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder='{ "topic": "Tech", "level": "Easy", "questions": [...] }'
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                />
                <button onClick={handleValidate} className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold hover:bg-black transition-all">Validate JSON</button>
                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{error}</div>}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                {parsedData ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">{parsedData.topic}</h2>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black">{parsedData.questions.length} Questions</span>
                        </div>
                        <button onClick={handlePublish} disabled={loading} className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold hover:bg-green-700 shadow-lg shadow-green-100">
                            {loading ? "Publishing..." : "Publish Quiz"}
                        </button>
                    </div>
                ) : <p className="text-gray-400 text-center py-20 italic">Validate JSON to see preview</p>}
            </div>
        </div>
    );
}

function CategoriesSection() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        const snap = await getDocs(collection(db, "categories"));
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
    };

    useEffect(() => { refresh(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const res = await deleteCategoryAction(id);
        if (res.success) refresh();
        else alert(res.error);
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Slug</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.map(cat => (
                        <tr key={cat.id} className="hover:bg-gray-50/50 transition">
                            <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{cat.slug}</td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-tighter">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
        if (!confirm("Delete this quiz?")) return;
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
        <div className="grid gap-4">
            {editingQuiz && (
                <div className="bg-white p-6 rounded-3xl border-2 border-green-500 shadow-xl mb-4 animate-in zoom-in duration-200">
                    <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Quiz Title</label>
                                <input
                                    className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500 font-bold"
                                    value={editingQuiz.title}
                                    onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Level</label>
                                    <select
                                        className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500 font-bold appearance-none"
                                        value={editingQuiz.level}
                                        onChange={e => setEditingQuiz({ ...editingQuiz, level: e.target.value })}
                                    >
                                        <option value="LOW">EASY</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HIGH">HARD</option>
                                        <option value="MIX">MIX</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Time Limit (Min)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500 font-bold"
                                        value={editingQuiz.timeLimit || ""}
                                        onChange={e => setEditingQuiz({ ...editingQuiz, timeLimit: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 justify-end">
                            <button type="submit" className="bg-green-600 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100">Save Changes</button>
                            <button type="button" onClick={() => setEditingQuiz(null)} className="bg-gray-100 text-gray-400 rounded-2xl py-4 font-black text-xs uppercase tracking-widest">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {items.map(quiz => (
                <div key={quiz.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-green-100 transition-all group">
                    <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition">{quiz.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 uppercase font-black tracking-widest">
                            {quiz.categoryId} • {quiz.level} • {quiz.timeLimit ? `${quiz.timeLimit} Min` : "No Limit"}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setEditingQuiz(quiz)}
                            className="text-blue-500 font-bold text-xs uppercase opacity-40 group-hover:opacity-100 transition"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => togglePublish(quiz.id, quiz.published)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${quiz.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                                }`}
                        >
                            {quiz.published ? "Live" : "Draft"}
                        </button>
                        <button onClick={() => handleDelete(quiz.id)} className="text-red-300 hover:text-red-500 font-bold text-xs uppercase">Delete</button>
                    </div>
                </div>
            ))}
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
        if (!confirm("Delete this entry?")) return;
        const res = await deleteAttemptAction(id);
        if (res.success) refresh();
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">User</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Quiz</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Score</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map(at => (
                        <tr key={at.id} className="border-t border-gray-50">
                            <td className="px-6 py-4 font-bold truncate max-w-[150px]">{at.userId || at.guestSessionId?.substring(0, 8)}</td>
                            <td className="px-6 py-4 text-gray-500 uppercase font-bold text-[10px]">{at.category}</td>
                            <td className="px-6 py-4 font-black text-green-600">{at.scoreFinal}</td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDelete(at.id)} className="text-red-500 font-bold uppercase text-[10px]">Remove</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
