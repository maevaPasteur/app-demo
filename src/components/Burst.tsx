import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#ffb627', '#ffd37a', '#25e6c4', '#7b5cff', '#ff1f6b', '#35d07f'];

/** Explosion de confettis légère (pas de canvas), à monter quand on veut célébrer. */
export function Burst({ count = 36, spread = 180 }: { count?: number; spread?: number }) {
  const parts = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const r = spread * (0.5 + Math.random() * 0.6);
      return { x: Math.cos(a) * r, y: Math.sin(a) * r - 40, rot: Math.random() * 540, c: COLORS[i % COLORS.length], w: 5 + Math.random() * 6, round: Math.random() > 0.6, d: Math.random() * 0.15 };
    }),
    [count, spread],
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-50">
      {parts.map((p, i) => (
        <motion.span key={i} className="absolute block"
          style={{ width: p.w, height: p.round ? p.w : p.w * 1.8, background: p.c, borderRadius: p.round ? 99 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 160], opacity: [1, 1, 0], rotate: p.rot, scale: 1 }}
          transition={{ duration: 1.6, delay: p.d, ease: [0.16, 1, 0.3, 1], times: [0, 0.45, 1] }} />
      ))}
    </div>
  );
}
