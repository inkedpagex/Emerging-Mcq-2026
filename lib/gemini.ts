import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface QuizQuestionJSON {
    difficulty: "LOW" | "MEDIUM" | "HIGH";
    questionText: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

export interface QuizBankJSON {
    category: string;
    quizTitle: string;
    questions: QuizQuestionJSON[];
    incomplete: boolean;
}
