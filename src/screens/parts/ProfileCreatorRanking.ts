import { awards, leaderboards, worlds, type Board, type Medal } from '../../data';

// Utilitaires de classement partagés par ProfileCreator et Awards.
export type Period = 'season' | 'allTime';
export type ScopeRef = { kind: 'global' | 'world' | 'subWorld'; id: string; name: string; worldId?: string };

export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
};

export const boardOf = (s: ScopeRef): Board =>
  s.kind === 'global' ? leaderboards.global : s.kind === 'world' ? leaderboards.worlds[s.id] : leaderboards.subWorlds[s.id];

/** Rang du créateur dans un classement. Absent du top 8 : rang déterministe plus bas, points extrapolés. */
export function rankOf(creatorId: string, s: ScopeRef, per: Period) {
  const rows = boardOf(s)?.[per] ?? [];
  const row = rows.find((r) => r.creator === creatorId);
  const third = rows[2]?.points;
  if (row) {
    return { rank: row.rank, points: row.points, delta: row.delta, toBronze: row.rank > 3 && third ? third - row.points : 0 };
  }
  const h = hash(creatorId + s.id + per);
  const rank = Math.max(rows.length + 1, 9) + (h % 22);
  const last = rows[rows.length - 1]?.points ?? 1000;
  const points = Math.max(120, Math.round(last * (1 - (rank - rows.length) * 0.035)));
  return { rank, points, delta: (h % 7) - 3, toBronze: third ? third - points : 0 };
}

export const medalFor = (rank: number): Medal | null => (rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : null);

/** Médailles gagnées (all-time) agrégées par périmètre. */
export function medalsByScope(creatorId: string) {
  const list = awards.byCreator[creatorId]?.list ?? [];
  const map: Record<string, Record<Medal, number>> = {};
  for (const a of list) {
    const k = `${a.scope}:${a.scopeName}`;
    map[k] ??= { gold: 0, silver: 0, bronze: 0 };
    map[k][a.medal] += 1;
  }
  const totals = { gold: 0, silver: 0, bronze: 0 } as Record<Medal, number>;
  list.forEach((a) => (totals[a.medal] += 1));
  return { map, totals, list };
}

export const globalScope: ScopeRef = { kind: 'global', id: 'global', name: 'Global' };
export const worldScopes = () =>
  worlds.map((w) => ({
    world: { kind: 'world', id: w.id, name: w.name } as ScopeRef,
    tone: w.tone,
    subs: w.subWorlds.map((s) => ({ kind: 'subWorld', id: s.id, name: s.name, worldId: w.id }) as ScopeRef),
  }));
