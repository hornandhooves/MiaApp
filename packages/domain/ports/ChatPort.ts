export interface ChatMessage {
  id: string;
  uid: string;
  /** true = escrito por el huésped; false = concierge */
  mine: boolean;
  texto: string;
  createdAt: string;
}

/**
 * Concierge — chat dentro de la app (Firestore en producción; el
 * puente a WhatsApp vía Twilio llega con la verificación de Meta).
 */
export interface ChatPort {
  suscribir(uid: string, cb: (msgs: ChatMessage[]) => void): () => void;
  enviar(uid: string, texto: string): Promise<void>;
}
