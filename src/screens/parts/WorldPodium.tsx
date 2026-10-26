import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtNum, person, type LeaderRow } from '../../data';
import copy from '../../data/screens/Worlds.json';
import { Avatar, Counter, Medal, alpha } from '../../ui';
import { ArrowDown, ArrowUp, Trophy } from '../../ui/Icon';

const t = copy.world;

/** Figma 372:4951 : podium 2-1-3 + toggle saison / all-time + classement complet dépliable. */
export function WorldPodium({ season, allTime, title }: { season: LeaderRow[]; allTime: LeaderRow[]; title?: string }) {
  const [tab, setTab] = useState<0 | 1>(0);
  const [full, setFull] = useState(false);
  const rows = tab === 0 ? season : allTime;
  const [first, second, third] = rows;
  const spots = [
    { r: second, h: 48, ring: 'silver' as const, medal: 'silver' as const, size: 58 },
    { r: first, h: 72, ring: 'gold' as const, medal: 'gold' as const, size: 78 },
    { r: third, h: 38, ring: 'bronze' as const, medal: 'bronze' as const, size: 54 },
  ];
  return (
    <div className="mx-[18px] rounded-[20px] border border-line bg-panel p-4" style={{ background: 'var(--grad-card)' }}>
      <div className="flex items-center justify-between">
        <span className="eyebrow text-gold">{title ?? t.leaderboard}</span>
        <span className="eyebrow text-muted-2">{t.seasonLeft}</span>
      </div>
      <div className="relative mt-3 flex h-[46px] rounded-[14px] border border-line bg-ink p-1">
        {t.seasonTabs.map((label, i) => (
          <button key={label} onClick={() => setTab(i as 0 | 1)} className="relative z-10 flex-1 font-display text-[14px] font-bold" style={{ color: tab === i ? 'var(--on-gold)' : 'var(--muted)' }}>
            {tab === i && <motion.span layoutId={`wp-tab-${title ?? ''}`} className="absolute inset-0 -z-10 rounded-[11px]" style={{ background: 'var(--grad-gold-cta)' }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="mt-5 grid grid-cols-3 items-end gap-2">
          {spots.map(({ r, h, ring, medal, size }, i) =>
            r ? (
              <div key={r.creator} className="flex flex-col items-center text-center">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.08 * i, type: 'spring', stiffness: 380, damping: 20 }} className="relative">
                  {i === 1 && <span className="glowpulse absolute -inset-3 rounded-full" style={{ background: alpha('var(--gold)', 0.25), filter: 'blur(14px)' }} />}
                  <Avatar id={r.creator} size={size} ring={ring} />
                  <span className="absolute -bottom-1 -right-1"><Medal medal={medal} size={i === 1 ? 30 : 24} /></span>
                </motion.div>
                <Link to={`/creator/${r.creator}`} className="mt-2.5 max-w-full truncate text-[13px] font-semibold">{person(r.creator)?.handle}</Link>
                <p className={`font-display text-[15px] font-bold ${i === 1 ? 'text-gold' : 'text-txt-90'}`}><Counter value={r.points} /></p>
                <p className="text-[11px]" style={{ color: i === 1 ? 'var(--gold)' : 'var(--muted-2)' }}>{i === 1 ? t.leading : `-${fmtNum(first.points - r.points)}`}</p>
                <motion.div initial={{ height: 0 }} animate={{ height: h }} transition={{ delay: 0.15 + 0.06 * i, type: 'spring', stiffness: 160, damping: 20 }} className="mt-2 w-full rounded-t-[14px]" style={{ background: i === 1 ? 'var(--grad-gold-cta)' : 'var(--panel-hi)' }} />
              </div>
            ) : <div key={i} />,
          )}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {full && (
          <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {rows.slice(3, 8).map((r) => (
              <li key={r.creator} className="flex items-center gap-3 border-t border-line py-2.5 first:mt-3">
                <span className="w-6 text-center font-display text-[13px] font-bold text-muted">{r.rank}</span>
                <Avatar id={r.creator} size={32} />
                <span className="flex-1 truncate text-[13px] font-semibold">{person(r.creator)?.handle}</span>
                <span className="flex items-center gap-0.5 text-[11px]" style={{ color: r.delta > 0 ? 'var(--green)' : r.delta < 0 ? 'var(--danger)' : 'var(--muted-2)' }}>
                  {r.delta > 0 ? <ArrowUp size={11} /> : r.delta < 0 ? <ArrowDown size={11} /> : null}{r.delta !== 0 ? Math.abs(r.delta) : '·'}
                </span>
                <span className="w-16 text-right font-display text-[13px] font-bold text-txt-90">{fmtNum(r.points)}</span>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setFull(!full)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-ink font-display text-[13px] font-bold">
        <Trophy size={14} className="text-gold" />{full ? t.hideRanking : t.fullRanking}
      </motion.button>
    </div>
  );
}
