import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { challenges, type Dare, type Duel } from '../data';
import { useDemo } from './store';

/* ---------- Horloge partagée : un seul setInterval pour tous les timers ---------- */
const listeners = new Set<(t: number) => void>();
let clock: ReturnType<typeof setInterval> | undefined;
const T0 = Date.now();

function subscribe(fn: (t: number) => void) {
  listeners.add(fn);
  if (!clock) clock = setInterval(() => { const now = Date.now(); listeners.forEach((l) => l(now)); }, 1000);
  return () => {
    listeners.delete(fn);
    if (!listeners.size && clock) { clearInterval(clock); clock = undefined; }
  };
}

/** Temps courant, rafraîchi chaque seconde (seulement pour le composant qui l'utilise). */
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => subscribe(setNow), []);
  return now;
}

/** '1d 6h 04m', '14h 22m', '2d 4h', '12d left', '6h 12m' : secondes restantes au chargement de la démo. */
export function parseDuration(label: string): number | null {
  const re = /(\d+)\s*([dhms])/g;
  let m: RegExpExecArray | null;
  let total = 0;
  let found = false;
  while ((m = re.exec(label))) {
    found = true;
    const n = Number(m[1]);
    total += m[2] === 'd' ? n * 86400 : m[2] === 'h' ? n * 3600 : m[2] === 'm' ? n * 60 : n;
  }
  return found ? total : null;
}

export function formatCountdown(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  if (d > 0) return `${d}d ${h}h ${p(m)}m`;
  if (h > 0) return `${h}h ${p(m)}m ${p(ss)}s`;
  return `${m}m ${p(ss)}s`;
}

/** Libellé qui décompte chaque seconde. Garde le libellé tel quel s'il n'est pas une durée. */
export function useCountdown(label: string) {
  const now = useNow();
  const base = parseDuration(label);
  if (base === null) return label;
  const suffix = /left/i.test(label) ? ' left' : '';
  return formatCountdown(base - (now - T0) / 1000) + suffix;
}

/* ---------- Votes en direct ---------- */
type LiveState = {
  extra: Record<string, number>; // `${challengeId}:${creatorId}` -> votes reçus en direct
  last: Record<string, { n: number; at: number }>; // dernier incrément, pour les particules
  bump: (key: string, n: number) => void;
};

export const useLive = create<LiveState>((set) => ({
  extra: {},
  last: {},
  bump: (key, n) => set((s) => ({ extra: { ...s.extra, [key]: (s.extra[key] ?? 0) + n }, last: { ...s.last, [key]: { n, at: Date.now() } } })),
}));

let simStarted = false;
/** Lance la simulation des votes (une fois). Les duels serrés basculent de temps en temps. */
export function startLiveSim() {
  if (simStarted) return;
  simStarted = true;
  const pick = () => {
    const live = challenges.filter((c): c is Duel | Dare => (c.type === 'duel' || c.type === 'dare') && c.status === 'live');
    if (!live.length) return;
    const ch = live[Math.floor(Math.random() * live.length)];
    const pool = ch.type === 'dare' ? ch.entries.slice(0, 4) : ch.entries;
    const e = pool[Math.floor(Math.random() * pool.length)];
    useLive.getState().bump(`${ch.id}:${e.creator}`, ch.type === 'duel' ? 6 + Math.floor(Math.random() * 34) : 1 + Math.floor(Math.random() * 12));
  };
  setInterval(() => { if (!document.hidden) { pick(); if (Math.random() > 0.5) pick(); } }, 2200);
}

/** Votes affichés = JSON + votes de la démo (toi) + votes en direct. */
export function useLiveVotes(challengeId: string, creatorId: string, base: number) {
  const key = `${challengeId}:${creatorId}`;
  const live = useLive((s) => s.extra[key] ?? 0);
  const mine = useDemo((s) => s.extraVotes[key] ?? 0);
  return base + live + mine * 37;
}

/** Dernier incrément en direct (pour afficher « +N »). */
export function useLastBump(challengeId: string, creatorId: string) {
  return useLive((s) => s.last[`${challengeId}:${creatorId}`]);
}
