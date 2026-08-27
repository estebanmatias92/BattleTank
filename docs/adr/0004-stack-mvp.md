# ADR 0004 — Stack MVP mínimo (Phaser 4 + Colyseus + Hono + Drizzle + SQLite)

**Estado:** aceptado. 2026-08-27.
**Decide sobre:** `docs/prd-inputs/SUGERENCIA01.md` (Phaser 3 + Colyseus + Express + Prisma + MariaDB) vs alternativas evaluadas en research 2026-08-27.
**Contexto:** `CONTEXT.md` + `docs/PRD.md` §6/§8 + `docs/adr/0001-0003` + `docs/updates/grilling-notes.md` D1-D23.

## Contexto

El MVP (`docs/PRD.md:14-22` §2.1) exige: Identidad `user+pass` sin mail (`docs/PRD.md:17` D3), Lobby 4-10 con votación 2→1 y cierre 60s sin Partida si <4 (`docs/PRD.md:42-47`, `docs/adr/0003`), Partida FFA sobre único Mapa-terreno (`docs/adr/0002`) sin ganador con 2 cierres (`docs/adr/0001`), Puntaje 100×Eliminado única métrica asentada al salir (`docs/PRD.md:67-72` D18-D19) y Tabla Top100 + propia por suma acumulada instantánea (`docs/PRD.md:76-78` D21/D23). NFR `docs/PRD.md:90-91` exige persistencia duradera y autoridad servidor, pero deja elección de “dónde/cómo” a Fase 3. El prototipo `js/battleTank.js` (Canvas + `AudioManager`, power-ups, niveles infinitos `README.md:29-33`) es throwaway — no se rescata.

## Decisión

Fijamos el **stack mínimo verificable para MVP**, reversible y JS/TS end-to-end:

1. **Cliente — Phaser 4** (MIT, `phaser@4.2.1`). Framework completo, renderer WebGPU/WebGL reescrito (“Caladan” abr-2026), headless mode para test server-side, Arcade+Matter, tilemaps Tiled, input/audio/tweens integrados. Reemplaza Phaser 3 de SUGERENCIA01 con misma API. Descartado PixiJS v8 (solo renderer — obligaría a montar física/audio/scenes a mano para un FFA 10).

2. **Realtime — Colyseus 0.16+** (Node.js/TypeScript, MIT). `Room` = Lobby/Partida 1:1, `Schema` deltas binarios, `setSimulationInterval` tick autoritativo, matchmaking por filtro, reconexión con seat reservation. Cubre `docs/PRD.md:91` autoridad sin construir rooms/sync desde cero. Complemento: `colyseus.js` en cliente Phaser. Descartados: Nakama (Go, Apache2, todo-en-uno auth/leaderboards — overkill y cambio de runtime), `ws` crudo (sin rooms), geckos.io/WebRTC-UDP (latencia menor pero NAT/port-forward complejidad innecesaria para 10 jugadores TCP), Lance.gg (49 descargas/sem, sin mantenimiento).

3. **Persistencia — Hono 4 + Drizzle ORM + SQLite** (MVP). Hono Web-Standards portable (Node/Bun/Workers) con `@hono/zod-validator` y RPC typed `hc`; Drizzle 7.4KB 0 deps con `drizzle-kit` y soporte libSQL/Turso/D1/Neon; SQLite archivo único para `Usuario {id, username, passwordHash}` + `Puntaje {usuarioId, valor, partidaId, at}` y vista Tabla `SUM(valor) GROUP BY usuarioId`. Migrable a PostgreSQL/Neon sin rewrite (Drizzle mismo dialect). Descartados para MVP: Fastify+Prisma+PostgreSQL (válido Fase 3 pero engine Rust 30MB + PG server overhead), Express+Prisma+MariaDB (SUGERENCIA01 — familiar pero Node-locked y pesado).

## Consecuencias

- Fase 1 (`docs/PRD.md:110`): `PlayScene` Phaser 4 con colisión AABB, sin netcode.
- Fase 2 (`docs/PRD.md:111`): Colyseus `LobbyRoom` (cola/votación) → `PartidaRoom` (FFA). Tick fijo, validación server-side, broadcast deltas.
- Fase 3 (`docs/PRD.md:112`): Hono `POST /auth/register` + `POST /partida/cierre` (server-to-server Colyseus→Hono con secret) + `GET /tabla?top=100&usuarioId` ( Top100 + propia ). `SQLite` suficiente para criterios `docs/PRD.md:97-104` 1/6/7.
- Testing seams: Lobby lifecycle, Votación desempate, Partida cierres, Puntaje idempotente al salir, Tabla atomic update — testeables con Phaser headless + Colyseus `Room` test + `hono/app.request()`.

## Alternativas consideradas

| Opción | Por qué no MVP |
|---|---|
| PixiJS v8 | Renderer veloz pero sin framework — coste de montar física/scenes supera ventaja bundle. |
| Nakama | Ideal para social/leaderboards nativos, pero Go runtime fragmenta stack JS y excede alcance FFA. |
| Fastify/Express + Prisma + MariaDB/Postgres | Sólido, pero mayor footprint; reservado como evolución Fase 3 si SQLite limita. |

## Referencias

- PRD: `docs/PRD.md:90-93`, `docs/PRD.md:107-114`
- Grilling: D1 `docs/updates/grilling-notes.md:13`, D2 `docs/updates/grilling-notes.md:14`
- ADRs: `docs/adr/0001`, `0002`, `0003`
- Research 2026-08-27: Phaser 4 vs PixiJS, Colyseus vs Nakama, Hono vs Fastify vs Express, Drizzle vs Prisma (MIT/Apache2, open-source, Bun/Node/Workers portability).
