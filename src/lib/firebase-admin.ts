import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
};

let adminApp;
let adminAuth;
let adminDb;

if (!getApps().length) {
    adminApp = initializeApp(firebaseAdminConfig);
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
} else {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
}

export { adminApp, adminAuth, adminDb }; 