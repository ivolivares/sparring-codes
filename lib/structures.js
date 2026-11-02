// Estructuras con la misma forma que usa LeetCode, más conversores para los tests.

export class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

export class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Nodo de grafo (Clone Graph)
export class GraphNode {
  constructor(val = 0, neighbors = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

/** [1,2,3] -> 1 -> 2 -> 3 */
export function toList(arr) {
  const dummy = new ListNode();
  let cur = dummy;
  for (const v of arr) { cur.next = new ListNode(v); cur = cur.next; }
  return dummy.next;
}

/** 1 -> 2 -> 3 -> [1,2,3]. Corta en `limit` nodos para no colgarse con ciclos. */
export function fromList(head, limit = 100_000) {
  const out = [];
  while (head && out.length < limit) { out.push(head.val); head = head.next; }
  if (head) throw new Error('fromList: la lista parece tener un ciclo');
  return out;
}

/** Lista con ciclo: `pos` es el índice al que apunta el último nodo (-1 = sin ciclo). */
export function toCyclicList(arr, pos) {
  const head = toList(arr);
  if (pos < 0 || !head) return head;
  let tail = head, target = null, i = 0;
  for (let n = head; n; n = n.next, i++) { if (i === pos) target = n; tail = n; }
  tail.next = target;
  return head;
}

/** Orden por niveles con null, como LeetCode: [3,9,20,null,null,15,7] */
export function toTree(arr) {
  if (!arr.length || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;
  while (queue.length && i < arr.length) {
    const node = queue.shift();
    if (i < arr.length && arr[i] !== null) { node.left = new TreeNode(arr[i]); queue.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = new TreeNode(arr[i]); queue.push(node.right); }
    i++;
  }
  return root;
}

/** Inverso de toTree, sin nulls al final. */
export function fromTree(root) {
  if (!root) return [];
  const out = [], queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (node) { out.push(node.val); queue.push(node.left, node.right); }
    else out.push(null);
  }
  while (out.at(-1) === null) out.pop();
  return out;
}

/** Busca un nodo por valor (útil para LCA). */
export function findNode(root, val) {
  if (!root) return null;
  if (root.val === val) return root;
  return findNode(root.left, val) ?? findNode(root.right, val);
}

/** Lista de adyacencia 1-indexada -> grafo (Clone Graph). */
export function toGraph(adj) {
  if (!adj.length) return null;
  const nodes = adj.map((_, i) => new GraphNode(i + 1));
  adj.forEach((ns, i) => { nodes[i].neighbors = ns.map(n => nodes[n - 1]); });
  return nodes[0];
}

/** Grafo -> lista de adyacencia, para comparar. */
export function fromGraph(node) {
  if (!node) return [];
  const seen = new Map(), stack = [node];
  while (stack.length) {
    const n = stack.pop();
    if (seen.has(n.val)) continue;
    seen.set(n.val, n.neighbors.map(x => x.val));
    for (const x of n.neighbors) if (!seen.has(x.val)) stack.push(x);
  }
  return [...seen.keys()].sort((a, b) => a - b).map(k => seen.get(k));
}
