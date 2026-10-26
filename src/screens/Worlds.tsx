import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { app, leaderboards, person, worlds, type World } from '../data';
import copy from '../data/screens/Worlds.json';
import { TopBar } from '../components/TopBar';
import { useDemo } from '../lib/store';
import { Avatar, Reveal, alpha, toneColor } from '../ui';
import { BarChart3, ChevronRight, Heart, Trophy } from 'lucide-react';
import { WorldIcon } from './parts/WorldIcon';

const ui = app.worldsUi;

export function toggleFav(id: string) {
  const s = useDemo.getState();
  const on = s.favWorlds.includes(id);
  useDemo.setState({ favWorlds: on ? s.favWorlds.filter((x) => x !== id) : [...s.favWorlds, id] });
  s.notify(on ? copy.favRemoved : copy.favAdded, 'hot');
}

/** Figma 88:3 · Screen Worlds */
export default function Worlds() {
  const fav = useDemo((s) => s.favWorlds);
  const nav = useNavigate();
  return (
    <div>
      <TopBar />
      <Reveal className="px-[18px] pt-1">
        <h1 className="font-display text-[30px] font-bold leading-8">{ui.title}</h1>
        <p className="mt-1 text-[14px] leading-5 text-muted">{ui.sub}</p>
      </Reveal>

      {/* Bannière saison */}
      <Reveal delay={0.05} className="mx-[18px] mt-4">
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => nav('/podium')} className="relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] border p-3.5 text-left" style={{ borderColor: alpha('var(--gold)', 0.4), background: `linear-gradient(120deg, ${alpha('var(--gold)', 0.16)}, ${alpha('var(--gold)', 0.03)})` }}>
          <span className="floaty grid h-12 w-12 shrink-0 place-items-center rounded-[14px] text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}><Trophy size={22} /></span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow block text-gold">{copy.seasonBanner.eyebrow}</span>
            <span className="mt-0.5 block font-display text-[15px] font-bold leading-5">{copy.seasonBanner.title}</span>
            <span className="block text-[11px] text-muted">{copy.seasonBanner.sub}</span>
          </span>
          <ChevronRight size={18} className="text-gold" />
          <span className="shine pointer-events-none absolute inset-0" />
        </motion.button>
      </Reveal>

      {/* Favoris */}
      <section className="mt-5 px-[18px]">
        <p className="font-display text-[13px] font-bold uppercase tracking-[.6px]">{ui.favorites}</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {fav.length === 0 && <p className="text-[12px] text-muted">{copy.favEmpty}</p>}
          {fav.map((id) => {
            const w = worlds.find((x) => x.id === id);
            if (!w) return null;
            return (
              <motion.div key={id} layout initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <Link to={`/world/${id}`} className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-line bg-panel-hi px-3 font-display text-[13px] font-semibold">
                  <Heart size={15} className="fill-hot-soft text-hot-soft" />{w.name}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="mt-5 space-y-4 px-[18px]">
        {worlds.map((w, i) => <WorldCard key={w.id} w={w} i={i} fav={fav.includes(w.id)} />)}
      </div>
    </div>
  );
}

function WorldCard({ w, i, fav }: { w: World; i: number; fav: boolean }) {
  const c = toneColor(w.tone);
  const lb = leaderboards.worlds[w.id];
  const champs = [
    { label: copy.champions.allTime, r: lb.allTime[0], color: 'var(--gold)' },
    { label: copy.champions.season, r: lb.season[0], color: 'var(--muted)' },
  ];
  return (
    <Reveal delay={Math.min(i, 2) * 0.05}>
      <div className="relative overflow-hidden rounded-[20px] border border-line p-4 pl-5" style={{ background: 'var(--grad-card)' }}>
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: c }} />
        <span className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full" style={{ background: alpha(c, 0.12), filter: 'blur(24px)' }} />
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[12px]" style={{ background: alpha(c, 0.14), color: c }}><WorldIcon name={w.icon} size={20} /></span>
          <Link to={`/world/${w.id}`} className="flex-1">
            <span className="block font-display text-[22px] font-bold leading-6">{w.name}</span>
            <span className="block text-[11px] text-muted">{w.tagline}</span>
          </Link>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleFav(w.id)} aria-label="Favorite" className="grid h-10 w-10 place-items-center rounded-[12px] border border-line bg-panel-hi">
            <motion.span key={String(fav)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 14 }}>
              <Heart size={20} className={fav ? 'fill-hot text-hot' : 'text-muted'} />
            </motion.span>
          </motion.button>
        </div>

        <div className="mt-3.5 flex items-stretch rounded-[16px] border border-line bg-bg/50">
          {champs.map(({ label, r, color }, k) => (
            <Link key={label} to={`/creator/${r.creator}`} className={`flex flex-1 items-center gap-2.5 px-3 py-3 ${k ? 'border-l border-line' : ''}`}>
              <Avatar id={r.creator} size={40} ring={k ? 'silver' : 'gold'} to={false} />
              <span className="min-w-0">
                <span className="eyebrow block" style={{ color }}>{label}</span>
                <span className="block truncate text-[13px] font-semibold">{person(r.creator)?.handle}</span>
                <span className="block text-[11px] text-muted">{r.points.toLocaleString('en-US')} pts</span>
              </span>
            </Link>
          ))}
          <Link to={`/world/${w.id}?view=ranking`} aria-label={app.worldsUi.ranking} className="grid w-10 place-items-center border-l border-line text-muted"><BarChart3 size={16} /></Link>
        </div>

        <p className="eyebrow mt-4 text-muted-2">{copy.subLabel}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {w.subWorlds.map((s) => (
            <Link key={s.id} to={`/world/${w.id}?sub=${s.id}`} className="inline-flex h-[34px] items-center gap-1 rounded-[10px] px-3 font-display text-[13px] font-semibold" style={{ background: alpha(c, 0.1), boxShadow: `inset 0 0 0 1px ${alpha(c, 0.35)}` }}>
              {s.name}<ChevronRight size={13} style={{ color: c }} />
            </Link>
          ))}
        </div>

        <div className="mt-4">
          <ExploreButton to={`/world/${w.id}`} color={c} label={ui.explore} />
        </div>
      </div>
    </Reveal>
  );
}

export function ExploreButton({ to, color, label }: { to: string; color: string; label: string }) {
  const nav = useNavigate();
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={() => nav(to)} className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] font-display text-[15px] font-bold" style={{ background: alpha(color, 0.16), color, boxShadow: `inset 0 0 0 1px ${alpha(color, 0.55)}` }}>
      {label}<ChevronRight size={16} />
    </motion.button>
  );
}
