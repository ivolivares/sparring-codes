---
name: progreso
description: Muestra el progreso por patrón (vistos, dominados, débiles), repasos pendientes y recomienda en qué enfocarse. Úsala cuando la persona pregunte cómo va, qué le cuesta más o qué debería practicar.
---

# /progreso

1. Corre `node scripts/coach.mjs stats` (la tabla, para mostrarla tal cual) y `node scripts/coach.mjs stats --json` (para analizar). Corre también `node scripts/coach.mjs due`.
2. Lee `progress/journal.md` (las últimas 15 entradas aprox.) para detectar errores que se repiten en las notas.
3. Muestra la tabla y luego un análisis corto:
   - **Repasos pendientes:** cuántos hay. Si son más de 5, recomienda hacerlos antes de avanzar. Acumular repasos es la forma más común de que este sistema deje de funcionar.
   - **Patrón más débil:** el de peor promedio entre los que tienen al menos 2 vistos, con la evidencia de la bitácora (qué error se repite).
   - **Ritmo:** intentos en los últimos 7 días, según las fechas de la bitácora. Lo que importa es la constancia (un problema al día), no el total.
   - **Recomendación:** una sola acción concreta para la próxima sesión (por ejemplo, "`/siguiente repaso` hasta vaciar la cola y después `/siguiente sliding-window`").
4. Si lleva más de 30 problemas vistos y nunca ha hecho un simulacro, sugiérelo: practicar solo con pistas disponibles da una idea demasiado optimista del nivel real.

No maquilles los números. Si el progreso está estancado, dilo y propón un ajuste.
