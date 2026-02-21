// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8N-rd3LxrYgvZPRSvCFRX7DPkjCa3sP4",
  authDomain: "its120l-kamai.firebaseapp.com",
  projectId: "its120l-kamai",
  storageBucket: "its120l-kamai.firebasestorage.app",
  messagingSenderId: "572074303698",
  appId: "1:572074303698:web:ce9553e1d14ebcc73acd0b",
  measurementId: "G-BWPQDFXPNP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);