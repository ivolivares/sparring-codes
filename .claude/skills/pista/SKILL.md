---
name: pista
description: Da la siguiente pista de la escalera (1 pregunta guía, 2 patrón, 3 idea clave, 4 recorrido completo) para el problema en curso. Úsala cuando la persona diga que está trabada, pida una pista o una ayuda.
argument-hint: "[nivel 1-4]"
---

# /pista

Argumentos: $ARGUMENTS

1. Corre `node scripts/coach.mjs elapsed`. Si no hay problema en curso, díselo y ofrece `/siguiente`. Si el modo es `mock`, recuérdale que en el simulacro no hay pistas: puede pensar en voz alta y tú respondes como lo haría un entrevistador.

2. **Antes de la primera pista** (`maxHint` = 0):
   - Si lleva menos de 8 minutos y no te ha contado qué intentó, pídele primero que te diga en una línea qué probó o dónde se trabó. Si insiste, dale la pista igual: es su decisión.
   - Avísale una sola vez del costo: con pistas 1–2 la nota máxima es "aprobado"; desde la 3, "con ayuda".

3. Nivel: el que pida en los argumentos; si no pide ninguno, `maxHint + 1`. No saltes niveles por iniciativa propia.

4. Registra la pista **antes** de darla: `node scripts/coach.mjs hint <nivel>`.

5. Da la pista según la escalera de CLAUDE.md. Breve: 1 a 3 frases. Sin código.
   - Nivel 1: una pregunta. Apóyate en lo que la persona ya dijo o escribió (lee su `solution.js` si tiene avance).
   - Nivel 2: el patrón y **la señal del enunciado** que lo sugiere ("subarreglo contiguo + condición que se mantiene al crecer → ventana deslizante"). Esa señal es lo que tiene que aprender a reconocer.
   - Nivel 3: la estructura de datos y el invariante ("un hashmap de valor → índice; al recorrer, buscas el complemento antes de guardar el actual").
   - Nivel 4: no la des aquí; corre `/explicar`.

6. Cierra con una pregunta corta que le devuelva el trabajo ("¿cómo cambia tu loop con eso?").
