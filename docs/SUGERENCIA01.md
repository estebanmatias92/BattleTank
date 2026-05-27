# SUGERENCIA01 - Arquitectura Propuesta: BattleTank Refactor

**Objetivo:** Migrar el prototipo monolítico actual hacia una arquitectura Cliente-Servidor escalable que soporte multijugador en tiempo real, persistencia de datos y gestión dinámica de niveles.

---

## 1. Frontend (Cliente de Juego)
**Tecnología:** Phaser 3 (JavaScript/TypeScript)
* **Justificación Técnica:** El renderizado nativo con Canvas 2D es ineficiente para manejar múltiples entidades, proyectiles y mapas grandes en tiempo real. Phaser 3 utiliza WebGL por defecto, delegando el renderizado a la GPU.
* **Impacto en los Requerimientos:** * Soporte nativo para mapas basados en *tiles* (Tilemaps), lo que permite cargar niveles dinámicos desde archivos JSON generados con herramientas como *Tiled*.
  * Motor de físicas integrado (Arcade Physics) que simplifica el cálculo matemático de colisiones AABB.

## 2. Backend Multijugador (Servidor Autoritativo)
**Tecnología:** Node.js + Colyseus
* **Justificación Técnica:** Emplear HTTP tradicional es inviable para la latencia requerida en un juego PvP. Mapear WebSockets crudos (ej. Socket.io) requiere programar manualmente la sincronización de estado. Colyseus abstrae esta capa y está diseñado específicamente para juegos.
* **Impacto en los Requerimientos:**
  * Implementa un modelo de servidor autoritativo: el servidor calcula las posiciones y valida los disparos, enviando únicamente los deltas (cambios de estado) a los clientes. Esto previene trampas e inyección de datos.
  * Gestión nativa de "Rooms" (Salas de combate) para instanciar múltiples partidas en paralelo.

## 3. Backend de Persistencia y Estadísticas (API REST)
**Tecnología:** Node.js + Express.js + Prisma (ORM) + MariaDB
* **Justificación Técnica:** Los datos generados en las partidas (Kills, muertes, uso de items) son transaccionales y relacionales. MariaDB garantiza la integridad referencial y el rendimiento para consultas analíticas.
* **Impacto en los Requerimientos:**
  * **Express.js:** Expone endpoints seguros para registrar usuarios, iniciar sesión (emisión de JWT) y guardar el resumen de la partida.
  * **Prisma:** ORM que tipifica el acceso a la base de datos, previniendo inyecciones SQL y estandarizando las consultas.
  * **Flujo lógico:** Al finalizar la sala en Colyseus, el servidor se comunica con esta API de forma interna para asentar los resultados finales en la base de datos antes de desconectar a los jugadores.

---

## Plan de Ejecución (Enfoque Iterativo)
Para minimizar la deuda técnica y el riesgo de refactorización, el desarrollo debe dividirse en tres fases secuenciales:

1. **Fase 1 - Desacople del Cliente:** Reescribir `battleTank.js` en Phaser 3. Mantener el juego "single player" temporalmente para validar que el motor gráfico, la recarga dinámica de arenas y las colisiones base funcionen de forma óptima.
2. **Fase 2 - Sincronización de Red:** Levantar el servidor Node.js con Colyseus. Eliminar la lógica de IA y movimiento del cliente (Phaser) y delegar el cálculo físico al servidor. El objetivo es lograr que dos clientes locales puedan interactuar y colisionar en la misma sala.
3. **Fase 3 - Persistencia Transaccional:** Diseñar el esquema relacional en MariaDB. Desarrollar la API RESTful para el ABM de usuarios y vincular el cierre de sala de Colyseus con la actualización de métricas estadísticas.