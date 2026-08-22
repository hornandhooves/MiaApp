/**
 * Un límite de tiempo para las operaciones de red.
 *
 * Por qué: el transporte de Firestore en React Native puede **colgarse
 * sin rechazar nunca la promesa**. El resultado no es un error, es un
 * botón que se queda en "cargando" para siempre y una pantalla que
 * parece vacía. Es la peor forma de fallar: el sistema se ve sano.
 *
 * Con esto, una operación que no responde se convierte en un error
 * visible, con su código, que la pantalla puede mostrar. Preferimos
 * decir "no pudimos" a los 12 segundos que dejar al huésped mirando un
 * botón muerto.
 */
export const SIN_RESPUESTA = "firestore-sin-respuesta";

export function conLimite<T>(
  promesa: Promise<T>,
  ms = 12_000,
  que = "",
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      const e = new Error(que ? `${SIN_RESPUESTA}:${que}` : SIN_RESPUESTA);
      (e as Error & { code?: string }).code = SIN_RESPUESTA;
      reject(e);
    }, ms);
    promesa.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

/**
 * Tiempo real por sondeo, porque el canal de escucha no funciona.
 *
 * Lo que la evidencia del 22-ago-2026 mostró, en el teléfono y contra
 * el proyecto real:
 *
 *   · Peticiones sueltas (`getDocs`) → **funcionan**.
 *   · Canal de escritura (`addDoc`) → se cuelga sin fallar. Por eso el
 *     pedido lo crea ahora una function.
 *   · Canal de escucha (`onSnapshot`) → entrega la primera respuesta
 *     desde la caché local —vacía— y la del servidor no llega nunca.
 *     De ahí "no hay pedidos" teniendo pedidos, la cuenta en blanco y
 *     las Olas en cero: no era que faltaran datos, es que la respuesta
 *     del servidor no llegaba.
 *
 * Este ayudante repite una lectura suelta cada pocos segundos y llama
 * al mismo callback. Se pierde el empuje instantáneo del servidor; a
 * cambio, la pantalla se actualiza de verdad. Un segundo de retraso es
 * mejor que un dato que nunca llega.
 *
 * Devuelve la función para cancelar, igual que `onSnapshot`, así que
 * los adaptadores no cambian de forma.
 */
export function sondear<T>(
  leer: () => Promise<T>,
  cb: (valor: T) => void,
  opciones: {
    cadaMs?: number;
    onError?: (e: unknown) => void;
    etiqueta?: string;
  } = {},
): () => void {
  const { cadaMs = 6_000, onError, etiqueta = "sondeo" } = opciones;
  let vivo = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const tick = async (): Promise<void> => {
    if (!vivo) return;
    try {
      const valor = await conLimite(leer(), 12_000, etiqueta);
      if (!vivo) return;
      cb(valor);
    } catch (e) {
      if (!vivo) return;
      onError?.(e);
    }
    if (vivo) timer = setTimeout(() => void tick(), cadaMs);
  };
  void tick();

  return () => {
    vivo = false;
    if (timer) clearTimeout(timer);
  };
}
