# Revisión final contra docs/prototipo.dc.html y CLAUDE.md

Fecha: 2026-08-17 · commit de la revisión: (ver git log)
Revisión mecánica corrida: hex fuera de tokens (0) · texto literal en
JSX (0, regla ESLint propia activa) · dinero fuera de
PLACEHOLDER_PRICES (0) · Firestore/seed directo en pantallas (0) ·
console.log (0) · any/@ts-ignore (0) · 242 claves i18n usadas, 0
faltantes en es/en · 49 tests en verde.

## 1. Errores claros (por gravedad)

1. **Nada ha corrido en simulador ni dispositivo.** No es un bug: es
   la deuda de verificación de todo el lote. Cualquier pantalla puede
   tener errores de layout, imágenes CDN lentas o safe-areas mal
   medidas que ningún test atrapa. La primera corrida en simulador ES
   la siguiente tarea.
2. **Los tests de reglas de Firestore (19 casos) nunca se han
   ejecutado** — el emulador no corre en el entorno del agente.
   `pnpm test:rules` en la Mac antes de cualquier deploy de reglas.
3. **Gradientes de héroe con rgba inline por pantalla.** CLAUDE.md
   dice "ningún color fuera de tokens"; los stops de gradiente de
   cada héroe replican los valores exactos del prototipo y quedaron
   inline (solo negros/tinta con alpha). Es deriva menor y contenida;
   si molesta, se extraen a `tokens.heroGradients` en una pasada.
4. **`beach.tsx` tiene un componente `DineCta` con prop `dark` sin
   uso desde la pestaña admisiones.** Cosmético.

## 2. Desviaciones del diseño tomadas A PROPÓSITO (con su razón)

1. **Fechas vivas, no las congeladas del prototipo** ("Sat 15 Aug",
   "2h 14m", reservas 15–19 Ago): todo se calcula con Intl en hora
   real de Tulum. Razón: un demo con fechas vencidas se ve muerto.
2. **El saldo de Círculo es el TUYO, derivado del ledger** — no el
   "12,480" de la Ana ficticia. El banner de Home para socia sí
   conserva el copy del prototipo (es un rótulo). Razón: un concepto
   rotulado no debe fingir números en la pantalla que los explica.
3. **Cobros con adaptador simulado SIEMPRE rotulado "Modo de prueba —
   sin cargo real"** en la confirmación. Razón: sin functions
   desplegadas no hay PaymentSheet; no se finge un cobro sin decirlo.
   `crearPago` (Stripe test, idempotente) ya está escrita.
4. **Google y correo avisan "solo Apple en el demo"**. Razón: el
   prototipo no diseña esos formularios y Google no está configurado
   en Firebase; no aproximar en silencio.
5. **"Tengo una reserva" (código) desactivado hasta que existan
   reservas reales** (llegó en s6 la infraestructura; el lookup por
   código no está en el GuestPort). Registrado, no olvidado.
6. **Llave digital bloqueada con aviso honesto** ("fuera del demo —
   requiere SDK del fabricante"), incluso para el huésped con
   habitación. El prototipo la muestra funcionando para Ana.
7. **Liquidar folio termina en Alert, no en pantalla nueva.** El
   prototipo no diseña la pantalla post-liquidación.
8. **Estados del pedido avanzan solos cada 25 s.** Para que el demo
   se sienta vivo sin staff operando la cocina.

## 3. Lo que el prototipo NO define y se decidió (lo más valioso)

1. **Formularios de acceso** (habitación+apellido) y de bodas:
   diseño mínimo propio con los tokens. El prototipo solo simula el
   tap.
2. **El selector de fechas/huéspedes del Resort no es editable**
   (tarjeta visible, valores demo: llegada +7 días, 4 noches, 2
   adultos). El prototipo no diseña picker alguno.
3. **Day pass fijo en 2 personas** (el prototipo confirma
   "Guests: 2" sin selector).
4. **Progreso de nivel en Círculo** = saldo / costo de noche gratis.
   El 78% del prototipo no tiene definición contable detrás.
5. **Pestaña Camastros del Beach Club** = tarjeta de entrada al mapa
   (el prototipo no la detalla; el mapa es su propia pantalla).
6. **El claim de vencimiento se llama `sexp`** — la ruta pedía `exp`,
   que es claim reservado del JWT e inimplementable tal cual.
7. **Respuestas automáticas del concierge** (3 textos cíclicos en
   i18n) para que el chat respire sin backend.
8. **Textos de error y estados vacíos**: 40+ claves nuevas es/en que
   el prototipo no traía.

## 4. Casos NO cubiertos (dilo antes de que lo descubra un tester)

- **Sesión de invitado sin scope**: la UI la maneja (pedido exige
  destino; banner ausente), pero las REGLAS que lo bloquean del lado
  del servidor no se han ejecutado contra el emulador.
- **Listas vacías**: todo lista tiene ListState, pero solo se ha
  visto el estado "con datos" (el mock nunca devuelve vacío salvo
  cocina sin pedidos).
- **Pérdida de red a media escritura**: la semántica está en el mock
  (cola offline probada en jest); el comportamiento REAL con
  Firestore y modo avión no existe aún — llega con el deploy.
- **Inglés más largo que español**: no verificado visualmente en
  ninguna pantalla (los botones píldora pueden desbordar).
- **Dynamic Type al 200% / lector de pantalla**: labels de
  accesibilidad y 44 pt están puestos en todo control, pero nada se
  ha probado con VoiceOver ni texto grande.
- **Deep link en frío** (`mia://spot/...` con la app cerrada).
- **Rotación / iPad**: la app es portrait/phone; no se probó nada más.
