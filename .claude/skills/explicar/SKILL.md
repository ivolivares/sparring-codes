---
name: explicar
description: Enseña el problema en curso paso a paso y de forma socrática (reformular, fuerza bruta, cuello de botella, señal del patrón, idea óptima, código de la persona), para cuando no sabe cómo resolverlo. Úsala cuando diga "no sé", "explícame", "enséñame", "me rindo" o pida la solución.
argument-hint: "[slug opcional]"
---

# /explicar

Argumentos: $ARGUMENTS

El objetivo es que la persona **entienda el porqué** y pueda reconstruir la solución sola en el repaso, no que vea una solución. Avanza **un paso por mensaje** y espera su respuesta antes del siguiente. Si responde bien, avanza rápido; si se traba, haz una pregunta más chica.

## 0. Preparación

- `node scripts/coach.mjs elapsed`. Si hay un problema en curso y todavía no llegó a la pista 4, registra `node scripts/coach.mjs hint 4` (la nota máxima queda en "con ayuda"; díselo en una frase, sin dramatizar).
- Si se indica un slug sin problema en curso, es una consulta de estudio: no registres nada.
- Lee su `solution.js` si tiene algo: parte desde donde llegó, no desde cero.

## Pasos

1. **Reformular.** Pídele que diga con sus palabras qué entra, qué sale y que invente un ejemplo chico propio. Corrige malentendidos aquí: muchos bloqueos son de lectura, no de algoritmo.

2. **Fuerza bruta.** Pregúntale cuál sería la solución más tonta que funciona. Complétala si hace falta y calculen juntos su complejidad. Siempre hay una; partir de ahí es el método que sirve en cualquier entrevista.

3. **Cuello de botella.** "¿Qué trabajo se repite en la fuerza bruta?" o "¿qué información recalculas que podrías recordar?". Este es el paso más importante: de aquí sale la optimización.

4. **La señal del patrón.** Nombra el patrón y, sobre todo, **qué en el enunciado lo delata** (por ejemplo: "pide algo sobre un subarreglo contiguo y la condición se mantiene al agrandarlo → ventana deslizante"; "ordenado + buscar → binary search"; "todas las combinaciones → backtracking"). Esta frase es lo que tiene que llevarse.

5. **Idea óptima e invariante.** Explica la idea con una tabla o traza a mano sobre un ejemplo chico, paso a paso (estado de las variables en cada iteración). Termina con el invariante en una frase ("en todo momento, la ventana no tiene caracteres repetidos").

6. **Que la persona programe.** Pídele que lo escriba en `solution.js`. No escribas código tú. Cuando termine, corre `/evaluar` (la nota quedará en "con ayuda").
   - Solo si pide **explícitamente** ver la solución: muéstrala, breve y comentada, y pídele que cierre el archivo y la reescriba de memoria antes de evaluar.

7. **Cierre.** Tres viñetas para recordar: la señal del patrón, el invariante y el error típico. Úsalas como `--note` cuando se registre el intento. Sugiere 1 o 2 problemas del mismo patrón del catálogo (`coach.mjs list --pattern <id>`) para reforzar.

El repaso queda en 2 días automáticamente. Díselo: entender hoy no es lo mismo que poder hacerlo pasado mañana sin ayuda, y eso es lo que mide el repaso.
