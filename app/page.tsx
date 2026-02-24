"use client";

import { useQuizStore } from "@/lib/store";
import HomeView from "@/components/quiz/HomeView";
import QuizRunner from "@/components/quiz/QuizRunner";
import Navbar from "@/components/layout/Navbar";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";

function MainAppContent() {
  const { currentQuizId, currentCategory, currentLevel, startQuiz } = useQuizStore();
  const searchParams = useSearchParams();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    if (category && level && !currentQuizId && !currentCategory) {
      startQuiz(null, category, level, "INSTANT");
    }
  }, [searchParams, currentQuizId, currentCategory, startQuiz, hasHydrated]);

  if (!hasHydrated) return null;

  const isInQuiz = currentQuizId || (currentCategory && currentLevel);

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-green-100 selection:text-green-900">
      <Navbar />

      <section className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-8 flex-1 min-w-0">
        {!isInQuiz ? <HomeView /> : <QuizRunner quizId={currentQuizId} />}
      </section>
    </main>
  );
}

export default function MainApp() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-white"><div className="h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <MainAppContent />
    </Suspense>
  );
}
