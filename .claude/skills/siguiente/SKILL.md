---
name: siguiente
description: Presenta el siguiente problema de práctica (repasos vencidos primero, luego el roadmap NeetCode 150). Úsala cuando la persona pida un problema nuevo, "dame otro", "siguiente", "qué toca hoy" o un problema de un patrón específico.
argument-hint: "[patrón | nuevo | repaso | aleatorio]"
---

# /siguiente

Argumentos: $ARGUMENTS

## 1. Elegir el problema

Traduce los argumentos a flags de `node scripts/coach.mjs next`:
- un ID de patrón (`sliding-window`, `dp-1d`, …) o su nombre aproximado ("árboles" → `trees`) → `--pattern <id>`
- "nuevo" → `--new` (salta los repasos vencidos)
- "repaso" → `--review`
- "aleatorio" o "mezclado" → `--random --new`
- sin argumentos → sin flags

Interpreta el `reason` del resultado:
- `in-progress`: ya hay un problema en curso. Recuérdale cuál es y cuánto tiempo lleva, vuelve a mostrar el enunciado y pregúntale si quiere seguir o soltarlo (`abandon`, o `record --grade fail` si se rinde). No empieces otro sin su confirmación (`next --force`).
- `review-due`: es un repaso. Díselo y muéstrale cuántos hay pendientes. Muestra también la nota del último intento (`coach.mjs show <slug>`), pero solo la parte de "lo que le costó", **sin el insight**: la idea es que la reconstruya.
- `new` / `new-random`: problema nuevo.
- `nothing-due` / `catalog-complete`: díselo y propón el siguiente paso (otro modo o `/simulacro`).

## 2. Preparar los archivos (antes de mostrar el enunciado)

1. Escribe `.coach/stubs/<slug>.js`: la firma con JSDoc y el cuerpo vacío (ver "Convenciones" en CLAUDE.md). Si el problema usa listas, árboles o grafos, incluye el import desde `../../lib/structures.js`.
2. Corre `node scripts/coach.mjs start <slug>` (con `--mode review` si es repaso). El script copia el stub a `solution.js`, archiva el intento anterior en un repaso, crea la plantilla `edge.test.js` y arranca el reloj. Si el resultado trae `warning`, resuélvelo antes de seguir.
3. Escribe `practice/<slug>/examples.test.js` con los ejemplos que vas a mostrar (2 o 3), usando `loadSolution`.

## 3. Presentar el problema

Formato:

```
## <Título> · LeetCode #<n> · <dificultad>
<patrón: solo si NO es aleatorio>  ·  tiempo objetivo: <15|25|40> min

<Enunciado con tus palabras: qué recibe, qué devuelve, reglas.>

Ejemplos
- <input> → <output>   (una línea explicando por qué)

Restricciones
- <tamaños y rangos relevantes: definen la complejidad que se espera>

Original: <url>
```

Si el problema es premium en LeetCode, no pasa nada: tu enunciado basta.

## 4. Cerrar con el método

Termina siempre así (corto, sin repetir el enunciado):

> El reloj está corriendo. Antes de programar:
> 1. Escribe 2 o 3 casos borde en `practice/<slug>/edge.test.js`.
> 2. Cuéntame en una o dos líneas tu idea y su complejidad (fuerza bruta vale como punto de partida).
>
> Cuando termines: `/evaluar`. Si te trabas: `/pista`. Si no tienes idea por dónde partir: `/explicar`.

No agregues pistas ni comentarios sobre cómo resolverlo.
