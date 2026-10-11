// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth,GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "synapse-ai-cc450.firebaseapp.com",
  projectId: "synapse-ai-cc450",
  storageBucket: "synapse-ai-cc450.firebasestorage.app",
  messagingSenderId: "497165842559",
  appId: "1:497165842559:web:bfc4ecd720d4fef541a74a",
  measurementId: "G-Y4JC83VR2F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth=getAuth(app)
export const googleprovider= new GoogleAuthProvider()
