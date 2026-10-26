import { animate, motion, useInView, useMotionValue, useTransform, type HTMLMotionProps } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Creator, Medal as MedalT, Tone } from '../data';
import { person } from '../data';
import { useCountdown } from '../lib/live';
import { ArrowLeft, Clock, Lock, Play } from './Icon';

/* ---------- Tokens utilitaires ---------- */
export type Accent = 'gold' | 'hot' | 'cool' | 'cyan' | 'green' | 'muted' | 'danger';
export const accentVar: Record<Accent, string> = {
  gold: 'var(--gold)', hot: 'var(--hot)', cool: 'var(--cool)', cyan: 'var(--cyan)', green: 'var(--green)', muted: 'var(--muted)', danger: 'var(--danger)',
};
export const toneColor = (t: Tone) => `var(--tone-${t})`;
export const alpha = (cssVar: string, a: number) => `color-mix(in srgb, ${cssVar} ${Math.round(a * 100)}%, transparent)`;
export const spring = { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 } as const;

/* ---------- Typo ---------- */
export const Eyebrow = ({ children, className = '', color }: { children: ReactNode; className?: string; color?: string }) => (
  <p className={`eyebrow ${className}`} style={{ color: color ?? 'var(--muted)' }}>{children}</p>
);

/* ---------- Bouton (Figma Button 225:731) ---------- */
const btnBg: Record<string, string> = {
  hot: 'linear-gradient(180deg,#ff4f8b 0%,#ff1f6b 100%)',
  cool: 'linear-gradient(180deg,#9a82ff 0%,#7b5cff 100%)',
  cyan: 'linear-gradient(180deg,#7fffe6 0%,#25e6c4 100%)',
  gold: 'linear-gradient(180deg,#ffd37a 0%,#ffb627 100%)',
  green: 'linear-gradient(180deg,#8affce 0%,#35d07f 100%)',
  ghost: 'var(--ink-700)',
  danger: 'linear-gradient(180deg,#ff7a7a 0%,#ff4d4d 100%)',
};
const btnFg: Record<string, string> = { hot: '#fff', cool: '#fff', cyan: 'var(--on-cyan)', gold: 'var(--on-gold)', green: 'var(--on-green)', ghost: 'var(--txt)', danger: '#fff' };
type BtnProps = {
  color?: keyof typeof btnBg; size?: 'S' | 'M' | 'L'; full?: boolean; children: ReactNode; onClick?: () => void; to?: string; icon?: ReactNode;
  className?: string; disabled?: boolean; done?: boolean;
};
export function Button({ color = 'gold', size = 'M', full, children, onClick, to, icon, className = '', disabled, done }: BtnProps) {
  const nav = useNavigate();
  const h = size === 'S' ? 'h-[30px] px-3 text-[12px] rounded-[10px]' : size === 'L' ? 'h-[52px] px-5 text-[15px] rounded-[14px]' : 'h-[44px] px-4 text-[14px] rounded-[12px]';
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={spring}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); haptic(); if (onClick) onClick(); else if (to) nav(to); }}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-display font-bold disabled:opacity-50 ${h} ${full ? 'w-full' : ''} ${color === 'ghost' ? 'border border-line-strong' : 'shadow-[inset_0_1px_0_rgba(255,255,255,.35)]'} ${className}`}
      style={{ background: done ? 'var(--panel-hi)' : btnBg[color], color: done ? 'var(--txt)' : btnFg[color] }}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/* ---------- Tag (Figma Tag 24:12) ---------- */
export function Tag({ children, accent = 'muted', dot, className = '', solid }: { children: ReactNode; accent?: Accent; dot?: boolean; className?: string; solid?: boolean }) {
  const c = accentVar[accent];
  return (
    <span
      className={`inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 font-display text-[11px] font-bold ${className}`}
      style={solid ? { background: c, color: accent === 'gold' ? 'var(--on-gold)' : accent === 'cyan' ? 'var(--on-cyan)' : '#fff' } : { background: alpha(c, 0.12), color: accent === 'muted' ? 'var(--muted)' : c, boxShadow: `inset 0 0 0 1px ${alpha(c, 0.34)}` }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />}
      {children}
    </span>
  );
}

/* ---------- Chip (Figma Chip 731:1465) ---------- */
export function Chip({ children, active, onClick, tone }: { children: ReactNode; active?: boolean; onClick?: () => void; tone?: Tone }) {
  const c = tone ? toneColor(tone) : 'var(--gold)';
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3.5 font-display text-[13px] font-semibold transition-colors"
      style={active ? { background: alpha(c, 0.16), color: c, boxShadow: `inset 0 0 0 1px ${alpha(c, 0.5)}` } : { background: 'var(--panel)', color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
    >
      {children}
    </motion.button>
  );
}

/* ---------- Timer (Figma Timer 26:24) : rose = timers ---------- */
export function Timer({ label }: { label: string }) {
  const live = useCountdown(label);
  return (
    <span className="inline-flex h-[28px] items-center gap-1.5 rounded-full px-3 font-display text-[12px] font-bold text-hot-soft" style={{ background: alpha('var(--hot)', 0.14), boxShadow: `inset 0 0 0 1px ${alpha('var(--hot)', 0.4)}` }}>
      <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hot opacity-70" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-hot" /></span>
      <span className="tabular-nums">{live}</span>
    </span>
  );
}
/** Texte de compte à rebours seul (pour les timers custom des écrans). */
export const LiveCountdown = ({ label, className = '' }: { label: string; className?: string }) => <span className={`tabular-nums ${className}`}>{useCountdown(label)}</span>;

/** Retour haptique léger (mobile). */
export const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch { /* non supporté */ } };

/* ---------- Avatar (Figma Avatar 264:647) ---------- */
export type Ring = 'none' | 'gold' | 'hot' | 'cool' | 'cyan' | 'green' | 'silver' | 'bronze';
const ringColor: Record<Ring, string> = { none: 'transparent', gold: 'var(--gold)', hot: 'var(--hot)', cool: 'var(--cool)', cyan: 'var(--cyan)', green: 'var(--green)', silver: 'var(--silver)', bronze: 'var(--bronze)' };
export function Avatar({ id, size = 36, ring = 'none', to, className = '' }: { id: string; size?: number; ring?: Ring; to?: string | false; className?: string }) {
  const p = person(id);
  const isCreator = 'world' in (p as Creator);
  const href = to === false ? undefined : to ?? (isCreator ? `/creator/${id}` : `/fan/${id}`);
  const pad = ring === 'none' ? 0 : size >= 56 ? 3 : 2;
  const img = (
    <span className={`relative inline-block shrink-0 rounded-full ${className}`} style={{ width: size, height: size, padding: pad, background: ring === 'none' ? undefined : ringColor[ring] }}>
      <img src={p?.avatar} alt={p?.handle} loading="lazy" decoding="async" className="h-full w-full rounded-full bg-media object-cover" style={{ boxShadow: ring === 'none' ? undefined : '0 0 0 2px var(--bg)' }} />
    </span>
  );
  return href ? <Link to={href} onClick={(e) => e.stopPropagation()} className="shrink-0">{img}</Link> : img;
}
export const Handle = ({ id, className = '' }: { id: string; className?: string }) => <span className={className}>{person(id)?.handle}</span>;

/* ---------- Medal (Figma Award 244:678) ---------- */
const medalGrad: Record<MedalT, [string, string, string]> = {
  gold: ['#ffe7a0', '#ffb627', '#3a2609'], silver: ['#f1f3f7', '#a9b0bd', '#2a2e36'], bronze: ['#f2b98f', '#b8693a', '#3a1d09'],
};
export function Medal({ medal, size = 40, laurel }: { medal: MedalT; size?: number; laurel?: boolean }) {
  const [a, b, ink] = medalGrad[medal];
  const n = medal === 'gold' ? 1 : medal === 'silver' ? 2 : 3;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-label={medal}>
      <defs>
        <linearGradient id={`m-${medal}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      {laurel && <path d="M4 36c-3-9 0-19 8-25M52 36c3-9 0-19-8-25" stroke={b} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="3 4" />}
      <circle cx="28" cy="28" r="24" fill={`url(#m-${medal})`} />
      <circle cx="28" cy="28" r="20" fill="none" stroke={ink} strokeOpacity=".35" strokeWidth="1.5" />
      <text x="28" y="36" textAnchor="middle" fontFamily="Chakra Petch" fontWeight="700" fontSize="22" fill={ink}>{n}</text>
    </svg>
  );
}

/* ---------- Barres ---------- */
export function ProgressBar({ pct, color = 'gold', h = 8 }: { pct: number; color?: Accent; h?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-panel-hi" style={{ height: h }}>
      <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ background: color === 'gold' ? 'var(--grad-gold-cta)' : color === 'cyan' ? 'var(--grad-cyan)' : accentVar[color] }} />
    </div>
  );
}
/** VoteBar duel : or à gauche, cyan à droite (Figma DuelTug). */
export function TugBar({ left }: { left: number }) {
  return (
    <div className="relative h-[10px] w-full overflow-hidden rounded-full" style={{ background: 'var(--cyan-600)' }}>
      <div className="absolute inset-0" style={{ background: 'var(--grad-cyan)' }} />
      <motion.div className="absolute inset-y-0 left-0 rounded-r-none" initial={{ width: '50%' }} animate={{ width: `${left}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} style={{ background: 'var(--grad-gold-cta)', boxShadow: '2px 0 0 #fff' }} />
    </div>
  );
}

/* ---------- Compteur animé ---------- */
export function Counter({ value, format = (n: number) => Math.round(n).toLocaleString('en-US'), className = '' }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const txt = useTransform(mv, (v) => format(v));
  const started = useRef(false);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: started.current ? 0.5 : 1.1, ease: [0.22, 1, 0.36, 1] });
    started.current = true;
    return () => c.stop();
  }, [inView, value, mv]);
  return <motion.span ref={ref} className={className}>{txt}</motion.span>;
}

/* ---------- Section header ---------- */
export function SectionHeader({ title, icon, right, to, color, className = '' }: { title: string; icon?: ReactNode; right?: ReactNode; to?: string; color?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between px-[18px] ${className}`}>
      <h2 className="flex items-center gap-2 font-display text-[22px] font-bold leading-[26px]" style={{ color }}>
        {icon}
        <span className="text-txt">{title}</span>
      </h2>
      {right ?? (to && <Link to={to} className="eyebrow text-muted">SEE ALL</Link>)}
    </div>
  );
}

/* ---------- Nav header (Figma NavHeader 423:7) ---------- */
export function NavHeader({ title, right, back = true, sub }: { title: string; right?: ReactNode; back?: boolean | string; sub?: string }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 bg-bg/85 px-4 backdrop-blur-xl">
      {back && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel" aria-label="Back">
          <ArrowLeft size={18} />
        </motion.button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[17px] font-bold leading-5">{title}</h1>
        {sub && <p className="truncate text-[11px] text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function IconButton({ children, onClick, dot, label, className = '' }: { children: ReactNode; onClick?: () => void; dot?: boolean; label: string; className?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.88 }} onClick={onClick} aria-label={label} className={`relative grid h-9 w-9 place-items-center rounded-full border border-line bg-panel text-txt ${className}`}>
      {children}
      {dot && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-hot" />}
    </motion.button>
  );
}

/* ---------- Carte de base ---------- */
export function Card({ children, className = '', glow, ...rest }: { children: ReactNode; className?: string; glow?: string } & HTMLMotionProps<'div'>) {
  return (
    <motion.div className={`rounded-[18px] border border-line ${className}`} style={{ background: 'var(--grad-card)', boxShadow: glow ? `0 0 0 1px ${glow}, 0 12px 40px -18px ${glow}` : undefined }} {...rest}>
      {children}
    </motion.div>
  );
}

/** Apparition au scroll, utilisée partout pour le rythme. */
export function Reveal({ children, delay = 0, className = '', y = 16 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/** Ligne horizontale scrollable avec snap. */
export function Rail({ children, className = '', gap = 12 }: { children: ReactNode; className?: string; gap?: number }) {
  return (
    <div className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-px-[18px] px-[18px] ${className}`} style={{ gap }}>
      {children}
    </div>
  );
}

export const Divider = ({ className = '' }: { className?: string }) => <div className={`h-px w-full bg-line ${className}`} />;

/* ---------- Petits badges vidéo ---------- */
export const FreePreviewPill = ({ sec }: { sec: number }) => (
  <span className="inline-flex h-[24px] items-center gap-1 rounded-full bg-black/70 px-2 font-display text-[11px] font-semibold text-white backdrop-blur"><Lock size={12} />0:{String(sec).padStart(2, '0')} free</span>
);
export const PlayDot = ({ size = 44 }: { size?: number }) => (
  <span className="grid place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md" style={{ width: size, height: size }}><Play size={size * 0.34} fill="currentColor" /></span>
);
export const EndsIn = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 text-[11px] text-muted"><Clock size={12} />{label}</span>
);
