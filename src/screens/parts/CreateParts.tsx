import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { creators, fmtDuration, person, video as getVideo, videos, worlds } from '../../data';
import C from '../../data/screens/Create.json';
import { Avatar, Chip, alpha, spring } from '../../ui';
import { ArrowLeft, Check, Clock, Download, Heart, Lock, Play, Plus, Search, TrendingUp, X } from '../../ui/Icon';

export const cc = C.common;
export type CreateAccent = 'cyan' | 'hot' | 'gold';
export const accentCss: Record<CreateAccent, string> = { cyan: 'var(--cyan)', hot: 'var(--hot)', gold: 'var(--gold)' };
export const accentGrad: Record<CreateAccent, string> = {
  cyan: 'var(--grad-cyan)',
  hot: 'linear-gradient(180deg,#ff4f8b 0%,#ff1f6b 100%)',
  gold: 'var(--grad-gold-cta)',
};
export const accentInk: Record<CreateAccent, string> = { cyan: 'var(--on-cyan)', hot: '#fff', gold: 'var(--on-gold)' };

/** Bouton retour flottant (Figma IconButton en haut à gauche). */
export function BackFab() {
  const nav = useNavigate();
  return (
    <motion.button whileTap={{ scale: 0.88 }} onClick={() => nav(-1)} aria-label="Back"
      className="absolute left-0 top-0 z-20 grid h-9 w-9 place-items-center rounded-full border border-line bg-panel backdrop-blur">
      <ArrowLeft size={18} />
    </motion.button>
  );
}

/** Figma CreateHero 751:1484 : tuile icône teintée, titre, sous-titre, badges. */
export function CreateHero({ accent, icon, title, sub, badges }: { accent: CreateAccent; icon: ReactNode; title: string; sub: string; badges: { icon: ReactNode; label: string }[] }) {
  const c = accentCss[accent];
  return (
    <div className="relative px-[18px] pt-[36px] text-center">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[260px] w-[300px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: alpha(c, 0.18) }} />
      <motion.div initial={{ scale: 0.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        className="relative mx-auto grid h-[60px] w-[60px] place-items-center rounded-[16px]" style={{ background: alpha(c, 0.16), boxShadow: `inset 0 0 0 1px ${alpha(c, 0.45)}, 0 10px 30px -8px ${alpha(c, 0.5)}`, color: c }}>
        {icon}
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="relative mt-4 font-display text-[26px] font-bold leading-[30px]">{title}</motion.h1>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="relative mx-auto mt-2 max-w-[330px] text-[14px] leading-[20px] text-muted">{sub}</motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="relative mt-3 flex flex-wrap justify-center gap-1.5">
        {badges.map((b) => (
          <span key={b.label} className="inline-flex h-[26px] items-center gap-1 rounded-full border border-line bg-panel px-2.5 font-display text-[11px] font-semibold text-txt-90">
            <span style={{ color: c }}>{b.icon}</span>{b.label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function StepLabel({ n, children, accent, right }: { n?: number; children: ReactNode; accent: CreateAccent; right?: ReactNode }) {
  const c = accentCss[accent];
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <p className="eyebrow flex items-center gap-2 text-muted">
        {n !== undefined && <span className="grid h-[17px] w-[17px] place-items-center rounded-full font-display text-[10px] font-bold" style={{ color: c, boxShadow: `inset 0 0 0 1.5px ${c}` }}>{n}</span>}
        {children}
      </p>
      {right}
    </div>
  );
}

/** Pastille sélectionnable teintée par l'accent du flux. */
export function Pick({ active, onClick, accent, children, className = '' }: { active: boolean; onClick: () => void; accent: CreateAccent; children: ReactNode; className?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.93 }} onClick={onClick}
      className={`inline-flex h-[38px] shrink-0 items-center justify-center rounded-[11px] px-3.5 font-display text-[13px] font-bold transition-colors ${className}`}
      style={active ? { background: accentGrad[accent], color: accentInk[accent] } : { background: 'var(--panel)', color: 'var(--txt-90)', boxShadow: 'inset 0 0 0 1px var(--line-strong)' }}>
      {children}
    </motion.button>
  );
}

export function WorldPicker({ accent, worldId, subId, onWorld, onSub, start = 1 }: { accent: CreateAccent; worldId: string; subId: string; onWorld: (id: string) => void; onSub: (id: string) => void; start?: number }) {
  const w = worlds.find((x) => x.id === worldId)!;
  return (
    <>
      <section className="mt-6">
        <div className="px-[18px]"><StepLabel n={start} accent={accent}>{cc.pickWorld}</StepLabel></div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-[18px]">
          {worlds.map((x) => <Pick key={x.id} accent={accent} active={x.id === worldId} onClick={() => { onWorld(x.id); onSub(x.subWorlds[0].id); }}>{x.name}</Pick>)}
        </div>
      </section>
      <section className="mt-5">
        <div className="px-[18px]"><StepLabel n={start + 1} accent={accent}>{cc.pickSub}</StepLabel></div>
        <AnimatePresence mode="wait">
          <motion.div key={worldId} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="no-scrollbar flex gap-2 overflow-x-auto px-[18px]">
            {w.subWorlds.map((s) => <Pick key={s.id} accent={accent} active={s.id === subId} onClick={() => onSub(s.id)}>{s.name}</Pick>)}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}

export const TEXT_MIN = 12;
export const TEXT_MAX = 140;
/** Texte valide pour publier : assez précis, pas trop long. */
export const textError = (v: string) => (v.trim().length < TEXT_MIN ? `At least ${TEXT_MIN} characters so creators know what wins` : '');

export function TextArea({ value, onChange, placeholder, rows = 3, max, error }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number; max?: number; error?: string }) {
  const n = value.length;
  const near = max && n > max * 0.85;
  return (
    <div className="relative">
      <textarea value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ background: alpha('var(--panel-hi)', 0.6), borderColor: error ? alpha('var(--danger)', 0.7) : undefined }}
        className="w-full resize-none rounded-[16px] border border-line-strong px-3.5 pb-7 pt-3 text-[14px] leading-[20px] text-txt outline-none transition-shadow placeholder:text-muted-2 focus:shadow-[0_0_0_2px_var(--line-strong)]" />
      {max && (
        <span className="pointer-events-none absolute bottom-2.5 right-3.5 font-display text-[11px] font-semibold" style={{ color: error ? 'var(--danger)' : near ? 'var(--gold)' : 'var(--muted-2)' }}>
          {n}/{max}
        </span>
      )}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-[12px] text-danger">{error}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ChallengeField({ value, onChange, placeholder, title = cc.challenge, error }: { value: string; onChange: (v: string) => void; placeholder: string; title?: string; error?: string }) {
  return (
    <section className="mt-6 px-[18px]">
      <p className="eyebrow text-muted">{title}</p>
      <p className="mb-2.5 mt-1.5 text-[12px] leading-[17px] text-muted">{cc.challengeHelp}</p>
      <TextArea value={value} onChange={onChange} placeholder={placeholder} max={TEXT_MAX} error={error} />
    </section>
  );
}

/** Champ vidéo (Figma InputField Type=Video) + longueur du teaser gratuit. */
export function EntryField({ accent, file, meta, world, onVideo }: { accent: CreateAccent; file: string; meta: string; world: string; onVideo?: (id: string) => void }) {
  const pool = videos.filter((v) => v.world === world);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [teaser, setTeaser] = useState(2);
  const v = getVideo(pool[idx % pool.length]?.id ?? videos[0].id);
  const c = accentCss[accent];
  useEffect(() => { onVideo?.(v.id); }, [v.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const replace = () => {
    setLoading(true);
    setTimeout(() => { setIdx((i) => i + 1); setPicked(true); setLoading(false); }, 700);
  };
  return (
    <section className="mt-6 px-[18px]">
      <p className="eyebrow mb-2.5 text-muted">{cc.yourEntry}</p>
      <motion.button whileTap={{ scale: 0.98 }} onClick={replace} className="flex w-full items-center gap-3 rounded-[14px] border border-line bg-ink p-2 text-left">
        <span className="relative h-[50px] w-[72px] shrink-0 overflow-hidden rounded-[9px] bg-media">
          {picked && <img src={v.poster} alt="" className="h-full w-full object-cover" />}
          <span className="absolute inset-0 grid place-items-center">
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <span className="grid h-7 w-7 place-items-center rounded-full bg-black/50"><Play size={12} fill="currentColor" /></span>}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{idx === 0 ? file : `clip_${String(idx).padStart(2, '0')}.mp4`}</span>
          <span className="block text-[11px] text-muted">{idx === 0 ? meta : `${fmtDuration(v.durationSec)} · ${(v.durationSec * 0.62).toFixed(1)} MB`} · {cc.tapReplace}</span>
        </span>
      </motion.button>

      <div className="mt-3 flex gap-3 rounded-[16px] border border-line bg-panel p-3">
        <div className="relative h-[165px] w-[120px] shrink-0 overflow-hidden rounded-[12px] bg-media">
          <img src={v.poster} alt="" className="h-full w-full object-cover opacity-80" />
          <span className="absolute left-2 top-2 rounded-[6px] px-1.5 py-0.5 font-display text-[11px] font-bold" style={{ background: c, color: accentInk[accent] }}>{teaser}s free</span>
          <span className="absolute inset-0 grid place-items-center"><span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/40"><Play size={14} fill="currentColor" /></span></span>
          <div className="absolute inset-x-2 bottom-2.5 h-1 overflow-hidden rounded-full bg-white/20">
            <motion.div className="h-full rounded-full" style={{ background: c }} animate={{ width: `${(teaser / v.durationSec) * 100 * 4}%` }} transition={spring} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-muted">{cc.teaser}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[2, 3, 4, 5, 6, 7, 8].map((s) => (
              <motion.button key={s} whileTap={{ scale: 0.9 }} onClick={() => setTeaser(s)} className="h-[30px] w-[36px] rounded-[9px] font-display text-[12px] font-bold"
                style={s === teaser ? { background: accentGrad[accent], color: accentInk[accent] } : { background: 'var(--ink-700)', color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line-strong)' }}>{s}s</motion.button>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] font-semibold"><span style={{ color: c }}>{teaser}s</span> {cc.teaserFree} <span style={{ color: c }}>{cc.teaserEvery}</span></p>
          <p className="mt-1.5 text-[11px] leading-[15px] text-muted">{cc.teaserHelp}</p>
        </div>
      </div>
    </section>
  );
}

export function SubscriberNote({ text = cc.subscriberNote }: { text?: string }) {
  return (
    <div className="mx-[18px] mt-6 flex gap-3 rounded-[16px] p-3.5" style={{ background: alpha('var(--hot)', 0.1), boxShadow: `inset 0 0 0 1px ${alpha('var(--hot)', 0.45)}` }}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-hot" style={{ background: alpha('var(--hot)', 0.16) }}><Heart size={16} /></span>
      <p className="text-[12px] leading-[17px] text-hot-soft">{text}</p>
    </div>
  );
}

const payIcon = { lock: Lock, plus: Plus, trend: TrendingUp, download: Download, check: Check, clock: Clock } as const;
const payTone = { lock: 'var(--cyan)', plus: 'var(--cyan)', trend: 'var(--gold)', download: 'var(--gold)', check: 'var(--gold)', clock: 'var(--gold)' } as const;
/** Bloc « How it pays » : surligne en gras les segments entre ** **. */
export function HowItPays({ title, rows }: { title: string; rows: { icon: string; title: string; text: string }[] }) {
  return (
    <section className="mt-6 px-[18px]">
      <p className="eyebrow mb-2.5 text-muted">{title}</p>
      <div className="divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-panel">
        {rows.map((r, i) => {
          const I = payIcon[r.icon as keyof typeof payIcon] ?? Check;
          const col = payTone[r.icon as keyof typeof payTone] ?? 'var(--gold)';
          return (
            <motion.div key={r.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex gap-3 px-3.5 py-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: alpha(col, 0.14), color: col, boxShadow: `inset 0 0 0 1px ${alpha(col, 0.4)}` }}><I size={17} /></span>
              <span>
                <span className="block text-[15px] font-semibold">{r.title}</span>
                <span className="mt-0.5 block text-[12px] leading-[17px] text-muted">{r.text}</span>
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/** Figma BottomBar : CTA collant en bas. */
export function BottomBar({ accent, label, onClick, disabled, busy }: { accent: CreateAccent; label: string; onClick: () => void; disabled?: boolean; busy?: boolean }) {
  return (
    <div className="sticky bottom-0 z-20 mt-8 px-[16px] pb-[max(14px,env(safe-area-inset-bottom))] pt-6" style={{ background: 'linear-gradient(180deg,transparent,var(--bg) 40%)' }}>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} disabled={disabled || busy}
        className="relative flex h-[52px] w-full items-center justify-center overflow-hidden rounded-[14px] font-display text-[15px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,.35)] disabled:opacity-50"
        style={{ background: accentGrad[accent], color: accentInk[accent], boxShadow: `0 12px 30px -10px ${alpha(accentCss[accent], 0.7)}, inset 0 1px 0 rgba(255,255,255,.35)` }}>
        {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" /> : label}
      </motion.button>
    </div>
  );
}

/** Recherche de créateur (invitation / rival). */
export function CreatorSearch({ placeholder, exclude, onPick, accent }: { placeholder: string; exclude: string[]; onPick: (id: string) => void; accent: CreateAccent }) {
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const res = useCreatorResults(q, exclude);
  return (
    <div className="relative">
      <label className="flex h-[46px] items-center gap-2.5 rounded-[14px] border border-line-strong bg-panel px-3.5" style={focus ? { boxShadow: `0 0 0 2px ${alpha(accentCss[accent], 0.4)}` } : undefined}>
        <Search size={18} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-2" />
        {q && <button onClick={() => setQ('')} aria-label="Clear"><X size={16} className="text-muted" /></button>}
      </label>
      <AnimatePresence>
        {focus && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute inset-x-0 top-[52px] z-30 max-h-[236px] overflow-y-auto rounded-[14px] border border-line-strong bg-panel shadow-[0_20px_40px_rgba(0,0,0,.5)]">
            {res.length === 0 && <p className="px-4 py-3 text-[13px] text-muted">No creator found</p>}
            {res.map((c) => (
              <button key={c.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(c.id); setQ(''); setFocus(false); }} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-panel-hi">
                <Avatar id={c.id} size={32} to={false} />
                <span className="flex-1"><span className="block text-[13px] font-semibold">{c.handle}</span><span className="block text-[11px] text-muted">{c.name} · {worlds.find((w) => w.id === c.world)?.name}</span></span>
                <Plus size={16} style={{ color: accentCss[accent] }} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function useCreatorResults(q: string, exclude: string[]) {
  const s = q.trim().toLowerCase().replace('@', '');
  return creators.filter((c) => !exclude.includes(c.id) && (!s || c.id.toLowerCase().includes(s) || c.name.toLowerCase().includes(s))).slice(0, 6);
}

export function UserChip({ id, onRemove }: { id: string; onRemove: () => void }) {
  return (
    <motion.span layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
      className="inline-flex h-[35px] items-center gap-2 rounded-full pl-1 pr-2 text-[13px] font-semibold" style={{ background: alpha('var(--cool)', 0.15), boxShadow: `inset 0 0 0 1px ${alpha('var(--cool)', 0.6)}` }}>
      <Avatar id={id} size={27} to={false} />{person(id).handle}
      <button onClick={onRemove} aria-label="Remove"><X size={15} className="text-muted" /></button>
    </motion.span>
  );
}

/** Overlay de succès : burst de particules + check à ressort. */
export function SuccessBurst({ show, accent, title, sub }: { show: boolean; accent: CreateAccent; title: string; sub: string }) {
  const c = accentCss[accent];
  const colors = [c, 'var(--gold)', 'var(--cool)', 'var(--hot)', 'var(--cyan)'];
  const host = typeof document !== 'undefined' ? document.getElementById('app-scroll')?.parentElement : null;
  if (!host) return null;
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div className="absolute inset-0 z-[80] grid place-items-center backdrop-blur-md" style={{ background: "rgba(8,5,16,.82)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="relative flex flex-col items-center px-8 text-center">
            {Array.from({ length: 22 }).map((_, i) => {
              const a = (i / 22) * Math.PI * 2;
              const r = 110 + (i % 3) * 30;
              return (
                <motion.span key={i} className="absolute left-1/2 top-[44px] h-2 w-2 rounded-[2px]" style={{ background: colors[i % colors.length] }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }} animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r, opacity: 0, rotate: 220, scale: 0.6 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.12 }} />
              );
            })}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}
              className="grid h-[88px] w-[88px] place-items-center rounded-full" style={{ background: accentGrad[accent], color: accentInk[accent], boxShadow: `0 0 60px ${alpha(c, 0.6)}` }}>
              <Check size={44} strokeWidth={3} />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 font-display text-[26px] font-bold">{title}</motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-1.5 text-[14px] text-muted">{sub}</motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    host,
  );
}

export { Chip };
