/**
 * Inicialización de Firebase (SDK JS) — proyecto miaapp-30191.
 * La app solo escribe donde las reglas lo permiten; todo lo demás
 * pasa por Cloud Functions.
 */
import Constants from "expo-constants";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

interface FirebaseExtra {
  apiKey: string;
  projectId: string;
  appId: string;
  messagingSenderId: string;
  storageBucket: string;
  authDomain: string;
}

function config(): FirebaseExtra {
  const extra = Constants.expoConfig?.extra?.firebase as
    | FirebaseExtra
    | undefined;
  if (!extra) {
    throw new Error("Falta extra.firebase en app.config.ts");
  }
  return extra;
}

let app: FirebaseApp | undefined;

export function firebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(config());
  }
  return app;
}

export const auth = (): Auth => getAuth(firebaseApp());
export const db = (): Firestore => getFirestore(firebaseApp());
export const functions = (): Functions =>
  getFunctions(firebaseApp(), "us-central1");
