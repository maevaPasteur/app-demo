import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fmtDuration, type Video } from '../data';
import { unlockIntent } from '../lib/access';
import { useDemo } from '../lib/store';
import { alpha } from '../ui';
import { Lock, LockOpen, Play, Repeat } from '../ui/Icon';
import { Burst } from './Burst';

type Size = 'mini' | 'card' | 'stage';

/**
 * Couche au-dessus d'une vidéo verrouillée.
 * - pendant la preview : jauge qui se remplit + compte à rebours « 0:02 free »
 * - à la fin : flou progressif, cadenas qui tombe et respire, reflet, appel à débloquer
 * - au déblocage : le flou se lève, flash + confettis
 */
export function LockedPreview({ video, locked, ended, playing, size = 'card', onReplay }: {
  video: Video; locked: boolean; ended: boolean; playing: boolean; size?: Size; onReplay?: () => void;
}) {
  const ask = useDemo((s) => s.ask);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [wasLocked, setWasLocked] = useState(locked);

  useEffect(() => {
    if (wasLocked && !locked) {
      setJustUnlocked(true);
      const t = setTimeout(() => setJustUnlocked(false), 1700);
      return () => clearTimeout(t);
    }
    setWasLocked(locked);
  }, [locked, wasLocked]);

  const { intent, label, color } = unlockIntent(video.id);
  const big = size === 'stage';
  const mini = size === 'mini';
  const btnBg = color === 'cyan' ? 'var(--grad-cyan)' : color === 'cool' ? 'var(--grad-sub)' : 'var(--grad-gold-cta)';
  const btnFg = color === 'cyan' ? 'var(--on-cyan)' : color === 'cool' ? '#fff' : 'var(--on-gold)';
  const glow = color === 'cyan' ? 'var(--cyan)' : color === 'cool' ? 'var(--cool)' : 'var(--gold)';

  return (
    <>
      {/* Jauge de preview */}
      {locked && !ended && !mini && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[3px] bg-white/10">
          {playing && (
            <motion.div key={String(playing)} className="h-full" style={{ background: glow, boxShadow: `0 0 10px ${glow}` }}
              initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: video.freePreviewSec, ease: 'linear' }} />
          )}
        </div>
      )}

      {/* Flou + verrou */}
      <AnimatePresence>
        {locked && ended && (
          <motion.div key="lock" className="absolute inset-0 z-[3] overflow-hidden"
            initial={{ backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)', backgroundColor: 'rgba(8,5,16,0)' }}
            animate={{ backdropFilter: `blur(${mini ? 10 : 18}px)`, WebkitBackdropFilter: `blur(${mini ? 10 : 18}px)`, backgroundColor: 'rgba(8,5,16,0.42)' }}
            exit={{ backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)', backgroundColor: 'rgba(8,5,16,0)', transition: { duration: 0.7 } }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* reflet qui balaie */}
            <motion.div className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)' }}
              initial={{ x: '-150%' }} animate={{ x: '250%' }} transition={{ duration: 1.6, delay: 0.5, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }} />

            <div className="relative flex h-full flex-col items-center justify-center px-5 text-center">
              {/* cadenas */}
              <motion.div className="relative grid place-items-center" initial={{ y: -40, scale: 0.4, opacity: 0, rotate: -20 }} animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.15 }}>
                <motion.span className="absolute rounded-full" style={{ width: big ? 120 : mini ? 46 : 84, height: big ? 120 : mini ? 46 : 84, border: `2px solid ${alpha(glow, 0.55)}` }}
                  animate={{ scale: [1, 1.35], opacity: [0.8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }} />
                <motion.span className="grid place-items-center rounded-full" style={{ width: big ? 76 : mini ? 32 : 56, height: big ? 76 : mini ? 32 : 56, background: alpha(glow, 0.18), boxShadow: `inset 0 0 0 1.5px ${alpha(glow, 0.7)}, 0 0 30px ${alpha(glow, 0.45)}` }}
                  animate={{ rotate: [0, -10, 10, -6, 6, 0] }} transition={{ duration: 0.6, delay: 0.55 }}>
                  <Lock size={big ? 32 : mini ? 14 : 24} style={{ color: glow }} strokeWidth={2.4} />
                </motion.span>
              </motion.div>

              {!mini && (
                <>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className={`mt-4 font-display font-bold text-white ${big ? 'text-[22px]' : 'text-[16px]'}`}>
                    Free preview ended
                  </motion.p>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className={`mt-1 max-w-[250px] text-white/75 ${big ? 'text-[14px]' : 'text-[12px]'}`}>
                    {video.access === 'subscribers' ? 'Subscribers watch everything, in full HD' : `Unlock the full ${fmtDuration(video.durationSec)} in HD · paid to the creator instantly`}
                  </motion.p>
                  <motion.button initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.55, type: 'spring', stiffness: 400, damping: 22 }}
                    whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); ask(intent); }}
                    className={`shine relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-[14px] px-5 font-display font-bold shadow-[0_10px_30px_-8px_rgba(0,0,0,.6)] ${big ? 'h-[52px] text-[16px]' : 'h-[42px] text-[14px]'}`}
                    style={{ background: btnBg, color: btnFg }}>
                    <LockOpen size={big ? 18 : 16} />{label}
                  </motion.button>
                  {onReplay && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} onClick={(e) => { e.stopPropagation(); onReplay(); }}
                      className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/70">
                      <Repeat size={13} />Replay preview
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Déblocage */}
      <AnimatePresence>
        {justUnlocked && (
          <motion.div key="unlocked" className="pointer-events-none absolute inset-0 z-[4] grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0" style={{ background: `radial-gradient(circle, ${alpha(glow, 0.45)}, transparent 65%)` }} initial={{ scale: 0.3 }} animate={{ scale: 1.6, opacity: [1, 0] }} transition={{ duration: 1 }} />
            {!mini && <Burst count={28} spread={big ? 170 : 120} />}
            <motion.span initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1.15, 1], opacity: 1 }} transition={{ duration: 0.5 }}
              className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-[14px] font-bold" style={{ background: btnBg, color: btnFg }}>
              <Play size={14} fill="currentColor" />Unlocked · enjoy
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** État local d'une vidéo verrouillée (fin de preview, lecture en cours). */
export function usePreviewState() {
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  return {
    ended, playing,
    onPreviewEnd: () => { setEnded(true); setPlaying(false); },
    onPreviewStart: () => { setEnded(false); setPlaying(true); },
    reset: () => { setEnded(false); setPlaying(false); },
  };
}
