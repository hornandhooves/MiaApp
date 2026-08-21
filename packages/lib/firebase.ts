/**
 * Inicialización de Firebase (SDK JS) — proyecto miaapp-30191.
 * Auth con persistencia en AsyncStorage para que la sesión (incluido
 * el usuario anónimo) sobreviva reinicios de la app — sin eso, el
 * invitado perdería su UID y su consumo al cerrar la app.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from "firebase/auth";
import * as fbAuth from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import { rastro } from "./errorTecnico";

/**
 * getReactNativePersistence existe en el entry react-native de
 * firebase/auth (Metro lo resuelve por la condición "react-native"),
 * pero los tipos publicados son los del entry web y no lo declaran.
 * Se accede vía cast estructural — sin any ni @ts-ignore.
 */
const getRNPersistence = (
  fbAuth as unknown as {
    getReactNativePersistence?: (storage: unknown) => Persistence;
  }
).getReactNativePersistence;

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
let authInstance: Auth | undefined;

export function firebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(config());
  }
  return app;
}

export function auth(): Auth {
  if (!authInstance) {
    try {
      authInstance = getRNPersistence
        ? initializeAuth(firebaseApp(), {
            persistence: getRNPersistence(AsyncStorage),
          })
        : getAuth(firebaseApp());
    } catch {
      // Ya inicializado (fast refresh) — recuperar la instancia
      authInstance = getAuth(firebaseApp());
    }
  }
  return authInstance;
}

let dbInstance: Firestore | undefined;

/**
 * Firestore con el transporte por defecto.
 *
 * Historia, para que nadie repita el experimento: el 20-ago-2026, ante
 * una consulta que se colgaba, se forzó `experimentalForceLongPolling`.
 * Fue peor. Antes del cambio la consulta al menos **respondía** —con
 * `permission-denied`, que era correcto porque al token le faltaban los
 * claims—; con long polling forzado dejó de responder del todo: doce
 * segundos de silencio y el límite de tiempo saltando.
 *
 * Conclusión: el transporte por defecto sí funciona aquí, y forzarlo
 * fue un arreglo para un problema que no existía. Si algún día vuelve a
 * hacer falta, `experimentalAutoDetectLongPolling` es la vía
 * recomendada, NO forzarlo — pero antes hay que comprobar que el
 * síntoma sea silencio y no un rechazo con su código.
 */
export function db(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(firebaseApp());
    rastro("firestore: transporte por defecto");
  }
  return dbInstance;
}

export const functions = (): Functions =>
  getFunctions(firebaseApp(), "us-central1");
