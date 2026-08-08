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
El estado de espera previo a una partida: usuarios en cola, votación de mapa y espera hasta completar la capacidad o vencer el tiempo máximo de espera. La partida arranca al completarse el mínimo de asistentes (4) o transcurrido el tiempo de espera. Si ese tiempo se agota con menos de 4 asistentes, el Lobby se cierra sin partida. Admite hasta 10.
_Avoid_: sala, room, waiting room

**Votación**:
El mecanismo por el cual el Lobby elige el mapa de la partida. Presenta 2 mapas candidatos; cada usuario vota por uno, y en caso de empate el sistema decide. Los votantes no pueden elegir un mapa distinto de los candidatos.
_Avoid_: elección, sorteo, ballot

**Mapa**:
Un terreno de combate (Tundra, Ciudad, Desierto, Montaña, etc.), cada uno identificado por el propio terreno. No existen niveles progresivos dentro de un terreno. Es el objeto único de la votación del Lobby y el escenario de una Partida.
_Avoid_: nivel, level, arena, stage

**Partida**:
Un evento de juego sobre un único Mapa. Comienza al iniciarse desde el Lobby (capacidad 4–10 o vencido el tiempo de espera) y termina por una condición de cierre: queda un solo jugador vivo o se agota el tiempo. No declara un ganador; cada jugador computa su puntaje al salir.
_Avoid_: match, round, nivel

**Enemigo**:
Cualquier otro jugador vivo dentro de la misma partida. No existen enemigos controlados por la máquina.
_Avoid_: bot, AI enemy, rival

**Puntaje**:
Los puntos acumulados por un jugador durante la partida. Provenientes únicamente de enemigos eliminados, a X puntos por cada uno. Se computa y asienta en el registro del Usuario en el momento en que el jugador sale de la partida, sea por eliminación, desconexión, último vivo o fin del tiempo. Es la única métrica que se asienta en el MVP. No usa multiplicadores.
_Avoid_: score, kills, puntos

**Eliminación**:
El momento en que un jugador muere dentro de una partida. Su puntaje se computa, sale del mapa y no vuelve hasta que la partida termina.
_Avoid_: muerte, kill, death, respawn

**Tabla de posiciones**:
Ranking de Usuarios por la suma acumulada de sus Puntajes, actualizado en el instante en que cada jugador computa su puntaje al salir de la partida.
_Avoid_: leaderboard, ranking, top
