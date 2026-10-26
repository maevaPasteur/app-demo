import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { challenge as getChallenge, challenges, fmtMoney, person, video as getVideo, world as getWorld, type Challenge } from '../../data';
import { Burst } from '../../components/Burst';
import { DareCard, DropCard, DuelCard } from '../../cards/Cards';
import { VideoThumb } from '../../cards/VideoThumb';
import { useContent } from '../../lib/contentStore';
import { Avatar, Eyebrow, Tag, alpha, toneColor } from '../../ui';
import { Clock, Gift, Sparkle, Swords, Target, Zap } from '../../ui/Icon';
import { OpenDarePreview } from './CreateDarePreview';

/* ---------- Temps réel ---------- */
const LOADED = Date.now();
/** "14h 22m", "1d 2h", "2d 4h" -> fin absolue (relative au chargement de la démo). */
export function endsAtFromLabel(label?: string) {
  if (!label) return LOADED + 86400000;
  let ms = 0;
  for (const [, n, u] of label.matchAll(/(\d+)\s*([dhms])/g)) ms += Number(n) * ({ d: 86400000, h: 3600000, m: 60000, s: 1000 } as const)[u as 'd' | 'h' | 'm' | 's'];
  return LOADED + (ms || 86400000);
}
export function useNow(every = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), every); return () => clearInterval(t); }, [every]);
  return now;
}
export function fmtLeft(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return d ? `${d}d ${p(h)}h ${p(m)}m` : `${p(h)}:${p(m)}:${p(ss)}`;
}
const endOf = (c: Challenge) => (c.id.includes('-new-') && c.endsAt ? Date.parse(c.endsAt) : endsAtFromLabel(c.endsInLabel));

/** Timer rose qui défile à la seconde. */
export function TickTimer({ end, compact }: { end: number; compact?: boolean }) {
  const now = useNow();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-display font-bold tabular-nums text-hot-soft ${compact ? 'h-[22px] px-2 text-[11px]' : 'h-[28px] px-3 text-[12px]'}`} style={{ background: alpha('var(--hot)', 0.14), boxShadow: `inset 0 0 0 1px ${alpha('var(--hot)', 0.4)}` }}>
      <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hot opacity-70" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-hot" /></span>
      {fmtLeft(end - now)}
    </span>
  );
}

/* ---------- Live now : challenges qui se terminent bientôt ---------- */
const kindIcon = { duel: Swords, dare: Target, drop: Gift } as const;
export function LiveNowStrip() {
  const nav = useNavigate();
  useContent((s) => s.version);
  const list = challenges.filter((c) => c.status === 'live' && ('entries' in c ? c.entries.length > 0 : true)).sort((a, b) => endOf(a) - endOf(b)).slice(0, 8);
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between px-[18px]">
        <h2 className="flex items-center gap-2 font-display text-[18px] font-bold"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hot opacity-70" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-hot" /></span>Live now</h2>
        <span className="eyebrow text-muted">ENDING SOON</span>
      </div>
      <div className="no-scrollbar mt-3 flex snap-x gap-2.5 overflow-x-auto px-[18px] pb-1">
        {list.map((c, i) => {
          const w = getWorld(c.world);
          const I = kindIcon[c.type];
          const v = getVideo(c.videos[0]);
          return (
            <motion.button key={c.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => nav(c.videos[0] ? `/video/${c.videos[0]}` : `/world/${c.world}`)}
              className="relative flex h-[118px] w-[210px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[16px] border border-line p-3 text-left">
              {v && <img src={v.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
              <span className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${alpha(toneColor(w.tone), 0.3)}, rgba(8,5,16,.92) 70%)` }} />
              <span className="relative flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[1px]" style={{ color: toneColor(w.tone) }}><I size={13} />{c.type} · {w.name}</span>
              </span>
              <span className="relative line-clamp-2 text-[13px] font-semibold leading-[17px]">{c.title}</span>
              <span className="relative flex items-center justify-between">
                <TickTimer end={endOf(c)} compact />
                {c.type === 'drop' ? <span className="font-display text-[12px] font-bold text-gold">{fmtMoney(c.raised)}</span> : (
                  <span className="flex -space-x-2">{c.entries.slice(0, 3).map((e) => <Avatar key={e.creator} id={e.creator} size={22} to={false} />)}</span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Contenus créés pendant la démo ---------- */
function PendingDuel({ id }: { id: string }) {
  const d = getChallenge(id);
  const rival = useContent((s) => s.pendingRival[id]);
  if (!d || d.type !== 'duel') return null;
  const mine = d.entries[0];
  return (
    <section>
      <div className="flex items-center justify-between px-[18px]">
        <Eyebrow>DUEL · 1 VS 1</Eyebrow>
        <Tag accent="hot" dot>PENDING</Tag>
      </div>
      <p className="mt-2 px-[18px] text-[14px] leading-5 text-txt-90">{d.title}</p>
      <div className="mx-[18px] mt-3 flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5" style={{ borderColor: alpha('var(--hot)', 0.4), background: alpha('var(--hot)', 0.08) }}>
        <Clock size={16} className="text-hot" />
        <p className="flex-1 text-[13px]">Waiting for <b>{person(rival).handle}</b> to accept</p>
        <span className="flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-hot" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />)}</span>
      </div>
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-[18px]">
        <VideoThumb id={mine.video} border="var(--gold)" badge={<Tag accent="gold" solid>YOU</Tag>} />
        <div className="relative grid h-[380px] w-[285px] shrink-0 place-items-center overflow-hidden rounded-[18px] border border-dashed" style={{ borderColor: alpha('var(--cyan)', 0.5), background: `linear-gradient(170deg, ${alpha('var(--cyan)', 0.12)}, var(--panel))` }}>
          <div className="flex flex-col items-center text-center">
            <span className="relative">
              <motion.span className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${alpha('var(--cyan)', 0.6)}` }} animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />
              <Avatar id={rival} size={84} ring="cyan" to={false} />
            </span>
            <p className="mt-3 font-display text-[16px] font-bold">{person(rival).handle}</p>
            <p className="mt-1 text-[12px] text-muted">Invite sent · their entry appears here</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CelebrateLayer({ id }: { id: string }) {
  const cel = useContent((s) => (s.celebrate?.id === id ? s.celebrate : null));
  const [show, setShow] = useState<typeof cel>(null);
  useEffect(() => {
    if (!cel) return;
    setShow(cel);
    const t = setTimeout(() => setShow(null), 1800);
    return () => clearTimeout(t);
  }, [cel?.k]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AnimatePresence>
      {show && (
        <motion.div key={show.k} className="pointer-events-none absolute inset-0 z-30 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Burst count={32} spread={170} />
          <motion.span initial={{ scale: 0.4, y: 10 }} animate={{ scale: [0.4, 1.12, 1], y: 0 }} transition={{ duration: 0.5 }}
            className="relative rounded-full px-4 py-2 font-display text-[14px] font-bold text-on-gold shadow-[0_12px_30px_rgba(0,0,0,.5)]" style={{ background: 'var(--grad-gold-cta)' }}>
            <Sparkle size={13} fill="currentColor" className="mr-1.5 inline" />{show.text}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Carte d'un contenu créé : état en attente, puis carte réelle, avec halo « just posted ». */
export function CreatedCard({ id }: { id: string }) {
  useContent((s) => s.version);
  const phase = useContent((s) => s.phase[id]);
  const highlight = useContent((s) => s.highlight === id);
  const ref = useRef<HTMLDivElement>(null);
  const glow = useAnimationControls();
  const ch = getChallenge(id);

  useEffect(() => {
    if (!highlight) return;
    const el = ref.current;
    const scroller = document.getElementById('app-scroll');
    if (el && scroller) setTimeout(() => {
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 136;
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 350);
    glow.start({ opacity: [0, 1, 0.35, 1, 0.35], transition: { duration: 3.2 } });
    const t = setTimeout(() => useContent.setState({ highlight: null }), 6000);
    return () => clearTimeout(t);
  }, [highlight, glow]);

  if (!ch) return null;
  const w = getWorld(ch.world);
  const c = ch.type === 'drop' ? 'var(--gold)' : ch.type === 'duel' ? 'var(--hot)' : 'var(--cyan)';
  let body: ReactNode;
  if (ch.type === 'duel') body = phase === 'pending' ? <PendingDuel id={id} /> : <DuelCard duel={ch} />;
  else if (ch.type === 'dare') body = ch.entries.length ? <DareCard dare={ch} /> : <OpenDarePreview title={ch.title} world={ch.world} sub={ch.subWorld} invited={[]} daredBy={ch.daredBy} live="Starts now" />;
  else body = <DropCard drop={ch} />;

  return (
    <div ref={ref} className="relative py-3">
      <motion.div className="pointer-events-none absolute inset-x-2 inset-y-0 rounded-[24px]" initial={{ opacity: 0.35 }} animate={glow}
        style={{ boxShadow: `0 0 0 1.5px ${alpha(c, 0.7)}, 0 0 40px -6px ${alpha(c, 0.55)}`, background: `linear-gradient(180deg, ${alpha(c, 0.07)}, transparent 30%)` }} />
      <div className="relative mb-3 flex items-center gap-2 px-[18px]">
        <Tag accent="green" solid><Zap size={11} fill="currentColor" />NEW · JUST POSTED</Tag>
        <span className="text-[11px] text-muted">by you · {w.name}</span>
      </div>
      <div className="relative">{body}</div>
      <CelebrateLayer id={id} />
    </div>
  );
}

/** Bandeau « Your live challenges » : ce que le créateur a lancé pendant la démo. */
export function YourLiveStrip({ onOpen }: { onOpen: (id: string) => void }) {
  const created = useContent((s) => s.created);
  const phase = useContent((s) => s.phase);
  useContent((s) => s.version);
  const nav = useNavigate();
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between px-[18px]">
        <h2 className="font-display text-[18px] font-bold">Your live challenges</h2>
        <button onClick={() => nav('/create/dare')} className="eyebrow text-gold">+ NEW</button>
      </div>
      <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto px-[18px] pb-1">
        {created.length === 0 && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => nav('/create/duel')} className="flex h-[86px] w-full items-center gap-3 rounded-[16px] border border-dashed px-4 text-left" style={{ borderColor: alpha('var(--gold)', 0.5), background: alpha('var(--gold)', 0.05) }}>
            <span className="grid h-11 w-11 place-items-center rounded-[12px] text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}><Sparkle size={20} fill="currentColor" /></span>
            <span><span className="block font-display text-[15px] font-bold">Nothing live yet</span><span className="block text-[12px] text-muted">Start a duel, post a dare or launch a drop</span></span>
          </motion.button>
        )}
        {created.map((id) => {
          const ch = getChallenge(id);
          if (!ch) return null;
          const I = kindIcon[ch.type];
          const pending = phase[id] === 'pending';
          const stat = ch.type === 'drop' ? `${fmtMoney(ch.raised)} · ${ch.buyers} backers` : ch.type === 'dare' ? `${ch.entryCount} ${ch.entryCount === 1 ? 'entry' : 'entries'}` : pending ? 'Waiting to accept' : `${ch.entries[0].pct}% vs ${ch.entries[1]?.pct ?? 0}%`;
          const col = ch.type === 'drop' ? 'var(--gold)' : ch.type === 'duel' ? 'var(--hot)' : 'var(--cyan)';
          return (
            <motion.button key={id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.96 }} onClick={() => onOpen(id)}
              className="flex w-[200px] shrink-0 flex-col gap-2 rounded-[16px] border p-3 text-left" style={{ borderColor: alpha(col, 0.45), background: `linear-gradient(160deg, ${alpha(col, 0.14)}, var(--panel) 70%)` }}>
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[1px]" style={{ color: col }}><I size={13} />{ch.type}</span>
                {pending ? <Tag accent="hot" dot>PENDING</Tag> : <Tag accent="green" dot>LIVE</Tag>}
              </span>
              <span className="line-clamp-1 text-[13px] font-semibold">{ch.title}</span>
              <motion.span key={stat} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-display text-[13px] font-bold" style={{ color: col }}>{stat}</motion.span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Pull to refresh ---------- */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => void; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  const pullRef = useRef(0);
  const set = (v: number) => { pullRef.current = v; setPull(v); };
  const scroller = () => document.getElementById('app-scroll');
  const move = (y: number) => {
    if (start.current === null) return;
    const d = y - start.current;
    set(d <= 0 ? 0 : Math.min(120, d * 0.5));
  };
  const end = () => {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (pullRef.current > 6) {
      // un pull n'est pas un tap : on avale le click qui suit le relâchement
      const stop = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
      window.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 50);
    }
    if (pullRef.current > 64) {
      setBusy(true);
      set(64);
      setTimeout(() => { onRefresh(); setBusy(false); set(0); }, 1100);
    } else set(0);
  };
  const begin = (y: number, mouse: boolean) => {
    if ((scroller()?.scrollTop ?? 1) > 0 || busy) return;
    start.current = y;
    setDragging(true);
    if (mouse) {
      const mm = (e: PointerEvent) => move(e.clientY);
      const up = () => { end(); window.removeEventListener('pointermove', mm); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', mm);
      window.addEventListener('pointerup', up);
    }
  };
  return (
    <div onTouchStart={(e) => begin(e.touches[0].clientY, false)} onTouchMove={(e) => move(e.touches[0].clientY)} onTouchEnd={end}
      onPointerDown={(e) => e.pointerType === 'mouse' && begin(e.clientY, true)} onDragStart={(e) => start.current !== null && e.preventDefault()}>
      <div className="relative overflow-hidden" style={{ height: pull, transition: dragging ? undefined : 'height .35s cubic-bezier(.22,1,.36,1)' }}>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          <motion.span className="grid h-10 w-10 place-items-center rounded-[12px] text-on-gold shadow-[0_8px_24px_-6px_rgba(255,182,39,.7)]" style={{ background: 'var(--grad-gold-cta)', rotate: busy ? undefined : pull * 3 }}
            animate={busy ? { rotate: 360 } : undefined} transition={busy ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : undefined}>
            <Sparkle size={20} fill="currentColor" />
          </motion.span>
          <span className="mt-1.5 text-[11px] font-semibold text-muted">{busy ? 'Loading fresh drops' : pull > 64 ? 'Release to refresh' : 'Pull to refresh'}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
