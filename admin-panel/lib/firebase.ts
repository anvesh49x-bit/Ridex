import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAAxXBuLGOg-fQYmq6Nlu4UH-gA7o_8gxc",
  authDomain: "ridex-8a79b.firebaseapp.com",
  projectId: "ridex-8a79b",
  storageBucket: "ridex-8a79b.firebasestorage.app",
  messagingSenderId: "349518243555",
  appId: "1:349518243555:web:2ab80e507d0d4d9fac87d6",
};

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const adminAuth = getAuth(app);

export default app;