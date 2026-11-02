---
name: evaluar
description: Evalúa la solución del problema en curso como lo haría un entrevistador. Corre tests visibles y ocultos (validados contra una referencia), analiza complejidad y calidad, asigna nota y registra el intento. Úsala cuando la persona diga que terminó, pida revisar su código o pregunte si su solución está bien.
---

# /evaluar

## 1. Contexto

- `node scripts/coach.mjs elapsed` → slug, modo, minutos y pistas. Si no hay problema en curso, pregunta cuál quiere evaluar.
- Lee `practice/<slug>/solution.js` y `practice/<slug>/edge.test.js`.
- Si `solution.js` sigue vacío o es claramente un borrador, pregúntale si de verdad quiere evaluar o si prefiere seguir.

## 2. Tests ocultos

Si no existen `.coach/hidden/<slug>.test.js` y `.coach/reference/<slug>.js` (o son de un intento anterior al de hoy y quieres refrescarlos), escríbelos según la sección "Tests" de CLAUDE.md: casos borde a mano + comparación aleatoria contra un oráculo de fuerza bruta + rendimiento con `assertUnder` cuando aplique.

Valida **siempre** antes de usarlos:
```
node scripts/coach.mjs verify <slug> --reference
```
- Si falla un test tuyo, corrígelo y valida de nuevo. No sigas hasta que tu referencia pase todo lo tuyo.
- Si falla un test de `edge.test.js`, anótalo: la persona esperaba un valor incorrecto.

## 3. Correr contra la persona

```
node scripts/coach.mjs verify <slug>
```

**Si falla algún test de ejemplos u oculto contra su solución**, registra la evaluación fallida antes de responder: `node scripts/coach.mjs check-fail --reason "<categoría>"`. Esto pone el tope de nota en "aprobado", igual que en una entrevista real, donde entregar algo que falla y corregirlo después del feedback no es "sólido". Si lo único que falla es un test de `edge.test.js` con el valor esperado equivocado, no cuenta como fallo de la solución: no lo registres.

**Si algo falla, todavía no registres el intento.** Dile qué categoría falló ("falla con el array vacío", "pasa todo, pero con n = 100.000 tarda 3,6 s"). No muestres el input exacto del test aleatorio a la primera; si después de un intento sigue fallando, muéstraselo. El reloj sigue corriendo. Que corrija y vuelva a pedir `/evaluar`. Si dice que no puede más, pasa al paso 4 con la nota que corresponda (o sugiere `/explicar`).

## 4. Feedback de entrevistador

Con todo verde (o cuando la persona se rinda), responde con esta estructura, en corto:

```
### Resultado: <sólido | aprobado | con ayuda | no resuelto>  ·  <min> min  ·  <pistas>

**Correctitud** – tests visibles y ocultos; qué casos borde anticipó y cuáles no.
**Complejidad** – la suya: O(?) tiempo / O(?) espacio. Óptima: O(?) / O(?). Si no es óptima, por qué y cuál es la idea que le falta (sin código).
**Código** – 1 a 3 observaciones concretas (nombres, claridad, JS idiomático, mutación de inputs).
**Lo que preguntaría un entrevistador** – una pregunta de seguimiento realista (variante, trade-off, "¿y si no cabe en memoria?").
```

Si la nota es menor que sólido, termina con la mejora más importante, no con una lista.

## 5. Registrar

```
node scripts/coach.mjs record <slug> --grade <fail|assisted|pass|strong> --note "<insight clave + lo que costó>"
```

Usa la nota que indica la rúbrica de CLAUDE.md, no la que suena más amable. Si el resultado trae `capped: true`, explica en una frase qué puso el tope (pistas o evaluaciones fallidas). Informa la fecha del próximo repaso y ofrece `/siguiente`.

Si el problema fue de heap y la persona creó o mejoró `lib/heap.js`, revisa también ese archivo con la misma vara.
