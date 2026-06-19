import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCt-RWKGcy10pecTNcyolCR6UNddiMR1nQ",
  authDomain: "teste-psicologico.firebaseapp.com",
  projectId: "teste-psicologico",
  storageBucket: "teste-psicologico.appspot.com",
  messagingSenderId: "969151153248",
  appId: "1:969151153248:web:a041674674c0b9fc116f05"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };