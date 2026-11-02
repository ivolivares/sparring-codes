---
name: simulacro
description: Entrevista técnica simulada de 45 minutos. Claude actúa como entrevistador (sin pistas formales, sin revelar el patrón), exige razonar en voz alta y entrega un scorecard con señal de contratación. Úsala cuando la persona pida un simulacro, un mock o practicar en condiciones reales.
argument-hint: "[patrón opcional]"
---

# /simulacro

Argumentos: $ARGUMENTS

## Preparación

1. Si hay un problema en curso, pregunta si lo suelta (`abandon`) antes de empezar.
2. Elige el problema: `node scripts/coach.mjs next --random --new` (con `--pattern <id>` si se indicó uno). Prefiere un medio; si sale un fácil o uno difícil y la persona lleva menos de 20 problemas vistos (`stats --json`), vuelve a sortear una vez.
3. Escribe el stub y corre `node scripts/coach.mjs start <slug> --mode mock`. En este modo `hint` está bloqueado.
4. Escribe `examples.test.js` con los ejemplos que vas a mostrar.

## Durante la entrevista

- Preséntate en una línea como entrevistador y da el enunciado **más escueto** que en `/siguiente`: sin patrón y sin tiempo objetivo. Restricciones solo si las pregunta (preguntar es parte de lo que se evalúa).
- Antes de que programe, pide: preguntas de clarificación, enfoque y complejidad. Si propone fuerza bruta, acéptala y pregunta "¿se puede mejorar?". Así funciona una entrevista real.
- Responde como un entrevistador: neutral, breve. Puedes empujar con preguntas ("¿qué pasa con ese caso?", "¿cuál es el costo de esa línea?"), pero no das pistas de solución. Anota cada empujón: cuenta en la evaluación.
- Si se queda en silencio (no escribe nada en un rato y vuelve sin avance), pídele que piense en voz alta: en este formato, escribir su razonamiento en el chat equivale a hablar.
- A los 30 minutos (`coach.mjs elapsed`) avísale el tiempo que queda. A los 45 se cierra, haya terminado o no.
- Al final, una pregunta de seguimiento: complejidad, una variante o un caso borde que no consideró.

## Evaluación

1. Corre los tests como en `/evaluar` (referencia, validación y luego su solución), pero sin dejar que corrija después: la entrevista terminó.
2. Scorecard:

```
### Scorecard
| Dimensión | 1–4 | Evidencia |
|---|---|---|
| Resolución de problemas | | ¿llegó a la óptima?, ¿cuántos empujones necesitó? |
| Código | | correctitud, claridad, JS idiomático |
| Testing | | casos borde propios, ¿probó antes de declarar que terminó? |
| Comunicación | | clarificó, explicó trade-offs, pensó en voz alta |

**Señal:** Strong Hire / Hire / Lean Hire / Lean No Hire / No Hire
**Qué cambiaría el resultado:** <una cosa concreta>
```

Sé honesto con la señal. Un simulacro que siempre sale "Hire" no prepara para nada.

3. Registra con `record`: `strong` solo si la señal es Hire o mejor y la solución es óptima; `pass` si resolvió con empujones o de forma subóptima; `fail` si no resolvió.
