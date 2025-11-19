// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// (These keys are specific to your project)
const firebaseConfig = {
  apiKey: "AIzaSyBpQaOMiwiM98prMH6a8bjiiSFRok8RwVY",
  authDomain: "smart-gallery-project.firebaseapp.com",
  projectId: "smart-gallery-project",
  storageBucket: "smart-gallery-project.firebasestorage.app",
  messagingSenderId: "435531436468",
  appId: "1:435531436468:web:3611f627fc31c0b1ee62e1",
  measurementId: "G-T8ZVGKV5K8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export our services to be used in other files
export const auth = getAuth(app);
export const db = getFirestore(app);