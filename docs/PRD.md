# BattleTank — PRD (MVP)

> **Estado:** borrador. Fuentes: `CONTEXT.md` (glosario del dominio), sesión de grilling (`docs/updates/grilling-notes.md`) y decisiones registradas en `docs/adr/`.
> **Idioma del dominio:** este documento usa el vocabulario del glosario (Usuario, Jugador, Lobby, Votación, Mapa, Partida, Enemigo, Puntaje, Eliminación, Tabla de posiciones). Consultar `CONTEXT.md` ante duda.

## 1. Objetivo

BattleTank es un multijugador web de tanques arcade (top-down shooter). Es la evolución de un prototipo single-player hacia un juego PvP en línea con persistencia de estadísticas.

El MVP debe entregar una experiencia **multijugador web jugable**: el usuario se registra, busca partida desde un Lobby, juega libre para todos (FFA), obtiene un puntaje por enemigos eliminados y lo ve reflejado en una tabla de posiciones persistente.

## 2. Alcance del MVP

### 2.1 Incluye (MVP)

1. **Identidad**: registro de un Usuario con nombre de usuario y contraseña (sin correo). El Usuario es dueño persistente de sus puntajes.
2. **Lobby**: cola de espera con votación de mapa y límite de tiempo. Ver reglas en §4.
3. **Votación**: elección del Mapa entre 2 candidatos; empate resuelto por el sistema.
4. **Partida**: evento FFA sobre un único Mapa, sin declarar ganador.
5. **Puntaje**: única métrica asentada al salir (enemigos eliminados × 100). Persistido en el registro del Usuario.
6. **Tabla de posiciones**: Top 100 + posición del propio Usuario, actualizada al instante.

### 2.2 Fuera de alcance del MVP (visión futura)

- Boosters / power-ups en el terreno.
- Terrenos adicionales (Desierto, Montaña y demás).
- Estadísticas por jugador extendidas (tiempo vivo, disparos, tiempo de juego).
- App Android / táctil.
- Progresión de niveles (modelo descartado — ver ADR 0002).

## 3. Usuarios y roles

- **Usuario**: persona con identidad registrada. Dueño persistente de los puntajes.
- **Jugador**: la participación del Usuario en una Partida concreta (entidad efímera del campo de batalla).

No existen roles administrativos en el MVP.

## 4. Reglas del dominio (funcional)

### 4.1 Lobby

- Cada Lobby admite **de 4 a 10 usuarios**.
- Un Usuario puede entrar y salir de la cola sin penalización.
- La Partida arranca al alcanzar el **mínimo (4)** o al vencer el **tiempo de espera (1 minuto)**, lo que ocurra primero. No espera a llenar los 10.
- Si el tiempo expira con **menos de 4** asistentes, el **Lobby se cierra sin Partida** y los usuarios regresan a la cola (ADR 0003).
- El Lobby inicia la **Votación**: presenta 2 Mapas candidatos.
- Cada usuario vota por 1 de los 2. Ante empate, el sistema desempata. El Mapa con más votos es el de la Partida.

### 4.2 Partida

- Es un evento de juego sobre **un único Mapa** (ADR 0002: el Mapa ES un terreno; no hay niveles).
- **Free For All**: cada jugador combate contra los demás jugadores vivos.
- **Sin ganador**: ningún jugador es declarado victorioso (ADR 0001). Cada jugador computa su resultado por sí mismo al salir.
- Cierre (2 condiciones):
  - Queda **un solo jugador vivo** → la Partida termina.
  - **Se agota el tiempo** de la Partida.
- Al terminar la Partida, todos los que siguen en el campo cierran su participación y computan su puntaje.

### 4.3 Eliminación, desconexión y salida

- **Eliminación**: cuando un Jugador es eliminado, su puntaje se computa, abandona el Mapa y no regresa hasta que la Partida termina.
- **Desconexión**: equivale a una eliminación para el cómputo del puntaje; el puntaje se asienta igual.
- **Último vivo / fin de tiempo**: computan para todos los que aún estaban en el campo.
- Ante cualquier salida, el Jugador **vuelve automáticamente a la cola** de un Lobby nuevo.

### 4.4 Puntaje

- Fuente única: **enemigos eliminados** (otros jugadores vivos dentro de la misma Partida).
- Valor: **100 puntos por cada Enemigo eliminado** (constante de diseño ajustable).
- **Sin multiplicadores** ni bonificadores.
- Se computa y asienta en el registro del Usuario **en el momento en que el Jugador sale de la Partida**.
- Es la **única métrica** que se asienta en el MVP.

### 4.5 Tabla de posiciones

- Ranking global de Usuarios por la **suma acumulada de sus puntajes** (cada Puntaje al salir se suma al acumulado del Usuario).
- Se actualiza **en el instante** en que un Jugador computa el puntaje al salir.
- MVP: muestra **las 100 primeras posiciones** y **la posición del propio Usuario** (aunque esté fuera del Top 100).

## 5. Flujo principal del usuario

```
Registro/Login → Lobby (cola + Votar 2→1) → [mín. 4 o 60s] → Partida FFA
  → salida (eliminación / desconexión / último vivo / fin de tiempo)
  → Puntaje computado y asentado → Tabla de posiciones actualizada → vuelve a la cola
```

## 6. Requisitos no funcionales (para el MVP)

- **Persistencia**: el puntaje de cada Participación debe quedar registrado de forma duradera en el registro del Usuario (la elección de dónde y cómo se define en la Fase 3).
- **Multijugador en línea**: el estado de la Partida es autoritativo en el servidor; el cliente solo renderiza y envía las intenciones del usuario (decisión D1). Se documenta el requisito funcional, no la implementación.
- **Multiplataforma**: web, sin requerir instalación.
- **Tiempos percibidos**: la votación y el arranque de la Partida no deben exceder el tiempo acordado (espera máxima de 1 minuto).

## 7. Criterios de aceptación del MVP

1. Un Usuario puede registrarse e iniciar sesión con usuario + contraseña.
2. Entrar a la cola y participar en la votación de Mapa (2 candidatos).
3. Iniciar la Partida al alcanzar 4 jugadores, o cerrar el Lobby a los 60s si hay menos de 4.
4. Jugar una Partida FFA sobre el Mapa votado, contra otros jugadores vivos.
5. Cada eliminación suma 100 puntos al puntaje del jugador responsable.
6. Al salir (cualquier motivo), el Puntaje queda persistido y la Tabla de posiciones se actualiza al instante.
7. La Tabla muestra Top 100 y la posición propia del Usuario.
8. Al salir, el Jugador vuelve automáticamente a una nueva cola.

## 8. Fases de ejecución (definición del alcance por etapa)

> Resumen de la estructura del plan propuesto en la fuente (SUGERENCIA 01), expresado aquí sin tecnología:

- **Fase 1 — base del juego y contenido**: el tanque se desplaza en el Mapa, colisiona con los obstáculos; el prototipo single-player se convierte en la base del juego en línea. *(Sin redes aún.)*
- **Fase 2 — multijugador**: sincronización de red, una Partida con varios Jugadores, autoridad del servidor sobre posiciones y disparos. Primer objetivo: "dos clientes locales puedan enfrentarse en una misma Partida".
- **Fase 3 — persistencia**: registro/login, cómputo del Puntaje al salir, guardado de resultados y Tabla de posiciones.

> El MVP comprende el final de la Fase 3 con el núcleo de la sección 2.1; boosters y el resto de la sección 2.2 quedan para etapas posteriores.

## 9. Fuentes y decisiones

- [Glosario del dominio](../CONTEXT.md)
- [Notas de grilling y decisiones D1–D22](./updates/grilling-notes.md)
- [ADR 0001 — Partidas sin ganador](./adr/0001-partidas-sin-ganador.md)
- [ADR 0002 — El Mapa es un terreno](./adr/0002-mapa-es-terreno.md)
- [ADR 0003 — El Lobby cierra sin mínimo](./adr/0003-lobby-cierra-sin-minimo.md)