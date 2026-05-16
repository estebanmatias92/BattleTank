# 🧠 BRAINSTORMING - Proyecto: BattleTank Refactor

**Objetivo de este documento:**
Centralizar propuestas de nuevas mecánicas, refactorización y escalabilidad del proyecto. 

**Reglas de colaboración:**
1. Toda idea nueva debe ir acompañada de un análisis de viabilidad técnica (Pros/Contras).
2. No borrar las ideas de otros; usar comentarios o viñetas anidadas para debatir.
3. Pensar siempre en la **escalabilidad** del sistema.

---

## 💡 Idea 1: Transición a Multijugador (Real-Time)
**Propuesta por:** David H. Bravo
**Descripción:** Convertir la experiencia de un solo jugador contra IA en combates PvP (Player vs Player) o cooperativos en tiempo real.

**Desarrollo Técnico & Críticas:**
* **Arquitectura necesaria:** Obliga a implementar un servidor (Backend) que gestione la sala. No se puede depender únicamente del navegador del cliente.
* **Protocolo de comunicación:** HTTP no sirve para esto por la latencia. Hay que implementar **WebSockets** para mantener una conexión bidireccional abierta (ej. emitiendo coordenadas y eventos de disparo a 60 ticks por segundo).
* **Sincronización de estado:** ¿Quién tiene la última palabra sobre una colisión, el cliente o el servidor? 
    * *Opción A (Servidor Autoritativo):* El servidor calcula todo y le avisa al cliente. Evita trampas, pero requiere optimizar mucho el código para no generar *lag*.
    * *Opción B (Cliente Autoritativo):* El cliente calcula si le dio al enemigo y le avisa al server. Es más fluido, pero trivial de hackear.
* **Conclusión analítica:** Es el feature más caro en términos de tiempo. Requiere desacoplar toda la lógica de movimiento y colisiones del archivo `battleTank.js` actual para llevarla al servidor.

## 💡 Idea 2: Persistencia y Estadísticas de Jugadores
**Propuesta por:** David
**Descripción:** Crear un sistema de registro de usuarios y un panel de métricas de combate (Kills, Muertes, Winrate, Nivel máximo alcanzado).

**Desarrollo Técnico & Críticas:**
* **Modelado de Datos:** Las estadísticas de combate son inherentemente relacionales (Un Jugador -> Muchas Partidas -> Muchas Métricas). Diseñar un esquema normalizado en SQL, montado sobre un motor robusto como MariaDB, garantiza la integridad de estos datos transaccionales y permite hacer consultas analíticas complejas a futuro.
* **Estructura sugerida (Tablas base):**
    1.  `Usuarios`: ID, Username, Email, PasswordHash (nunca texto plano).
    2.  `Partidas`: ID, Fecha_Inicio, Duración, Resultado.
    3.  `Estadisticas`: ID_Usuario, ID_Partida, Enemigos_Destruidos, Precisión_Disparos, PowerUps_Recolectados.
* **Backend:** Se requiere una API RESTful (puede ser en Python, C++ u otro lenguaje backend) que reciba los datos del juego al finalizar la partida (`gameOver()`) y ejecute los `INSERT` en la base de datos.
* **Seguridad:** Hay que implementar tokens (ej. JWT) para asegurar que un jugador no pueda alterar sus estadísticas inyectando peticiones falsas a la API.

## 💡 Idea 3: Sistema Dinámico de Arenas de Combate
**Propuesta por:** David
**Descripción:** Salir del mapa estático actual y crear múltiples niveles con diferentes topografías, obstáculos y ventajas tácticas.

**Desarrollo Técnico & Críticas:**
* **El problema actual:** En el código fuente, los muros (`walls`) están hardcodeados con coordenadas fijas dentro de la función `createWalls()`. Esto es insostenible si queremos 10 o 50 mapas.
* **Solución (Tilemapping):**
    * Representar el mapa como una matriz (array 2D) de números, donde `0` es piso libre, `1` es muro destructible, y `2` es muro sólido.
    * Los mapas deben guardarse como archivos `.json` separados y cargarse asíncronamente cuando el jugador cambia de nivel.
* **Ventajas de diseño:** Permite crear diferentes biomas (hielo donde el tanque patina, barro donde va más lento).
* **Requerimiento técnico:** Optimizar la función `checkCollisions()`. Si el mapa tiene cientos de tiles, iterar sobre todos ellos en cada frame va a bajar los FPS. Se debe implementar partición espacial (Grid Espacial o QuadTrees) para verificar colisiones solo con los muros cercanos al tanque.

---

## 📝 Espacio para nuevas propuestas
*(Agregá tu idea acá siguiendo el formato de arriba)*

* **Idea 4:** [Título de la idea]
    * **Propuesta por:** [Nombre]
    * **Descripción:** ...
    * **Desarrollo Técnico:** ...