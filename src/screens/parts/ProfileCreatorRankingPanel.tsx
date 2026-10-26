import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { creator, person } from '../../data';
import { Avatar, Counter, Medal, Tag, alpha, toneColor } from '../../ui';
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, Globe, Minus } from '../../ui/Icon';
import { boardOf, globalScope, medalFor, rankOf, worldScopes, type Period, type ScopeRef } from './ProfileCreatorRanking';
import t from '../../data/screens/ProfileCreator.json';

function Delta({ d }: { d: number }) {
  if (!d) return <span className="flex items-center text-[11px] font-bold text-muted"><Minus size={11} strokeWidth={3} />0</span>;
  return (
    <span className="flex items-center gap-0.5 font-display text-[11px] font-bold" style={{ color: d > 0 ? 'var(--green)' : 'var(--hot)' }}>
      {d > 0 ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}{Math.abs(d)}
    </span>
  );
}

const RankPill = ({ rank }: { rank: number }) => {
  const m = medalFor(rank);
  return m ? <Medal medal={m} size={24} /> : <span className="min-w-[30px] rounded-full bg-panel-hi px-1.5 py-0.5 text-center font-display text-[11px] font-bold text-muted">#{rank}</span>;
};

/** Sélecteur hiérarchique Global > Monde > Sous-monde, rang affiché à côté de chaque entrée. */
function ScopeSelect({ me, per, value, onPick }: { me: string; per: Period; value: ScopeRef; onPick: (s: ScopeRef) => void }) {
  const [open, setOpen] = useState(false);
  const home = creator(me).world;
  const [expanded, setExpanded] = useState<string | null>(home);
  const tree = worldScopes();
  const cur = rankOf(me, value, per).rank;
  return (
    <div className="relative">
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setOpen((o) => !o)} className="flex h-[46px] w-full items-center gap-2.5 rounded-[14px] border border-line-strong bg-panel px-3.5 text-left">
        <Globe size={16} className="text-muted" />
        <span className="flex-1 truncate text-[14px]">
          <span className="text-muted">{value.kind === 'subWorld' ? `${tree.find((x) => x.world.id === value.worldId)?.world.name} › ` : ''}</span>
          <b className="font-semibold">{value.name}</b>
        </span>
        <RankPill rank={cur} />
        <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={16} className="text-muted" /></motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
            className="absolute inset-x-0 top-[52px] z-30 max-h-[340px] overflow-y-auto rounded-[16px] border border-line-strong bg-panel-hi p-1.5 shadow-[0_24px_50px_rgba(0,0,0,.6)]">
            <Row label="Global" rank={rankOf(me, globalScope, per).rank} active={value.id === 'global'} onClick={() => { onPick(globalScope); setOpen(false); }} />
            {tree.map((w) => (
              <div key={w.world.id}>
                <div className="flex items-center">
                  <button onClick={() => setExpanded(expanded === w.world.id ? null : w.world.id)} className="grid h-9 w-7 place-items-center text-muted" aria-label="Expand">
                    <motion.span animate={{ rotate: expanded === w.world.id ? 90 : 0 }}><ChevronRight size={14} /></motion.span>
                  </button>
                  <div className="flex-1">
                    <Row label={w.world.name} dot={toneColor(w.tone)} rank={rankOf(me, w.world, per).rank} active={value.id === w.world.id} onClick={() => { onPick(w.world); setOpen(false); }} />
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {expanded === w.world.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-9">
                      {w.subs.map((s) => (
                        <Row key={s.id} label={s.name} small rank={rankOf(me, s, per).rank} active={value.id === s.id} onClick={() => { onPick(s); setOpen(false); }} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, rank, active, onClick, dot, small }: { label: string; rank: number; active: boolean; onClick: () => void; dot?: string; small?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-[10px] px-2.5 ${small ? 'h-[34px] text-[13px] text-txt-90' : 'h-[38px] text-[14px] font-semibold'} ${active ? 'bg-white/[.06]' : ''}`}>
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      <span className="flex-1 text-left">{label}</span>
      {active && <Check size={14} className="text-gold" />}
      <RankPill rank={rank} />
    </button>
  );
}

/** Classement : toggle saison/all-time + sélecteur + hero + leaderboard live. */
export function RankingPanel({ me }: { me: string }) {
  const [per, setPer] = useState<Period>('season');
  const c = creator(me);
  const tree = worldScopes();
  const sub = tree.find((w) => w.world.id === c.world)!.subs.find((s) => s.id === c.subWorld)!;
  const [scope, setScope] = useState<ScopeRef>(sub);
  const r = rankOf(me, scope, per);
  const medal = medalFor(r.rank);

  // Leaderboard live : de petits gains arrivent en continu, le classement se réordonne.
  const base = useMemo(() => {
    const rows = [...(boardOf(scope)?.[per] ?? [])].map((x) => ({ ...x }));
    if (!rows.some((x) => x.creator === me)) rows.push({ rank: r.rank, creator: me, points: r.points, delta: r.delta });
    return rows;
  }, [scope, per, me, r.rank, r.points, r.delta]);
  const [live, setLive] = useState(base);
  useEffect(() => {
    setLive(base);
    const id = setInterval(() => {
      setLive((rows) => {
        const n = rows.map((x) => ({ ...x }));
        const i = Math.floor(Math.random() * Math.min(5, n.length));
        n[i].points += 10 * (1 + Math.floor(Math.random() * 6));
        const top = n.filter((x) => x.rank <= 8).sort((a, b) => b.points - a.points);
        top.forEach((x, k) => (x.rank = k + 1));
        return [...top, ...n.filter((x) => x.rank > 8 && !top.includes(x))];
      });
    }, 2600);
    return () => clearInterval(id);
  }, [base]);
  const shown = live.filter((x) => x.rank <= 5);
  const meRow = live.find((x) => x.creator === me);

  return (
    <div className="mx-[18px] mt-2.5 rounded-[18px] border border-line bg-panel p-3.5">
      <div className="relative flex h-[40px] rounded-[12px] border border-line bg-ink p-1">
        {(['season', 'allTime'] as const).map((p) => (
          <button key={p} onClick={() => setPer(p)} className="relative z-10 flex-1 font-display text-[13px] font-bold" style={{ color: per === p ? 'var(--on-gold)' : 'var(--muted)' }}>
            {per === p && <motion.span layoutId="pc-rank-tab" className="absolute inset-0 -z-10 rounded-[9px]" style={{ background: 'var(--grad-gold-cta)' }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            {p === 'season' ? 'This season' : 'All-time'}
          </button>
        ))}
      </div>
      <div className="mt-2.5"><ScopeSelect me={me} per={per} value={scope} onPick={setScope} /></div>

      {/* Hero */}
      <AnimatePresence mode="wait">
        <motion.div key={scope.id + per} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
          className="relative mt-3 flex items-center gap-4 overflow-hidden rounded-[16px] border p-4"
          style={{ borderColor: medal ? alpha('var(--gold)', 0.5) : 'var(--line)', background: medal ? `linear-gradient(135deg, ${alpha('var(--gold)', 0.16)}, transparent 70%)` : 'var(--ink-700)' }}>
          {medal ? <motion.div initial={{ rotate: -30, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}><Medal medal={medal} size={64} laurel /></motion.div> : (
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-dashed border-line-strong font-display text-[22px] font-bold text-muted">{r.rank}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-[22px] font-bold leading-6">#{r.rank} <span className="text-[14px] font-semibold text-muted">{scope.kind === 'global' ? t.worldwide : `${t.in} ${scope.name}`}</span></p>
            <p className="mt-1 flex items-center gap-2 text-[12px] text-muted"><span className="font-display font-bold text-gold"><Counter value={r.points} /> pts</span><Delta d={r.delta} /></p>
            <p className="mt-1.5 text-[11px]" style={{ color: medal ? 'var(--gold)' : 'var(--muted)' }}>
              {medal ? `${t.holding} ${medal} · ${per === 'season' ? t.inContention : 'all-time'}` : r.toBronze > 0 ? `${r.toBronze.toLocaleString('en-US')} ${t.toBronze}` : t.outside}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Leaderboard */}
      <div className="mt-3 flex items-center justify-between">
        <p className="font-display text-[14px] font-bold">{t.leaderboard}</p>
        <span className="flex items-center gap-1.5 text-[11px] text-hot-soft"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hot" />{t.rankingSub}</span>
      </div>
      <motion.ul layout className="mt-2 space-y-1.5">
        {shown.map((x) => <LbRow key={x.creator} row={x} me={x.creator === me} />)}
        {meRow && meRow.rank > 5 && (
          <>
            <li className="text-center text-[11px] leading-3 text-muted-2">···</li>
            <LbRow row={meRow} me />
          </>
        )}
      </motion.ul>
    </div>
  );
}

function LbRow({ row, me }: { row: { rank: number; creator: string; points: number; delta: number }; me: boolean }) {
  const m = medalFor(row.rank);
  return (
    <motion.li layout transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
      <Link to={`/creator/${row.creator}`} className="flex h-[46px] items-center gap-2.5 rounded-[12px] px-2.5"
        style={{ background: me ? alpha('var(--gold)', 0.1) : 'var(--ink-700)', boxShadow: me ? `inset 0 0 0 1px ${alpha('var(--gold)', 0.45)}` : undefined }}>
        <span className="grid w-6 place-items-center">{m ? <Medal medal={m} size={24} /> : <span className="font-display text-[13px] font-bold text-muted">{row.rank}</span>}</span>
        <Avatar id={row.creator} size={28} to={false} />
        <span className="flex flex-1 items-center gap-1.5 truncate text-[13px] font-semibold">{person(row.creator).handle}{me && <Tag accent="gold">{t.you}</Tag>}</span>
        <motion.span key={row.points} initial={{ color: '#ffd37a', scale: 1.08 }} animate={{ color: '#f4eff8', scale: 1 }} transition={{ duration: 0.6 }} className="font-display text-[13px] font-bold">{row.points.toLocaleString('en-US')}</motion.span>
      </Link>
    </motion.li>
  );
}
