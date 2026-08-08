# BattleTank

Multijugador web de tanques arcade (top-down shooter). Evolución de un prototipo single-player hacia un juego PvP en línea con persistencia de estadísticas.

## Language

**Usuario**:
Una persona con identidad registrada en el sistema (usuario + password). Es el dueño persistente de las estadísticas.
_Avoid_: Player, account, jugador

**Jugador**:
La participación de un Usuario en una partida concreta. Una entidad efímera del campo de batalla.
_Avoid_: tank, usuario

**Lobby**:
El estado de espera previo a una partida: usuarios en cola, elección de mapa por votación y llenado hasta la capacidad de la sala.
_Avoid_: sala, room, waiting room

**Partida**:
Un evento de juego sobre un único mapa. Comienza al llenarse el lobby con mapa votado y termina por una condición de cierre: queda un solo jugador vivo o se agota el tiempo. No declara un ganador; cada jugador computa su puntaje al salir.
_Avoid_: match, round, nivel

**Enemigo**:
Cualquier otro jugador vivo dentro de la misma partida. No existen enemigos controlados por la máquina.
_Avoid_: bot, AI enemy, rival

**Puntaje**:
Los puntos acumulados por un jugador durante la partida según enemigos eliminados. Se computa y asienta en el registro del Usuario en el momento en que el jugador sale de la partida, sea por eliminación, desconexión, último vivo o fin del tiempo. No usa multiplicadores.
_Avoid_: score, kills, puntos

**Eliminación**:
El momento en que un jugador muere dentro de una partida. Su puntaje se computa, sale del mapa y no vuelve hasta que la partida termina.
_Avoid_: muerte, kill, death, respawn

**Tabla de posiciones**:
Ranking de Usuarios por sus puntajes, actualizado en el instante en que cada jugador computa su puntaje al salir de la partida.
_Avoid_: leaderboard, ranking, top
