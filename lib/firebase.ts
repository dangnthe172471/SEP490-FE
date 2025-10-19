// ===== FIREBASE REALTIME DATABASE CONFIGURATION =====
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Cấu hình Firebase project
const firebaseConfig = {
    apiKey: "AIzaSyC2Xvzl0Kd5p1MLpPG0DZtRUYiLNXGBBBg",                    // API Key
    authDomain: "realtimet-14741.firebaseapp.com",                        // Auth Domain
    databaseURL: "https://realtimet-14741-default-rtdb.firebaseio.com",   // Realtime Database URL
    projectId: "realtimet-14741",                                         // Project ID
    storageBucket: "realtimet-14741.firebasestorage.app",                 // Storage Bucket
    messagingSenderId: "1018775136345",                                   // Messaging Sender ID
    appId: "1:1018775136345:web:9ff21d5c3468f5e767e948"                  // App ID
};

// Khởi tạo Firebase app
const app = initializeApp(firebaseConfig);

// Khởi tạo Realtime Database instance
export const db = getDatabase(app);

// Export app instance
export default app;


