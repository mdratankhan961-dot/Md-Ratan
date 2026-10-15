import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
 import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCeJDz6-niK1xE285z_DuXP78rSpYu3bAM",
  authDomain: "takaearn-bd-55795.firebaseapp.com",
  projectId: "takaearn-bd-55795",
  storageBucket: "takaearn-bd-55795.firebasestorage.app",
  messagingSenderId: "272424180316",
  appId: "1:272424180316:web:d68bf50e0da52d068d2499",
  measurementId: "G-WYGQC5KNEE"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => console.error("Persistence failed: ", err));
let analyticsInstance: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }).catch(() => {});
}

export { analyticsInstance as analytics };
