// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider
} from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAHeppAhT9i9El4uf0eFPZTKGkyUWU3NLU",
  authDomain: "moodie-31bc2.firebaseapp.com",
  projectId: "moodie-31bc2",
  storageBucket: "moodie-31bc2.firebasestorage.app",
  messagingSenderId: "365995435515",
  appId: "1:365995435515:web:586f4f0f5852814f5f175e",
  measurementId: "G-G6NCJ49KS0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Auth persistence set"))
  .catch(console.error);

const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };