# Arquitectura

Documento en construcción. Se irá completando durante el desarrollo.

## Decisiones tomadas

- Monorepo: `backend/` y `frontend/` en el mismo repositorio.
- El backend es la fuente de verdad: precios, disponibilidad, roles,
  estados de pedido y puntos se calculan y validan siempre en servidor.
- Dinero en céntimos (enteros), moneda EUR.
- Puntos como libro de movimientos (ledger); el saldo se calcula con SUM.
- Interfaz en español; código, tablas y API en inglés.