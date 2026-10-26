import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmtCount, fmtDuration, video as getVideo } from '../data';
import { LockedPreview, usePreviewState } from '../components/LockedPreview';
import { Media, type MediaHandle } from '../components/Media';
import { useCanWatch } from '../lib/access';
import { useDemo } from '../lib/store';
import { FreePreviewPill, PlayDot, Tag } from '../ui';
import { Eye, Heart, MessageSquare } from '../ui/Icon';

/**
 * Figma VideoThumb 360:24 : stats en bas, durée, badge haut droite, pastille preview haut gauche.
 * Vidéo verrouillée : lecture limitée aux secondes gratuites, puis flou + verrou animé (LockedPreview).
 * Double tap = like avec cœur animé ; simple tap = ouvrir la vidéo.
 */
export function VideoThumb({ id, badge, border, w = 285, h = 380, className = '', to, onClick, children, compact }: {
  id: string; compact?: boolean; badge?: ReactNode; border?: string; w?: number | string; h?: number; className?: string; to?: string; onClick?: () => void; children?: ReactNode;
}) {
  const v = getVideo(id);
  const nav = useNavigate();
  const open = useCanWatch(id);
  const liked = useDemo((s) => s.liked.has(id));
  const toggleLike = useDemo((s) => s.toggleLike);
  const pv = usePreviewState();
  const media = useRef<MediaHandle>(null);
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hearts, setHearts] = useState<{ k: number; x: number; y: number }[]>([]);
  if (!v) return null;
  const free = v.access === 'free';
  const locked = !open;

  const tap = (e: React.MouseEvent) => {
    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (now - lastTap.current < 280) {
      clearTimeout(timer.current);
      if (!liked) toggleLike(id);
      setHearts((h) => [...h, { k: now, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setHearts((h) => h.filter((x) => x.k !== now)), 900);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    timer.current = setTimeout(() => (onClick ? onClick() : nav(to ?? `/video/${id}`)), 240);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={tap}
      className={`relative shrink-0 snap-start overflow-hidden rounded-[18px] bg-media ${className}`}
      style={{ width: w, height: h, boxShadow: border ? `inset 0 0 0 2px ${border}` : 'inset 0 0 0 1px var(--line)' }}
    >
      <Media ref={media} video={v} className="absolute inset-0" previewSec={locked ? v.freePreviewSec : undefined} onPreviewEnd={pv.onPreviewEnd} onPreviewStart={pv.onPreviewStart} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(8,5,16,.35) 0%,transparent 22%,transparent 62%,rgba(8,5,16,.85) 100%)' }} />
      {compact ? (
        <div className="absolute inset-0 grid place-items-center"><PlayDot size={30} /></div>
      ) : (<>
        <div className="absolute left-2.5 top-2.5 z-[5]">
          {free ? <Tag accent="green">FREE</Tag> : open ? <Tag accent="cyan" solid>UNLOCKED</Tag> : <FreePreviewPill sec={v.freePreviewSec} />}
        </div>
        {badge && <div className="absolute right-2.5 top-2.5 z-[5]">{badge}</div>}
        {!(locked && pv.ended) && <div className="absolute inset-0 grid place-items-center"><PlayDot /></div>}
        <div className="absolute inset-x-3 bottom-3 z-[5] flex items-center justify-between text-[12px] font-semibold text-white">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Heart size={15} className={liked ? 'fill-hot text-hot' : ''} />{fmtCount(v.stats.likes + (liked ? 1 : 0))}</span>
            <span className="flex items-center gap-1"><MessageSquare size={15} />{fmtCount(v.stats.comments)}</span>
            {Number(typeof w === 'number' ? w : 300) >= 200 && <span className="flex items-center gap-1"><Eye size={15} />{fmtCount(v.stats.views)}</span>}
          </div>
          <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px]">{fmtDuration(v.durationSec)}</span>
        </div>
      </>)}
      <LockedPreview video={v} locked={locked} ended={pv.ended} playing={pv.playing} size={compact ? 'mini' : 'card'} onReplay={() => media.current?.replay()} />
      <AnimatePresence>
        {hearts.map((hh) => (
          <motion.span key={hh.k} className="pointer-events-none absolute z-[6] text-hot" style={{ left: hh.x - 36, top: hh.y - 36 }}
            initial={{ scale: 0, opacity: 0, rotate: -15 }} animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1], rotate: 0, y: [0, -10, -60] }} exit={{ opacity: 0 }} transition={{ duration: 0.85 }}>
            <Heart size={72} fill="currentColor" strokeWidth={0} style={{ filter: 'drop-shadow(0 6px 20px rgba(255,31,107,.6))' }} />
          </motion.span>
        ))}
      </AnimatePresence>
      {children}
    </motion.div>
  );
}
