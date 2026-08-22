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
import * as Crypto from "expo-crypto";
import { NONCE_INVALIDO, YA_TIENE_CUENTA } from "./authCodes";
import { codigoDeError, rastro } from "./errorTecnico";
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
  /** Personal de Mía. Viaja en el token, no lo decide la app. */
  staff: boolean;
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
  /**
   * Vuelve a pedir el token al servidor y relee los claims.
   *
   * Los claims viajan DENTRO del token, y el token vive hasta una hora.
   * Si a alguien le dan el rol de personal mientras tiene la app
   * abierta, su token sigue siendo el de antes y Firestore le niega la
   * cocina — sin que nada en la app parezca roto. Esto es lo que cierra
   * ese hueco, y en producción es el caso normal: un gerente da de alta
   * a alguien a media jornada.
   */
  refrescarClaims: () => Promise<void>;
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
    staff: false,
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
            staff?: boolean;
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
            staff: claims.staff === true,
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
      // La verificación vive en el SERVIDOR, no aquí.
      //
      // Antes esto consultaba un adaptador en memoria y solo escribía
      // `scope` en el estado de la app. Las reglas de Firestore no leen
      // el estado de la app: leen los claims del token. Resultado —
      // encontrar tu estancia no daba permiso de nada, y todo pedido
      // moría con "Missing or insufficient permissions".
      //
      // Ahora `buscarEstancia` verifica contra la lista de huéspedes,
      // que el cliente nunca ve, y escribe los claims. El conteo de
      // intentos de aquí abajo se conserva por la experiencia —avisar
      // rápido sin ir al servidor— pero el freno que cuenta es el del
      // servidor: éste se reinicia al reinstalar la app.
      const { bloqueadoHasta, intentosEstancia } = get();
      if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
        throw new Error("bloqueado");
      }

      const fallo = () => {
        const intentos = intentosEstancia + 1;
        set({
          intentosEstancia: intentos,
          bloqueadoHasta:
            intentos >= MAX_INTENTOS ? Date.now() + BLOQUEO_MS : null,
        });
        if (intentos >= MAX_INTENTOS) throw new Error("bloqueado");
        return false;
      };

      let estancia: Estancia;
      try {
        const call = httpsCallable<
          { habitacion: string; apellido: string },
          { estancia: Estancia }
        >(functions(), "buscarEstancia");
        const { data } = await call({ habitacion, apellido });
        estancia = data.estancia;
      } catch (e) {
        const code = (e as { code?: string }).code ?? "";
        // El servidor ya frenó: se respeta sin discutir.
        if (code === "functions/resource-exhausted") {
          set({ bloqueadoHasta: Date.now() + BLOQUEO_MS });
          throw new Error("bloqueado");
        }
        if (code === "functions/not-found") return fallo();
        throw e;
      }

      // Los claims se escribieron en el servidor: sin refrescar el token
      // la app los tendría, pero Firestore seguiría viendo el token
      // viejo y rechazando cada escritura.
      const user = auth().currentUser;
      if (!user) throw new Error("sin-sesion");
      const tk = await user.getIdTokenResult(true);
      const claims = tk.claims as {
        scope?: string[];
        sexp?: number;
        roomId?: string;
      };
      // Sin este rastro, "la app cree que encontró tu estancia" y "el
      // servidor te dio permiso" se ven idénticos en pantalla.
      rastro("claims tras findStay ->", {
        // El uid va aquí para no tener que adivinar cuál de los 27
        // usuarios anónimos es este teléfono al dar el rol de personal.
        uid: user.uid,
        staff: (tk.claims as { staff?: boolean }).staff === true,
        roomId: claims.roomId ?? null,
        scope: claims.scope ?? null,
        venceEn: claims.sexp
          ? `${Math.round((claims.sexp - Date.now()) / 60000)} min`
          : null,
      });

      set({
        status: user.providerData.length > 0 ? "member" : "guest",
        roomId: estancia.roomId,
        estancia,
        scope: claims.scope ?? SCOPE_INVITADO,
        exp: typeof claims.sexp === "number" ? claims.sexp : null,
        intentosEstancia: 0,
        bloqueadoHasta: null,
      });
      return true;
    },

    signInWithApple: async () => {
      // Pide a Apple una identidad nueva y devuelve una FÁBRICA de
      // credenciales de Firebase, no una credencial.
      //
      // El nonce es obligatorio con el SDK de JavaScript y son dos
      // piezas: a Apple se le manda hasheado (SHA-256, hex minúsculas)
      // y va dentro del identityToken; a Firebase se le manda en crudo
      // y él lo hashea y compara. Sin eso, `auth/missing-or-invalid-
      // nonce` siempre.
      //
      // Y la credencial NO se reutiliza: cada llamada al SDK recibe un
      // objeto recién construido. Reutilizar el mismo `OAuthCredential`
      // en dos llamadas —enlazar y luego entrar— devolvía
      // `auth/missing-or-invalid-nonce` en la segunda, con la primera
      // perfectamente válida.
      const pedirApple = async () => {
        const rawNonce = Crypto.randomUUID();
        const hashedNonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          rawNonce,
        );
        const apple = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });
        const idToken = apple.identityToken;
        if (!idToken) throw new Error("apple-sin-token");
        return {
          apple,
          credencial: () =>
            new OAuthProvider("apple.com").credential({ idToken, rawNonce }),
        };
      };

      let sesion = await pedirApple();
      rastro("apple sub ->", sesion.apple.user.slice(0, 12) + "...");
      const user = auth().currentUser;
      const esAnonimo = user !== null && user.providerData.length === 0;

      // ¿Esa identidad de Apple ya tiene cuenta? Preguntarlo ANTES es lo
      // que evita que la hoja de Apple salga dos veces: el token se gasta
      // en el primer uso contra Firebase, así que hay que acertar el
      // camino a la primera. Si la consulta falla —sin red, function
      // caída— se responde null y abajo se toma el camino de siempre:
      // intentar enlazar y, si hace falta, reintentar con identidad
      // nueva. Feo, pero nunca deja al huésped sin poder entrar.
      const yaTieneCuenta = async (): Promise<boolean | null> => {
        try {
          const fn = httpsCallable<{ appleUserId: string }, { existe: boolean }>(
            functions(),
            "identidadAppleExiste",
          );
          const { data } = await fn({ appleUserId: sesion.apple.user });
          rastro("identidadAppleExiste ->", data.existe);
          return data.existe;
        } catch (e) {
          // Si esta consulta falla, la hoja de Apple saldra dos veces.
          // Sin rastro, eso es indistinguible de "la consulta dijo que
          // no existia": dos causas muy distintas, mismo sintoma.
          rastro("identidadAppleExiste FALLO ->", codigoDeError(e));
          return null;
        }
      };

      if (user && esAnonimo) {
        // Camino corto: ya sabemos que existe, así que ni se intenta
        // enlazar. Una sola hoja de Apple.
        if ((await yaTieneCuenta()) === true) {
          await signInWithCredential(auth(), sesion.credencial());
          const yaDentro = auth().currentUser;
          set({
            status: "member",
            uid: yaDentro?.uid ?? null,
            displayName:
              yaDentro?.displayName ?? sesion.apple.fullName?.givenName ?? null,
          });
          return;
        }
      }

      if (user && esAnonimo) {
        // LA pieza: enlazar sobre el anónimo conserva el UID y con él
        // el folio y el consumo del día. Nada que migrar.
        try {
          await linkWithCredential(user, sesion.credencial());
        } catch (e) {
          const code = (e as { code?: string }).code ?? "";
          // Estos códigos significan lo mismo: esa identidad YA tiene
          // cuenta y no hay nada que enlazar. Cuál llega depende de un
          // ajuste de consola —Authentication → Settings → User account
          // linking—, por eso se contemplan todos.
          if (!YA_TIENE_CUENTA.has(code)) throw e;

          // Se entra a la cuenta existente. Ojo: el UID cambia, así que
          // el consumo anónimo de hoy NO se enlaza. Quien llame debe
          // releer el uid después (ver circulo.tsx).
          try {
            await signInWithCredential(auth(), sesion.credencial());
          } catch (e2) {
            const code2 = (e2 as { code?: string }).code ?? "";
            if (!NONCE_INVALIDO.has(code2)) throw e2;
            // Segundo nivel: el identityToken de Apple ya se gastó
            // contra Firebase en el intento de enlace. Se pide uno
            // nuevo. La hoja de Apple sale otra vez, pero ya autorizada:
            // es un toque. Este es el camino del huésped QUE VUELVE —
            // el más común en producción después del primer mes.
            rastro("segunda hoja de Apple: el token se gasto", code2);
            sesion = await pedirApple();
            await signInWithCredential(auth(), sesion.credencial());
          }
        }
      } else {
        await signInWithCredential(auth(), sesion.credencial());
      }

      const current = auth().currentUser;
      set({
        status: "member",
        uid: current?.uid ?? null,
        displayName:
          current?.displayName ?? sesion.apple.fullName?.givenName ?? null,
      });
    },

    refrescarClaims: async () => {
      const user = auth().currentUser;
      if (!user) return;
      // `true` fuerza ir al servidor: sin eso el SDK devuelve el token
      // que ya tenía en memoria, que es justo el que no trae el claim
      // nuevo.
      const tk = await user.getIdTokenResult(true);
      const claims = tk.claims as {
        spotId?: string;
        roomId?: string;
        scope?: string[];
        sexp?: number;
        staff?: boolean;
      };
      const vigente =
        typeof claims.sexp === "number" && claims.sexp > Date.now();
      rastro("claims refrescados ->", {
        uid: user.uid,
        staff: claims.staff === true,
        vigente,
      });
      set({
        spotId: vigente ? (claims.spotId ?? null) : null,
        roomId: claims.roomId ?? get().roomId,
        scope: vigente ? (claims.scope ?? []) : [],
        exp: vigente ? (claims.sexp ?? null) : null,
        staff: claims.staff === true,
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
        staff: false,
      });
      // onAuthStateChanged reintenta el anónimo y deja status "none"
    },
  }),
);
