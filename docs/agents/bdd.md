# BDD conventions

How acceptance criteria are written on tickets: as **Escenarios** in Spanish Gherkin. Scenarios exist to steer the implementing agent and give a human an auditable contract — they are acceptance criteria, not documentation.

## Where scenarios appear

Tickets produced by `/to-tickets` (and triage briefs, when useful) carry one Escenario per acceptance criterion that involves business rules. Specs do not carry scenarios; they crystallize at ticket time. Each criterion keeps its checkbox wrapping the scenario title:

```markdown
- [ ] El Lobby se cierra si el tiempo de espera vence con menos de 4
```

## Format

Spanish keywords, Spanish domain terms:

| Keyword | Use |
| --- | --- |
| `Característica:` | Optional grouping header when a ticket has several related scenarios |
| `Escenario:` | One behavior per scenario; the title states the rule |
| `Dado` | Initial state/context |
| `Cuando` | The action or event under test |
| `Entonces` | The observable outcome |
| `Y` / `Pero` | Additional steps in any of the three positions |

```gherkin
Escenario: El Lobby se cierra si el tiempo de espera vence con menos de 4
  Dado un Lobby abierto con 3 usuarios en cola
  Cuando el tiempo máximo de espera vence
  Entonces el Lobby se cierra sin iniciar una Partida
```

## Scope rules

Scenarios are for **rule-dense behavior** — state machines, thresholds, tie-breaks, end conditions (Lobby timing and capacity, Votación desempate, Puntaje computation, Tabla de posiciones updates).

Do not write scenarios for plumbing, rendering, input feel, or netcode mechanics. Litmus test: if you cannot produce three concrete examples a non-programmer would nod at, use plain acceptance-criterion bullets instead.

One behavior per scenario. If a scenario needs an `Y` chain longer than about three steps, it is probably two scenarios.

## Test mapping

When test infrastructure exists, each scenario title becomes the name of a test at one of the pre-agreed seams from the spec's Testing Decisions (`/tdd`). A scenario with no corresponding test is an open acceptance criterion; a test with no scenario was not asked for.

## Vocabulary

Use `CONTEXT.md` terms exactly — Usuario, Jugador, Lobby, Votación, Mapa, Partida, Enemigo, Puntaje, Eliminación, Tabla de posiciones — and honor their _Avoid_ lists. If a scenario seems to need a term the glossary lacks or contradicts, surface the conflict rather than inventing a synonym.
