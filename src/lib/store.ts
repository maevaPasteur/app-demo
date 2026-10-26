import { create } from 'zustand';
import { me } from '../data';

// État de démo en mémoire uniquement (reset au reload, donc l'inscription réapparaît à chaque visite). Aucun back.
export type PayIntent = {
  kind: 'unlock' | 'vote' | 'subscribe' | 'drop' | 'tip' | 'bundle' | 'request';
  label: string;
  price: number;
  targetId: string; // id vidéo, challenge, créateur…
  extra?: string; // vote : id créateur choisi
  sub?: string;
};
export type Role = 'fan' | 'creator';
export type SheetName = 'create' | 'notifications' | 'search' | 'filters' | null;

type DemoState = {
  onboarded: boolean;
  role: Role;
  favWorlds: string[];
  verified: 'unverified' | 'pending' | 'verified';
  unlocked: Set<string>;
  followed: Set<string>;
  subscribed: Set<string>;
  votes: Record<string, string>;
  extraVotes: Record<string, number>; // challengeId:creatorId -> votes ajoutés pendant la démo
  liked: Set<string>;
  saved: Set<string>;
  pending: PayIntent | null;
  sheet: SheetName;
  toast: { id: number; text: string; tone?: 'gold' | 'cyan' | 'hot' | 'cool' | 'green' } | null;
  ask: (p: PayIntent) => void;
  cancel: () => void;
  confirm: () => void;
  toggleFollow: (creatorId: string) => void;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  openSheet: (s: SheetName) => void;
  notify: (text: string, tone?: 'gold' | 'cyan' | 'hot' | 'cool' | 'green') => void;
  finishOnboarding: (role: Role, favWorlds: string[], follows: string[]) => void;
  setRole: (r: Role) => void;
  setVerified: (v: 'unverified' | 'pending' | 'verified') => void;
  reset: () => void;
};

const add = (s: Set<string>, v: string) => new Set(s).add(v);
const toggle = (s: Set<string>, v: string) => {
  const n = new Set(s);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
};

const initial = () => ({
  onboarded: false,
  role: 'fan' as Role,
  favWorlds: me.favoriteWorlds,
  verified: 'unverified' as const,
  unlocked: new Set<string>(me.unlocked),
  followed: new Set<string>(me.circle.following),
  subscribed: new Set<string>(me.circle.subscribed),
  votes: {} as Record<string, string>,
  extraVotes: {} as Record<string, number>,
  liked: new Set<string>(),
  saved: new Set<string>(),
  pending: null,
  sheet: null as SheetName,
  toast: null,
});

export const useDemo = create<DemoState>((set, get) => ({
  ...initial(),
  ask: (pending) => set({ pending }),
  cancel: () => set({ pending: null }),
  confirm: () => {
    const p = get().pending;
    if (!p) return;
    const s = get();
    const patch: Partial<DemoState> = { pending: null };
    if (p.kind === 'unlock' || p.kind === 'drop' || p.kind === 'bundle') patch.unlocked = add(s.unlocked, p.targetId);
    if (p.kind === 'subscribe') patch.subscribed = add(s.subscribed, p.targetId);
    if (p.kind === 'vote' && p.extra) {
      patch.votes = { ...s.votes, [p.targetId]: p.extra };
      patch.unlocked = add(s.unlocked, p.targetId);
      const k = `${p.targetId}:${p.extra}`;
      patch.extraVotes = { ...s.extraVotes, [k]: (s.extraVotes[k] ?? 0) + 1 };
    }
    set(patch);
    const msg: Record<PayIntent['kind'], string> = {
      unlock: 'Unlocked · yours forever',
      vote: 'Vote counted · paid to the creator',
      subscribe: 'Subscribed · everything unlocked',
      drop: 'Drop secured · you get every bonus',
      tip: 'Tip sent · 100% to the creator',
      bundle: 'All entries unlocked',
      request: 'Request sent',
    };
    get().notify(msg[p.kind], p.kind === 'vote' || p.kind === 'bundle' ? 'cyan' : p.kind === 'subscribe' ? 'cool' : 'gold');
  },
  toggleFollow: (id) => set((s) => ({ followed: toggle(s.followed, id) })),
  toggleLike: (id) => set((s) => ({ liked: toggle(s.liked, id) })),
  toggleSave: (id) => set((s) => ({ saved: toggle(s.saved, id) })),
  openSheet: (sheet) => set({ sheet }),
  notify: (text, tone = 'gold') => set({ toast: { id: Date.now(), text, tone } }),
  finishOnboarding: (role, favWorlds, follows) =>
    set((s) => ({ onboarded: true, role, favWorlds: favWorlds.length ? favWorlds : s.favWorlds, followed: new Set([...s.followed, ...follows]) })),
  setRole: (role) => set({ role }),
  setVerified: (verified) => set({ verified }),
  reset: () => set(initial()),
}));

/** Votes affichés = votes JSON + votes ajoutés pendant la démo. */
export const useVotes = (challengeId: string, creatorId: string, base: number) =>
  useDemo((s) => base + (s.extraVotes[`${challengeId}:${creatorId}`] ?? 0) * 37);
