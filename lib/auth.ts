"use client";

import { auth } from "./firebase";
import {
    signOut,
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { useEffect, useState } from "react";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            throw new Error(error.message || "Login failed");
        }
    };

    const register = async (name: string, email: string, pass: string) => {
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(res.user, { displayName: name });
        } catch (error: any) {
            throw new Error(error.message || "Registration failed");
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const isAdmin = user ? (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").includes(user.email || "") : false;

    return { user, loading, login, register, logout, isAdmin };
}
