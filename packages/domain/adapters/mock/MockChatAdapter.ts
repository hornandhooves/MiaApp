/**
 * Chat en memoria con respuesta automática del concierge (para que el
 * demo se sienta vivo). Las respuestas llegan como datos del
 * constructor — el adaptador no conoce i18n.
 */
import type { ChatMessage, ChatPort } from "../../ports/ChatPort";

export class MockChatAdapter implements ChatPort {
  private msgs: ChatMessage[] = [];
  private listeners = new Set<{
    uid: string;
    cb: (m: ChatMessage[]) => void;
  }>();
  private seq = 0;
  private replyIdx = 0;

  constructor(
    private readonly saludo: string,
    private readonly respuestas: string[],
  ) {}

  private forUid(uid: string): ChatMessage[] {
    return this.msgs.filter((m) => m.uid === uid).map((m) => ({ ...m }));
  }

  private notify(uid: string) {
    const msgs = this.forUid(uid);
    this.listeners.forEach((l) => {
      if (l.uid === uid) l.cb(msgs);
    });
  }

  private push(uid: string, mine: boolean, texto: string) {
    this.seq += 1;
    this.msgs.push({
      id: `msg-${this.seq}`,
      uid,
      mine,
      texto,
      createdAt: new Date().toISOString(),
    });
    this.notify(uid);
  }

  suscribir(uid: string, cb: (m: ChatMessage[]) => void): () => void {
    const entry = { uid, cb };
    this.listeners.add(entry);
    if (this.forUid(uid).length === 0) {
      this.push(uid, false, this.saludo);
    } else {
      cb(this.forUid(uid));
    }
    return () => this.listeners.delete(entry);
  }

  async enviar(uid: string, texto: string): Promise<void> {
    const limpio = texto.trim();
    if (!limpio) return;
    this.push(uid, true, limpio);
    const respuesta =
      this.respuestas[this.replyIdx % this.respuestas.length] ?? "";
    this.replyIdx += 1;
    setTimeout(() => this.push(uid, false, respuesta), 1600);
  }
}
