# Prueba end-to-end — Mía Tulum beta

Todo lo de abajo corre contra el backend REAL: Firestore, functions
desplegadas y Stripe en modo test. Nada está simulado salvo el precio,
que sigue siendo placeholder.

**Con un solo aparato se puede.** El teléfono hace de huésped y, para
la sección 3, se abre `mia://kitchen` en el mismo teléfono. Lo único
que se pierde es el paso 3.5 —comprobar que un huésped *sin* rol de
personal no ve la cocina— y ese ya está cubierto por los 25 casos de
`pnpm test:rules`, que corren contra el emulador. Con dos aparatos,
usa el segundo como cocina y haz 3.5.

---

## Fase 0 · Preparar las identidades (5 min, antes de tocar la app)

Esto no es burocracia: **sin esto la sección 4 no prueba nada.**

`linkWithCredential` sólo conserva el UID si la credencial de Apple **no
pertenece ya a un usuario de Firebase**. Si ya existe, el código entra a
propósito por `signInWithCredential` (`packages/lib/session.ts`), que
entra al UID viejo y deja atrás el consumo anónimo del día. Verías "el
invariante falla" cuando en realidad nunca se ejecutó el camino que
querías probar.

Por eso la cuenta de Apple tiene que llegar **virgen** a la sección 4.

| # | Paso | Dónde |
|---|---|---|
| 0.1 | Instalar la build nueva y abrir la app | Aparato |
| 0.2 | Entrar con Apple. **Si entra, el bug del nonce está resuelto.** | Aparato |
| 0.3 | Tu día → Eliminar mi cuenta | Aparato |
| 0.4 | `zsh ~/Documents/MiaApp/staff-mia.command` — la cuenta de correo **ya no aparece** | Terminal |
| 0.5 | Reabrir la app: entra como anónimo nuevo. Correr de nuevo el comando y copiar **ese uid nuevo** | Terminal |
| 0.6 | `zsh ~/Documents/MiaApp/staff-mia.command PEGA_EL_UID_NUEVO` | Terminal |
| 0.7 | En la app: Tu día → Cerrar sesión → volver a entrar sin cuenta | Aparato |
| 0.8 | Opcional, para un primer uso de verdad: Ajustes de iOS → tu Apple ID → Inicio de sesión y seguridad → Apps que usan Apple ID → Mía Tulum → dejar de usar | Aparato |

0.3 y 0.4 son, de paso, la prueba de `eliminarCuenta`: el usuario
desaparece de Firebase Auth de verdad.

0.6 le da el rol de personal al **mismo usuario anónimo** que hará de
huésped. Suena raro y es a propósito: con un solo aparato, el huésped
también es la cocina. Al crear cuenta en la sección 4 ese usuario
conserva el rol, que es justo lo que permite seguir avanzando pedidos.

0.7 es necesario porque el rol viaja **dentro del token**: sin cerrar
sesión, el token de ese anónimo todavía no lo trae.

**Criterio para seguir:** `staff-mia.command` sin argumento debe listar
un uid anónimo marcado `[PERSONAL]` y **ninguna cuenta con correo**.

---

## 1 · El invitado sin cuenta

| # | Paso | Qué debe pasar |
|---|---|---|
| 1.1 | Abrir la app por primera vez | Entra sin pedir nada. Ya tienes UID anónimo. |
| 1.2 | "I'm staying at Mía" → habitación `204`, apellido `Lopez` | Home muestra "Day N of 4" con datos del seed |
| 1.3 | Mirar abajo | **La barra de sesión** aparece con tu suite |
| 1.4 | Beach → mapa → elegir camastro → Hold | "Your spot is held", 45 min |
| 1.5 | Mirar la barra | Ahora dice camastro y, en los últimos 15 min, cuánto queda |

## 2 · Pedir de verdad

| # | Paso | Qué debe pasar |
|---|---|---|
| 2.1 | Menu & order → elegir platillos | Total se acumula |
| 2.2 | Mirar el selector de destino | Ofrece **camastro y suite**; el actual preseleccionado |
| 2.3 | Elegir la suite (aunque estés en el camastro) | Se permite: decisión de producto |
| 2.4 | Confirmar el pedido | Confirmación con el destino elegido |
| 2.5 | Tu día → Tus pedidos | Aparece con estado y **"pedido hace N min"** |
| 2.6 | **Cerrar la app por completo y reabrirla** | **El pedido SIGUE AHÍ.** Esto es lo que antes se perdía. |

## 3 · La cocina

| # | Paso | Qué debe pasar |
|---|---|---|
| 3.1 | Abrir `mia://kitchen` (mismo teléfono, o el segundo si tienes dos) | Se ve el pedido del huésped |
| 3.2 | Avanzar el pedido tres veces | received → preparing → on-way → delivered |
| 3.3 | En el teléfono del huésped, Tu día | El estado cambia **en vivo**, sin recargar |
| 3.4 | Al marcar entregado | **El cargo aparece en el folio** — lo escribe el servidor en la misma transacción |
| 3.5 | **Solo con dos aparatos.** En el del huésped, sin rol de personal, abrir `mia://kitchen` | Debe salir vacío o negado. Con un solo aparato se omite: ya lo cubren los 25 casos de `pnpm test:rules`. |

## 4 · Crear cuenta sin perder el día — EL INVARIANTE

Va **antes** de pagar, a propósito: enlazar con el folio abierto y las
Olas sin acreditar es la versión fuerte de la prueba. Si primero
liquidas, ya no queda día que perder.

| # | Paso | Qué debe pasar |
|---|---|---|
| 4.1 | Anota el saldo del folio y las Olas que ves ahora | Es tu punto de comparación |
| 4.2 | Con ese consumo hecho, ir a Círculo | La tarjeta dice tus Olas reales, no un número pintado |
| 4.3 | "Create my account" → Sign in with Apple | Flujo nativo de Apple |
| 4.4 | Al volver | **El folio sigue con el mismo saldo** y las Olas se acreditan al mismo UID |
| 4.5 | Tu día | Tu historial de pedidos **sigue completo** |
| 4.6 | En terminal: `zsh ~/Documents/MiaApp/staff-mia.command` | El uid que era anónimo **ahora trae el correo**: mismo uid, no uno nuevo |

> 4.4, 4.5 y 4.6 juntos demuestran que crear cuenta **no** destruye el
> día del huésped. Es el invariante del que colgó todo el diseño desde el
> primer día. 4.6 es la prueba dura: el UID no cambió.

## 5 · Borrar cuenta con folio abierto

| # | Paso | Qué debe pasar |
|---|---|---|
| 5.1 | Tu día → Eliminar mi cuenta, con el folio abierto y con saldo | Se niega: "liquídala antes" |

## 6 · Pagar con Stripe real

| # | Paso | Qué debe pasar |
|---|---|---|
| 6.1 | Tu día → Settle now | Se abre **la página de Stripe** en el navegador |
| 6.2 | Tarjeta `4242 4242 4242 4242`, fecha futura, cualquier CVC | Stripe acepta |
| 6.3 | Volver a la app | El folio queda liquidado y las Olas se acreditan |
| 6.4 | Revisar tu dashboard de Stripe | **El cobro aparece ahí.** Esta es la prueba real. |
| 6.5 | Repetir el pago con doble toque rápido | **Un solo cargo.** La idempotencia funciona. |

## 7 · Cerrar sesión y borrar cuenta

| # | Paso | Qué debe pasar |
|---|---|---|
| 7.1 | Tu día → Cerrar sesión, siendo invitado anónimo | Advierte que **pierdes el día para siempre** |
| 7.2 | Cancelar | No pasa nada |
| 7.3 | Ya liquidado, "Eliminar mi cuenta" | Borra y cierra sesión |
| 7.4 | `zsh ~/Documents/MiaApp/staff-mia.command` | El usuario ya no existe |

## 8 · El QR y las notificaciones

| # | Paso | Qué debe pasar |
|---|---|---|
| 8.1 | Escanear un QR de camastro con la cámara | Liga la sesión al lugar (requiere sticker firmado) |
| 8.2 | Un QR viejo o alterado | Lo rechaza — `validarQR` valida HMAC con rotación diaria |
| 8.3 | Hold a punto de vencer | Notificación local 10 min antes |

---

## Qué anotar de cada falla

- Qué esperabas y qué viste
- En qué aparato y con qué usuario (huésped o cocina)
- Hora aproximada, para poder cruzarla con los logs de functions
