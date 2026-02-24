"use client";

import { useState, useEffect } from "react";
import { publishManualQuizAction, ManualQuizJSON } from "./_actions/quiz-actions";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [jsonText, setJsonText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [parsedData, setParsedData] = useState<ManualQuizJSON | null>(null);

    if (authLoading) return <div className="p-12 text-center text-gray-400">Loading checking access...</div>;

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 max-w-md">
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="mb-6 opacity-80">You do not have administrative privileges to access this panel.</p>
                    <button
                        onClick={() => router.push("/")}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const handleValidate = () => {
        setError("");
        try {
            const data = JSON.parse(jsonText) as ManualQuizJSON;

            // Basic validation
            if (!data.topic || !data.level || !Array.isArray(data.questions)) {
                throw new Error("Invalid structure. Missing topic, level, or questions array.");
            }

            if (data.questions.length === 0) {
                throw new Error("Questions array cannot be empty.");
            }

            // Validate a sample question
            const q = data.questions[0];
            if (!q.question || !q.options || !q.correctAnswer || !["A", "B", "C", "D"].includes(q.correctAnswer)) {
                throw new Error("Invalid question format. Check options and correctAnswer.");
            }

            setParsedData(data);
        } catch (err: any) {
            setError(err.message || "Invalid JSON format.");
            setParsedData(null);
        }
    };

    const handlePublish = async () => {
        if (!parsedData) return;
        setLoading(true);
        setError("");
        const result = await publishManualQuizAction(parsedData);
        if (result.success) {
            alert("Quiz Published Successfully!");
            setParsedData(null);
            setJsonText("");
        } else {
            setError(result.error || "Failed to publish.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 underline decoration-green-500 underline-offset-8">
                Admin Panel - Manual JSON Import
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-gray-700">Paste Quiz JSON</label>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Strict format required</span>
                        </div>
                        <textarea
                            className="w-full h-[500px] font-mono text-sm p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                            placeholder='{ "topic": "Tech", "level": "Easy", "questions": [...] }'
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleValidate}
                        className="w-full bg-green-500 text-white rounded-xl py-4 font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-200 active:scale-[0.98]"
                    >
                        Validate JSON Structure
                    </button>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                            <strong>Validation Error:</strong> {error}
                        </div>
                    )}
                </div>

                {/* Preview Section */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 overflow-y-auto max-h-[800px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Live Preview</h2>
                        {parsedData && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                Valid JSON
                            </span>
                        )}
                    </div>

                    {parsedData ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Topic</p>
                                    <p className="font-semibold text-gray-800">{parsedData.topic}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Level</p>
                                    <p className="font-semibold text-gray-800">{parsedData.level}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {parsedData.questions.map((q, idx) => (
                                    <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-green-200 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="font-bold text-gray-700">{idx + 1}. {q.question}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${q.difficulty === "HIGH" ? "bg-red-100 text-red-600" :
                                                q.difficulty === "MEDIUM" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {Object.entries(q.options).map(([key, val]) => (
                                                <div key={key} className={`p-2 rounded-lg border ${key === q.correctAnswer ? "bg-green-50 border-green-200 text-green-700 font-bold" : "bg-gray-50 border-gray-100 text-gray-500"
                                                    }`}>
                                                    {key}. {val}
                                                </div>
                                            ))}
                                        </div>
                                        {q.explanation && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                                                <strong>Exp:</strong> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handlePublish}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                            >
                                {loading ? "Publishing Data..." : "Finalize & Publish Quiz"}
                            </button>
                        </div>
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-center">Paste and validate your JSON<br />to see the preview here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
