// Utilidades para tests: aleatorios reproducibles y comparación sin orden.
import { pathToFileURL } from 'node:url';
import path from 'node:path';

/**
 * Carga la solución a probar. Por defecto la tuya; con SOLUTION=<ruta> otra
 * (así el coach valida sus tests ocultos contra una solución de referencia antes de usarlos contigo).
 */
export async function loadSolution(defaultPath) {
  const target = process.env.SOLUTION ?? defaultPath;
  return import(pathToFileURL(path.resolve(target)).href);
}

/** PRNG con semilla (mulberry32). Mismo seed = mismos casos = fallas reproducibles. */
export function rng(seed = 42) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next,
    int,
    pick: arr => arr[int(0, arr.length - 1)],
    array: (len, lo, hi) => Array.from({ length: len }, () => int(lo, hi)),
    string: (len, alphabet = 'abcdefghijklmnopqrstuvwxyz') =>
      Array.from({ length: len }, () => alphabet[int(0, alphabet.length - 1)]).join(''),
    shuffle: arr => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) { const j = int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    },
  };
}

/**
 * Forma canónica para comparar resultados donde el orden no importa
 * (Group Anagrams, 3Sum, Subsets, Permutations...). Ordena recursivamente.
 */
export function canonical(value) {
  if (!Array.isArray(value)) return value;
  const inner = value.map(canonical);
  return inner.sort((a, b) => {
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
}

/** Ordena solo el nivel externo (cuando el orden interno sí importa). */
export function sortOuter(arr) {
  return [...arr].sort((a, b) => {
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
}

/** Mide tiempo de una llamada. */
export function timeIt(fn) {
  const t0 = performance.now();
  const result = fn();
  return { result, ms: performance.now() - t0 };
}

/**
 * Test de rendimiento. OJO: la opción { timeout } de node:test NO interrumpe código
 * síncrono, así que una solución lenta "pasa" igual. Por eso se mide y se compara.
 * Elige n para que la solución ingenua tarde unos segundos, no minutos
 * (O(n²) → n ≈ 1e5; O(n³) → n ≈ 2e3; O(2^n) → n ≈ 30).
 */
export function assertUnder(budgetMs, fn, label = 'rendimiento') {
  const { result, ms } = timeIt(fn);
  if (ms > budgetMs) {
    throw new Error(`${label}: tardó ${Math.round(ms)} ms (límite ${budgetMs} ms). Probablemente la complejidad no es la óptima.`);
  }
  return result;
}
