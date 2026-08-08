# Grilling Session — Estado de Pausa

Sesión de grilling + domain-modeling sobre el PRD de BattleTank. Pausada para retomarse en una sesión futura.

## Cómo retomar

1. Leer este archivo.
2. Leer `../CONTEXT.md` (glosario del consenso) y `../adr/0001-partidas-sin-ganador.md`.
3. Continuar grilleando las preguntas abiertas de abajo, una por vez.

## Consenso alcanzado (D1–D10)

- **D1 — Dirección:** refactor web cliente-servidor (Phaser 3 + Colyseus + API REST). Descartado el sistema de plugins C++ (`COMPONENT-ARCHITECTURE.md` fue eliminado). Requisito principal: multijugador web jugable.
- **D2 — Objetivo:** definir un PRD (no implementación). Se desestiman por ahora herramientas y detalles de implementación. Enfoque: MVP multijugador jugable, multiplataforma web, incluyendo Fase 3 (persistencia) y el resto de la visión.
- **D3 — Identidad:** registro sencillo usuario + password (sin email). El Usuario es el dueño persistente de las estadísticas.
- **D4 — Partida:** evento sobre un único mapa. Comienza al completarse el lobby con mapa votado.
- **D5 — Enemigo:** exclusivamente otro jugador. No hay enemigos IA.
- **D6 — (superada) Victoria:** la dinámica de ganador/derrota se descartó por completo (ver ADR 0001).
- **D7 — Cierre:** condiciones de cierre de la partida son **2**: queda un solo jugador vivo o se agota el tiempo. El umbral de puntaje fue descartado.
- **D8 — (superada) Puntaje congelado:** superada por "puntaje computado al salir".
- **D9 — Desconexión:** computa el puntaje igualmente, como si hubiera salido por eliminación.
- **D10 — Multiplicador:** descartado por ahora. El puntaje es la suma plana de enemigos eliminados.

## Modelo de dominio resultante (ver ../CONTEXT.md)

Flujo: **Usuario** registrado → **Lobby** (cola + votación de mapa) → **Partida** FFA sin ganador → cada jugador **sale** (eliminación, desconexión, último vivo o fin de tiempo) → su **Puntaje** se computa y asienta → **Tabla de posiciones** se actualiza en ese instante.

## Preguntas abiertas por grillar

- Capacidad del lobby ([briefing](../prd-inputs/briefing.md) sugería 10 jugadores, sin confirmar).
- Mecánica de votación de mapa: cómo se elige entre candidatos, empates.
- Boosters / power-ups aleatorios en el campo (en [briefing](../prd-inputs/briefing.md), sin decidir si entran al MVP).
- Qué stats se asientan por jugador al salir ([briefing](../prd-inputs/briefing.md) sugería tiempo de juego, tiempo vivo, cantidad de disparos, enemigos destruidos).
- Alcance por fases: qué entra en el MVP (Fases 1–3 de [SUGERENCIA01](../prd-inputs/SUGERENCIA01.md)) y qué queda de visión futura.
- Terrenos / mapas: los "5 niveles por terreno" de [briefing](../prd-inputs/briefing.md), sin resolver cómo se organizan.
