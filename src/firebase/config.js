// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrNErswE-x954R38T5xw1reIaHr4pRjpk",
  authDomain: "emrs-gaza.firebaseapp.com",
  projectId: "emrs-gaza",
  storageBucket: "emrs-gaza.firebasestorage.app",
  messagingSenderId: "682141718512",
  appId: "1:682141718512:web:94cc3e8018a7ea0380ef35"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
