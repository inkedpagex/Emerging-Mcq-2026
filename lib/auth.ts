"use client";

import { auth, googleProvider } from "./firebase-client";
import {
    signOut,
    signInWithPopup,
    onAuthStateChanged,
    User,
} from "firebase/auth";
import { useEffect, useState } from "react";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            throw new Error(error.message || "Google login failed");
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

    return { user, loading, loginWithGoogle, logout, isAdmin };
}
