import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuizState {
    currentQuizId: string | null;
    currentCategory: string | null;
    currentLevel: string | null;
    guestSessionId: string | null;
    currentQuestionIndex: number;
    answers: { questionId: string; selectedIndex: number; isCorrect: boolean; timeSpent: number }[];
    isLoginModalOpen: boolean;
    revealMode: "INSTANT" | "END_ONLY";

    // Actions
    startQuiz: (quizId: string | null, category?: string | null, level?: string | null, reveal?: "INSTANT" | "END_ONLY") => void;
    setAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean, timeSpent: number) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    resetQuiz: () => void;
    setLoginModal: (isOpen: boolean) => void;
    setGuestSessionId: (id: string) => void;
}

export const useQuizStore = create<QuizState>()(
    persist(
        (set) => ({
            currentQuizId: null,
            currentCategory: null,
            currentLevel: null,
            guestSessionId: null,
            currentQuestionIndex: 0,
            answers: [],
            isLoginModalOpen: false,
            revealMode: "END_ONLY",

            startQuiz: (quizId, category = null, level = null, reveal = "END_ONLY") => set({
                currentQuizId: quizId,
                currentCategory: category,
                currentLevel: level,
                revealMode: reveal,
                currentQuestionIndex: 0,
                answers: []
            }),

            setAnswer: (questionId, selectedIndex, isCorrect, timeSpent) => set((state) => {
                const existingIdx = state.answers.findIndex(a => a.questionId === questionId);
                const newAnswers = [...state.answers];
                if (existingIdx > -1) {
                    newAnswers[existingIdx] = { questionId, selectedIndex, isCorrect, timeSpent };
                } else {
                    newAnswers.push({ questionId, selectedIndex, isCorrect, timeSpent });
                }
                return { answers: newAnswers };
            }),

            nextQuestion: () => set((state) => ({
                currentQuestionIndex: state.currentQuestionIndex + 1
            })),

            prevQuestion: () => set((state) => ({
                currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1)
            })),

            resetQuiz: () => set({
                currentQuizId: null,
                currentCategory: null,
                currentLevel: null,
                currentQuestionIndex: 0,
                answers: []
            }),

            setLoginModal: (isOpen) => set({ isLoginModalOpen: isOpen }),

            setGuestSessionId: (id) => set({ guestSessionId: id }),
        }),
        {
            name: "quiz-storage",
        }
    )
);
