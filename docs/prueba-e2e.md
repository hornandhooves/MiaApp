# Prueba end-to-end — Mía Tulum beta

Todo lo de abajo corre contra el backend REAL: Firestore, functions
desplegadas y Stripe en modo test. Nada está simulado salvo el precio,
que sigue siendo placeholder.

**Necesitas dos aparatos** (o uno y el simulador): el del huésped y el de
la cocina.

---

## Antes de empezar

1. Instala la build en el teléfono.
2. Dale rol de personal al usuario que hará de cocina:
   ```
   node scripts/staff.mjs usuarios        # copia el uid
   node scripts/staff.mjs dar <uid>
   ```
   Esa persona debe **cerrar sesión y volver a entrar** — el rol viaja
   dentro del token.

---

## 1 · El invitado sin cuenta (el invariante central)

| # | Paso | Qué debe pasar |
|---|---|---|
| 1.1 | Abrir la app por primera vez | Entra sin pedir nada. Ya tienes UID anónimo. |
| 1.2 | "I'm staying at Mía" → habitación `204`, apellido `Lopez` | Home muestra "Day N of 4" con datos del seed |
| 1.3 | Mirar abajo | **La barra de sesión** aparece con tu suite |
| 1.4 | Beach → mapa → elegir camastro → Hold | "Your spot is held", 45 min |
| 1.5 | Mirar la barra | Ahora dice camastro y, en los últimos 15 min, cuánto queda |

## 2 · Pedir y cobrar de verdad

| # | Paso | Qué debe pasar |
|---|---|---|
| 2.1 | Menu & order → elegir platillos | Total se acumula |
| 2.2 | Mirar el selector de destino | Ofrece **camastro y suite**; el actual preseleccionado |
| 2.3 | Elegir la suite (aunque estés en el camastro) | Se permite: decisión de producto |
| 2.4 | Confirmar el pedido | Confirmación con el destino elegido |
| 2.5 | Tu día → Tus pedidos | Aparece con estado y **"pedido hace N min"** |
| 2.6 | **Cerrar la app por completo y reabrirla** | **El pedido SIGUE AHÍ.** Esto es lo que antes se perdía. |

## 3 · La cocina (segundo aparato)

| # | Paso | Qué debe pasar |
|---|---|---|
| 3.1 | Abrir `mia://kitchen` | Se ve el pedido del huésped |
| 3.2 | Avanzar el pedido tres veces | received → preparing → on-way → delivered |
| 3.3 | En el teléfono del huésped, Tu día | El estado cambia **en vivo**, sin recargar |
| 3.4 | Al marcar entregado | **El cargo aparece en el folio** — lo escribe el servidor en la misma transacción |
| 3.5 | Sin rol de personal, intentar lo mismo | Debe fallar. Es la prueba de que las reglas sirven. |

## 4 · Pagar con Stripe real

| # | Paso | Qué debe pasar |
|---|---|---|
| 4.1 | Tu día → Settle now | Se abre **la página de Stripe** en el navegador |
| 4.2 | Tarjeta `4242 4242 4242 4242`, fecha futura, cualquier CVC | Stripe acepta |
| 4.3 | Volver a la app | El folio queda liquidado y las Olas se acreditan |
| 4.4 | Revisar tu dashboard de Stripe | **El cobro aparece ahí.** Esta es la prueba real. |
| 4.5 | Repetir el pago con doble toque rápido | **Un solo cargo.** La idempotencia funciona. |

## 5 · Crear cuenta sin perder el día — EL INVARIANTE

| # | Paso | Qué debe pasar |
|---|---|---|
| 5.1 | Con consumo del día ya hecho, ir a Círculo | La tarjeta dice tus Olas reales, no un número pintado |
| 5.2 | "Create my account" → Sign in with Apple | Flujo nativo de Apple |
| 5.3 | Al volver | **Las Olas se acreditan y el folio sigue siendo el tuyo** |
| 5.4 | Tu día | Tu historial de pedidos **sigue completo** |

> Si 5.3 y 5.4 se cumplen, queda demostrado que crear cuenta **no**
> destruye el día del huésped. Es el invariante del que colgó todo el
> diseño desde el primer día.

## 6 · Cerrar sesión y borrar cuenta

| # | Paso | Qué debe pasar |
|---|---|---|
| 6.1 | Tu día → Cerrar sesión, siendo invitado anónimo | Advierte que **pierdes el día para siempre** |
| 6.2 | Cancelar | No pasa nada |
| 6.3 | Siendo miembro, "Eliminar mi cuenta" con folio abierto | Se niega: "liquídala antes" |
| 6.4 | Liquidar y volver a intentar | Borra y cierra sesión |
| 6.5 | Consola de Firebase → Auth | El usuario ya no existe |

## 7 · El QR y las notificaciones

| # | Paso | Qué debe pasar |
|---|---|---|
| 7.1 | Escanear un QR de camastro con la cámara | Liga la sesión al lugar (requiere sticker firmado) |
| 7.2 | Un QR viejo o alterado | Lo rechaza — `validarQR` valida HMAC con rotación diaria |
| 7.3 | Hold a punto de vencer | Notificación local 10 min antes |

---

## Qué anotar de cada falla

- Qué esperabas y qué viste
- En qué aparato y con qué usuario (huésped o cocina)
- Hora aproximada, para poder cruzarla con los logs de functions
