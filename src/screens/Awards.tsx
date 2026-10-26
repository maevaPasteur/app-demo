import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { app, awards, creator, world, type Medal as MedalT, type Tone } from '../data';
import { Medal, NavHeader, ProgressBar, Tag, alpha, toneColor } from '../ui';
import { ArrowDown, ArrowUp, ChevronDown, Minus, Trophy } from '../ui/Icon';
import { globalScope, medalFor, medalsByScope, rankOf, worldScopes, type Period, type ScopeRef } from './parts/ProfileCreatorRanking';
import t from '../data/screens/Awards.json';

const ME = app.me.creator;
const ord = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `#${n}`);
type Filter = 'all' | 'earned' | 'unlock';

function DeltaBadge({ d }: { d: number }) {
  const c = d > 0 ? 'var(--green)' : d < 0 ? 'var(--hot)' : 'var(--muted)';
  return (
    <span className="inline-flex h-[17px] items-center gap-0.5 rounded-[6px] px-1 font-display text-[10px] font-bold" style={{ background: alpha(c, 0.18), color: c }}>
      {d > 0 ? <ArrowUp size={10} strokeWidth={3} /> : d < 0 ? <ArrowDown size={10} strokeWidth={3} /> : <Minus size={10} strokeWidth={3} />}{d ? Math.abs(d) : ''}
    </span>
  );
}

/** Pastille de rang : médaille si top 3, sinon cercle pointillé avec le rang. */
function RankBadge({ rank, size = 52 }: { rank: number; size?: number }) {
  const m = medalFor(rank);
  if (m) return <motion.span initial={{ scale: 0.5, rotate: -20 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}><Medal medal={m} size={size + 10} /></motion.span>;
  return <span className="grid shrink-0 place-items-center rounded-full border-2 border-dashed border-line-strong font-display font-bold text-muted" style={{ width: size, height: size, fontSize: size * 0.32 }}>{rank}</span>;
}

/** Pile de médailles gagnées (all-time). */
function MedalStack({ counts, size = 40 }: { counts?: Record<MedalT, number>; size?: number }) {
  const ms = counts ? (['gold', 'silver', 'bronze'] as const).flatMap((m) => Array(counts[m]).fill(m) as MedalT[]) : [];
  if (!ms.length) return <span className="grid shrink-0 place-items-center rounded-full border-2 border-dashed border-line-strong" style={{ width: size, height: size }} />;
  return (
    <span className="flex">
      {ms.slice(0, 3).map((m, i) => (
        <motion.span key={i} initial={{ x: -10, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} style={{ marginLeft: i ? -size * 0.55 : 0 }}><Medal medal={m} size={size + 8} /></motion.span>
      ))}
    </span>
  );
}
const countLine = (c?: Record<MedalT, number>) =>
  c ? (['gold', 'silver', 'bronze'] as const).filter((m) => c[m]).map((m) => `${c[m]}x ${awards.ui.medals[m]}`).join(' · ') : '';

/** Figma 119:589 (saison) et 130:663 (all-time). */
export default function Awards() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const per: Period = pathname.endsWith('all-time') ? 'allTime' : 'season';
  const [filter, setFilter] = useState<Filter>('all');
  const [moreWorlds, setMoreWorlds] = useState(false);
  const [moreWins, setMoreWins] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { map, totals, list } = medalsByScope(ME);
  const home = creator(ME).world;

  const medalsOf = (s: ScopeRef) => map[`${s.kind}:${s.name}`];
  const earned = (s: ScopeRef) => (per === 'season' ? rankOf(ME, s, per).rank <= 3 : !!medalsOf(s));
  const pass = (s: ScopeRef) => filter === 'all' || (filter === 'earned' ? earned(s) : !earned(s));

  const groups = useMemo(() => {
    const g = worldScopes().map((w) => ({ ...w, best: Math.min(...[w.world, ...w.subs].map((s) => rankOf(ME, s, per).rank)) }));
    return g.sort((a, b) => (a.world.id === home ? -1 : b.world.id === home ? 1 : a.best - b.best));
  }, [per, home]);
  const allScopes = [globalScope, ...groups.flatMap((g) => [g.world, ...g.subs])];
  const nEarned = allScopes.filter(earned).length;
  const g = rankOf(ME, globalScope, per);
  const visible = groups.filter((w) => [w.world, ...w.subs].some(pass));
  const shownGroups = moreWorlds ? visible : visible.slice(0, 4);

  return (
    <div className="pb-6">
      <NavHeader title={t.title} back="/me/creator" />

      {/* Toggle */}
      <div className="px-[18px]">
        <div className="relative flex h-[46px] rounded-[14px] border border-line bg-panel p-1">
          {(['season', 'allTime'] as const).map((p) => (
            <button key={p} onClick={() => nav(p === 'season' ? '/awards' : '/awards/all-time', { replace: true })} className="relative z-10 flex-1 font-display text-[14px] font-bold" style={{ color: per === p ? 'var(--on-gold)' : 'var(--muted)' }}>
              {per === p && <motion.span layoutId="awards-tab" className="absolute inset-0 -z-10 rounded-[11px]" style={{ background: 'var(--grad-gold-cta)' }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              {p === 'season' ? t.seasonTab : t.allTimeTab}
            </button>
          ))}
        </div>
      </div>

      {/* Résumé */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-[18px] mt-3 rounded-[16px] border p-3.5" style={{ borderColor: 'var(--gold)', background: `linear-gradient(135deg, ${alpha('var(--gold)', 0.12)}, transparent 70%)` }}>
        {per === 'season' ? (
          <>
            <div className="flex items-baseline justify-between">
              <p className="font-display"><b className="text-[24px] text-gold">{nEarned}</b> <span className="text-[13px] text-muted">/{allScopes.length}</span></p>
              <p className="text-[12px] text-muted">{t.inContention}</p>
            </div>
            <div className="mt-2"><ProgressBar pct={(100 * nEarned) / allScopes.length} /></div>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <p className="font-display"><b className="text-[24px] text-gold">{list.length}</b> <span className="text-[13px] text-muted">{t.medals}</span></p>
              <p className="text-[12px] text-muted">{t.collected}</p>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {(['gold', 'silver', 'bronze'] as const).map((m) => (
                <span key={m} className="flex items-center justify-center gap-1.5 rounded-[10px] border border-line bg-ink py-1.5"><Medal medal={m} size={28} /><b className="font-display text-[15px]">{totals[m]}</b><span className="text-[11px] text-muted">{awards.ui.medals[m]}</span></span>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Filtres */}
      <div className="mt-3 flex gap-2 px-[18px]">
        {(['all', 'earned', 'unlock'] as const).map((f) => {
          const n = f === 'earned' ? nEarned : f === 'unlock' ? allScopes.length - nEarned : 0;
          const on = filter === f;
          return (
            <motion.button key={f} whileTap={{ scale: 0.94 }} onClick={() => setFilter(f)} className="h-[32px] rounded-[10px] border px-3 text-[12px] font-semibold"
              style={{ borderColor: on ? alpha('var(--gold)', 0.6) : 'var(--line)', background: on ? alpha('var(--gold)', 0.12) : 'var(--panel)', color: on ? 'var(--gold)' : 'var(--muted)' }}>
              {t.filters[f]}{n ? <span className="ml-1 opacity-70">{n}</span> : null}
            </motion.button>
          );
        })}
      </div>

      {/* Global */}
      {pass(globalScope) && (
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => nav('/podium')} className="mx-[18px] mt-3 flex w-[calc(100%-36px)] items-center gap-3.5 rounded-[16px] border border-line-strong bg-panel-hi p-3.5 text-left">
          <span className="relative">{per === 'season' ? <RankBadge rank={g.rank} /> : <MedalStack counts={medalsOf(globalScope)} size={44} />}{per === 'season' && <span className="absolute -right-2 -top-1"><DeltaBadge d={g.delta} /></span>}</span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow block text-muted">{t.globalRanking}</span>
            <span className="block font-display text-[20px] font-bold">Global</span>
            <span className="block text-[12px] text-muted">
              {per === 'season' ? <><b className="text-gold">{g.points.toLocaleString('en-US')}</b> {t.pts} · #{g.rank}{g.rank > 3 ? ` · ${t.reachTop3}` : ''}</> : <span className="text-gold">{countLine(medalsOf(globalScope)) || t.noMedal}</span>}
            </span>
          </span>
        </motion.button>
      )}

      {/* Mondes */}
      <AnimatePresence mode="popLayout">
        {shownGroups.map((w, gi) => {
          const tone = toneColor(w.tone as Tone);
          const subs = w.subs.filter(pass);
          const wr = rankOf(ME, w.world, per);
          const top = per === 'season' ? wr.rank <= 3 : !!medalsOf(w.world);
          const nE = [w.world, ...w.subs].filter(earned).length;
          const nMedals = [w.world, ...w.subs].reduce((s, x) => { const c = medalsOf(x); return s + (c ? c.gold + c.silver + c.bronze : 0); }, 0);
          const isCol = collapsed[w.world.id];
          return (
            <motion.section key={w.world.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: gi * 0.05 }} className="mx-[18px] mt-4 rounded-[18px] border border-line bg-panel p-3">
              <button onClick={() => setCollapsed((c) => ({ ...c, [w.world.id]: !isCol }))} className="flex w-full items-center gap-2 px-1 py-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone }} />
                <span className="flex-1 text-left font-display text-[16px] font-bold">{w.world.name}</span>
                <span className="font-display text-[12px] font-bold text-gold">{per === 'season' ? <>{nE}<span className="text-muted">/{w.subs.length + 1}</span></> : `${nMedals} ${nMedals === 1 ? t.medal : t.medals}`}</span>
                <motion.span animate={{ rotate: isCol ? -90 : 0 }}><ChevronDown size={16} className="text-muted" /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {!isCol && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    {pass(w.world) && (
                      <button onClick={() => nav(`/world/${w.world.id}`)} className={`relative mt-2 flex w-full items-center gap-3.5 overflow-hidden rounded-[14px] p-3 text-left ${top ? 'border' : 'border border-dashed border-line-strong'}`}
                        style={top ? { borderColor: tone, background: alpha(tone, 0.08) } : { background: 'var(--ink-700)' }}>
                        <span className="absolute inset-y-0 left-0 w-1" style={{ background: tone }} />
                        <span className="relative ml-1">{per === 'season' ? <RankBadge rank={wr.rank} size={46} /> : <MedalStack counts={medalsOf(w.world)} size={42} />}{per === 'season' && <span className="absolute -right-2 -top-1"><DeltaBadge d={wr.delta} /></span>}</span>
                        <span className="min-w-0 flex-1">
                          <span className="eyebrow flex items-center gap-1.5 text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />{t.world}</span>
                          <span className="block font-display text-[18px] font-bold">{w.world.name}</span>
                          <span className="block text-[12px] text-muted">
                            {per === 'season' ? `${ord(wr.rank)} · ${wr.points.toLocaleString('en-US')} ${t.pts}${wr.rank > 3 && wr.rank < 12 ? ` · ${wr.rank - 3} ${t.toBronze}` : ''}` : countLine(medalsOf(w.world)) || t.noWorldMedal}
                          </span>
                        </span>
                      </button>
                    )}
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {subs.map((s, i) => {
                        const r = rankOf(ME, s, per);
                        const c = medalsOf(s);
                        const ok = per === 'season' ? r.rank <= 3 : !!c;
                        return (
                          <motion.button key={s.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => nav(`/world/${w.world.id}`)}
                            className={`relative flex flex-col items-center rounded-[14px] px-1.5 pb-2.5 pt-3.5 ${ok ? 'border border-line bg-ink' : 'border border-dashed border-line-strong bg-ink/60'}`}>
                            {per === 'season' && <span className="absolute right-1.5 top-1.5"><DeltaBadge d={r.delta} /></span>}
                            {per === 'season' ? <RankBadge rank={r.rank} size={40} /> : <MedalStack counts={c} size={36} />}
                            <span className="mt-2 text-[12px] font-semibold">{s.name}</span>
                            <span className="text-[10px] text-muted">{per === 'season' ? `${ord(r.rank)} · ${r.points.toLocaleString('en-US')} ${t.pts}` : countLine(c) || t.noMedal}</span>
                            {per === 'season' && r.rank > 3 && r.rank <= 6 && <span className="mt-1.5 rounded-[6px] px-1.5 py-0.5 font-display text-[10px] font-bold text-on-gold" style={{ background: 'var(--gold)' }}>{r.rank - 3} {t.toBronze}</span>}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </AnimatePresence>
      {!visible.length && <p className="mt-6 px-[18px] text-center text-[13px] text-muted">{t.emptyFilter}</p>}
      {visible.length > 4 && (
        <button onClick={() => setMoreWorlds((m) => !m)} className="mx-auto mt-3 block text-[13px] font-semibold text-cool-300">
          {moreWorlds ? t.lessWorlds : t.moreWorlds.replace('{n}', String(visible.length - 4))}
        </button>
      )}

      {/* Wins */}
      <div className="mt-7 flex items-center justify-between px-[18px]">
        <p className="eyebrow text-muted">{t.wins}</p>
        <p className="text-[12px] font-semibold text-txt-90">{t.winsCount}</p>
      </div>
      <motion.ul layout className="mt-2.5 space-y-2.5 px-[18px]">
        {(moreWins ? t.winsList : t.winsList.slice(0, 3)).map((wn, i) => {
          const tone = toneColor((world(wn.world.toLowerCase())?.tone ?? 'cyan') as Tone);
          return (
            <motion.li key={wn.title} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <button onClick={() => nav(wn.to)} className="flex w-full items-center gap-3 rounded-[16px] border border-line bg-panel p-3.5 text-left">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}><Trophy size={22} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap gap-1">
                    <Tag accent={wn.type === 'DUEL' ? 'hot' : 'cyan'}>{wn.type}</Tag>
                    <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 font-display text-[11px] font-bold" style={{ background: alpha(tone, 0.12), color: tone }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />{wn.world.toUpperCase()}</span>
                    <Tag>{wn.sub.toUpperCase()}</Tag>
                  </span>
                  <span className="mt-1.5 block text-[13px] font-semibold leading-[18px]">{wn.title}</span>
                  <span className="block text-[11px] text-muted">{wn.vs}</span>
                </span>
                <span className="text-right"><span className="block font-display text-[18px] font-bold text-gold">+{wn.pts}</span><span className="text-[10px] text-muted">{t.pts}</span></span>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>
      <button onClick={() => setMoreWins((m) => !m)} className="mx-auto mt-3 block text-[13px] font-semibold text-cool-300">{moreWins ? t.fewerWins : t.seeAllWins}</button>
    </div>
  );
}
