#!/usr/bin/env node
// CLI determinístico del coach. Claude lo llama; tú también puedes.
// Lleva el estado (qué problema estás haciendo, pistas, tiempos) y el repaso espaciado.
// Las fechas y las notas máximas las calcula este script, no el modelo.
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, renameSync, copyFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'catalog/problems.json');
const STATE = path.join(ROOT, 'progress/state.json');
const JOURNAL = path.join(ROOT, 'progress/journal.md');

// Días hasta el próximo repaso según la caja (sistema Leitner).
const INTERVALS = [1, 3, 7, 14, 30, 60];
const GRADES = ['fail', 'assisted', 'pass', 'strong'];
const GRADE_LABEL = { fail: 'no resuelto', assisted: 'con ayuda', pass: 'aprobado', strong: 'sólido' };

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const bySlug = new Map(catalog.problems.map(p => [p.slug, p]));

function loadState() {
  if (!existsSync(STATE)) return { version: 1, current: null, problems: {} };
  return JSON.parse(readFileSync(STATE, 'utf8'));
}
function saveState(s) {
  mkdirSync(path.dirname(STATE), { recursive: true });
  writeFileSync(STATE, JSON.stringify(s, null, 2) + '\n');
}

function today(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}
function minutesSince(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function parseArgs(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i++; }
    } else pos.push(a);
  }
  return { pos, flags };
}

function requireProblem(slug) {
  const p = bySlug.get(slug);
  if (!p) fail(`No existe "${slug}" en el catálogo. Usa: node scripts/coach.mjs list`);
  return p;
}
function fail(msg) { console.error(`error: ${msg}`); process.exit(1); }
function out(obj) { console.log(JSON.stringify(obj, null, 2)); }

function summary(p, rec) {
  return {
    slug: p.slug, title: p.title, lc: p.lc, difficulty: p.difficulty,
    pattern: p.pattern, patternName: p.patternName, url: p.url, premium: p.premium,
    attempts: rec?.attempts?.length ?? 0,
    lastGrade: rec?.attempts?.at(-1)?.grade ?? null,
    box: rec?.box ?? null, nextReview: rec?.nextReview ?? null,
  };
}

function dueList(state, pattern) {
  const t = today();
  return Object.entries(state.problems)
    .filter(([slug, r]) => r.nextReview && r.nextReview <= t && bySlug.has(slug))
    .filter(([slug]) => !pattern || bySlug.get(slug).pattern === pattern)
    .sort((a, b) => a[1].nextReview.localeCompare(b[1].nextReview) || a[1].box - b[1].box)
    .map(([slug, r]) => summary(bySlug.get(slug), r));
}

// ---------- comandos ----------

function cmdNext({ flags }) {
  const state = loadState();
  const pattern = flags.pattern && flags.pattern !== true ? flags.pattern : null;
  if (pattern && !catalog.patterns.some(p => p.id === pattern)) {
    fail(`Patrón desconocido "${pattern}". Opciones: ${catalog.patterns.map(p => p.id).join(', ')}`);
  }
  if (state.current && !flags.force) {
    const p = bySlug.get(state.current.slug);
    return out({ reason: 'in-progress', minutesElapsed: minutesSince(state.current.startedAt), maxHint: state.current.maxHint, problem: summary(p, state.problems[p.slug]) });
  }
  if (!flags.new) {
    const due = dueList(state, pattern);
    if (due.length) return out({ reason: 'review-due', dueCount: due.length, problem: due[0] });
    if (flags.review) return out({ reason: 'nothing-due', problem: null });
  }
  const unseen = catalog.problems.filter(p => !state.problems[p.slug] && (!pattern || p.pattern === pattern));
  if (!unseen.length) return out({ reason: 'catalog-complete', problem: null });
  // --random: sin orden de roadmap, para entrenar el reconocimiento del patrón.
  // Solo sortea entre patrones que ya tocaste (reconocer algo que nunca viste no entrena nada);
  // si aún no tocas ninguno, sortea entre fáciles y medios.
  let pool = unseen;
  if (flags.random) {
    const touched = new Set(Object.keys(state.problems).map(s => bySlug.get(s)?.pattern));
    const known = unseen.filter(p => touched.has(p.pattern));
    pool = known.length ? known : unseen.filter(p => p.difficulty !== 'hard');
    if (!pool.length) pool = unseen;
  }
  const fresh = flags.random ? pool[Math.floor(Math.random() * pool.length)] : unseen[0];
  return out({ reason: flags.random ? 'new-random' : 'new', hidePattern: Boolean(flags.random), problem: summary(fresh, null) });
}

function cmdStart({ pos, flags }) {
  const slug = pos[0] ?? fail('uso: start <slug> [--mode practice|review|mock]');
  requireProblem(slug);
  const state = loadState();
  if (state.current && state.current.slug !== slug && !flags.force) {
    fail(`Ya tienes "${state.current.slug}" en curso. Ciérralo con record o usa --force.`);
  }
  const mode = typeof flags.mode === 'string' ? flags.mode : (state.problems[slug] ? 'review' : 'practice');
  if (!['practice', 'review', 'mock'].includes(mode)) fail(`modo inválido: ${mode}`);
  const dir = path.join(ROOT, 'practice', slug);
  const solution = path.join(dir, 'solution.js');
  const stub = path.join(ROOT, '.coach/stubs', `${slug}.js`);
  mkdirSync(dir, { recursive: true });

  // Un repaso se resuelve desde cero: el intento anterior se archiva, no se borra.
  let archived = null;
  if (existsSync(solution) && existsSync(stub)) {
    const hist = path.join(dir, 'history');
    mkdirSync(hist, { recursive: true });
    const n = readdirSync(hist).filter(f => f.startsWith(today())).length;
    archived = `practice/${slug}/history/${today()}${n ? `-${n + 1}` : ''}.js`;
    renameSync(solution, path.join(ROOT, archived));
  }
  let stubCopied = false;
  if (!existsSync(solution) && existsSync(stub)) { copyFileSync(stub, solution); stubCopied = true; }

  // Plantilla de casos borde: los escribes tú, ANTES de programar.
  const edge = path.join(dir, 'edge.test.js');
  let edgeCreated = false;
  if (!existsSync(edge) && existsSync(solution)) {
    const src = readFileSync(solution, 'utf8');
    const names = [...src.matchAll(/export\s+(?:async\s+)?(?:function|class)\s+(\w+)/g)].map(m => m[1]);
    writeFileSync(edge, edgeTemplate(slug, names));
    edgeCreated = true;
  }

  state.current = { slug, mode, startedAt: new Date().toISOString(), maxHint: 0, hints: [] };
  saveState(state);
  out({
    started: slug, mode, folder: `practice/${slug}/`, stubCopied, archived, edgeCreated,
    warning: existsSync(solution) ? undefined : `Falta el stub: escribe .coach/stubs/${slug}.js y vuelve a correr start ${slug} --force`,
  });
}

function edgeTemplate(slug, names) {
  const imports = names.length ? `const { ${names.join(', ')} } = ` : 'const solution = ';
  return `// Tus casos borde. Escríbelos ANTES de programar la solución.
// Piensa en: vacío, un elemento, duplicados, negativos, todo igual, ya ordenado, el máximo de las restricciones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSolution } from '../../lib/testing.js';

${imports}await loadSolution('practice/${slug}/solution.js');

test('borde: TODO', () => {
  // assert.deepEqual(${names[0] ?? 'fn'}(...), ...);
});
`;
}

// Corre los tests con node --test. --reference valida los tests contra la solución de referencia del coach.
function cmdVerify({ pos, flags }) {
  const slug = pos[0] ?? loadState().current?.slug ?? fail('uso: verify <slug> [--reference] [--visible]');
  requireProblem(slug);
  const dir = path.join(ROOT, 'practice', slug);
  const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.test.js')).map(f => path.join(dir, f)) : [];
  const hidden = path.join(ROOT, '.coach/hidden', `${slug}.test.js`);
  if (!flags.visible && existsSync(hidden)) files.push(hidden);
  if (!files.length) fail(`No hay tests para ${slug}.`);

  const env = { ...process.env };
  if (flags.reference) {
    const ref = path.join(ROOT, '.coach/reference', `${slug}.js`);
    if (!existsSync(ref)) fail(`No existe .coach/reference/${slug}.js`);
    env.SOLUTION = ref;
  } else {
    delete env.SOLUTION;
  }
  console.log(`# ${flags.reference ? 'REFERENCIA' : 'TU SOLUCIÓN'} · ${files.map(f => path.relative(ROOT, f)).join(', ')}`);
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { cwd: ROOT, env, stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

function cmdHint({ pos }) {
  const level = Number(pos[0]);
  if (![1, 2, 3, 4].includes(level)) fail('uso: hint <1|2|3|4>');
  const state = loadState();
  if (!state.current) fail('No hay problema en curso.');
  if (state.current.mode === 'mock') fail('Modo mock: no hay pistas. El entrevistador solo puede hacer preguntas.');
  const elapsed = minutesSince(state.current.startedAt);
  state.current.hints.push({ level, atMinute: elapsed });
  state.current.maxHint = Math.max(state.current.maxHint, level);
  saveState(state);
  out({ slug: state.current.slug, level, minutesElapsed: elapsed, maxHint: state.current.maxHint, gradeCap: gradeCap(state.current.maxHint, state.current.failedChecks) });
}

// Tope de nota: pistas y evaluaciones fallidas (entregar algo que no pasa y corregirlo
// después del feedback no es "sólido" en una entrevista real).
function gradeCap(maxHint, failedChecks = 0) {
  if (maxHint >= 3) return 'assisted';
  if (maxHint >= 1 || failedChecks >= 1) return 'pass';
  return 'strong';
}

function cmdElapsed() {
  const state = loadState();
  if (!state.current) return out({ current: null });
  const c = state.current;
  out({ slug: c.slug, mode: c.mode, minutesElapsed: minutesSince(c.startedAt), maxHint: c.maxHint, failedChecks: c.failedChecks ?? 0, gradeCap: gradeCap(c.maxHint, c.failedChecks) });
}

// /evaluar lo llama cuando la solución de la persona falla algún test (ejemplos u ocultos).
function cmdCheckFail({ flags }) {
  const state = loadState();
  if (!state.current) fail('No hay problema en curso.');
  state.current.failedChecks = (state.current.failedChecks ?? 0) + 1;
  saveState(state);
  out({ slug: state.current.slug, failedChecks: state.current.failedChecks, reason: typeof flags.reason === 'string' ? flags.reason : null, gradeCap: gradeCap(state.current.maxHint, state.current.failedChecks) });
}

function cmdRecord({ pos, flags }) {
  const state = loadState();
  const slug = pos[0] ?? state.current?.slug ?? fail('uso: record <slug> --grade <fail|assisted|pass|strong> [--note "..."]');
  const p = requireProblem(slug);
  let grade = flags.grade;
  if (!GRADES.includes(grade)) fail(`--grade debe ser uno de: ${GRADES.join(', ')}`);

  const cur = state.current?.slug === slug ? state.current : null;
  const maxHint = cur?.maxHint ?? 0;
  const failedChecks = cur?.failedChecks ?? 0;
  const cap = gradeCap(maxHint, failedChecks);
  const capped = GRADES.indexOf(grade) > GRADES.indexOf(cap);
  if (capped) grade = cap;

  const minutes = cur ? minutesSince(cur.startedAt) : (Number(flags.minutes) || null);
  const rec = state.problems[slug] ?? { box: 0, nextReview: null, attempts: [] };
  const t = today();

  let reviewIn;
  if (grade === 'strong') { rec.box = Math.min(rec.box + 2, INTERVALS.length - 1); reviewIn = INTERVALS[rec.box]; }
  else if (grade === 'pass') { rec.box = Math.min(rec.box + 1, INTERVALS.length - 1); reviewIn = INTERVALS[rec.box]; }
  else if (grade === 'assisted') { rec.box = 0; reviewIn = 2; }
  else { rec.box = 0; reviewIn = 1; }
  rec.nextReview = addDays(t, reviewIn);

  const note = typeof flags.note === 'string' ? flags.note : '';
  const mode = cur?.mode ?? 'practice';
  rec.attempts.push({ date: t, grade, minutes, maxHint, failedChecks, mode, note });
  state.problems[slug] = rec;
  if (cur) state.current = null;
  saveState(state);

  const hintTxt = maxHint ? `pista máx. ${maxHint}` : 'sin pistas';
  const failTxt = failedChecks ? ` · ${failedChecks} evaluación${failedChecks > 1 ? 'es' : ''} fallida${failedChecks > 1 ? 's' : ''}` : '';
  const capTxt = capped ? ' (tope por pistas o evaluaciones fallidas)' : '';
  const line = `\n## ${t} · ${p.title} · ${p.patternName}\n- Resultado: **${GRADE_LABEL[grade]}**${capTxt} · ${minutes ?? '?'} min · ${hintTxt}${failTxt} · modo ${mode}\n- Próximo repaso: ${rec.nextReview}\n${note ? `- ${note}\n` : ''}`;
  if (!existsSync(JOURNAL)) writeFileSync(JOURNAL, '# Bitácora de práctica\n');
  appendFileSync(JOURNAL, line);

  out({ slug, grade, capped, minutes, maxHint, failedChecks, box: rec.box, nextReview: rec.nextReview, mastered: isMastered(rec) });
}

function isMastered(rec) {
  return rec.box >= 4 && rec.attempts.at(-1)?.grade === 'strong';
}

function cmdAbandon() {
  const state = loadState();
  if (!state.current) return out({ abandoned: null });
  const slug = state.current.slug;
  state.current = null;
  saveState(state);
  out({ abandoned: slug, note: 'No se registró intento. Si te rendiste, usa record --grade fail para que vuelva al repaso.' });
}

function cmdDue({ flags }) {
  const due = dueList(loadState(), typeof flags.pattern === 'string' ? flags.pattern : null);
  if (flags.json) return out(due);
  if (!due.length) return console.log('Nada pendiente de repaso hoy.');
  console.log(`Repasos pendientes (${due.length}):`);
  for (const d of due) console.log(`  ${d.nextReview}  ${d.title}  [${d.patternName}]  último: ${GRADE_LABEL[d.lastGrade] ?? '-'}`);
}

function cmdStats({ flags }) {
  const state = loadState();
  const rows = catalog.patterns.map(pt => {
    const items = catalog.problems.filter(p => p.pattern === pt.id);
    const recs = items.map(p => state.problems[p.slug]).filter(Boolean);
    const lastGrades = recs.map(r => r.attempts.at(-1).grade);
    const scored = lastGrades.map(g => GRADES.indexOf(g));
    return {
      pattern: pt.id, name: pt.name, total: items.length, seen: recs.length,
      mastered: recs.filter(isMastered).length,
      weak: lastGrades.filter(g => g === 'fail' || g === 'assisted').length,
      avg: scored.length ? +(scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(2) : null,
    };
  });
  const totals = {
    seen: Object.keys(state.problems).length,
    mastered: Object.values(state.problems).filter(isMastered).length,
    due: dueList(state).length,
    attempts: Object.values(state.problems).reduce((n, r) => n + r.attempts.length, 0),
  };
  if (flags.json) return out({ totals, patterns: rows, current: state.current });
  console.log(`Vistos ${totals.seen}/150 · dominados ${totals.mastered} · repasos pendientes ${totals.due} · intentos ${totals.attempts}`);
  if (state.current) console.log(`En curso: ${state.current.slug} (${minutesSince(state.current.startedAt)} min)`);
  console.log('');
  console.log('Patrón'.padEnd(28) + 'Vistos'.padEnd(9) + 'Dominados'.padEnd(11) + 'Débiles'.padEnd(9) + 'Promedio (0-3)');
  for (const r of rows) {
    console.log(r.name.padEnd(28) + `${r.seen}/${r.total}`.padEnd(9) + String(r.mastered).padEnd(11) + String(r.weak).padEnd(9) + (r.avg ?? '-'));
  }
}

function cmdList({ flags }) {
  const state = loadState();
  const pattern = typeof flags.pattern === 'string' ? flags.pattern : null;
  for (const p of catalog.problems.filter(p => !pattern || p.pattern === pattern)) {
    const r = state.problems[p.slug];
    const mark = !r ? ' ' : isMastered(r) ? '★' : '·';
    console.log(`${mark} ${String(p.order).padStart(3)}  ${p.slug.padEnd(58)} ${p.difficulty.padEnd(7)} ${p.patternName}${p.premium ? '  (premium en LeetCode)' : ''}`);
  }
}

function cmdShow({ pos }) {
  const p = requireProblem(pos[0] ?? fail('uso: show <slug>'));
  const state = loadState();
  out({ ...summary(p, state.problems[p.slug]), history: state.problems[p.slug]?.attempts ?? [] });
}

const HELP = `Uso: node scripts/coach.mjs <comando>

  next [--pattern <id>] [--new] [--review] [--random] [--force]
                                                        Elige el siguiente problema (repasos primero)
  start <slug> [--mode practice|review|mock]            Empieza el reloj, copia el stub y archiva el intento anterior
  verify [slug] [--reference] [--visible]               Corre los tests (tuyos + ocultos)
  hint <1-4>                                            Registra una pista (pone tope a la nota)
  check-fail [--reason "..."]                           Registra una evaluación fallida (tope: aprobado)
  elapsed                                               Minutos, pistas, evaluaciones fallidas y tope de nota
  record [slug] --grade <fail|assisted|pass|strong> [--note "..."]
  abandon                                               Suelta el problema en curso sin registrar
  due                                                   Repasos pendientes hoy
  stats [--json]                                        Progreso por patrón
  list [--pattern <id>]                                 Catálogo completo
  show <slug>                                           Historial de un problema
`;

const [cmd, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const commands = { next: cmdNext, start: cmdStart, verify: cmdVerify, 'check-fail': cmdCheckFail, hint: cmdHint, elapsed: cmdElapsed, record: cmdRecord, abandon: cmdAbandon, due: cmdDue, stats: cmdStats, list: cmdList, show: cmdShow };
if (!cmd || cmd === 'help' || !commands[cmd]) { console.log(HELP); process.exit(cmd && cmd !== 'help' ? 1 : 0); }
commands[cmd](args);
