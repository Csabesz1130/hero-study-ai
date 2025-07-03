import { app } from './firebase-app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export const getClientAuth = (): Auth => {
    if (typeof window === "undefined") {
        throw new Error("Firebase Auth csak kliensoldalon érhető el ezen a módon.");
    }
    if (!authInstance) {
        authInstance = getAuth(app);
    }
    return authInstance;
};

export const getClientFirestore = (): Firestore => {
    if (typeof window === "undefined") {
        throw new Error("Firestore csak kliensoldalon érhető el ezen a módon.");
    }
    if (!dbInstance) {
        dbInstance = getFirestore(app);
    }
    return dbInstance;
};

// Kliens oldali exportok - csak böngészőben használható
export const auth = typeof window !== "undefined" ? getClientAuth() : null;
export const db = typeof window !== "undefined" ? getClientFirestore() : null;

export { app }; 