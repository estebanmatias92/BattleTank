# Partidas sin ganador: puntaje computado al salir

Descartamos la dinámica de victoria/derrota en favor de partidas todos contra todos: cada jugador computa y asienta su puntaje en el momento en que sale de la partida (eliminación, último vivo o fin del tiempo), y la tabla de posiciones se actualiza en ese instante.

El motivo: una condición de victoria por mayor puntaje creaba un deadlock — el ganador no podía pasar a la siguiente partida ni esperar en el lobby hasta que la partida actual terminara, pero su estatus de ganador solo se definía al cierre. Al eliminar la noción de ganador, cada jugador es autónomo: su resultado se sella al salir, sin esperar el resultado de los demás.
