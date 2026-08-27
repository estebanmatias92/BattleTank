# Spec: Lobby y Votación

## Problem Statement

El Usuario registrado quiere encontrar una Partida FFA rápidamente sin quedar bloqueado esperando. Hoy no existe Lobby: no hay cola, ni votación de Mapa, ni regla de arranque/cierre. El resultado es que un Usuario no puede pasar de “quiero jugar” a “estoy en una Partida sobre el Mapa votado” de forma predecible y justa, ni volver a intentarlo si no hay quorum.

## Solution

Un Lobby como estado de espera que admite de 4 a 10 Usuarios en cola, presenta 2 Mapas candidatos para Votación, permite entrar/salir sin penalización, arranca la Partida al alcanzar 4 o al vencer 1 minuto (no espera a 10), y si a los 60s hay <4 se cierra sin Partida y los Usuarios vuelven a la cola. Cada Usuario vota 1 de los 2; en empate el sistema desempata. El Mapa ganador es el de la Partida. Al salir de una Partida (cualquier motivo) el Jugador vuelve automáticamente a una nueva cola. Todo orquestado por `LobbyRoom` Colyseus (ADR 0004) y renderizado en Phaser 4.

## User Stories

1. Como Usuario en la cola de un Lobby, quiero ver cuántos Usuarios hay en mi Lobby (ej. “3/10”) y cuánto tiempo de espera queda, para decidir si me quedo.
2. Como Usuario, quiero poder entrar a la cola de un Lobby y salir de ella sin penalización mientras no haya arrancado la Partida, para no quedar atrapado.
3. Como Usuario dentro de un Lobby abierto, quiero que se me presenten exactamente 2 Mapas candidatos para la Votación, para elegir uno.
4. Como Usuario, quiero votar por 1 de los 2 Mapas candidatos y poder cambiar mi voto hasta que cierre la Votación, para corregir un error.
5. Como Usuario, quiero que si hay empate en la Votación el sistema desempaté automáticamente y se comunique el Mapa elegido, para no bloquear el arranque.
6. Como Usuario, quiero que el Lobby arranque la Partida en cuanto haya 4 Usuarios (sin esperar a 10) sobre el Mapa votado, para jugar rápido.
7. Como Usuario, quiero que si el tiempo máximo de espera (60s) vence con menos de 4, el Lobby se cierre sin Partida y yo vuelva automáticamente a la cola general, para reintentar sin acción manual.
8. Como Usuario que acaba de salir de una Partida (por Eliminación, desconexión, último vivo o fin de tiempo), quiero volver automáticamente a la cola de un Lobby nuevo, para flujo continuo Lobby→Partida→Lobby.
9. Como Jugador en Partida, quiero ver durante el Lobby la cuenta regresiva de arranque una vez definido el Mapa, para prepararme.

## Implementation Decisions

- **LobbyRoom (Colyseus, ADR 0004):** Room autoritativa que mantiene `lobbyState { usuarios: UsuarioId[], votos: Map<UsuarioId, MapaId>, candidatos: [Mapa, Mapa], estado: 'esperando'|'votando'|'cerrado'|'arrancando', deadlineAt }`. Transiciona por ticks fijos; no por cliente.
- **Capacidad y temporizador:** invariantes 4–10 y deadline 60s codificados como constantes de dominio (ajustables solo vía ADR). El chequeo de arranque es `si usuarios>=4 => arrancar` en cada tick, y `si now>=deadlineAt => si <4 cerrarSinPartida else arrancar`.
- **Votación 2→1 con desempate:** candidatos elegidos server-side (aleatorio entre terrenos, ex. Tundra/Ciudad para MVP); voto es `setVote(usuarioId, mapaId)` validado (solo candidatos). Conteo al cierre; empate => `pickRandom(candidatos)` server-side, auditado en log.
- **Enter/leave sin penalización:** `onJoin`/`onLeave` actualizan `usuarios` y retiran voto si existía; sin registro negativo en Usuario.
- **Re-queue automático:** al cerrar Lobby sin Partida o al recibir `partida:fin` el cliente recibe `lobby:requeue` y hace `joinOrCreate("lobby")` sin input manual. Si el cliente no reconecta, no se reserva plaza.
- **Interacción Partida:** Lobby al arrancar crea `PartidaRoom` con `mapaId` elegido y pasa `usuarioIds`; no hay “nivel” (`docs/adr/0002` — Mapa es terreno).

## Testing Decisions

Qué es buen test: solo comportamiento observable por Usuario a través del Lobby (estado, votos, transiciones), no detalles de serialización Colyseus. Cada escenario titula 1 regla de `docs/PRD.md:42-47` / `docs/agents/bdd.md:35`.

Seams (pre-acordados, el menor número posible — ideal 1):
- **Seam 1 — LobbyRoom state machine (server):** test de integración contra Room en memoria (sin WebSocket real) — transiciones `esperando→votando→arrancando/cerrado`, conteo votos, empate, deadline. Prior art: no existe; se crea como primer seam del repo, reutilizable por `partida-ffa`.
- **Seam 2 — Cliente Phaser 4 `LobbyScene` (observer):** test de UI que el HUD refleja `usuarios.length` y `candidatos` del Schema (sin testear interpolación).

Casos densos en reglas (títulos para futuros Escenarios BDD ES):
- El Lobby arranca al alcanzar 4 sin esperar a 10
- El Lobby se cierra sin Partida si vence 60s con <4 y reencola
- Entrar/salir sin penalización retira voto
- Votación 2 candidatos, 1 voto por Usuario, desempate sistema
- Re-queue automático al salir de Partida

No se testea aquí: netcode fino, audio, push de assets.

## Out of Scope

Fuera de MVP (`docs/PRD.md:24-29`): boosters/power-ups, terrenos adicionales (Desierto, Montaña y demás), stats extendidas (tiempo vivo, disparos), app Android/táctil, progresión de niveles (ver `docs/adr/0002`), friends/party, chat de texto/voz, minimapa, kill feed, spectator, replay. Fuera de este slice: lógica de Partida FFA, cómputo de Puntaje y Tabla de posiciones (ver specs `partida-ffa` y `puntaje-tabla`).

## Further Notes

- El valor 60s viene de `docs/updates/grilling-notes.md:33` D17; cambiarlo requiere ADR.
- Legacy `js/battleTank.js` power-ups/niveles es throwaway (`docs/legacy/README.md`); no se migra.
- Esquema de candidatos MVP: Tundra/Ciudad; resto de terrenos visión futura `docs/PRD.md:27`.
