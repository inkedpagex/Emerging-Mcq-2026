"use client";

import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { app } from "./firebase";

// Client-only: Firebase Auth (browser only)
const auth = app ? getAuth(app) : (null as any);
const googleProvider = app ? new GoogleAuthProvider() : (null as any);

export { auth, googleProvider };
