#!/usr/bin/env node
// Règle maison : aucun em dash (U+2014) ni en dash (U+2013) dans le code et les textes.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const bad = /[–—]/;
const hits = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) return walk(p);
  if (!/\.(tsx?|json|css|html|md)$/.test(f)) return;
  readFileSync(p, 'utf8').split('\n').forEach((l, i) => bad.test(l) && hits.push(`${p}:${i + 1}`));
});
['src', 'index.html', 'CLAUDE.md'].forEach((p) => (statSync(p).isDirectory() ? walk(p) : bad.test(readFileSync(p, 'utf8')) && hits.push(p)));
console.log(hits.length ? hits.join('\n') : '0 dash');
process.exit(hits.length ? 1 : 0);
