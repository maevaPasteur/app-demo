import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { fmtCount, person, subWorldName, video as getVideo, videos, world as getWorld, toneVar, type Video } from '../data';
import { CommentsSheet } from '../components/CommentsSheet';
import { LockedPreview, usePreviewState } from '../components/LockedPreview';
import { Media, type MediaHandle } from '../components/Media';
import { ShareSheet } from '../components/ShareSheet';
import { useCanWatch, unlockIntent } from '../lib/access';
import { useDemo } from '../lib/store';
import { Avatar, alpha, haptic } from '../ui';
import { ArrowLeft, Bookmark, Check, ChevronDown, Heart, LockOpen, MessageSquare, Pause, Play, Plus, Share2, Volume2, VolumeX } from '../ui/Icon';

let hintShown = false;

/** Lecteur immersif vertical façon TikTok : swipe entre vidéos, preview gratuite puis flou, double tap like. */
export default function Watch() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const start = getVideo(id);
  const list = useMemo(() => {
    if (!start) return [];
    const same = videos.filter((v) => v.world === start.world && v.id !== start.id);
    const rest = videos.filter((v) => v.world !== start.world);
    return [start, ...same, ...rest].slice(0, 24);
  }, [start]);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [sheet, setSheet] = useState<'comments' | 'share' | null>(null);
  const [hint, setHint] = useState(!hintShown);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); });
    }, { root: el, threshold: 0.6 });
    el.querySelectorAll('[data-i]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [list]);

  useEffect(() => {
    if (!hint) return;
    hintShown = true;
    const t = setTimeout(() => setHint(false), 2800);
    return () => clearTimeout(t);
  }, [hint]);
  useEffect(() => { if (active > 0) setHint(false); }, [active]);

  if (!start) return <Navigate to="/" replace />;
  const cur = list[active] ?? start;

  return (
    <div className="relative h-[var(--app-h,100dvh)] overflow-hidden bg-black">
      <div ref={scroller} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto overscroll-contain">
        {list.map((v, i) => (
          <div key={v.id} data-i={i} className="relative h-full w-full snap-start snap-always">
            {Math.abs(i - active) <= 2 ? (
              <Slide v={v} active={i === active} muted={muted} onComments={() => setSheet('comments')} onShare={() => setSheet('share')} onMute={() => setMuted((m) => !m)} />
            ) : (
              <img src={v.poster} alt="" className="h-full w-full object-cover opacity-60" />
            )}
          </div>
        ))}
      </div>

      {/* Haut : retour + onglet */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pt-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => nav(-1)} aria-label="Back" className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur"><ArrowLeft size={19} /></motion.button>
        <div className="pointer-events-auto flex items-center gap-4 font-display text-[15px] font-bold">
          <button onClick={() => nav('/')} className="text-white/55">Following</button>
          <span className="relative text-white">For you<span className="absolute -bottom-1.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-gold" /></span>
        </div>
        <span className="pointer-events-auto rounded-full bg-black/45 px-2.5 py-1 font-display text-[11px] font-bold text-white/80 backdrop-blur tabular-nums">{active + 1}/{list.length}</span>
      </div>

      {/* Indice swipe */}
      <AnimatePresence>
        {hint && (
          <motion.div className="pointer-events-none absolute inset-x-0 bottom-[150px] z-20 flex flex-col items-center text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 1.1, repeat: Infinity }} className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur">
              <ChevronDown size={22} className="rotate-180" />
            </motion.div>
            <span className="mt-2 rounded-full bg-black/50 px-3 py-1 font-display text-[12px] font-bold backdrop-blur">Swipe up for more</span>
          </motion.div>
        )}
      </AnimatePresence>

      <CommentsSheet videoId={cur.id} total={cur.stats.comments} open={sheet === 'comments'} onClose={() => setSheet(null)} />
      <ShareSheet open={sheet === 'share'} onClose={() => setSheet(null)} link={`daresonly.app/v/${cur.id}`} title={cur.caption} />
    </div>
  );
}

function Slide({ v, active, muted, onComments, onShare, onMute }: { v: Video; active: boolean; muted: boolean; onComments: () => void; onShare: () => void; onMute: () => void }) {
  const open = useCanWatch(v.id);
  const pv = usePreviewState();
  const media = useRef<MediaHandle>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const liked = useDemo((s) => s.liked.has(v.id));
  const saved = useDemo((s) => s.saved.has(v.id));
  const followed = useDemo((s) => s.followed.has(v.creator));
  const { toggleLike, toggleSave, toggleFollow, notify, ask } = useDemo.getState();
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState<'play' | 'pause' | null>(null);
  const [hearts, setHearts] = useState<{ k: number; x: number; y: number }[]>([]);
  const [more, setMore] = useState(false);
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const w = getWorld(v.world);
  const locked = !open;
  const vid = () => wrap.current?.querySelector('video') ?? null;

  // Barre de progression (lecture complète), mise à jour sans re-render
  useEffect(() => {
    const el = vid();
    if (!el || locked) return;
    const on = () => { if (bar.current && el.duration) bar.current.style.width = `${(el.currentTime / el.duration) * 100}%`; };
    el.addEventListener('timeupdate', on);
    return () => el.removeEventListener('timeupdate', on);
  });
  useEffect(() => { if (!active) { setPaused(false); } }, [active]);

  const tap = (e: React.MouseEvent) => {
    const now = Date.now();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (now - lastTap.current < 280) {
      clearTimeout(timer.current);
      lastTap.current = 0;
      if (!liked) toggleLike(v.id);
      haptic(12);
      setHearts((h) => [...h, { k: now, x: e.clientX - r.left, y: e.clientY - r.top }]);
      setTimeout(() => setHearts((h) => h.filter((x) => x.k !== now)), 900);
      return;
    }
    lastTap.current = now;
    timer.current = setTimeout(() => {
      if (locked && pv.ended) return;
      const el = vid();
      if (!el) return;
      if (el.paused) { el.play().catch(() => {}); setPaused(false); setFlash('play'); }
      else { el.pause(); setPaused(true); setFlash('pause'); }
      setTimeout(() => setFlash(null), 600);
    }, 260);
  };

  const ui = unlockIntent(v.id);

  return (
    <div ref={wrap} className="absolute inset-0" onClick={tap}>
      <Media ref={media} video={v} className="absolute inset-0" muted={muted || !active} previewSec={locked ? v.freePreviewSec : undefined} onPreviewEnd={pv.onPreviewEnd} onPreviewStart={pv.onPreviewStart} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.45) 0%,transparent 18%,transparent 55%,rgba(0,0,0,.85) 100%)' }} />

      {/* Barre de progression haut */}
      {!locked && (
        <div className="absolute inset-x-0 top-0 z-[2] h-[3px] bg-white/15"><div ref={bar} className="h-full bg-white transition-[width] duration-300 ease-linear" style={{ width: '0%' }} /></div>
      )}

      <LockedPreview video={v} locked={locked} ended={pv.ended} playing={pv.playing} size="stage" onReplay={() => media.current?.replay()} />

      {/* Pause / lecture */}
      <AnimatePresence>
        {(flash || (paused && !(locked && pv.ended))) && (
          <motion.div key={flash ?? 'p'} className="pointer-events-none absolute inset-0 z-[6] grid place-items-center" initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <span className="grid h-20 w-20 place-items-center rounded-full bg-black/40 text-white backdrop-blur">{flash === 'play' ? <Play size={34} fill="currentColor" /> : <Pause size={34} fill="currentColor" />}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cœurs double tap */}
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.span key={h.k} className="pointer-events-none absolute z-[7] text-hot" style={{ left: h.x - 48, top: h.y - 48 }}
            initial={{ scale: 0, opacity: 0, rotate: -18 }} animate={{ scale: [0, 1.35, 1], opacity: [0, 1, 1], rotate: [-18, 8, 0], y: [0, -10, -90] }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
            <Heart size={96} fill="currentColor" strokeWidth={0} style={{ filter: 'drop-shadow(0 8px 24px rgba(255,31,107,.65))' }} />
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Rail droit */}
      <div className="absolute bottom-[110px] right-2.5 z-[8] flex flex-col items-center gap-4 transition-opacity duration-500" style={{ opacity: locked && pv.ended ? 0.35 : 1 }} onClick={(e) => e.stopPropagation()}>
        <div className="relative mb-2">
          <Avatar id={v.creator} size={48} ring="gold" />
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => { haptic(); toggleFollow(v.creator); if (!followed) notify(`Following ${person(v.creator).handle}`, 'hot'); }}
            className="absolute -bottom-2 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full text-white ring-2 ring-black" style={{ background: followed ? 'var(--green)' : 'var(--hot)' }} aria-label="Follow">
            <AnimatePresence mode="popLayout" initial={false}>
              {followed ? <motion.span key="c" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}><Check size={13} strokeWidth={3} /></motion.span>
                : <motion.span key="p" initial={{ scale: 0 }} animate={{ scale: 1 }}><Plus size={14} strokeWidth={3} /></motion.span>}
            </AnimatePresence>
          </motion.button>
        </div>
        <RailBtn label={fmtCount(v.stats.likes + (liked ? 1 : 0))} onClick={() => { haptic(); toggleLike(v.id); }}>
          <motion.span key={String(liked)} initial={{ scale: liked ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 12 }}>
            <Heart size={30} className={liked ? 'fill-hot text-hot' : 'text-white'} />
          </motion.span>
        </RailBtn>
        <RailBtn label={fmtCount(v.stats.comments)} onClick={onComments}><MessageSquare size={28} className="text-white" /></RailBtn>
        <RailBtn label={saved ? 'Saved' : 'Save'} onClick={() => { haptic(); toggleSave(v.id); notify(saved ? 'Removed from saved' : 'Saved to your collection', 'gold'); }}>
          <Bookmark size={27} className={saved ? 'fill-gold text-gold' : 'text-white'} />
        </RailBtn>
        <RailBtn label="Share" onClick={onShare}><Share2 size={26} className="text-white" /></RailBtn>
        <RailBtn label="" onClick={onMute}>{muted ? <VolumeX size={24} className="text-white" /> : <Volume2 size={24} className="text-white" />}</RailBtn>
      </div>

      {/* Bas : créateur, légende, monde */}
      <div className="absolute inset-x-0 bottom-0 z-[8] px-4 pb-[max(22px,env(safe-area-inset-bottom))] pr-[76px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <p className="font-display text-[16px] font-bold text-white">{person(v.creator).handle}</p>
          <span className="rounded-full px-2 py-0.5 font-display text-[10px] font-bold" style={{ background: alpha(toneVar(w.tone), 0.2), color: toneVar(w.tone) }}>{w.name} · {subWorldName(v.world, v.subWorld)}</span>
        </div>
        <button onClick={() => setMore(!more)} className={`mt-1.5 block text-left text-[14px] leading-5 text-white/90 ${more ? '' : 'line-clamp-2'}`}>
          {v.caption} {more ? <span className="text-white/60">Posted {v.postedAgo} ago · {fmtCount(v.stats.views)} views · {v.access === 'free' ? 'free clip' : `unlock ${ui.label.split('·').pop()?.trim()}`}</span> : <span className="font-semibold text-white/60">more</span>}
        </button>
        {locked && !pv.ended && (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.96 }} onClick={() => { haptic(); ask(ui.intent); }}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-full px-4 font-display text-[13px] font-bold"
            style={{ background: ui.color === 'cyan' ? 'var(--grad-cyan)' : ui.color === 'cool' ? 'var(--grad-sub)' : 'var(--grad-gold-cta)', color: ui.color === 'cyan' ? 'var(--on-cyan)' : ui.color === 'cool' ? '#fff' : 'var(--on-gold)' }}>
            <LockOpen size={15} />{ui.label}
          </motion.button>
        )}
      </div>
    </div>
  );
}

function RailBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.82 }} onClick={onClick} className="flex flex-col items-center gap-1 text-white" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.5))' }}>
      {children}
      {label && <span className="font-display text-[11px] font-bold">{label}</span>}
    </motion.button>
  );
}
