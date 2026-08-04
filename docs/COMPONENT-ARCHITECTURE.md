# Propuesta: Arquitectura de Componentes Dinámicos (Plugin System)

**Propósito educativo:** Demostrar SOLID, patrones de diseño, SDLC y arquitectura de software a través de un sistema de carga dinámica de componentes en C++, inspirado en Battle City.

**Contraste con la arquitectura actual:** Mientras `SUGERENCIA01.md` propone un sistema cliente-servidor web (Phaser + Colyseus), esta propuesta es deliberadamente *overkill* académico — implementar un sistema de plugins nativos (`.so`/`.dll`) en un juego de tanques para aprender haciendo.

---

## Mapeo de Battle City a una Arquitectura de Componentes

```
Aplicación Principal (main.cpp)
  ├── ModuleManager (carga dinámica de .so)
  │
  ├── [Interfaces] ──────────────── [Implementaciones como Plugins]
  │   ├── ITank                   libTank_Basic.so, libTank_Fast.so, libTank_Armor.so
  │   ├── IBullet                 libBullet_Standard.so, libBullet_Piercing.so
  │   ├── IPowerUp                libPowerUp_Helmet.so, libPowerUp_Star.so, libPowerUp_Shovel.so
  │   ├── IMapLoader              libMap_Classic.so, libMap_Fortress.so
  │   └── IRenderer               libRenderer_SDL.so, libRenderer_ASCII.so (para debug)
  │
  └── Core Game Loop (usa interfaces, no concreciones)
```

---

## SOLID — Demostración Práctica

| Principio | Cómo se demuestra |
|---|---|
| **SRP** — Responsabilidad Única | `ITank` solo define comportamiento de tanque. `IRenderer` solo dibuja. `IMapLoader` solo carga mapas. Ninguna clase hace de todo. |
| **OCP** — Abierto/Cerrado | Para agregar un nuevo tipo de enemigo (ej. "FastTank"), se compila un nuevo `.so`. La app principal no se toca. Demostrable: agregar un plugin sin recompilar `main`. |
| **LSP** — Sustitución de Liskov | Cualquier `ITank*` puede reemplazar a otro. El game loop itera sobre una lista de `shared_ptr<ITank>` y todos son tratados igual. Si un plugin rompe el contrato (ej. no implementa `move()` correctamente), se detecta en pruebas. |
| **ISP** — Segregación de Interfaces | `IMovable`, `ICollidable`, `IRenderable` son interfaces pequeñas y específicas. Un tanque implementa las tres. Un power-up solo implementa `ICollidable` y `IActivable`. |
| **DIP** — Inversión de Dependencias | El game loop depende de las interfaces (`ITank`, `IBullet`, `IRenderer`), no de `SDL_Renderer` ni de `GreeterComponent`. La decisión de qué implementación cargar se toma en runtime, no en compile-time. |

---

## Patrones de Diseño Implementados

| Patrón | Dónde aparece |
|---|---|
| **Component / Plugin** | Todo el sistema: módulos `.so` cargados en tiempo de ejecución |
| **Factory Method** | `ModuleManager::createInstance<ITank>()` resuelve `createComponent()` del `.so` |
| **RAII** | `SharedLibrary` envuelve `dlopen`/`dlclose` en ctor/dtor. El custom deleter de `shared_ptr` llama a `destroyComponent()` en el heap correcto |
| **Strategy** | Cada `ITank` plugin implementa su propia AI. El juego elige la estrategia al cargar el `.so` |
| **Observer** | Colisiones: un `EventBus` notifica a suscriptores (ej. "bullet hit tank" → `ScoreManager` + `SpawnExplosion`) |
| **Adapter** | `IRenderer` adapta una librería gráfica (SDL, terminal ASCII) a una interfaz común |

---

## SDLC — Ciclo de Vida del Software

1. **Requisitos:** Juego Battle City con tanques, balas, power-ups, mapas, y soporte para agregar nuevos tipos sin recompilar.
2. **Diseño:** Diagrama de componentes (interfaces + módulos `.so`), diagrama de clases, diagrama de secuencia (game loop).
3. **Implementación:** C++11+, `dlopen`/`dlsym`, interfaces virtuales puras.
4. **Pruebas:** Unit tests con `catch2` o `google-test`. Prueba concreta: cargar un plugin deliberadamente roto y verificar que el sistema lo rechaza (`dynamic_cast` falla → `nullptr`).
5. **Despliegue:** El binario principal + carpeta `plugins/` con los `.so`. Agregar un plugin = copiar un nuevo `.so`.
6. **Mantenimiento:** Nuevos enemigos no tocan el core. El sistema de logging y manejo de errores detecta plugins fallados.

---

## Arquitectura General

```
┌─────────────────────────────────────────────┐
│               Core (main.cpp)               │
│  GameLoop, CollisionDetector, EventBus      │
│  Depende solo de interfaces.                │
└──────────┬──────────────────────┬───────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────┐
│  ModuleManager   │   │   IRenderer (.so)    │
│  dlopen/dlsym    │   │   SDL / Terminal     │
│  shared_ptr deleter │                      │
└──────────────────┘   └──────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│         Plugins (.so files)                 │
│  libTank_Basic.so   libBullet_Piercing.so   │
│  libTank_Fast.so    libPowerUp_Star.so      │
│  libTank_Armor.so   libMap_Fortress.so      │
│  libTank_BigTank.so (¡nuevo, sin recompilar!)│
└─────────────────────────────────────────────┘
```

---

## Entregables para la Presentación

1. **Código funcional:** Tanque Amarillo (player) + 2 tipos de enemigos (Basic, Fast) cargados como plugins.
2. **Demo en vivo:** Compilar un nuevo plugin (ej. `libTank_BigTank.so`) y mostrarlo corriendo sin reiniciar el binario.
3. **Diagramas:** Componentes, clases, secuencia del game loop.
4. **Comparación:** "Así se vería sin componentes (monolítico)" vs. "Así con componentes".
5. **Pruebas:** Mostrar que un plugin inválido es rechazado (cápsula educativa sobre ABI y `dynamic_cast`).

---

## Herramientas Sugeridas

| Herramienta | Uso |
|---|---|
| `g++` / `clang++` | Compilación de plugins y core |
| `CMake` o `Makefile` | Build system multi-target (un target por plugin) |
| `dlopen` / `dlsym` | Carga dinámica en Linux |
| `catch2` o `google-test` | Unit tests |
| `gdb` / `valgrind` | Debug y memory leak checks |
| `PlantUML` o `draw.io` | Diagramas |

---

> **Nota importante:** Esta arquitectura es excesiva para un juego de este tamaño. El valor no está en la eficiencia sino en la *demostración didáctica* de conceptos de ingeniería de software. Es el equivalente a construir una casa con grúas y topadoras para luego poner un muñeco de Ikea adentro — pero aprendés cómo funcionan las grúas y topadoras.
