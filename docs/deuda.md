# La deuda del demo — lo que se finge y lo que costará después

Un demo honesto sabe qué está fingiendo. Esta lista se mantiene viva
conforme se construye; es el puente entre este demo y la versión de
producción (plan v1).

| Lo que el demo finge | Cómo lo finge | Lo que costará después |
| --- | --- | --- |
| Disponibilidad y tarifas | `MockInventoryAdapter` con reglas deterministas sobre el seed | Contratar el PMS, escribir `adapters/pms` con los mismos ports. 2–4 semanas con credenciales |
| El pedido llega a la cocina | Pantalla staff `/kitchen` en la misma app; estados avanzan solos cada 25 s | Integrar el POS del beach club, o tablet dedicada con esta pantalla como sistema real |
| Cobros | `MockPaymentAdapter` — SIEMPRE rotulado "modo de prueba"; `crearPago` real (Stripe test) está escrito en functions, sin desplegar | Desplegar functions + STRIPE_TEST_KEY → cambiar 1 línea en `di.ts` para PaymentSheet real. Producción: cuenta Stripe MX + CFDI |
| El QR del camastro | El parser y `validarQR` (HMAC + rotación diaria) son reales, pero las functions no están desplegadas y el secreto no existe | `firebase deploy` + crear QR_MASTER_SECRET + generar stickers con `firmarToken` |
| Habitación + apellido | Mock local con 1 estancia demo (204/López) | La function `buscarEstancia` contra el PMS; la app nunca recibe la lista |
| La cola offline de pedidos | Semántica real en el mock (encolar/sincronizar/no duplicar, con tests) | Persistencia offline de Firestore + claves de idempotencia (mismo contrato) |
| Holds y su liberación | Timer en memoria + notificación local 10 min antes | Cloud Task programada + push FCM desde `liberarHold` (ya escrita) |
| Concierge | Chat en memoria con respuesta automática | Firestore `conversations` + puente Twilio/WhatsApp (verificación de Meta: 1–3 semanas) |
| Olas / Círculo | Ledger append-only REAL en memoria (saldo derivado, con tests), rotulado como concepto | Decisión de dirección: pasivo contable, caducidad, quién autoriza canjes. `acreditarOlas` como único escritor |
| Llave digital | Tarjeta bloqueada con aviso honesto | Proyecto aparte: SDK del fabricante, módulo nativo, piloto en puertas |
| Los precios | TODOS en `PLACEHOLDER_PRICES.ts`, rotulados | Que alguien en Mía se haga dueño del archivo |
| Copy en español del contenido | Borradores del agente en el seed | Revisión de Carlos (el copy bilingüe es suyo) |
| Fechas de reserva | Fijas: llegada en 7 días, 4 noches, 2 adultos | Date picker + selector de huéspedes (v1.1) |
| Fotos | CDN del sitio de Mía (requieren red) | Assets empaquetados o CDN propio |
