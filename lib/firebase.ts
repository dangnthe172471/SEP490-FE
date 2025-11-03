import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Cấu hình Firebase project từ biến môi trường
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
} as const;

// Khởi tạo Firebase app
const app = initializeApp(firebaseConfig);

// Khởi tạo Realtime Database instance
export const db = getDatabase(app);

// Export app instance
export default app;


