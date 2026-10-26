import { create } from 'zustand';
import { challenge, creator, filters as F, video, type FeedItem } from '../data';

// Filtres du feed : attributs auto-déclarés des créateurs + formats + mondes. Mémoire seulement.
export type FilterState = {
  sel: Record<string, string[]>; // groupId -> options
  height: [number, number];
  types: string[];
  worlds: string[];
  set: (patch: Partial<Omit<FilterState, 'set' | 'reset'>>) => void;
  reset: () => void;
};
const initial = { sel: {} as Record<string, string[]>, height: [F.height.min, F.height.max] as [number, number], types: [] as string[], worlds: [] as string[] };
export const useFilters = create<FilterState>((set) => ({ ...initial, set: (p) => set(p), reset: () => set(initial) }));

export const activeCount = (s: Pick<FilterState, 'sel' | 'height' | 'types' | 'worlds'>) =>
  Object.values(s.sel).filter((v) => v.length).length + (s.height[0] > F.height.min || s.height[1] < F.height.max ? 1 : 0) + (s.types.length ? 1 : 0) + (s.worlds.length ? 1 : 0);

export function creatorMatches(id: string, s: Pick<FilterState, 'sel' | 'height'>) {
  const c = creator(id) as ReturnType<typeof creator> & { profile?: Record<string, string | number> };
  if (!c?.profile) return true;
  for (const [k, v] of Object.entries(s.sel)) if (v.length && !v.includes(String(c.profile[k]))) return false;
  const h = Number(c.profile.heightCm);
  return h >= s.height[0] && h <= s.height[1];
}

const typeOf = (it: FeedItem): string => {
  if (it.kind === 'risers') return 'risers';
  if (it.kind === 'video') return video(it.id)?.access === 'free' ? 'Free' : 'Videos';
  const ch = challenge(it.id);
  return ch?.type === 'duel' ? 'Duels' : ch?.type === 'dare' ? 'Dares' : 'Drops';
};

/** Garde un élément si au moins un de ses créateurs correspond, et si format / monde correspondent. */
export function itemMatches(it: FeedItem, s: Pick<FilterState, 'sel' | 'height' | 'types' | 'worlds'>) {
  if (it.kind === 'risers') return activeCount(s) === 0;
  const t = typeOf(it);
  if (s.types.length && !s.types.includes(t) && !(t === 'Videos' && s.types.includes('Free'))) return false;
  let ids: string[] = [];
  let world = '';
  if (it.kind === 'video') { const v = video(it.id); ids = v ? [v.creator] : []; world = v?.world ?? ''; }
  else { const ch = challenge(it.id); world = ch?.world ?? ''; ids = !ch ? [] : ch.type === 'drop' ? ch.creators : ch.entries.map((e) => e.creator); }
  if (s.worlds.length && !s.worlds.includes(world)) return false;
  return ids.some((id) => creatorMatches(id, s));
}
