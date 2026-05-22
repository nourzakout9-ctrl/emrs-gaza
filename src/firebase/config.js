// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnU50YH-blRemQvvDKkPlAXdNc_3BCNVY",
  authDomain: "emrs-gaza-26922.firebaseapp.com",
  projectId: "emrs-gaza-26922",
  storageBucket: "emrs-gaza-26922.firebasestorage.app",
  messagingSenderId: "31119250178",
  appId: "1:31119250178:web:dcbc74c0d0b3c66341a81b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;