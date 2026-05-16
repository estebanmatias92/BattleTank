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

## 🚀 Nuevas Propuestas Técnicas (Vinculadas a SUGERENCIA01.md)

## 💡 Idea 4: Reestructuración del Cliente mediante Escenas Modulares
**Propuesta por:** Equipo de Desarrollo
**Referencia:** `SUGERENCIA01.md` - Sección 1 (Phaser 3)
**Descripción:** Romper el monolito de interfaz y juego mezclados en el DOM, implementando el sistema de ciclo de vida de Phaser 3.

**Desarrollo Técnico & Críticas:**
* **Implementación:** Dividir la aplicación en clases independientes que extiendan de `Phaser.Scene`:
    1. `BootScene`: Configuración técnica y chequeo de capacidades gráficas.
    2. `PreloadScene`: Carga asíncrona de assets (sprites del tanque, audio procedural y mapas JSON).
    3. `MenuScene`: Manejo de la UI de inicio y controles de audio sin interferir con el bucle físico.
    4. `PlayScene`: Núcleo del gameplay, renderizado de mapas por capas (suelo, obstáculos, tanques).
* **Pros:** El código se vuelve modular, mantenible y respeta el principio de responsabilidad única. Resuelve de forma nativa la gestión de estados de la **Idea 3**.
* **Contras:** Requiere reescribir la manipulación actual del Canvas nativo y adaptar los event listeners del teclado al sistema de inputs de Phaser.

## 💡 Idea 5: Implementación de Estado Compartido e Interpolación
**Propuesta por:** Equipo de Desarrollo
**Referencia:** `SUGERENCIA01.md` - Sección 2 (Colyseus)
**Descripción:** Definir un esquema de datos estricto en el servidor para sincronizar las físicas de los tanques y mitigar el impacto visual del lag en el cliente.

**Desarrollo Técnico & Críticas:**
* **Implementación:** El servidor Node.js correrá una simulación física simplificada. En lugar de transmitir la posición de cada tanque en cada frame (lo que saturaría el ancho de banda), el servidor transmite el estado modificado a una tasa fija (ej. 20Hz o 30Hz). El cliente (Phaser 3) recibirá estos paquetes y aplicará **interpolación lineal (Lerp)** para mover suavemente los tanques entre la última posición conocida y la nueva, evitando movimientos cortados ("teletransportes").
* **Pros:** Optimiza drásticamente el consumo de red y viabiliza la **Idea 1** bajo conexiones estándar.
* **Contras:** Introduce una complejidad matemática extra en el cliente para predecir o suavizar los movimientos locales mientras llega la respuesta del servidor.

## 💡 Idea 6: Abstracción de Datos y Middleware de Autenticación
**Propuesta por:** Equipo de Desarrollo
**Referencia:** `SUGERENCIA01.md` - Sección 3 (Express + Prisma + MariaDB)
**Descripción:** Implementar un pipeline seguro para el flujo de información entre el fin de una partida multijugador y el almacenamiento definitivo de métricas.

**Desarrollo Técnico & Críticas:**
* **Implementación:** Cuando la sala de Colyseus detecta el fin del juego, no permite que el cliente envíe sus propios datos. El mismo servidor de Colyseus, de forma interna (Server-to-Server), realiza una petición firmada con una clave secreta a la API de Express. Express recibe el JSON de la partida, lo valida mediante un esquema estricto de Prisma y realiza la transacción en MariaDB.
* **Pros:** Blindaje total contra la manipulación de estadísticas (fundamental para viabilizar la **Idea 2**). El uso de Prisma automatiza las migraciones del esquema si decidimos agregar nuevos campos (como "precisión de tiro" o "tiempo de supervivencia").
* **Contras:** Agrega latencia interna en el cierre de la partida; se debe manejar un estado de "guardando datos..." en la pantalla del usuario para que la desconexión no rompa la transacción.

---

## 📝 Espacio para nuevas propuestas
*(Agregá tu idea acá siguiendo el formato de arriba)*

* **Idea 7:** [Título de la idea]
    * **Propuesta por:** [Nombre]
    * **Descripción:** ...
    * **Desarrollo Técnico:** ...