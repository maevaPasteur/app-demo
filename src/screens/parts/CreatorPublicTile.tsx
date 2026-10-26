import { motion } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockedPreview, usePreviewState } from '../../components/LockedPreview';
import { Media, type MediaHandle } from '../../components/Media';
import { fmtCount, fmtDuration, video as getVideo } from '../../data';
import { Eye, Play } from '../../ui/Icon';

/** Figma MediaTile 487:7345 (Paid / Subs / Free) : preview gratuite puis flou + verrou tant que non débloqué. */
export function MediaTile({ id, badge, locked }: { id: string; badge?: ReactNode; locked: boolean }) {
  const v = getVideo(id);
  const nav = useNavigate();
  const pv = usePreviewState();
  const media = useRef<MediaHandle>(null);
  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={() => nav(`/video/${id}`)} className="relative block h-[236px] w-full cursor-pointer overflow-hidden rounded-[16px] bg-media text-left" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
      <Media ref={media} video={v} className="absolute inset-0" previewSec={locked ? v.freePreviewSec : undefined} onPreviewEnd={pv.onPreviewEnd} onPreviewStart={pv.onPreviewStart} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(8,5,16,.35),transparent 30%,transparent 65%,rgba(8,5,16,.85))' }} />
      <span className="absolute left-2 top-2 z-[5] rounded-full bg-black/60 px-2 py-0.5 font-display text-[11px] font-semibold text-white">{locked ? `0:0${v.freePreviewSec || 2} free` : fmtDuration(v.durationSec)}</span>
      {badge && <span className="absolute right-2 top-2 z-[5]">{badge}</span>}
      {!(locked && pv.ended) && (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md"><Play size={15} fill="currentColor" /></span>
        </span>
      )}
      <span className="absolute inset-x-2.5 bottom-2 z-[5] flex items-center justify-between text-[11px] font-semibold text-white">
        <span className="flex items-center gap-1"><Eye size={13} />{fmtCount(v.stats.views)}</span>
        <span>{fmtDuration(v.durationSec)}</span>
      </span>
      <LockedPreview video={v} locked={locked} ended={pv.ended} playing={pv.playing} size="mini" />
    </motion.div>
  );
}
