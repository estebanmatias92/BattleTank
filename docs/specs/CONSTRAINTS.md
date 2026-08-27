# Constraints para el próximo `/to-specs` (BattleTank MVP)

> Este archivo existe para que `/to-specs` —que hace `Explore the repo` (`to-spec:14`)— no repita el error `docs/specs/_archive/multiplayer-networking-2026-08-27.md:1-392` (50 stories, respawn/reconnect/power-ups, 145 tests commerce). Si lo editas, `/to-specs` lo leerá.

## Fuentes de verdad (leer antes de escribir cualquier spec)

1. `CONTEXT.md` — vocab exacto: Usuario, Jugador, Lobby, Votación, Mapa, Partida, Enemigo, Puntaje, Eliminación, Tabla de posiciones + listas *Avoid*.
2. `docs/PRD.md` §2.1/§2.2 (§2.2 boosters/terrenos extra/stats/Android/progresión = fuera), §4.1-4.5 reglas, §7 criterios 1-8, §6 NFRs tech-deferred, §8 fases.
3. `docs/adr/0001` sin ganador, `0002` Mapa=terreno, `0003` Lobby cierra sin Partida si <4 a 60s, `0004` stack mínimo (Phaser 4 + Colyseus + Hono + Drizzle + SQLite).
4. `docs/updates/grilling-notes.md` D1-D23 (frontera vacía).
5. `docs/agents/bdd.md` — Escenarios ES solo para comportamiento denso-en-reglas, 1 por criterio, keywords Dado/Cuando/Entonces.
6. `docs/agents/domain.md` — si contradices un ADR, citalo explícitamente.

## Legacy throwaway

`js/battleTank.js`, `css/`, `index.html`, `README.md` ingeniería inversa (power-ups vida/velocidad/triple, `nextLevel()` infinito) son **referencia, no requisito**. No los copies a stories. Archivados en `docs/legacy/` si existen; si no, ignóralos.

## Cómo invocar `/to-specs` (recomendado 3 slices, no 1 mega-spec)

`/to-specs` con `to-spec:41` “extremely extensive” tiende a sobre-generar. Ejecuta 3 veces, una por slice, con prompt estrecho:

### 1) `lobby-votacion`
Prompt: “Spec para Lobby y Votación (`docs/PRD.md:42-47`, `docs/adr/0003`, `grilling D12-D14/D17`): capacidad 4-10, arranca a 4, cierra sin Partida si <4 a 60s, entrar/salir sin penalización, Votación 2→1 desempate sistema. Vocab CONTEXT, Out of Scope `docs/PRD.md:24-29`.”

### 2) `partida-ffa`
Prompt: “Spec para Partida FFA (`docs/PRD.md:54-57`, `docs/adr/0001`, `0002`): único Mapa-terreno, sin ganador, cierres único-vivo∨fin-tiempo, Eliminación terminal sin respawn (`CONTEXT.md:39`), desconexión=Eliminación (`docs/PRD.md:62` D9). Stack `docs/adr/0004` (Phaser 4 + Colyseus).”

### 3) `puntaje-tabla`
Prompt: “Spec para Puntaje y Tabla (`docs/PRD.md:67-78`, `grilling D18/D19/D21/D23`): 100 pts×Enemigo única métrica sin multiplicadores, asentado al salir (4 vías), Tabla suma acumulada Top100+propia instantánea, re-queue automático a Lobby (`docs/PRD.md:64` D22). Persistencia `docs/adr/0004` Hono+Drizzle+SQLite (migrable a PG).”

Si prefieres 1 spec MVP único, el prompt debe listar los 8 criterios `docs/PRD.md:97-104` como checklist y prohibir explícitamente power-ups/respawn/reconnect/minimap/chat/killcam.

## Guardrails para cada spec

- **Vocab:** kill→Eliminación, score→Puntaje, respawn→prohibido, rooms→Lobby/Partida, health→no término de dominio.
- **Implementation Decisions:** 6-8 bullets máx, sin números mágicos (no fijar 20Hz, no SQLite vs MariaDB fuera de ADR-0004). Menciona ADR-0004, no lo re-decidas.
- **Testing Decisions = seams** (`tdd:19`, `to-spec:16`): acordar con humano antes. 6-8 seams: Lobby lifecycle, Votación desempate, Partida cierres, Puntaje idempotente al salir, Tabla atomic update, re-queue. No commerce/leap-year/tax/VR (`_archive` tenía 145).
- **Out of Scope:** copiar `docs/PRD.md:24-29` verbatim + power-ups/respawn/reconnect/spectator/chat/minimap/killcam/replay/daily-leaderboards/friends/voice.
- **No file paths ni snippets** (`to-spec:55`), salvo state machine de Lobby/Partida si aporta decisión.

## Verificación antes de `/to-tickets`

- [ ] Cada criterio `docs/PRD.md:97-104` tiene ≥1 story o story explícitamente fuera
- [ ] Cada story usa términos `CONTEXT.md`, ningún *Avoid*
- [ ] Ninguna story contradice `docs/adr/0001-0004`
- [ ] `Out of Scope` menciona `docs/PRD.md:24-29`
- [ ] Testing Decisions lista seams BDD, no plumbing genérico

Archivado: `docs/specs/_archive/multiplayer-networking-2026-08-27.md` — no usar como plantilla.
