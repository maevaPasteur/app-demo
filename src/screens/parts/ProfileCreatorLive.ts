import { useEffect } from 'react';
import { create } from 'zustand';
import t from '../../data/screens/ProfileCreator.json';

export type Sale = (typeof t.liveSales)[number] & { k: number };
export type ReqStatus = 'pending' | 'countered' | 'accepted' | 'delivering' | 'delivered' | 'declined';

type LiveState = {
  sales: Sale[];
  added: { month: number; lifetime: number; subscribers: number; votes: number; unlocks: number };
  idx: number;
  req: Record<string, { status: ReqStatus; counter?: number }>;
  push: (s?: { fan: string; kind: string; label: string; amount: number }) => void;
  setReq: (id: string, status: ReqStatus, counter?: number) => void;
};

/** Simulation « créateur à succès » : ventes en direct + demandes de challenges (mémoire, démo). */
export const useCreatorLive = create<LiveState>((set, get) => ({
  sales: [],
  added: { month: 0, lifetime: 0, subscribers: 0, votes: 0, unlocks: 0 },
  idx: 0,
  req: Object.fromEntries(t.requests.map((r) => [r.id, { status: 'pending' as ReqStatus }])),
  push: (custom) => {
    const s = get();
    const base = custom ?? t.liveSales[s.idx % t.liveSales.length];
    const sale: Sale = { ...base, k: Date.now() + Math.random() } as Sale;
    set({
      idx: s.idx + (custom ? 0 : 1),
      sales: [sale, ...s.sales].slice(0, 6),
      added: {
        month: s.added.month + sale.amount,
        lifetime: s.added.lifetime + sale.amount,
        subscribers: s.added.subscribers + (sale.kind === 'sub' ? 1 : 0),
        votes: s.added.votes + (sale.kind === 'vote' ? 1 : 0),
        unlocks: s.added.unlocks + (sale.kind === 'unlock' || sale.kind === 'drop' ? 1 : 0),
      },
    });
  },
  setReq: (id, status, counter) => set((s) => ({ req: { ...s.req, [id]: { status, counter: counter ?? s.req[id]?.counter } } })),
}));

/** Démarre la simulation de ventes tant que la page est montée. */
export function useLiveSales(enabled: boolean) {
  const push = useCreatorLive((s) => s.push);
  useEffect(() => {
    if (!enabled) return;
    const first = setTimeout(push, 2200);
    const iv = setInterval(push, 6000);
    return () => { clearTimeout(first); clearInterval(iv); };
  }, [enabled, push]);
}
