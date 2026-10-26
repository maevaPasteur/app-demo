import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { creator as getCreator, fmtPrice, me, subWorldName, videosOf, world as getWorld, toneVar, type Video } from '../data';
import { Media } from '../components/Media';
import { canWatch } from '../lib/access';
import { useDemo } from '../lib/store';
import { Avatar, alpha, haptic } from '../ui';
import { Check, Crown, Heart, Lock, Send, X } from '../ui/Icon';

const SEG_MS = 5000;

/** Stories des créateurs de « Your circle » : barres segmentées, tap gauche/droite, appui long = pause, swipe bas = fermer. */
export default function Stories() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const subscribed = useDemo((s) => s.subscribed);
  const followed = useDemo((s) => s.followed);
  const order = useMemo(() => {
    const base = [...me.circle.subscribed, ...me.circle.following];
    const extra = [...subscribed, ...followed].filter((c) => getCreator(c) && !base.includes(c));
    const all = [...base, ...extra].filter((c) => getCreator(c));
    return all.includes(id) ? all : [id, ...all];
  }, [id, subscribed, followed]);
  const [ci, setCi] = useState(Math.max(0, order.indexOf(id)));
  const [dir, setDir] = useState(1);

  if (!getCreator(id)) return <Navigate to="/" replace />;
  const cid = order[ci];
  const close = () => nav(-1);
  const go = (d: number) => {
    const n = ci + d;
    if (n < 0) return;
    if (n >= order.length) return close();
    setDir(d);
    setCi(n);
  };

  return (
    <div className="relative h-[var(--app-h,100dvh)] overflow-hidden bg-black" style={{ perspective: 1200 }}>
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div key={cid} custom={dir} className="absolute inset-0"
          variants={{
            enter: (d: number) => ({ rotateY: d > 0 ? 75 : -75, x: d > 0 ? '55%' : '-55%', opacity: 0.4 }),
            center: { rotateY: 0, x: 0, opacity: 1 },
            exit: (d: number) => ({ rotateY: d > 0 ? -75 : 75, x: d > 0 ? '-55%' : '55%', opacity: 0.2 }),
          }}
          style={{ transformOrigin: dir > 0 ? 'left center' : 'right center' }}
          initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.7 }}
          onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 700) close(); }}>
          <CreatorStory id={cid} onDone={() => go(1)} onPrevCreator={() => go(-1)} onClose={close} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CreatorStory({ id, onDone, onPrevCreator, onClose }: { id: string; onDone: () => void; onPrevCreator: () => void; onClose: () => void }) {
  const c = getCreator(id);
  const w = getWorld(c.world);
  const segs = useMemo(() => videosOf(id).slice(0, 4), [id]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const bars = useRef<(HTMLDivElement | null)[]>([]);
  const elapsed = useRef(0);
  const followedC = useDemo((s) => s.followed.has(id));
  const subscribedC = useDemo((s) => s.subscribed.has(id));
  const unlockedSet = useDemo((s) => s.unlocked);
  const subscribedSet = useDemo((s) => s.subscribed);
  const { toggleFollow, notify, ask } = useDemo.getState();
  const pending = useDemo((s) => !!s.pending);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false);
  const [likeK, setLikeK] = useState(0);

  const next = useCallback(() => {
    elapsed.current = 0;
    if (i + 1 < segs.length) setI(i + 1);
    else onDone();
  }, [i, segs.length, onDone]);
  const prev = () => {
    elapsed.current = 0;
    if (i > 0) setI(i - 1);
    else onPrevCreator();
  };

  // Progression : rAF qui écrit directement la largeur des barres (pas de re-render)
  const stopped = paused || typing || pending;
  useEffect(() => {
    bars.current.forEach((b, k) => { if (b) b.style.width = k < i ? '100%' : k > i ? '0%' : `${(elapsed.current / SEG_MS) * 100}%`; });
    if (stopped) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      elapsed.current += t - last;
      last = t;
      const b = bars.current[i];
      if (b) b.style.width = `${Math.min(100, (elapsed.current / SEG_MS) * 100)}%`;
      if (elapsed.current >= SEG_MS) { next(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, stopped, next]);

  useEffect(() => { setI(0); elapsed.current = 0; }, [id]);

  const v: Video | undefined = segs[i];
  const locked = v ? !canWatch(v, { unlocked: unlockedSet, subscribed: subscribedSet }) : false;
  const [ended, setEnded] = useState(false);
  useEffect(() => setEnded(false), [v?.id]);

  const down = () => { held.current = false; holdTimer.current = setTimeout(() => { held.current = true; setPaused(true); }, 180); };
  const up = (e: React.PointerEvent) => {
    clearTimeout(holdTimer.current);
    if (held.current) { setPaused(false); held.current = false; return; }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.3) prev(); else next();
  };

  const send = () => {
    if (!draft.trim()) return;
    setDraft('');
    setTyping(false);
    haptic();
    notify(`Reply sent to ${c.handle}`, 'gold');
  };

  return (
    <div className="relative h-full w-full bg-black">
      {/* Média */}
      <div className="absolute inset-0" onPointerDown={down} onPointerUp={up} onPointerCancel={() => { clearTimeout(holdTimer.current); setPaused(false); }}>
        {v && (
          <motion.div key={v.id} className="absolute inset-0" initial={{ opacity: 0.3, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
            <Media video={v} className="absolute inset-0" eager previewSec={locked ? v.freePreviewSec : undefined} onPreviewEnd={() => setEnded(true)} />
          </motion.div>
        )}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.55) 0%,transparent 22%,transparent 62%,rgba(0,0,0,.8) 100%)' }} />

        {/* Verrou abonnés */}
        <AnimatePresence>
          {locked && ended && (
            <motion.div className="absolute inset-0 z-[3] grid place-items-center px-8 text-center"
              initial={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(8,5,16,0)' }} animate={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(8,5,16,.45)' }} exit={{ backdropFilter: 'blur(0px)', opacity: 0 }} transition={{ duration: 0.6 }}>
              <div onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
                <motion.span initial={{ scale: 0.4, y: -30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
                  className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ background: alpha('var(--cool)', 0.2), boxShadow: `inset 0 0 0 1.5px ${alpha('var(--cool)', 0.7)}, 0 0 30px ${alpha('var(--cool)', 0.5)}` }}>
                  <Lock size={26} className="text-cool-300" />
                </motion.span>
                <p className="mt-4 font-display text-[20px] font-bold text-white">Subscribe to see more</p>
                <p className="mt-1 text-[13px] text-white/75">{c.handle} posts full videos for subscribers. Every story unlocked, every month.</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => ask({ kind: 'subscribe', label: `Subscribe to ${c.handle}`, sub: 'Monthly · every video and story unlocked', price: c.subscriptionPrice, targetId: id })}
                  className="shine relative mt-4 inline-flex h-12 items-center gap-2 overflow-hidden rounded-[14px] px-5 font-display text-[15px] font-bold text-white" style={{ background: 'var(--grad-sub)' }}>
                  <Crown size={16} fill="currentColor" />Subscribe · {fmtPrice(c.subscriptionPrice)}/mo
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause */}
        <AnimatePresence>{paused && <motion.div className="pointer-events-none absolute inset-x-0 top-1/2 z-[4] text-center font-display text-[12px] font-bold text-white/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>PAUSED</motion.div>}</AnimatePresence>
      </div>

      {/* Barres segmentées + en-tête */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-3">
        <div className="flex gap-1">
          {segs.map((s, k) => (
            <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <div ref={(el) => { bars.current[k] = el; }} className="h-full rounded-full bg-white" style={{ width: k < i ? '100%' : '0%' }} />
            </div>
          ))}
        </div>
        <div className="pointer-events-auto mt-3 flex items-center gap-2.5">
          <Avatar id={id} size={38} ring={subscribedC ? 'cool' : 'hot'} to={`/creator/${id}`} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[14px] font-semibold text-white">{c.handle}<span className="text-[12px] font-normal text-white/60">{v?.postedAgo ?? ''}</span></p>
            <p className="truncate text-[11px]" style={{ color: toneVar(w.tone) }}>{w.name} · {subWorldName(c.world, c.subWorld)}</p>
          </div>
          {!followedC && !subscribedC && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { haptic(); toggleFollow(id); notify(`Following ${c.handle}`, 'hot'); }} className="h-8 rounded-full bg-hot px-3 font-display text-[12px] font-bold text-white">Follow</motion.button>
          )}
          {!subscribedC ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => ask({ kind: 'subscribe', label: `Subscribe to ${c.handle}`, sub: 'Monthly · every video and story unlocked', price: c.subscriptionPrice, targetId: id })}
              className="flex h-8 items-center gap-1 rounded-full px-3 font-display text-[12px] font-bold text-white" style={{ background: 'var(--grad-sub)' }}><Crown size={12} fill="currentColor" />Sub</motion.button>
          ) : (
            <span className="flex h-8 items-center gap-1 rounded-full px-2.5 font-display text-[11px] font-bold text-cool-300" style={{ background: alpha('var(--cool)', 0.2) }}><Check size={12} />Subscribed</span>
          )}
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white"><X size={18} /></motion.button>
        </div>
      </div>

      {/* Légende + réponse */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {v && <p className="mb-3 px-1 text-[14px] leading-5 text-white/90">{v.caption}</p>}
        <div className="flex items-center gap-2">
          <input value={draft} onFocus={() => setTyping(true)} onBlur={() => setTyping(false)} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={`Reply to ${c.handle}…`} className="h-11 flex-1 rounded-full border border-white/30 bg-black/30 px-4 text-[14px] text-white outline-none backdrop-blur placeholder:text-white/55" />
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => { haptic(); setLikeK(Date.now()); notify(`You liked ${c.handle}'s story`, 'hot'); }} aria-label="Like" className="relative grid h-11 w-11 place-items-center text-white">
            <Heart size={26} className={likeK ? 'fill-hot text-hot' : ''} />
            <AnimatePresence>{likeK > 0 && <motion.span key={likeK} className="absolute text-hot" initial={{ scale: 0.5, opacity: 1, y: 0 }} animate={{ scale: 2.2, opacity: 0, y: -40 }} transition={{ duration: 0.8 }}><Heart size={22} fill="currentColor" /></motion.span>}</AnimatePresence>
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={send} aria-label="Send" className="grid h-11 w-11 place-items-center text-white"><Send size={22} /></motion.button>
        </div>
      </div>
    </div>
  );
}
