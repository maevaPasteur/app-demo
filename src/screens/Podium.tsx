import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { app, fans, podium, world, worlds, type Medal as MedalT } from '../data';
import { Avatar, Counter, Eyebrow, Medal, Tag, Timer, alpha, toneColor } from '../ui';
import { ArrowDown, ArrowUp, ChevronDown, Check, Info, Minus } from '../ui/Icon';
import { hash } from './parts/ProfileCreatorRanking';
import t from '../data/screens/Podium.json';

type Row = { fan: string; points: number; delta: number; rank: number };

/** Classement fans (jokers). Les filtres recalculent un classement déterministe pour la démo. */
function buildBoard(period: 'season' | 'allTime', w: string, s: string): Row[] {
  const base = new Map<string, number>();
  podium.top3.forEach((r) => base.set(r.fan, r.points));
  podium.chase.forEach((r) => base.set(r.fan, r.points));
  fans.forEach((f) => !base.has(f.id) && base.set(f.id, 1500 + (hash(f.id) % 400)));
  const key = `${period}|${w}|${s}`;
  const neutral = key === 'season|all|all';
  const rows = [...base.entries()].map(([fan, p]) => {
    let pts = p;
    if (!neutral) {
      const f = 0.55 + (hash(fan + key) % 90) / 100;
      pts = Math.round(p * f * (period === 'allTime' ? 9.2 : 1) / 10) * 10;
    }
    return { fan, points: pts, delta: neutral && fan === 'me' ? 2 : (hash(fan + key + 'd') % 8) - 3, rank: 0 };
  });
  rows.sort((a, b) => b.points - a.points);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

const fanSub = (id: string) => {
  const f = fans.find((x) => x.id === id);
  return (f?.favoriteWorlds ?? []).slice(0, 2).map((w) => world(w)?.name).join(' · ');
};

function Delta({ d }: { d: number }) {
  if (d === 0) return <span className="flex items-center gap-0.5 text-[11px] font-bold text-muted"><Minus size={11} strokeWidth={3} />0</span>;
  const up = d > 0;
  return (
    <span className="flex items-center gap-0.5 font-display text-[11px] font-bold" style={{ color: up ? 'var(--green)' : 'var(--hot)' }}>
      {up ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}{Math.abs(d)}
    </span>
  );
}

function Select({ label, value, options, onPick }: { label: string; value: string; options: { id: string; name: string; tone?: string }[]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.id === value);
  return (
    <div className="relative flex-1">
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen((o) => !o)} className="flex h-[38px] w-full items-center justify-between rounded-[12px] border border-line bg-panel px-3 text-[12px]">
        <span className="truncate"><span className="text-muted">{label}</span> <b className="font-semibold text-txt">{cur?.name ?? t.all}</b></span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={16} className="text-muted" /></motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-[42px] z-30 max-h-[260px] overflow-y-auto rounded-[14px] border border-line-strong bg-panel-hi p-1 shadow-[0_20px_40px_rgba(0,0,0,.5)]">
            {options.map((o) => (
              <li key={o.id}>
                <button onClick={() => { onPick(o.id); setOpen(false); }} className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13px] hover:bg-white/5">
                  {o.tone && <span className="h-2 w-2 rounded-full" style={{ background: o.tone }} />}
                  <span className="flex-1">{o.name}</span>
                  {o.id === value && <Check size={14} className="text-gold" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const spot: Record<1 | 2 | 3, { medal: MedalT; ring: 'gold' | 'silver' | 'bronze'; bar: number; av: number }> = {
  1: { medal: 'gold', ring: 'gold', bar: 72, av: 84 },
  2: { medal: 'silver', ring: 'silver', bar: 48, av: 64 },
  3: { medal: 'bronze', ring: 'bronze', bar: 36, av: 64 },
};

function PodiumSpot({ r, place }: { r: Row; place: 1 | 2 | 3 }) {
  const s = spot[place];
  const f = fans.find((x) => x.id === r.fan)!;
  return (
    <motion.div layout className={`flex flex-1 flex-col items-center ${place === 1 ? '' : 'pt-10'}`}>
      <motion.div initial={{ y: 30, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: place === 1 ? 0.35 : place === 2 ? 0.2 : 0.1 }} className="relative">
        {place === 1 && <span className="glowpulse absolute -inset-4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,182,39,.45), transparent 70%)' }} />}
        <Avatar id={r.fan} size={s.av} ring={s.ring} to={r.fan === 'me' ? '/me/fan' : undefined} />
        <span className="absolute -bottom-1 -right-1"><Medal medal={s.medal} size={place === 1 ? 38 : 32} /></span>
      </motion.div>
      <p className="mt-3 text-[14px] font-semibold">{f.handle}</p>
      <p className="font-display text-[15px] font-bold" style={{ color: place === 1 ? 'var(--gold)' : 'var(--txt-90)' }}><Counter value={r.points} /> pts</p>
      <p className="text-[11px]" style={{ color: place === 1 ? 'var(--gold)' : 'var(--muted)' }}>{place === 1 ? t.leading : fanSub(r.fan).split(' · ')[0]}</p>
      <motion.div initial={{ height: 0 }} animate={{ height: s.bar }} transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.5 + (3 - place) * 0.08 }}
        className="mt-3 w-[80%] rounded-t-[16px]"
        style={{ background: place === 1 ? 'var(--grad-gold-cta)' : 'linear-gradient(180deg,#2f2442,#1c1529)', boxShadow: place === 1 ? '0 -10px 40px -10px rgba(255,182,39,.6)' : undefined }} />
    </motion.div>
  );
}

/** Figma 803:6618 · Screen Podium */
export default function Podium() {
  const [period, setPeriod] = useState<'season' | 'allTime'>('season');
  const [w, setW] = useState('all');
  const [s, setS] = useState('all');
  const rows = useMemo(() => buildBoard(period, w, s), [period, w, s]);
  const top = rows.slice(0, 3);
  const chase = rows.slice(3, 10);
  const meRow = rows.find((r) => r.fan === 'me')!;
  const ahead = rows[meRow.rank - 2];
  const toNext = ahead ? ahead.points - meRow.points : 0;
  const wOpts = [{ id: 'all', name: t.all }, ...worlds.map((x) => ({ id: x.id, name: x.name, tone: toneColor(x.tone) }))];
  const sOpts = [{ id: 'all', name: t.all }, ...(w === 'all' ? worlds.flatMap((x) => x.subWorlds) : world(w).subWorlds).map((x) => ({ id: x.id, name: x.name }))];

  return (
    <div className="pb-4">
      <header className="flex h-[64px] items-center justify-between px-[18px]">
        <h1 className="font-display text-[26px] font-bold">{podium.title}</h1>
        <Tag accent="gold">Season {app.season.number}</Tag>
      </header>

      {/* Live banner */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 border-y px-[18px] py-3"
        style={{ borderColor: alpha('var(--cool)', 0.45), background: `linear-gradient(90deg, ${alpha('var(--cool)', 0.22)}, ${alpha('var(--cool)', 0.06)})` }}>
        <Avatar id="me" size={42} ring="gold" to="/me/fan" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[16px] font-bold">{podium.live}</p>
          <p className="truncate text-[12px] text-muted">{podium.sub}</p>
        </div>
        <Timer label={podium.endsInLabel} />
      </motion.div>

      {/* Controls */}
      <div className="mt-4 px-[18px]">
        <div className="relative flex h-[46px] rounded-[14px] border border-line bg-panel p-1">
          {(['season', 'allTime'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className="relative z-10 flex-1 font-display text-[14px] font-bold" style={{ color: period === p ? 'var(--on-gold)' : 'var(--muted)' }}>
              {period === p && <motion.span layoutId="podiumtab" className="absolute inset-0 -z-10 rounded-[11px]" style={{ background: 'var(--grad-gold-cta)' }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              {p === 'season' ? t.seasonTab : t.allTimeTab}
            </button>
          ))}
        </div>
        <div className="mt-2.5 flex gap-2.5">
          <Select label={t.worldLabel} value={w} options={wOpts} onPick={(v) => { setW(v); setS('all'); }} />
          <Select label={t.categoryLabel} value={s} options={sOpts} onPick={setS} />
        </div>
      </div>

      {/* Podium */}
      <section className="relative mt-6 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-6 h-56 w-56 -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,182,39,.18), transparent 65%)' }} />
        <p className="relative text-center font-display text-[11px] font-bold tracking-[1.4px] text-txt">{period === 'season' ? t.podiumLabel : t.podiumLabelAllTime}</p>
        <AnimatePresence mode="wait">
          <motion.div key={`${period}${w}${s}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative mt-4 flex items-end px-[18px]">
            {top[1] && <PodiumSpot r={top[1]} place={2} />}
            {top[0] && <PodiumSpot r={top[0]} place={1} />}
            {top[2] && <PodiumSpot r={top[2]} place={3} />}
          </motion.div>
        </AnimatePresence>
        <div className="mx-[18px] h-px bg-line-strong" />
      </section>

      {/* The chase */}
      <section className="mt-6 px-[18px]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[20px] font-bold">{t.chase}</h2>
          <span className="text-[12px] text-muted">{t.chaseRanks}</span>
        </div>
        <motion.ul layout className="mt-3 space-y-2">
          {chase.map((r, i) => {
            const me = r.fan === 'me';
            const f = fans.find((x) => x.id === r.fan)!;
            return (
              <motion.li key={r.fan} layout initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, layout: { type: 'spring', stiffness: 400, damping: 34 } }}>
                <Link to={me ? '/me/fan' : `/fan/${r.fan}`} className="flex h-[60px] items-center gap-3 rounded-[14px] border px-3"
                  style={{ borderColor: me ? alpha('var(--cool)', 0.6) : 'var(--line)', background: me ? alpha('var(--cool)', 0.16) : 'var(--panel)' }}>
                  <span className="w-6 text-center font-display text-[15px] font-bold" style={{ color: me ? 'var(--violet-300)' : 'var(--muted)' }}>{r.rank}</span>
                  <Avatar id={r.fan} size={36} to={false} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[14px] font-semibold">{f.handle}{me && <Tag accent="cool">{t.you}</Tag>}</span>
                    <span className="block truncate text-[11px] text-muted">{fanSub(r.fan)}</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-display text-[14px] font-bold">{r.points.toLocaleString('en-US')} pts</span>
                    <Delta d={r.delta} />
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      </section>

      {/* How to score */}
      <section className="mt-5 px-[18px]">
        <div className="rounded-[14px] border border-line bg-panel p-3.5">
          <p className="flex items-center gap-1.5 font-display text-[13px] font-bold"><Info size={14} className="text-gold" />{t.howTitle}</p>
          <ul className="mt-2 space-y-1 text-[12px] text-muted">{t.how.map((h) => <li key={h}>· {h}</li>)}</ul>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-gold"><Medal medal="gold" size={18} /><Medal medal="silver" size={18} /><Medal medal="bronze" size={18} />{t.rewards}</p>
        </div>
      </section>

      {/* Your position (sticky) */}
      <div className="sticky bottom-[96px] z-10 mt-5 px-[18px] pb-2 pt-6" style={{ background: 'linear-gradient(to top, var(--bg) 62%, transparent)' }}>
        <motion.div layout className="flex h-[68px] items-center gap-3 rounded-[16px] border px-3 shadow-[0_10px_30px_rgba(0,0,0,.5)]" style={{ borderColor: alpha('var(--cool)', 0.7), background: 'linear-gradient(90deg,#2a1f4d,#1d1533)' }}>
          <span className="w-7 text-center font-display text-[16px] font-bold text-cool-300">{meRow.rank}</span>
          <Avatar id="me" size={38} ring="cool" to="/me/fan" />
          <span className="min-w-0 flex-1">
            <Eyebrow className="!text-[9px] !leading-3">{t.yourPosition}</Eyebrow>
            <span className="flex items-center gap-1.5 text-[14px] font-semibold">{fans.find((x) => x.id === 'me')!.handle}<Tag accent="cool">{t.you}</Tag></span>
            <span className="block truncate text-[11px] text-muted">{toNext > 0 ? `${toNext.toLocaleString('en-US')} ${t.toNext}${meRow.rank - 1}` : t.leading}</span>
          </span>
          <span className="flex flex-col items-end">
            <span className="font-display text-[15px] font-bold"><Counter value={meRow.points} /> pts</span>
            <Delta d={meRow.delta} />
          </span>
        </motion.div>
      </div>
    </div>
  );
}
