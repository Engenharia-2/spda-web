import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your Firebase project configuration
// You can find this in the Firebase Console -> Project Settings -> General -> Your Apps
const firebaseConfig = {
    apiKey: "AIzaSyCmM_5CkJxNULsGzfZcdYj6C873ZgGV7SY",
    authDomain: "spda-report.firebaseapp.com",
    projectId: "spda-report",
    storageBucket: "spda-report.firebasestorage.app",
    messagingSenderId: "817499994748",
    appId: "1:817499994748:web:1cf9db637afdf9db9da7f9",
    measurementId: "G-P4RFBM882C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
