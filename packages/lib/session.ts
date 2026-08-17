/**
 * Sesión — el corazón del producto.
 *
 * Invariante que no se rompe (CLAUDE.md): el visitante entra SIN
 * cuenta con signInAnonymously(); escanear el QR liga ese UID a un
 * lugar físico vía custom claims; si después crea cuenta se usa
 * linkWithCredential() sobre el MISMO usuario, así el UID se conserva
 * y el consumo del día no se migra: ya apunta al usuario correcto.
 */
import * as AppleAuthentication from "expo-apple-authentication";
import {
  linkWithCredential,
  OAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { create } from "zustand";
import { getPorts } from "../domain/di";
import type { Estancia } from "../domain/types";
import { auth, functions } from "./firebase";

export type SessionStatus = "loading" | "none" | "guest" | "member";

interface SessionState {
  status: SessionStatus;
  uid: string | null;
  /** Lugar físico ligado por QR (bed-14, table-62) */
  spotId: string | null;
  /** Habitación ligada por habitación+apellido */
  roomId: string | null;
  estancia: Estancia | null;
  scope: string[];
  /** Vencimiento de la sesión de invitado (ms epoch) */
  exp: number | null;
  displayName: string | null;
  intentosEstancia: number;
  bloqueadoHasta: number | null;
}

interface SessionActions {
  /** Arranque: garantiza un UID desde el primer segundo */
  ensureAuth: () => void;
  /** QR escaneado → validarQR → claims → sesión ligada al lugar */
  bindSpot: (spotId: string, token: string) => Promise<void>;
  /** Habitación + apellido (verificación en servidor/mock) */
  findStay: (habitacion: string, apellido: string) => Promise<boolean>;
  /** Crea cuenta con Apple CONSERVANDO el UID (linkWithCredential) */
  signInWithApple: () => Promise<void>;
  signOutAll: () => Promise<void>;
}

const SCOPE_INVITADO = ["order", "hold", "book"];
const BLOQUEO_MS = 10 * 60 * 1000;
const MAX_INTENTOS = 3;

let unsubscribe: (() => void) | null = null;

export const useSession = create<SessionState & SessionActions>()(
  (set, get) => ({
    status: "loading",
    uid: null,
    spotId: null,
    roomId: null,
    estancia: null,
    scope: [],
    exp: null,
    displayName: null,
    intentosEstancia: 0,
    bloqueadoHasta: null,

    ensureAuth: () => {
      if (unsubscribe) return;
      unsubscribe = onAuthStateChanged(auth(), (user: User | null) => {
        if (!user) {
          set({ status: "loading", uid: null });
          void signInAnonymously(auth()).catch(() => {
            // Sin red o Auth anónimo deshabilitado en consola:
            // la app sigue navegable; las escrituras fallarán con
            // su propio estado de error.
            set({ status: "none", uid: null });
          });
          return;
        }
        const linked = user.providerData.length > 0;
        void user.getIdTokenResult().then((tk) => {
          const claims = tk.claims as {
            spotId?: string;
            scope?: string[];
            sexp?: number;
          };
          const vigente =
            typeof claims.sexp === "number" && claims.sexp > Date.now();
          set({
            uid: user.uid,
            displayName: user.displayName,
            status: linked ? "member" : vigente ? "guest" : "none",
            spotId: vigente ? (claims.spotId ?? null) : null,
            scope: vigente ? (claims.scope ?? []) : [],
            exp: vigente ? (claims.sexp ?? null) : null,
          });
        });
      });
    },

    bindSpot: async (spotId, token) => {
      const call = httpsCallable(functions(), "validarQR");
      await call({ spotId, token });
      // Los claims se escribieron en el servidor: refrescar el token
      const user = auth().currentUser;
      if (!user) throw new Error("sin-sesion");
      const tk = await user.getIdTokenResult(true);
      const claims = tk.claims as { spotId?: string; sexp?: number };
      set({
        status: user.providerData.length > 0 ? "member" : "guest",
        spotId: claims.spotId ?? spotId,
        scope: SCOPE_INVITADO,
        exp: typeof claims.sexp === "number" ? claims.sexp : null,
      });
    },

    findStay: async (habitacion, apellido) => {
      const { bloqueadoHasta, intentosEstancia } = get();
      if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
        throw new Error("bloqueado");
      }
      const estancia = await getPorts().guest.buscarPorHabitacionYApellido(
        habitacion,
        apellido,
      );
      if (!estancia) {
        const intentos = intentosEstancia + 1;
        set({
          intentosEstancia: intentos,
          bloqueadoHasta:
            intentos >= MAX_INTENTOS ? Date.now() + BLOQUEO_MS : null,
        });
        if (intentos >= MAX_INTENTOS) throw new Error("bloqueado");
        return false;
      }
      set({
        status:
          (auth().currentUser?.providerData.length ?? 0) > 0
            ? "member"
            : "guest",
        roomId: estancia.roomId,
        estancia,
        scope: SCOPE_INVITADO,
        intentosEstancia: 0,
        bloqueadoHasta: null,
      });
      return true;
    },

    signInWithApple: async () => {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) throw new Error("apple-sin-token");
      const provider = new OAuthProvider("apple.com");
      const firebaseCred = provider.credential({
        idToken: cred.identityToken,
      });
      const user = auth().currentUser;
      if (user && user.providerData.length === 0) {
        // LA pieza: enlazar sobre el anónimo conserva el UID y con él
        // el folio y el consumo del día. Nada que migrar.
        try {
          await linkWithCredential(user, firebaseCred);
        } catch (e) {
          const code = (e as { code?: string }).code;
          if (code === "auth/credential-already-in-use") {
            // La cuenta Apple ya existe: entrar con ella (UID previo
            // de esa cuenta; el consumo anónimo de hoy no se enlaza).
            await signInWithCredential(auth(), firebaseCred);
          } else {
            throw e;
          }
        }
      } else {
        await signInWithCredential(auth(), firebaseCred);
      }
      const current = auth().currentUser;
      set({
        status: "member",
        uid: current?.uid ?? null,
        displayName:
          current?.displayName ?? cred.fullName?.givenName ?? null,
      });
    },

    signOutAll: async () => {
      await fbSignOut(auth());
      set({
        status: "loading",
        uid: null,
        spotId: null,
        roomId: null,
        estancia: null,
        scope: [],
        exp: null,
        displayName: null,
      });
      // onAuthStateChanged reintenta el anónimo y deja status "none"
    },
  }),
);
