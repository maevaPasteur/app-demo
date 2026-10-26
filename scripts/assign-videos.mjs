#!/usr/bin/env node
// Remplace les vidéos d'exemple par tes vraies vidéos.
// Usage : node scripts/assign-videos.mjs <dossier-de-videos> [--world dance] [--no-encode]
// - Prend les fichiers .mp4/.mov du dossier (ordre alphabétique) et les assigne aux vidéos de demo.json
//   dans l'ordre (ou seulement celles d'un monde avec --world). S'il y a moins de fichiers que de vidéos, on boucle.
// - Avec ffmpeg installé : ré-encode en 720x1280 H.264 muet ~1.5 Mbps (faststart) et régénère le poster.
// - Sans ffmpeg ou avec --no-encode : copie le fichier tel quel (poster inchangé).
import { readdir, readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, extname } from 'node:path';

const [dir, ...rest] = process.argv.slice(2);
if (!dir) { console.error('Usage: node scripts/assign-videos.mjs <dossier> [--world <id>] [--no-encode]'); process.exit(1); }
const worldOnly = rest.includes('--world') ? rest[rest.indexOf('--world') + 1] : null;
let encode = !rest.includes('--no-encode');
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch { encode = false; console.warn('ffmpeg absent : copie sans ré-encodage'); }

const root = new URL('..', import.meta.url).pathname;
const jsonPath = join(root, 'src/data/demo.json');
const demo = JSON.parse(await readFile(jsonPath, 'utf8'));
const files = (await readdir(dir)).filter((f) => ['.mp4', '.mov', '.m4v', '.webm'].includes(extname(f).toLowerCase())).sort();
if (!files.length) { console.error('Aucune vidéo dans', dir); process.exit(1); }
await mkdir(join(root, 'public/media/videos'), { recursive: true });

const targets = demo.videos.filter((v) => !worldOnly || v.world === worldOnly);
for (const [i, v] of targets.entries()) {
  const src = join(dir, files[i % files.length]);
  const rel = `media/videos/${v.id}.mp4`;
  const out = join(root, 'public', rel);
  if (encode) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-t', '30', '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280', '-c:v', 'libx264', '-preset', 'medium', '-b:v', '1500k', '-maxrate', '1800k', '-bufsize', '3000k', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1', '-i', out, '-frames:v', '1', '-vf', 'scale=480:-1', '-q:v', '5', join(root, 'public', v.poster)]);
  } else {
    await copyFile(src, out);
  }
  v.src = rel;
  console.log(`${v.id} <- ${files[i % files.length]}`);
}
await writeFile(jsonPath, JSON.stringify(demo, null, 2));
console.log(`OK · ${targets.length} vidéos mises à jour dans demo.json`);
