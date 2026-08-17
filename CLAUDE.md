# Mía Tulum · app móvil

Resort y beach club en Tulum. La app sirve a tres personas: el
huésped durante su estancia, el visitante de day pass, y el
viajero que todavía decide.

El diseño está definido en docs/prototipo.dc.html — veinte
pantallas, bilingüe. Es la especificación, no una referencia.
No inventes pantallas ni componentes que no estén ahí.

## Prohibido

- Un color, tipo, radio o espaciado que no esté en
  packages/ui/tokens.ts
- Un número de precio fuera de PLACEHOLDER_PRICES.ts
- Texto literal en JSX. Todo pasa por t('clave'), con entrada
  en es.json Y en en.json
- Leer Firestore desde una pantalla. Solo a través de los ports
  de packages/domain
- Editar firestore.rules o PLACEHOLDER_PRICES.ts sin decírmelo
  explícitamente en tu respuesta
- any, @ts-ignore, y console.log en código que se commitea

## Siempre

- TypeScript estricto
- Una tarea = una pantalla que corre en el simulador y se puede
  probar. No entregues capas a medias
- Objetivos táctiles de 44 pt mínimo
- Estados de vacío, carga y error en toda lista
- El precio se congela en la línea del pedido al agregarlo,
  nunca se relee del catálogo al cobrar
- El saldo de Olas se deriva del ledger. Nunca escribas un
  contador de saldo
- Toda escritura que cueste dinero lleva clave de idempotencia

## Estructura

app/(guest)/     las veinte pantallas
app/(staff)/     cocina y mapa, detrás de bandera
packages/domain/ ports, adaptadores, precios, reglas puras
packages/ui/     tokens y primitivas
packages/i18n/   es.json · en.json
functions/       Cloud Functions gen2
seed/            contenido del demo

## Contexto del demo

No hay PMS ni punto de venta. Todo corre contra el adaptador
mock. Stripe en modo test. Sin WhatsApp, sin llave digital.
Mía Círculo va detrás de una bandera y rotulado como concepto.

## Cómo trabajar conmigo

Antes de escribir código en una pantalla nueva, dime en dos
líneas qué vas a hacer y espera. Si algo del prototipo no se
puede implementar como está diseñado, dilo en lugar de
aproximarlo.
