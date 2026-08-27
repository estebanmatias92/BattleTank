# Spec: Puntaje y Tabla de posiciones

## Problem Statement

El Usuario juega Partidas FFA pero hoy no conserva progreso: no hay Puntaje asentado al salir ni Tabla que refleje la suma acumulada al instante, con Top 100 y posición propia. Sin eso no hay persistencia (`docs/PRD.md:90`) ni motivo competitivo entre Partidas.

## Solution

Cada salida de Partida —Eliminación, desconexión (equivale a Eliminación), último vivo o fin de tiempo— computa exactamente `enemigosEliminados × 100` (`docs/updates/grilling-notes.md:33` D18, `docs/PRD.md:69` X=100 ajustable), sin multiplicadores ni bonificadores, y lo asienta duraderamente en el registro del Usuario (`docs/PRD.md:71`). Es la única métrica MVP (`grilling D19`). La Tabla de posiciones es el ranking global por suma acumulada de Puntajes, actualizada al instante de cada cómputo, que muestra las 100 primeras posiciones y la posición propia aunque esté fuera del Top 100 (`docs/PRD.md:78` D21). Al salir, el Jugador vuelve automáticamente a la cola de un Lobby nuevo (D22). Stack ADR 0004: Hono + Drizzle + SQLite (migrable a PG).

## User Stories

1. Como Jugador, quiero que al ser eliminado mi Puntaje se compute en ese instante como `enemigosEliminados × 100` y quede asentado en mi Usuario, para no perderlo.
2. Como Jugador que se desconecta, quiero que mi Puntaje se compute igual que si hubiera sido eliminado, para que desconexión no sea exploit ni castigo.
3. Como Jugador último vivo o que estaba en campo al agotarse el tiempo, quiero computar mi Puntaje al cierre sin que se declare ganador (ADR 0001).
4. Como Usuario, quiero que mi Puntaje no incluya multiplicadores ni bonus y que sea la única métrica del MVP, para simplicidad (D10/D19).
5. Como Usuario, quiero ver la Tabla de posiciones con el Top 100 ordenado por suma acumulada y mi posición propia (aunque esté 250º) actualizada al instante de cada cómputo.
6. Como Usuario, quiero que cada Puntaje se sume a mi acumulado (no reemplace el anterior) — ranking por `SUM(valor) GROUP BY usuarioId` (D23).
7. Como Jugador al salir (cualquier motivo), quiero volver automáticamente a la cola de un Lobby nuevo, sin clic extra (D22).
8. Como Usuario, quiero registrarme e iniciar sesión con nombre + contraseña (sin mail) —dueño persistente de mis Puntajes (D3)— y ver mi Tabla al instante tras cada Partida.

## Implementation Decisions

- **API Hono (ADR 0004):** `POST /auth/register {username,password}` + `POST /auth/login -> JWT` (D3, sin mail); `POST /partida/:id/cierre` interno server-to-server (Colyseus `PartidaRoom` → Hono con `X-Internal-Secret`, no acepta Puntaje del cliente); `GET /tabla?usuarioId&top=100` => `{top:[{usuario, acumulado}], yo:{pos, acumulado}}`.
- **Esquema Drizzle + SQLite:** `usuario(id PK, username UNIQUE, passwordHash)`, `puntaje(id PK, usuarioId FK, partidaId, enemigosEliminados INT, valor INT GENERATED AS enemigosEliminados*100, at DATETIME)`, índice `(usuarioId, at)`. `valor` deriva de `enemigosEliminados` — fuente única `Enemigo` = otro Jugador vivo en la misma Partida (`CONTEXT.md:31`).
- **Cómputo y asentamiento:** `PartidaRoom` cuenta `enemigosEliminados` por Jugador (incrementa en cada `eliminacion` donde `shooterId==jugadorId`); al evento de salida (`eliminacion|desconexion|ultimo-vivo|tiempo`) emite `puntaje:computado` y hace `INSERT puntaje` transaccional; idempotente por `(partidaId, usuarioId)` — reintento no duplica.
- **Tabla instantánea:** `GET /tabla` calcula `SELECT usuarioId, SUM(valor) AS acumulado FROM puntaje GROUP BY usuarioId ORDER BY acumulado DESC`; Top100 + window de `yo` (si `pos>100`, `SELECT COUNT(*) WHERE acumulado > miAcumulado` para rank exacto sin scan completo). Cache invalidada por cada `INSERT` (no TTL).
- **Re-queue:** tras `INSERT` el server emite `lobby:requeue` al cliente; el cliente hace `joinOrCreate("lobby")`. Sin penalización (`docs/PRD.md:43`).
- **Sin multiplicadores/bonus:** rechazado explícitamente (`docs/PRD.md:70` D10); cambiar X=100 requiere ADR, no hotfix.

## Testing Decisions

Buen test: Puntaje asentado y Tabla visible, no hashing de passwords ni índices.

Seams (mínimos, alto nivel):
- **Seam 1 — Hono `app.request()` + SQLite en memoria (principal):** tests de API sin red — `POST /auth/register` + `POST /partida/:id/cierre` (con secret) `INSERT` + `GET /tabla` Top100+yo. Usa `better-sqlite3` en memoria; mismo Drizzle schema que prod.
- **Seam 2 — PartidaRoom → Hono (integración fina):** doble de `PartidaRoom` que postea a Hono test y verifica idempotencia `(partidaId,usuarioId)` y que desconexión insertion no duplica.

Títulos para Escenarios BDD ES (1 por criterio `docs/PRD.md:71-78`):
- Puntaje 100 por Enemigo eliminado, única métrica, sin multiplicadores
- Asentado al salir por Eliminación
- Asentado al salir por desconexión (igual que Eliminación)
- Asentado al salir por último vivo y por fin de tiempo (sin ganador)
- Tabla suma acumulada Top100 + posición propia instantánea
- Idempotencia: mismo `(partidaId,usuarioId)` no duplica
- Re-queue automático a Lobby tras cómputo

No se testea: latencia WebSocket, compression, leaderboard diario/semanal (`multiplayer-networking.md:45` era out-of-scope), friends/party.

## Out of Scope

Fuera de MVP (`docs/PRD.md:24-29` + `grilling D15/D19/D20`): boosters/power-ups, terrenos adicionales, stats extendidas (tiempo vivo, disparos, tiempo de juego), Android/táctil, progresión de niveles (`docs/adr/0002`), daily/weekly leaderboards, friends/party/voice, achievements/battle pass, virtual currency/trading. Legacy `js/battleTank.js:839` `score+=100` y `AudioManager` son throwaway.

## Further Notes

- Password hashing: `argon2`/`bcrypt` server-side; nunca plano (`docs/prd-inputs/BRAINSTORMING.md:34` idea 2, pero sin mail).
- X=100 es dato de balance (`grilling D18`); el tipo `Puntaje` del dominio (`CONTEXT.md:36`) no incluye X.
- Migración a Postgres/Neon: cambiar driver Drizzle, mismo `puntaje` table — sin tocar Partida/Lobby.
- Persistencia `docs/PRD.md:90` “dónde/cómo se define en Fase 3” queda cerrada aquí por ADR 0004.
