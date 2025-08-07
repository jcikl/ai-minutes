import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
apiKey: "AIzaSyBWyw_eH5NhIVaIButkjY-qeenKwc-cN3c",
authDomain: "aimeeting-b2565.firebaseapp.com",
projectId: "aimeeting-b2565",
storageBucket: "aimeeting-b2565.firebasestorage.app",
messagingSenderId: "450984522155",
appId: "1:450984522155:web:9ff21ab496f2891f57a2ee"
};

// Initialize Firebase only once
let app;
if (typeof window !== 'undefined') {
app = initializeApp(firebaseConfig);
} else {
app = initializeApp(firebaseConfig); // For server-side or initial render
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
