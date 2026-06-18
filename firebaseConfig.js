
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCt-RWKGcy10pecTNcyolCR6UNddiMR1nQ",
  authDomain: "teste-psicologico.firebaseapp.com",
  projectId: "teste-psicologico",
  storageBucket: "teste-psicologico.firebasestorage.app",
  messagingSenderId: "969151153248",
  appId: "1:969151153248:web:8722ba8d6dbb358a116f05"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };