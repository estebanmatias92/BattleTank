# Spec: Partida FFA

## Problem Statement

Sin Partida FFA no hay juego multijugador: el Usuario puede hacer cola y votar, pero no combatir en tiempo real contra otros Jugadores vivos sobre un único Mapa hasta un cierre justo, ni salir con un resultado coherente. El prototipo legacy `js/battleTank.js` era single-player vs IA con niveles infinitos — no sirve.

## Solution

Una Partida es un evento sobre un único Mapa-terreno (ADR 0002), FFA, sin ganador declarado (ADR 0001). Corre autoritativa en el servidor (ADR 0004: Colyseus `PartidaRoom` + Phaser 4 `PlayScene` como renderer). Cierra solo por dos condiciones: queda un solo Jugador vivo o se agota el tiempo de Partida. Al salir —por Eliminación, desconexión (equivale a Eliminación), último vivo o fin de tiempo— el Jugador computa su Puntaje y abandona el Mapa sin respawn en esa Partida. El cliente envía intenciones (dirección, disparo); el servidor simula, valida y difunde deltas.

## User Stories

1. Como Jugador, quiero aparecer en el Mapa votado por el Lobby junto a 3-9 Enemigos (otros Jugadores vivos), para combatir FFA.
2. Como Jugador, quiero enviar movimiento (4 direcciones) y disparo y ver mi tanque y proyectiles reflejados con interpolación suave, sin teletransporte, para que el juego sea jugable.
3. Como Jugador, quiero que mi disparo elimine a un Enemigo cuando colisiona y que yo sea eliminado cuando me impactan, para que haya consecuencias.
4. Como Jugador eliminado, quiero computar mi Puntaje en ese instante, abandonar el Mapa y no reaparecer hasta que la Partida termine, para respetar `Eliminación` (`CONTEXT.md:39`).
5. Como Jugador que se desconecta, quiero que mi salida compute Puntaje igual que una Eliminación, para no perder ni duplicar progreso (D9).
6. Como Jugador último vivo, quiero que la Partida termine en ese momento y todos los que quedan computen su Puntaje, sin declarar ganador (ADR 0001).
7. Como Jugador, quiero que si se agota el tiempo de Partida, la Partida cierre y todos los que siguen en el campo computen su Puntaje.
8. Como Jugador, quiero colisionar con los muros/obstáculos del Mapa y no atravesarlos ni salir del canvas, para que el terreno importe.
9. Como Usuario, quiero volver automáticamente a la cola de un Lobby nuevo al salir de la Partida, para continuidad.

## Implementation Decisions

- **PartidaRoom (Colyseus, ADR 0004):** Room autoritativa con `partidaState { mapaId, jugadores: Map<UsuarioId, {x,y,dir,vivo}>, proyectiles[], estado: 'jugando'|'cerrada', terminaAt }`. Tick fijo server-side; el cliente no escribe posiciones. Creada por `LobbyRoom` con `mapaId` y `usuarioIds`.
- **Mapa = terreno (`docs/adr/0002`):** un único tilemap por Partida (MVP Tundra o Ciudad, cargado como JSON Tiled por Phaser 4). Sin niveles ni progresión dentro del terreno; muros son AABB del tilemap, no hardcodeados como `js/battleTank.js:740`.
- **Sin ganador (`docs/adr/0001`):** no hay ranking de victoria; la Partida solo emite `partida:cerrada {razon: 'ultimo-vivo'|'tiempo', t}` y deja que cada salida compute Puntaje (ver spec `puntaje-tabla`).
- **Cierres disjuntos:** cada tick evalúa `vivos==1 => cerrar('ultimo-vivo')` y `now>=terminaAt => cerrar('tiempo')`; `tiempo` no espera a `ultimo-vivo`.
- **Eliminación terminal:** `onHit(jugador) => vivo=false, emitir 'eliminacion', no respawn, el Jugador permanece como observador sin input hasta `cerrada` — luego re-queue (`docs/PRD.md:64` D22). Desconexión => mismo camino (`docs/PRD.md:62`).
- **Validación:** el servidor valida inputs (velocidad máxima `playerSpeed`, cadencia disparo) y resuelve colisiones AABB; el cliente interpola posiciones ajenas y predice propia con reconciliación — sin lógica de juego en cliente.

## Testing Decisions

Buen test: comportamiento FFA observable en `PartidaRoom` (quién vive, cuándo cierra, que no hay respawn), no serialización binaria.

Seams:
- **Seam 1 — PartidaRoom tick/colisiones (server, principal):** test en memoria de `step()` con inputs sintéticos — AABB bala→Jugador, bala→muro, muro→tanque, cierres `ultimo-vivo`/`tiempo`, y que `eliminado=>!vivo` y no vuelve a `vivo` en la misma Partida. Reusa harness de `LobbyRoom`; si existe proto de `PlayScene` headless, su simulación determinística sirve como doble.
- **Seam 2 — Phaser 4 `PlayScene` render (observer):** smoke de que el canvas refleja `jugadores` y `proyectiles` del Schema sin testear física.

Títulos para Escenarios BDD ES (rule-dense):
- Eliminación terminal sin respawn en la misma Partida
- Desconexión computa como Eliminación
- Cierre por último vivo computa para todos los restantes sin ganador
- Cierre por fin de tiempo computa para todos los restantes
- Proyectil vs muro destruye proyectil; tanque vs muro bloquea

No se testea: Puntaje numérico (es de `puntaje-tabla`), balance de daño, audio, push de assets.

## Out of Scope

Fuera de MVP (`docs/PRD.md:24-29`): boosters/power-ups (vida/velocidad/triple `js/battleTank.js:916-974` es legacy), terrenos extra, stats extendidas, Android/táctil, progresión de niveles, respawn, killcam/replay, minimapa, chat/voz, friends/party, spectator con cámara, trading/crafting. Fuera de este slice: Lobby/Votación (ver `lobby-votacion`) y persistencia de Puntaje/Tabla (ver `puntaje-tabla`).

## Further Notes

- Física: AABB Arcade de Phaser 4 en server headless; si el tick se desplaza a Colyseus puro, la misma AABB se reusa — decisión encapsulada en `PartidaRoom`.
- Tiempo de Partida: no fijado en PRD; se define como constante de dominio ajustable (no 20Hz mágico `_archive`).
- Legacy `nextLevel()` infinito `js/battleTank.js:998` y power-ups `README.md:29-33` no migran.
