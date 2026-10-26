import { create } from 'zustand';
import {
  addRuntimeChallenge, addRuntimeVideo, app, challenge as getChallenge, creators, fmtMoney, person, subWorldName, videos, world as getWorld,
  type Dare, type Drop, type Duel, type Video,
} from '../data';
import { useDemo } from './store';

/**
 * Contenus créés pendant la démo (dare / duel / drop) + simulation de leur vie :
 * duel accepté par le rival, créateurs qui rejoignent un dare, ventes d'un drop qui montent.
 * Les objets challenge sont enregistrés dans data (addRuntimeChallenge) et mutés en place ;
 * `version` déclenche le re-render des écrans qui les affichent.
 */

export type CreatedKind = 'duel' | 'dare' | 'drop';
export type Phase = 'pending' | 'live';
type Celebrate = { id: string; text: string; k: number };

type ContentState = {
  version: number;
  created: string[]; // ids, plus récent d'abord
  phase: Record<string, Phase>;
  pendingRival: Record<string, string>;
  highlight: string | null;
  celebrate: Celebrate | null;
  bump: () => void;
};

export const useContent = create<ContentState>((set) => ({
  version: 0,
  created: [],
  phase: {},
  pendingRival: {},
  highlight: null,
  celebrate: null,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

export const ME_CREATOR = app.me.creator;
const bump = () => useContent.getState().bump();
const notify = (t: string, tone?: 'gold' | 'cyan' | 'hot' | 'cool' | 'green') => useDemo.getState().notify(t, tone);
const celebrate = (id: string, text: string) => useContent.setState({ celebrate: { id, text, k: Date.now() } });

let seq = 0;
const uid = (p: string) => `${p}-new-${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Durée choisie ("24h", "7d", "72h") -> libellé "23h 59m" et timestamp de fin. */
export function durationToMs(d: string) {
  const n = parseInt(d, 10) || 24;
  return d.endsWith('d') ? n * 86400000 : n * 3600000;
}
export function endsLabel(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  return d ? `${d}d ${h}h` : `${h}h ${String(mm).padStart(2, '0')}m`;
}

/** Vidéo d'un créateur pour un monde : copie le média d'une vidéo existante du monde. */
export function makeVideo(creatorId: string, worldId: string, subId: string, caption: string, price: number, from?: string): Video {
  const base = (from && videos.find((v) => v.id === from)) || videos.find((v) => v.world === worldId) || videos[0];
  return {
    id: uid('rv'), creator: creatorId, world: worldId, subWorld: subId, src: base.src, poster: base.poster,
    durationSec: base.durationSec, freePreviewSec: 2, access: 'locked', price, caption,
    stats: { likes: 0, comments: 0, views: 0 }, postedAgo: 'now', mediaQuery: '',
  };
}

/* ---------- Constructeurs (servent aussi aux aperçus avant publication) ---------- */
export type DuelInput = { rival: string; world: string; sub: string; text: string; duration: string; price: number; entry: string };
export function buildDuel(p: DuelInput, preview = true): Duel {
  const mine = preview ? p.entry : registerVideo(makeVideo(ME_CREATOR, p.world, p.sub, p.text, p.price, p.entry));
  const rivalVid = videos.find((v) => v.creator === p.rival && v.world === p.world)?.id ?? videos.find((v) => v.world === p.world && v.id !== p.entry)?.id ?? p.entry;
  const ms = durationToMs(p.duration);
  return {
    id: preview ? 'preview-duel' : uid('duel'), type: 'duel', format: '1v1', world: p.world, subWorld: p.sub, status: 'live', badge: 'NEW',
    title: p.text.trim() || 'Your duel', endsAt: new Date(Date.now() + ms).toISOString(), endsInLabel: endsLabel(ms), votePrice: p.price,
    entries: [{ creator: ME_CREATOR, video: mine, votes: 1, pct: 50 }, { creator: p.rival, video: rivalVid, votes: 1, pct: 50 }],
    videos: [mine, rivalVid],
  };
}

export type DareInput = { world: string; sub: string; text: string; duration: string; price: number; entry: string; invited: string[]; asCreator: boolean };
export function buildDare(p: DareInput, preview = true): Dare {
  const ms = durationToMs(p.duration);
  const first = p.asCreator ? [{ creator: ME_CREATOR, video: preview ? p.entry : registerVideo(makeVideo(ME_CREATOR, p.world, p.sub, `Dare entry: ${p.text}`, p.price, p.entry)), votes: 1, pct: 100 }] : [];
  return {
    id: preview ? 'preview-dare' : uid('dare'), type: 'dare', world: p.world, subWorld: p.sub, status: 'live', badge: 'NEW',
    title: p.text.trim() || 'Your dare', daredBy: p.asCreator ? ME_CREATOR : 'me',
    endsAt: new Date(Date.now() + ms).toISOString(), endsInLabel: endsLabel(ms),
    entryCount: first.length, votePrice: p.price, singlePrice: p.price, bundleFullPrice: p.price * Math.max(1, first.length),
    entries: first, videos: first.map((e) => e.video),
  };
}

export type DropInput = { world: string; sub: string; text: string; duration: string; price: number; entry: string; collab: string[]; goals: { amount: number; text: string }[] };
export function buildDrop(p: DropInput, preview = true): Drop {
  const ms = durationToMs(p.duration);
  const vid = preview ? p.entry : registerVideo({ ...makeVideo(ME_CREATOR, p.world, p.sub, `Exclusive drop: ${p.text}`, p.price, p.entry), durationSec: 60 });
  const team = [ME_CREATOR, ...p.collab];
  const sorted = [...p.goals].sort((a, b) => a.amount - b.amount);
  return {
    id: preview ? 'preview-drop' : uid('drop'), type: 'drop', world: p.world, subWorld: p.sub, status: 'live', badge: 'EXCLUSIVE DROP',
    creators: team, creatorsLabel: team.map((c) => person(c).handle).join(', '), creatorsSub: team.length > 1 ? 'COLLAB · equal split, paid instantly' : 'SOLO · paid instantly',
    title: p.text.trim() || 'Your drop', endsAt: new Date(Date.now() + ms).toISOString(), endsInLabel: endsLabel(ms),
    price: p.price, raised: 0, buyers: 0, buyersLabel: 'raised · 0 backers',
    milestones: sorted.length
      ? sorted.map((g, i) => ({ amount: g.amount, label: i === 0 ? `${fmtMoney(g.amount)} · base` : fmtMoney(g.amount), desc: g.text, reached: false }))
      : [{ amount: 0, label: 'Base video', desc: p.text.trim() || 'The full drop', reached: true }],
    rulesTitle: 'The more we raise, the more I reveal', rulesSub: 'Each goal the community reaches adds more to the final video. Every buyer gets every bonus.',
    cta: `Buy the drop · $${p.price}`, ctaSub: 'Now or never · on sale only during the drop, and never public after.', videos: [vid],
  };
}

function registerVideo(v: Video) {
  addRuntimeVideo(v);
  return v.id;
}

/* ---------- Publication + simulation ---------- */
const timers: ReturnType<typeof setTimeout>[] = [];
const later = (ms: number, f: () => void) => timers.push(setTimeout(f, ms));

function register(id: string, phase: Phase) {
  useContent.setState((s) => ({ created: [id, ...s.created], phase: { ...s.phase, [id]: phase }, highlight: id }));
  bump();
}

export function publishDuel(p: DuelInput) {
  const d = buildDuel(p, false);
  // Les 2 entrées existent dès le départ (aucun écran ne casse) ; l'état « pending » est porté par `phase`.
  const rivalEntry = d.entries[1];
  d.badge = 'PENDING';
  addRuntimeChallenge(d);
  useContent.setState((s) => ({ pendingRival: { ...s.pendingRival, [d.id]: p.rival } }));
  register(d.id, 'pending');
  later(6500, () => {
    const rivalVideo = registerVideo(makeVideo(p.rival, p.world, p.sub, `Duel entry: ${d.title}`, p.price, rivalEntry.video));
    d.entries = [{ ...d.entries[0], votes: 12, pct: 52 }, { creator: p.rival, video: rivalVideo, votes: 11, pct: 48 }];
    d.videos = d.entries.map((e) => e.video);
    d.badge = 'HOT';
    useContent.setState((s) => ({ phase: { ...s.phase, [d.id]: 'live' } }));
    notify(`${person(p.rival).handle} accepted your duel · it is live`, 'hot');
    celebrate(d.id, 'Duel is live');
    bump();
    // Les votes commencent à tomber
    let n = 0;
    const tick = () => {
      if (n++ > 24) return;
      const [a, b] = d.entries;
      if (Math.random() > 0.45) a.votes += 1 + Math.floor(Math.random() * 6); else b.votes += 1 + Math.floor(Math.random() * 6);
      const t = a.votes + b.votes;
      a.pct = Math.round((100 * a.votes) / t); b.pct = 100 - a.pct;
      bump();
      later(2200, tick);
    };
    later(1800, tick);
  });
  return d.id;
}

export function publishDare(p: DareInput) {
  const d = buildDare(p, false);
  addRuntimeChallenge(d);
  register(d.id, 'live');
  const pool = [...p.invited, ...creators.filter((c) => c.world === p.world).map((c) => c.id), ...creators.map((c) => c.id)]
    .filter((c, i, a) => c !== ME_CREATOR && a.indexOf(c) === i && !d.entries.some((e) => e.creator === c));
  const joiners = pool.slice(0, 4 - d.entries.length);
  joiners.forEach((cid, i) => later(4200 + i * 5000, () => {
    const v = registerVideo(makeVideo(cid, p.world, p.sub, `Dare entry: ${d.title}`, p.price));
    d.entries.push({ creator: cid, video: v, votes: 40 + Math.floor(Math.random() * 120), pct: 0 });
    const tot = d.entries.reduce((s, e) => s + e.votes, 0);
    d.entries.forEach((e) => (e.pct = Math.round((100 * e.votes) / tot)));
    d.entries.sort((a, b) => b.votes - a.votes);
    d.entryCount = d.entries.length;
    d.videos = d.entries.map((e) => e.video);
    d.badge = `${d.entryCount} ${d.entryCount > 1 ? 'ENTRIES' : 'ENTRY'}`;
    if (d.entryCount >= 2) {
      d.bundleFullPrice = d.entryCount * d.singlePrice;
      d.bundlePrice = Math.max(1, Math.round(d.bundleFullPrice * 0.6));
      d.bundleSavePct = Math.round(100 - (100 * d.bundlePrice) / d.bundleFullPrice);
      d.bundleLabel = `Unlock all ${d.entryCount} entries`;
      d.bundleSub = 'Watch every entry, back your favorite';
    }
    notify(`${person(cid).handle} entered your dare`, 'cyan');
    if (i === joiners.length - 1) celebrate(d.id, `${d.entryCount} creators in`);
    bump();
  }));
  return d.id;
}

export function publishDrop(p: DropInput) {
  const d = buildDrop(p, false);
  addRuntimeChallenge(d);
  register(d.id, 'live');
  const goals = d.milestones.filter((m) => m.amount > 0);
  const target = goals[1]?.amount ?? goals[0]?.amount ?? p.price * 80;
  const perTick = Math.max(p.price, Math.round(target / 14 / p.price) * p.price); // ~14 ticks pour franchir 2 paliers
  let n = 0;
  const tick = () => {
    if (n++ > 60) return;
    const buyers = Math.max(1, Math.round(perTick / p.price * (0.6 + Math.random() * 0.8)));
    d.buyers += buyers;
    d.raised = Math.round(d.buyers * p.price);
    d.buyersLabel = `raised · ${d.buyers} backers`;
    for (const m of d.milestones) {
      if (!m.reached && d.raised >= m.amount) {
        m.reached = true;
        notify(`${fmtMoney(m.amount)} reached · ${m.desc} unlocked`, 'gold');
        celebrate(d.id, `${fmtMoney(m.amount)} unlocked`);
      }
    }
    bump();
    later(1300, tick);
  };
  later(2200, tick);
  return d.id;
}

/** Libellé de contexte d'un contenu créé. */
export function createdContext(id: string) {
  const ch = getChallenge(id);
  if (!ch) return '';
  return `${getWorld(ch.world).name} · ${subWorldName(ch.world, ch.subWorld)}`;
}
