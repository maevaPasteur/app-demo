import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../../lib/store';
import { Avatar, Counter, alpha } from '../../ui';
import { Bell, ChevronRight, LayoutGrid, LogOut, MessageSquare, Shield, ShieldCheck } from '../../ui/Icon';
import { BadgeCheck } from 'lucide-react';

/** En-tête de profil (Figma ProfileHeader 399:19). */
export function ProfileHead({ id, name, handle }: { id: string; name: string; handle: string }) {
  return (
    <div className="flex flex-col items-center pt-3">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="relative">
        <span className="glowpulse absolute -inset-3 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,182,39,.35), transparent 70%)' }} />
        <Avatar id={id} size={84} ring="gold" to={false} />
      </motion.div>
      <h1 className="mt-3 flex items-center gap-1.5 font-display text-[24px] font-bold">{name}<BadgeCheck size={20} className="fill-cyan text-bg" /></h1>
      <p className="text-[13px] text-muted">{handle}</p>
    </div>
  );
}

export type Stat = { label: string; value: number; fmt: string; sub?: string };
const fmt = (f: string) => (n: number) =>
  f === 'k' ? `${(n / 1000).toFixed(1)}K` : f === 'pct' ? `${Math.round(n)}%` : Math.round(n).toLocaleString('en-US');

export function StatsCard({ stats }: { stats: Stat[] }) {
  return (
    <div className="mx-[18px] mt-5 grid grid-cols-3 divide-x divide-line rounded-[18px] border border-line bg-panel py-3.5">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center px-1">
          <Counter value={s.value} format={fmt(s.fmt)} className="font-display text-[19px] font-bold" />
          {s.sub ? <span className="text-[10px] text-green">{s.sub}</span> : null}
          <span className="mt-0.5 font-display text-[9.5px] font-bold tracking-[1.2px] text-muted">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SectionLabel({ children, right, onRight }: { children: ReactNode; right?: string; onRight?: () => void }) {
  return (
    <div className="mt-7 flex items-center justify-between px-[18px]">
      <p className="eyebrow text-muted">{children}</p>
      {right && <button onClick={onRight} className="flex items-center gap-0.5 font-display text-[11px] font-bold tracking-[1px] text-muted">{right}<ChevronRight size={12} /></button>}
    </div>
  );
}

export function ReferralCard({ title, pct, sub, onClick }: { title: string; pct: string; sub: string; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} className="relative mx-[18px] mt-2.5 flex w-[calc(100%-36px)] items-center gap-3.5 overflow-hidden rounded-[18px] border border-line bg-panel p-3.5 text-left">
      <span className="pointer-events-none absolute -right-6 top-0 h-full w-2/3" style={{ background: `radial-gradient(ellipse at center, ${alpha('var(--green)', 0.18)}, transparent 70%)` }} />
      <span className="grid h-12 w-12 place-items-center rounded-[12px] font-display text-[14px] font-bold text-green" style={{ background: alpha('var(--green)', 0.12), boxShadow: `inset 0 0 0 1px ${alpha('var(--green)', 0.4)}` }}>{pct}</span>
      <span className="relative flex-1">
        <span className="block font-display text-[17px] font-bold">{title} <span className="text-green">{pct}</span></span>
        <span className="block text-[12px] text-muted">{sub}</span>
      </span>
      <ChevronRight size={20} />
    </motion.button>
  );
}

const icons = { subs: LayoutGrid, identity: ShieldCheck, privacy: Shield, notifications: Bell, help: MessageSquare, logout: LogOut } as const;

/** Liste Settings (Figma MenuItem 32:77). */
export function SettingsList({ rows, status, onSubs, restartLabel }: { rows: { id: string; label: string }[]; status: { label: string; ok: boolean }; onSubs: () => void; restartLabel: string }) {
  const nav = useNavigate();
  const open = useDemo((s) => s.openSheet);
  const reset = useDemo((s) => s.reset);
  const act = (id: string) => {
    if (id === 'subs') onSubs();
    if (id === 'identity') nav('/settings/identity');
    if (id === 'privacy') nav('/settings/profile/verified');
    if (id === 'notifications') open('notifications');
    if (id === 'help') nav('/messages');
    if (id === 'logout') { reset(); nav('/welcome'); }
  };
  return (
    <div className="mx-[18px] mt-2.5 space-y-2">
      {rows.map((r, i) => {
        const I = icons[r.id as keyof typeof icons] ?? Shield;
        const isId = r.id === 'identity';
        const color = isId ? (status.ok ? 'var(--green)' : 'var(--gold)') : undefined;
        return (
          <motion.button key={r.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} whileTap={{ scale: 0.98 }}
            onClick={() => act(r.id)} className="flex h-[48px] w-full items-center gap-3.5 rounded-[14px] border border-line bg-panel px-3.5 text-left"
            style={isId ? { borderColor: alpha(color!, 0.35) } : undefined}>
            <I size={20} style={{ color }} />
            <span className="flex-1 text-[14px]" style={{ color }}>{r.label}</span>
            {isId && <span className="font-display text-[12px] font-bold" style={{ color }}>{status.label}</span>}
            {r.id !== 'logout' && <ChevronRight size={16} className="text-muted" />}
          </motion.button>
        );
      })}
      <button onClick={() => { reset(); nav('/welcome'); }} className="w-full py-3 text-center text-[12px] text-muted-2 underline underline-offset-4">{restartLabel}</button>
    </div>
  );
}
