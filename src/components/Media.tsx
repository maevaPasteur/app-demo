import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Video } from '../data';

export type MediaHandle = { replay: () => void; el: HTMLVideoElement | null };

type Props = {
  video: Video;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  /** Secondes gratuites. Défini = vidéo verrouillée : lecture coupée à previewSec. undefined = lecture complète. */
  previewSec?: number;
  onPreviewEnd?: () => void;
  onPreviewStart?: () => void;
  /** Force la lecture même hors viewport (stage plein écran). */
  eager?: boolean;
};

/**
 * Vidéo verticale : poster immédiat, lecture muette seulement quand >60% visible, pause sinon.
 * preload="none" hors écran : on ne charge que ce qui est vu (N+1 max).
 * Mode preview : la lecture s'arrête à previewSec (le parent affiche le flou + l'appel à débloquer).
 */
/** Vidéo illisible (codec, réseau) : poster, et si verrouillée on simule quand même la fin de preview. */
function PosterFallback({ video, className, locked, previewSec, cb }: { video: Video; className: string; locked: boolean; previewSec?: number; cb: React.MutableRefObject<{ onPreviewEnd?: () => void; onPreviewStart?: () => void }> }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !locked) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !t) {
        cb.current.onPreviewStart?.();
        t = setTimeout(() => cb.current.onPreviewEnd?.(), (previewSec ?? 2) * 1000 + 300);
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); if (t) clearTimeout(t); };
  }, [locked, previewSec, cb]);
  return <img ref={ref} src={video.poster} alt="" decoding="async" loading="lazy" className={`h-full w-full object-cover ${className}`} />;
}

export const Media = memo(forwardRef<MediaHandle, Props>(function Media(
  { video, className = '', autoPlay = true, muted = true, previewSec, onPreviewEnd, onPreviewStart, eager },
  handle,
) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(!!eager);
  const [failed, setFailed] = useState(!video.src);
  const ended = useRef(false);
  const cb = useRef({ onPreviewEnd, onPreviewStart });
  cb.current = { onPreviewEnd, onPreviewStart };
  const locked = previewSec !== undefined;

  useImperativeHandle(handle, () => ({
    replay: () => {
      const el = ref.current;
      if (!el) return;
      ended.current = false;
      el.currentTime = 0;
      el.play().catch(() => {});
      cb.current.onPreviewStart?.();
    },
    el: ref.current,
  }));

  // Chargement anticipé + play/pause selon la visibilité
  useEffect(() => {
    const el = ref.current;
    if (!el || failed) return;
    const pre = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '300px' });
    const play = new IntersectionObserver(([e]) => {
      if (!autoPlay) return;
      if (e.isIntersecting) {
        if (ended.current) return; // preview terminée : on reste figé et flouté
        el.play().catch(() => {});
      } else el.pause();
    }, { threshold: 0.6 });
    pre.observe(el);
    if (!eager) play.observe(el);
    else el.play().catch(() => {});
    return () => { pre.disconnect(); play.disconnect(); };
  }, [autoPlay, failed, eager]);

  // Coupure à la fin de la preview
  useEffect(() => {
    const el = ref.current;
    if (!el || !locked) return;
    const onTime = () => {
      if (!ended.current && el.currentTime >= (previewSec ?? 0)) {
        ended.current = true;
        el.pause();
        cb.current.onPreviewEnd?.();
      }
    };
    const onPlay = () => { if (!ended.current && el.currentTime < 0.3) cb.current.onPreviewStart?.(); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('playing', onPlay);
    return () => { el.removeEventListener('timeupdate', onTime); el.removeEventListener('playing', onPlay); };
  }, [locked, previewSec]);

  // Déblocage : on repart en lecture complète là où on en était
  useEffect(() => {
    const el = ref.current;
    if (!el || locked) return;
    if (ended.current) {
      ended.current = false;
      el.play().catch(() => {});
    }
  }, [locked]);

  useEffect(() => { if (ref.current) ref.current.muted = muted; }, [muted]);

  if (failed) return <PosterFallback video={video} className={className} locked={locked} previewSec={previewSec} cb={cb} />;
  return (
    <video
      ref={ref}
      src={near ? video.src : undefined}
      poster={video.poster}
      muted={muted}
      loop={!locked}
      playsInline
      preload={near ? 'auto' : 'none'}
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}));
