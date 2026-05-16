# Documentación de Ingeniería Inversa: BattleTank

## 1. Descripción General del Sistema
BattleTank es un juego 2D de disparos tipo arcade ("top-down shooter"). El sistema está construido exclusivamente con tecnologías web estándar (HTML5, CSS3, Vanilla JavaScript), sin dependencias de motores gráficos externos ni librerías de terceros. El renderizado se gestiona íntegramente a través de la API `CanvasRenderingContext2D`.

## 2. Requerimientos Técnicos y Arquitectura Actual
* **Lenguaje Base:** JavaScript (ES6+).
* **Renderizado:** HTML5 `<canvas>`. Bucle de juego basado en `requestAnimationFrame` con cálculo de *deltaTime* para normalizar la velocidad de actualización independiente del framerate.
* **Estilos y Layout:** CSS3 con Flexbox. Diseño responsivo optimizado para un ancho máximo de 800px y adaptabilidad para pantallas menores a 600px.
* **Sistema de Audio:** Implementación nativa mediante `AudioContext` (Web Audio API). Generación de ondas de sonido de forma procedural (osciladores) para evitar latencia en efectos de sonido (disparos, explosiones).
* **Almacenamiento / Persistencia:** Nulo. El estado del juego se pierde al recargar la página.

## 3. Requerimientos Funcionales (Mecánicas Core)

### 3.1. Entidad: Jugador (Player)
* **Atributos Base:** Velocidad de movimiento (`2.5`), velocidad de proyectil (`4`), tiempo de enfriamiento de disparo (`600ms`), vidas iniciales (`3`).
* **Control:** Soporte dual.
    * *Físico:* Teclado (Flechas direccionales para movimiento, barra espaciadora para disparo).
    * *Táctil/Virtual:* Botones en pantalla mapeados a eventos `touchstart` / `touchend`.
* **Restricciones:** No puede atravesar muros ni salir de los límites del `canvas`.

### 3.2. Entidades: Enemigos (Enemies)
* **IA de Movimiento:** Algoritmo básico de deambulación ("random wandering"). Tienen una probabilidad del 1% por frame de cambiar de dirección aleatoriamente o rebotan contra los muros/límites del mapa.
* **Comportamiento de Ataque:** Disparo aleatorio basado en una tasa de probabilidad (`0.005` por ciclo).
* **Spawning:** Aparecen en los bordes del mapa (Arriba, Abajo, Izquierda, Derecha). Existe una validación matemática para evitar que hagan "spawn" a menos de 150 píxeles de distancia del jugador (prevención de *spawn-kill*).

### 3.3. Sistema de Power-Ups
Los objetos mejoradores aparecen aleatoriamente evitando superponerse con los muros. El sistema soporta un máximo de 2 power-ups simultáneos en pantalla. Tienen un efecto de animación por pulso sinusoidal.
Existen 3 variantes instanciadas aleatoriamente:
1.  **Vida (Roja - ♥):** Incrementa las vidas del jugador en 1 (Límite máximo: 5).
2.  **Velocidad (Verde - ⚡):** Aumenta temporalmente (5000ms) la velocidad de desplazamiento del tanque.
3.  **Poder (Azul - ✦):** Habilita temporalmente (5000ms) un disparo en forma de abanico (tres direcciones simultáneas).

### 3.4. Motor de Físicas y Colisiones
Implementación de colisiones AABB (Axis-Aligned Bounding Box) para todas las entidades cuadradas/rectangulares:
* **Proyectil vs. Tanque (Enemigo/Jugador):** Destrucción de la entidad impactada y del proyectil.
* **Proyectil vs. Muro:** Destrucción del proyectil.
* **Tanque vs. Muro:** Bloqueo de coordenadas (desplazamiento cancelado en el eje de colisión).
* **Jugador vs. Power-Up:** Consumo del objeto y aplicación de estado.

### 3.5. Progresión y Bucle de Juego
* **Niveles:** Incremento infinito. Al destruir a todos los enemigos en pantalla, el nivel avanza.
* **Curva de Dificultad:** Por cada nivel, la velocidad enemiga aumenta en `0.25`, la frecuencia de disparo aumenta en `0.001` y el límite de enemigos simultáneos sube (hasta un tope técnico de 8).
* **Puntuación:** `+100` puntos por cada enemigo destruido.

## 4. Requerimientos de Audio (Subsistema `AudioManager`)
Clase aislada que gestiona nodos de ganancia e inicialización asíncrona.
* **Música de Fondo ("Erika"):** Intenta realizar un `fetch` del archivo estático `assets/audio/erika.mp3`.
* **Mecanismo de Fallback:** Si el archivo `.mp3` no existe (HTTP 404), el sistema ejecuta una función de contingencia (`playGeneratedErika()`) que sintetiza las frecuencias y duraciones de la melodía usando `AudioContext.createOscillator()`.
* **Efectos (SFX):** Generados con diferentes tipos de ondas (`square`, `sawtooth`, `sine`) y rampas exponenciales para simular sonidos de disparos, explosiones, motor y power-ups.
* **Controles:** Toggles booleanos independientes y sliders de volumen `[0.0 - 1.0]` para música y efectos.

## 5. Requerimientos de Interfaz de Usuario (UI)
* **HUD (Heads-Up Display):** Indicadores en tiempo real de Vidas, Puntuación y Nivel.
* **Overlays:** Pantallas modales superpuestas manejadas por la clase CSS `.hidden` para el Menú de Inicio y la Pantalla de Game Over.
* **Modo Debug:** Se accede presionando la tecla `D`. Muestra variables de estado interno por consola e imprime recuento de entidades en el margen superior izquierdo del Canvas.