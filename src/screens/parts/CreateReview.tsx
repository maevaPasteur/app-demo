import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Sheet } from '../../components/Sheet';
import { alpha } from '../../ui';
import { Check, CircleAlert, Eye, Pencil } from '../../ui/Icon';
import { accentCss, accentGrad, accentInk, type CreateAccent } from './CreateParts';

/** Aperçu en direct : la vraie carte du feed, non interactive, telle que les fans la verront. */
export function LivePreview({ accent, children, note }: { accent: CreateAccent; children: ReactNode; note?: string }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between px-[18px]">
        <p className="eyebrow flex items-center gap-1.5 text-muted"><Eye size={13} style={{ color: accentCss[accent] }} />LIVE PREVIEW</p>
        <span className="flex items-center gap-1.5 text-[11px] text-muted"><span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: accentCss[accent] }} />{note ?? 'Updates as you type'}</span>
      </div>
      <div className="mx-[10px] mt-2.5 overflow-hidden rounded-[22px] border py-4" style={{ borderColor: alpha(accentCss[accent], 0.3), background: `linear-gradient(180deg, ${alpha(accentCss[accent], 0.06)}, transparent 40%)` }}>
        <div className="pointer-events-none select-none origin-top scale-[0.96]">{children}</div>
      </div>
    </section>
  );
}

/** Liste des problèmes bloquants, affichée au-dessus du CTA. */
export function ValidationList({ issues }: { issues: string[] }) {
  if (!issues.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-[18px] mt-6 rounded-[14px] border px-3.5 py-3" style={{ borderColor: alpha('var(--danger)', 0.4), background: alpha('var(--danger)', 0.06) }}>
      {issues.map((i) => <p key={i} className="flex items-center gap-2 py-0.5 text-[12px] text-danger"><CircleAlert size={14} />{i}</p>)}
    </motion.div>
  );
}

/** Étape de relecture avant publication. */
export function ReviewSheet({ open, onClose, onPublish, accent, title, rows, cta, busy, preview }: {
  open: boolean; onClose: () => void; onPublish: () => void; accent: CreateAccent; title: string;
  rows: { label: string; value: ReactNode }[]; cta: string; busy?: boolean; preview: ReactNode;
}) {
  const host = typeof document !== 'undefined' ? document.getElementById('app-scroll')?.parentElement : null;
  if (!host) return null;
  return createPortal(
    <Sheet open={open} onClose={onClose} full>
      <div className="px-5">
        <p className="eyebrow text-muted">REVIEW BEFORE PUBLISHING</p>
        <h3 className="mt-1 font-display text-[22px] font-bold leading-[26px]">{title}</h3>
      </div>
      <div className="mt-4 overflow-hidden rounded-[20px] border border-line mx-3 py-3">
        <div className="pointer-events-none origin-top scale-[0.94]">{preview}</div>
      </div>
      <div className="mx-5 mt-4 divide-y divide-line rounded-[16px] border border-line bg-ink">
        {rows.map((r, i) => (
          <motion.div key={r.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
            <span className="text-muted">{r.label}</span>
            <span className="min-w-0 truncate text-right font-semibold">{r.value}</span>
          </motion.div>
        ))}
      </div>
      <p className="mx-5 mt-3 flex items-center gap-1.5 text-[12px] text-muted"><Check size={13} className="text-green" />Every unlock and vote is paid to you instantly. No wallet, no waiting.</p>
      <div className="sticky bottom-0 mt-5 flex gap-2 bg-panel px-5 pb-7 pt-3">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex h-[52px] items-center gap-1.5 rounded-[14px] border border-line-strong px-4 font-display text-[14px] font-bold"><Pencil size={15} />Edit</motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onPublish} disabled={busy}
          className="shine relative flex h-[52px] flex-1 items-center justify-center overflow-hidden rounded-[14px] font-display text-[15px] font-bold"
          style={{ background: accentGrad[accent], color: accentInk[accent], boxShadow: `0 12px 30px -10px ${alpha(accentCss[accent], 0.7)}` }}>
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : cta}
        </motion.button>
      </div>
    </Sheet>,
    host,
  );
}
