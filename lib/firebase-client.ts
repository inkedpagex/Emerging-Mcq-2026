"use client";

import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { app } from "./firebase";

// Client-only: Firebase Auth (browser only)
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
