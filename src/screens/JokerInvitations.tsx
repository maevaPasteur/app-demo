import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useDemo } from '../lib/store';
import { NavHeader, alpha } from '../ui';
import { CircleCheck } from '../ui/Icon';
import { InvitationCard, jk, type Invite } from './parts/JokerParts';

const I = jk.invitations;

/** Figma 491:7671 · Joker · All invitations */
export default function JokerInvitations() {
  const notify = useDemo((s) => s.notify);
  const [tab, setTab] = useState(I.tabs[0]);
  const [items, setItems] = useState<Invite[]>(I.items);
  const shown = items.filter((i) => tab === I.tabs[0] || i.tab === tab);
  const remove = (inv: Invite, ok: boolean) => {
    setItems((l) => l.filter((x) => x.id !== inv.id));
    notify(ok ? `${inv.cta} · see it in progress` : 'Invitation declined', ok ? 'gold' : 'hot');
  };
  return (
    <div className="pb-8">
      <NavHeader title={I.title} />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 pt-2">
        {I.tabs.map((t) => {
          const on = t === tab;
          const n = t === I.tabs[0] ? items.length : items.filter((i) => i.tab === t).length;
          return (
            <motion.button key={t} whileTap={{ scale: 0.94 }} onClick={() => setTab(t)}
              className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3.5 font-display text-[13px] font-semibold"
              style={on ? { color: 'var(--hot-soft)', background: alpha('var(--hot)', 0.14), boxShadow: `inset 0 0 0 1.5px var(--hot)` } : { color: 'var(--muted)', background: 'var(--panel)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
              {t}{n > 0 && <span className="text-[11px] opacity-70">{n}</span>}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-3 space-y-3 px-4">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((inv, i) => (
            <motion.div key={inv.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0, x: 120, transition: { duration: 0.25 } }}>
              <InvitationCard inv={inv} onAccept={() => remove(inv, true)} onDecline={() => remove(inv, false)} />
            </motion.div>
          ))}
        </AnimatePresence>
        {shown.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-2 py-16 text-center">
            <CircleCheck size={36} className="text-gold" />
            <p className="font-display text-[17px] font-bold">You're all caught up</p>
            <p className="text-[13px] text-muted">New invitations land here first.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
