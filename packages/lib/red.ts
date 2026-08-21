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
