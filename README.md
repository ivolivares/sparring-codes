# sparring.codes

Tu sparring para entrevistas técnicas: un gimnasio de algoritmos en JavaScript sobre la lista **NeetCode 150**, con Claude Code como entrevistador y tutor. Claude te presenta problemas, te evalúa con tests reales, te da pistas graduadas cuando te trabas y te enseña paso a paso cuando no sabes por dónde partir. Un sistema de repaso espaciado vuelve a ponerte cada problema hasta que lo resuelves solo.

## Requisitos

- Node.js 22 o superior (usa el runner de tests nativo, sin dependencias)
- [Claude Code](https://code.claude.com/docs)

## Empezar

Haz un fork (tu progreso queda versionado en tu propio repo) o clónalo directo:

```bash
git clone https://github.com/ivolivares/sparring-codes.git
cd sparring-codes
claude
```

Dentro de Claude Code:

```
/siguiente
```

## El ciclo

1. **`/siguiente`** – Claude presenta el problema con sus propias palabras, crea `practice/<slug>/` y arranca el reloj.
2. **Antes de programar** – escribe tus casos borde en `edge.test.js` y cuéntale a Claude tu idea y su complejidad.
3. **Programa** en `practice/<slug>/solution.js`. Corre `npm test` cuando quieras.
4. **`/evaluar`** – Claude genera tests ocultos (casos borde, comparación aleatoria contra fuerza bruta y rendimiento), los valida contra su propia solución de referencia, los corre contra la tuya y te da feedback de entrevistador.
5. El resultado queda registrado y el problema vuelve a repaso: a los 2 días si necesitaste ayuda, y a intervalos cada vez más largos (3, 7, 14, 30 y 60 días) si lo resolviste bien.

## Comandos

| Comando | Para qué |
|---|---|
| `/siguiente` | Siguiente problema: repasos vencidos primero, después el roadmap |
| `/siguiente sliding-window` | Siguiente problema de un patrón |
| `/siguiente aleatorio` | Problema al azar de los patrones que ya tocaste, **sin decirte el patrón** (entrena reconocerlo) |
| `/siguiente nuevo` | Salta los repasos (úsalo poco) |
| `/pista` | Escalera de 4 niveles: pregunta guía → patrón → idea clave → explicación |
| `/explicar` | Clase socrática paso a paso. Tú escribes el código. |
| `/evaluar` | Tests + evaluación + registro |
| `/simulacro` | Entrevista de 45 min sin pistas, con scorecard y señal de contratación |
| `/progreso` | Estado por patrón, puntos débiles y qué hacer después |

También funcionan en lenguaje natural: "dame otro", "no sé cómo seguir", "revisa lo que hice".

## Reglas del juego

- **Las pistas tienen costo.** Con pistas 1–2 la nota máxima es *aprobado*; desde la pista 3, *con ayuda*. Lo aplica el script, no Claude, así que no se negocia.
- **Evaluar sin estar listo también.** Si pides `/evaluar` y tu solución falla algún test, la nota máxima queda en *aprobado*, igual que en una entrevista real. Corre `npm test` antes de evaluar.
- **Claude no puede tocar tu `solution.js` ni tu `edge.test.js`.** Está bloqueado en `.claude/settings.json`.
- **Los repasos se resuelven desde cero.** Tu intento anterior se archiva en `practice/<slug>/history/`.
- **El primer problema de heap incluye implementar tu propio `MinHeap`** en `lib/heap.js`. JavaScript no trae priority queue, y en entrevistas lo suelen pedir.

## Estructura

```
catalog/problems.json   150 problemas: metadatos y links (sin enunciados)
scripts/coach.mjs       estado, pistas, notas, repaso espaciado (determinístico)
lib/structures.js       ListNode, TreeNode, GraphNode y conversores
lib/testing.js          loadSolution, rng con semilla, canonical, assertUnder
practice/<slug>/        tu solución, tus casos borde y los ejemplos
progress/state.json     tu progreso (versiónalo con git)
progress/journal.md     bitácora: qué te costó en cada intento
.coach/                 tests ocultos y referencias (fuera de git: spoilers)
CLAUDE.md               instrucciones del coach
.claude/skills/         los comandos /siguiente, /pista, /evaluar…
```

El CLI también se puede usar sin Claude: `npm run stats`, `npm run due`, `node scripts/coach.mjs list`.

## Notas

- Los enunciados no se copian de LeetCode (tienen derechos de autor): Claude los redacta y el link apunta al original. Por eso los 7 problemas que son premium en LeetCode también se pueden practicar aquí.
- Si haces público el repo, `.coach/` queda fuera, pero tus soluciones en `practice/` sí se publican.
- Ritmo recomendado: un problema al día y la cola de repasos al día. Diez problemas un domingo rinden menos que uno diario durante dos semanas.

## Licencia

[MIT](LICENSE). La lista de problemas sigue la selección NeetCode 150; los problemas y sus enunciados originales pertenecen a LeetCode y se enlazan, no se reproducen.
