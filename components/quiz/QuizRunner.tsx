"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { saveAttemptAction } from "@/app/admin/_actions/quiz-results";

interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export default function QuizRunner({ quizId }: { quizId: string | null }) {
    const { user } = useAuth();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState<{ score: number; totalCorrect: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isTimeUp, setIsTimeUp] = useState(false);

    const {
        currentQuestionIndex,
        nextQuestion,
        prevQuestion,
        setAnswer,
        revealMode,
        resetQuiz,
        answers,
        setLoginModal,
        currentCategory,
        currentLevel
    } = useQuizStore();

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadQuiz = async () => {
            setError(null);
            setLoading(true);
            try {
                let url = "";
                if (quizId) {
                    url = `/api/quizzes/${quizId}`;
                } else if (currentCategory && currentLevel) {
                    url = `/api/questions?category=${currentCategory}&level=${currentLevel}&limit=50`;
                }

                if (!url) {
                    setLoading(false);
                    return;
                }

                const res = await fetch(url);
                const data = await res.json();

                if (!res.ok || !data.questions || data.questions.length === 0) {
                    throw new Error(data.error || "No questions found for this selection.");
                }

                setQuestions(data.questions);

                // Set time limit if available (convert minutes to seconds)
                if (data.timeLimit) {
                    setTimeLeft(data.timeLimit * 60);
                } else {
                    setTimeLeft(null); // No timer
                }
            } catch (err: any) {
                console.error("Quiz load error:", err);
                setError(err.message || "Something went wrong while loading the quiz.");
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [quizId, currentCategory, currentLevel]);

    // Restore previously selected option when question changes
    useEffect(() => {
        if (questions.length > 0 && questions[currentQuestionIndex]) {
            const existingAnswer = answers.find(a => a.questionId === questions[currentQuestionIndex].id);
            if (existingAnswer) {
                setSelectedOption(existingAnswer.selectedIndex);
                if (revealMode === "INSTANT") setIsAnswered(true);
            } else {
                setSelectedOption(null);
                setIsAnswered(false);
            }
            setStartTime(Date.now());
        }
    }, [currentQuestionIndex, questions, answers, revealMode]);

    // Timer Countdown Logic
    useEffect(() => {
        if (timeLeft === null || showResult || loading || error) return;

        if (timeLeft <= 0) {
            setIsTimeUp(true);
            handleFinalSubmit(); // Auto-submit when time is up
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, showResult, loading, error]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
            <div className="h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-bold italic">Preparing your questions...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-md mx-auto py-20 px-6 text-center animate-in zoom-in duration-300">
            <div className="text-6xl mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Oops! Couldn't load quiz</h3>
            <p className="text-gray-400 font-medium mb-8">{error}</p>
            <button
                onClick={() => resetQuiz()}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition"
            >
                Back to Home
            </button>
        </div>
    );

    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionSelect = (idx: number) => {
        if (isAnswered) return;
        setSelectedOption(idx);

        if (revealMode === "INSTANT") {
            setIsAnswered(true);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setSelectedOption(null);
            setIsAnswered(false);
            prevQuestion();
        }
    };

    const handleNext = async () => {
        if (selectedOption === null) return;

        // Login Gate logic
        if (currentQuestionIndex === 4 && !user) {
            alert("Please login to continue beyond 5 questions.");
            setLoginModal(true);
            return;
        }

        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const isCorrect = selectedOption === currentQuestion.correctIndex;

        setAnswer(currentQuestion.id, selectedOption, isCorrect, timeSpent);

        if (currentQuestionIndex < questions.length - 1) {
            setSelectedOption(null);
            setIsAnswered(false);
            nextQuestion();
        } else {
            await handleFinalSubmit();
        }
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        const finalAnswers = [...answers];

        // Add the current answer if not already there (for the last question submit)
        const isCorrect = selectedOption === currentQuestion?.correctIndex;
        const timeSpent = Math.round((Date.now() - startTime) / 1000);

        if (currentQuestion && selectedOption !== null) {
            const existingIdx = finalAnswers.findIndex(a => a.questionId === currentQuestion.id);
            const currentAnswer = { questionId: currentQuestion.id, selectedIndex: selectedOption, isCorrect, timeSpent };
            if (existingIdx > -1) finalAnswers[existingIdx] = currentAnswer;
            else finalAnswers.push(currentAnswer);
        }

        const res = await saveAttemptAction({
            userId: user?.uid,
            userName: user?.displayName || user?.email?.split('@')[0] || "Anonymous",
            quizId,
            category: currentCategory,
            level: currentLevel,
            answers: finalAnswers,
            mode: quizId ? "Fixed" : "Dynamic"
        });

        if (res.success) {
            setResultData({ score: res.score || 0, totalCorrect: finalAnswers.filter(a => a.isCorrect).length });
            setShowResult(true);
        } else {
            alert("Failed to save results. Redirecting to home.");
            resetQuiz();
        }
        setLoading(false);
    };


    if (showResult && resultData) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-50">
                    <div className="inline-flex h-20 w-20 bg-green-50 text-green-600 rounded-3xl items-center justify-center text-5xl mb-8">🏆</div>
                    <h2 className="text-4xl font-black text-gray-900 mb-2">Quiz Completed!</h2>
                    <p className="text-gray-400 font-medium mb-12 italic">Great job! Here is how you performed today.</p>

                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 mt-4">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Score</p>
                            <p className="text-5xl font-black text-green-600 tracking-tighter">{resultData.score}</p>
                        </div>
                        <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 -mt-4">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Accuracy</p>
                            <p className="text-5xl font-black text-blue-600 tracking-tighter">
                                {Math.round((resultData.totalCorrect / questions.length) * 100)}%
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 max-w-sm mx-auto">
                        <button
                            onClick={() => { resetQuiz(); router.push("/leaderboard"); }}
                            className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition shadow-xl shadow-green-100"
                        >
                            View Leaderboard & My Rank 📈
                        </button>
                        <button
                            onClick={() => resetQuiz()}
                            className="w-full bg-white text-gray-400 py-4 rounded-2xl font-bold hover:text-gray-600 transition"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion && !loading && !error) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">No question data available.</p>
                <button onClick={() => resetQuiz()} className="mt-4 text-green-600 font-bold underline">Go Back home</button>
            </div>
        );
    }

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Top Bar */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {currentQuestionIndex + 1}
                    </div>
                    <span className="text-gray-400 text-xs text-nowrap">/ {questions.length}</span>
                </div>
                <div className="flex-1 mx-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {timeLeft !== null && (
                    <div className={`mr-4 text-xs font-black flex items-center gap-1.5 ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-gray-900"}`}>
                        <span>⏱️</span> {formatTime(timeLeft)}
                    </div>
                )}
                <button onClick={resetQuiz} className="text-gray-400 hover:text-red-500 text-xs font-semibold">Quit</button>
            </div>

            {/* Question Card */}
            <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-50 mb-3 overflow-visible min-h-[auto]">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black text-green-600 tracking-widest uppercase">Question {currentQuestionIndex + 1}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrev}
                            disabled={currentQuestionIndex === 0}
                            className="text-[10px] font-black text-gray-400 uppercase tracking-tight hover:text-green-600 disabled:opacity-20 disabled:cursor-not-allowed transition flex items-center gap-1"
                        >
                            ← Prev
                        </button>
                        <div className="h-3 w-[1px] bg-gray-100 self-center"></div>
                        <button
                            onClick={handleNext}
                            disabled={selectedOption === null}
                            className="text-[10px] font-black text-gray-400 uppercase tracking-tight hover:text-green-600 disabled:opacity-20 disabled:cursor-not-allowed transition flex items-center gap-1"
                        >
                            Next →
                        </button>
                    </div>
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-4 leading-snug whitespace-normal break-words overflow-visible">
                    {currentQuestion.questionText}
                </h2>

                <div className="space-y-4">
                    {currentQuestion.options.map((option: string, idx: number) => {
                        let variant = "default";
                        if (selectedOption === idx) variant = "selected";
                        if (isAnswered) {
                            if (idx === currentQuestion.correctIndex) variant = "correct";
                            else if (selectedOption === idx) variant = "wrong";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                className={`w-full p-3.5 rounded-xl border-2 text-left transition-all relative overflow-hidden group
                  ${variant === "default" && "border-gray-100 hover:border-green-200 bg-white"}
                  ${variant === "selected" && "border-green-600 bg-green-50"}
                  ${variant === "correct" && "border-green-500 bg-green-500 text-white"}
                  ${variant === "wrong" && "border-red-400 bg-red-50 text-red-700"}
                `}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`h-7 w-7 shrink-0 rounded-lg flex items-center justify-center font-bold border text-sm
                    ${variant === "default" && "bg-gray-50 border-gray-100 group-hover:bg-green-100 group-hover:text-green-600"}
                    ${variant === "selected" && "bg-green-600 text-white border-green-600"}
                    ${variant === "correct" && "bg-white text-green-600 border-white"}
                    ${variant === "wrong" && "bg-white text-red-500 border-white"}
                  `}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="font-semibold text-sm whitespace-normal break-words leading-tight">{option}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {isAnswered && currentQuestion.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider">
                            💡 EXPLANATION
                        </h4>
                        <p className="text-blue-700 text-xs leading-relaxed">
                            {currentQuestion.explanation}
                        </p>
                    </div>
                )}
            </div>

            <button
                disabled={selectedOption === null}
                onClick={handleNext}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black text-base hover:bg-black transition shadow-xl disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.98]"
            >
                {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
            </button>

            {/* Login Gate Modal Hint */}
            {currentQuestionIndex === 4 && !user && (
                <p className="text-center mt-4 text-xs text-orange-600 font-medium">
                    ⚠️ LOGIN REQUIRED TO PROCEED BEYOND THIS QUESTION
                </p>
            )}
        </div>
    );
}
