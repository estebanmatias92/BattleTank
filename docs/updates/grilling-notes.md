# Grilling Session — Estado de Pausa

Sesión de grilling + domain-modeling sobre el PRD de BattleTank. Pausada para retomarse en una sesión futura.

## Cómo retomar

1. Leer este archivo.
2. Leer `../CONTEXT.md` (glosario del consenso), `../adr/0001-partidas-sin-ganador.md`, `../adr/0002-mapa-es-terreno.md` y `../adr/0003-lobby-cierra-sin-minimo.md`.
3. Continuar grilleando las preguntas abiertas de abajo, una por vez.

## Consenso alcanzado (D1–D10)

- **D1 — Dirección:** refactor web cliente-servidor (Phaser 3 + Colyseus + API REST). Descartado el sistema de plugins C++ (`COMPONENT-ARCHITECTURE.md` fue eliminado). Requisito principal: multijugador web jugable.
- **D2 — Objetivo:** definir un PRD (no implementación). Se desestiman por ahora los detalles de implementación. Enfoque: MVP multijugador jugable, multiplataforma web, incluyendo Fase 3 (persistencia) y el resto de la visión.
- **D3 — Identidad:** registro sencillo usuario + password (sin email). El Usuario es el dueño persistente de las estadísticas.
- **D4 — Partida:** evento sobre un único mapa. Comienza al completarse el lobby con mapa votado.
- **D5 — Enemigo:** exclusivamente otro jugador. No hay enemigos IA.
- **D6 — (superada) Victoria:** la dinámica de ganador/derrota se descartó por completo (ver ADR 0001).
- **D7 — Cierre:** condiciones de cierre de la partida son **2**: queda un solo jugador vivo o se agota el tiempo. El umbral de puntaje fue descartado.
- **D8 — (superada) Puntaje congelado:** superada por "puntaje computado al salir".
- **D9 — Desconexión:** computa el puntaje igualmente, como si hubiera salido por eliminación.
- **D10 — Multiplicador:** descartado por ahora. El puntaje es la suma plana de enemigos eliminados.

## Consenso nuevo (D11 y siguientes)

- **D11 — (Q4) Mapa = terreno:** los "niveles" del briefing mueren. Cada Mapa ES un terreno (Tundra, Ciudad, Desierto, Montaña, etc.); no existe progresión de niveles dentro de un terreno.
- **D12 — (Q2) Votación:** 2 mapas candidatos por votación; cada usuario vota 1; ante empate el sistema decide (desempate automático).
- **D13 — (Q1) Capacidad del Lobby:** mínimo 4, máximo 10, con un tiempo máximo de espera.
- **D14 — (Q1) Inicio de partida:** la partida arranca al alcanzar el mínimo (4) o solo al vencer la espera; no necesita el máximo (10).
- **D15 — (Q1b) Alcance del MVP:** núcleo = Lobby (cola/votación/espera), Partida FFA con 2 cierres, Puntaje + persistencia, Tabla de posiciones. Visión futura = boosters, terrenos adicionales, stats extendidas, Android/apps.
- **D16 — (Q23) Si no hay 4 a la hora:** el **Lobby se cierra sin partida** si la espera se agota con menos de 4.
- **D17 — (espera) Tiempo de espera del Lobby:** **1 minuto**.
- **D18 — (Q21) Valor del Puntaje:** **X = 100 pts por enemigo eliminado**, ajustable por balance (dato de diseño, no término de dominio).
- **D19 — (Q4b) Única salida del Lobby: solo Puntaje.** No se asientan en el MVP: tiempo de juego, tiempo vivo, cantidad de disparos.
- **D20 — (Q24) Boosters fuera del MVP:** quedan explícitamente como visión futura; documentados fuera de alcance, sin presencia en el modelo actual.
- **D21 — (Q25) Tabla de posiciones:** primeras **100 posiciones** completas + la **posición propia** del usuario aunque esté fuera del top.
- **D22 — (Q26) Reincorporación:** al salir (eliminación, último vivo, fin de tiempo), el jugador **vuelve automáticamente a la cola de un Lobby nuevo** — flujo continuo Lobby → Partida → Lobby. Un Usuario puede quitarse de la cola sin penalización.
- **D23 — (Tabla de posiciones) Ranking:** la Tabla de posiciones usa la **suma acumulada de los Puntajes** de cada Usuario (cada salida suma al acumulado). Descartado: tomar solo el último puntaje.

## Estado: sesión completa

## Modelo de dominio resultante (ver ../CONTEXT.md)

Flujo: **Usuario** registrado → **Lobby** (cola + votación de **2 mapas candidatos**, espera 1 min, mín 4 / máx 10, se cierra sin partida si <4) → **Partida** FFA sin ganador (un solo Mapa-terreno) → cada jugador **sale** (eliminación, desconexión, último vivo o fin de tiempo) → su **Puntaje** (100 pts/enemigo, única métrica) se computa y asienta → **Tabla de posiciones** (top 100 + posición propia; **suma acumulada**) se actualiza al instante → el jugador **vuelve a la cola**.

## Preguntas abiertas por grillar

- Ninguna: frontera vacía.
