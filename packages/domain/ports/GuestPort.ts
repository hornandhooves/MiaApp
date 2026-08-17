import type { Estancia } from "../types";

/**
 * Contrato de búsqueda de estancia.
 * La verificación ocurre en el servidor: la app nunca recibe la lista
 * de huéspedes, solo el resultado de su propia consulta.
 */
export interface GuestPort {
  buscarPorHabitacionYApellido(
    habitacion: string,
    apellido: string,
  ): Promise<Estancia | null>;
}
