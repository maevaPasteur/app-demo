import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet as BaseSheet } from '../../components/Sheet';
import { PhonePortal } from './MessagesPortal';
import type { ComponentProps } from 'react';
const Sheet = (p: ComponentProps<typeof BaseSheet>) => <PhonePortal><BaseSheet {...p} /></PhonePortal>;
import { creator as getCreator, fmtPrice, worlds } from '../../data';
import { handleOf, useMessages } from '../../lib/messagesStore';
import { useDemo, type PayIntent } from '../../lib/store';
import { Avatar, alpha, toneColor } from '../../ui';
import { Check, Shield, Sparkles, Timer } from './MessagesIcons';

/** Ouvre la feuille de paiement puis appelle onPaid seulement si l'utilisateur confirme (pas sur annulation). */
export function payThen(intent: PayIntent, onPaid: () => void) {
  const before = useDemo.getState().toast?.id;
  useDemo.getState().ask(intent);
  const unsub = useDemo.subscribe((s) => {
    if (s.pending) return;
    unsub();
    setTimeout(() => {
      const t = useDemo.getState().toast;
      if (t && t.id !== before) onPaid();
    }, 30);
  });
}

const BUDGETS = [25, 45, 60, 90, 150];
const DEADLINES = ['48h', '3 days', '1 week', '2 weeks'];
const IDEAS = [
  'Red bikini at golden hour, slow walk out of the water, just for me',
  'A 20s flirty birthday message for my girlfriend',
  'Your signature twerk, slow motion, back to the camera',
  'Whisper my name at the end of your next clip',
];

/** Fan : proposer un challenge privé à un créateur. Payé uniquement si le créateur accepte, puis instantanément. */
export function PrivateChallengeComposer({ open, onClose, creatorId, threadId }: { open: boolean; onClose: () => void; creatorId: string; threadId?: string }) {
  const nav = useNavigate();
  const c = getCreator(creatorId);
  const [brief, setBrief] = useState('');
  const [budget, setBudget] = useState(60);
  const [deadline, setDeadline] = useState(DEADLINES[1]);
  const [world, setWorld] = useState(c?.world ?? 'content');
  useEffect(() => { if (open) { setBrief(''); setBudget(60); setDeadline(DEADLINES[1]); setWorld(c?.world ?? 'content'); } }, [open, c?.world]);
  if (!c) return null;
  const ok = brief.trim().length >= 8;

  const send = () => {
    if (!ok) return;
    payThen(
      { kind: 'request', label: `Private challenge · ${c.handle}`, sub: `You pay ${fmtPrice(budget)} only if ${c.handle} accepts · then instantly to them`, price: budget, targetId: creatorId },
      () => {
        const id = useMessages.getState().createRequest(creatorId, { brief: brief.trim(), offer: budget, deadline, world }, threadId);
        onClose();
        nav(`/messages/${id}`);
      },
    );
  };

  return (
    <Sheet open={open} onClose={onClose} full>
      <div className="px-5 pb-8">
        <div className="flex items-center gap-3">
          <Avatar id={creatorId} size={46} ring="gold" to={false} />
          <div>
            <p className="eyebrow text-gold">PRIVATE CHALLENGE</p>
            <h3 className="font-display text-[20px] font-bold leading-6">Dare {c.handle}</h3>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-muted">Describe what you want. {c.name.split(' ')[0]} replies within hours. You pay only if the challenge is accepted.</p>

        <label className="mt-4 block">
          <span className="eyebrow text-muted">YOUR CHALLENGE</span>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value.slice(0, 220))} rows={3} placeholder="One take, your style, surprise me…"
            className="mt-2 w-full resize-none rounded-[14px] border border-line bg-ink p-3.5 text-[14px] leading-5 outline-none placeholder:text-muted-2 focus:border-gold" />
          <span className="block text-right text-[11px] text-muted-2">{brief.length}/220</span>
        </label>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {IDEAS.map((i) => <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => setBrief(i)} className="shrink-0 rounded-full border border-line bg-panel px-3 py-1.5 text-[12px] text-txt-90">{i}</motion.button>)}
        </div>

        <p className="eyebrow mb-2 mt-5 text-muted">BUDGET</p>
        <div className="grid grid-cols-5 gap-2">
          {BUDGETS.map((b) => (
            <motion.button key={b} whileTap={{ scale: 0.92 }} onClick={() => setBudget(b)} className="h-11 rounded-[12px] border font-display text-[14px] font-bold"
              style={{ borderColor: budget === b ? 'var(--gold)' : 'var(--line)', color: budget === b ? 'var(--gold)' : 'var(--txt)', background: budget === b ? alpha('var(--gold)', 0.1) : 'var(--ink-700)' }}>${b}</motion.button>
          ))}
        </div>

        <p className="eyebrow mb-2 mt-5 text-muted">DEADLINE</p>
        <div className="flex gap-2">
          {DEADLINES.map((d) => (
            <motion.button key={d} whileTap={{ scale: 0.92 }} onClick={() => setDeadline(d)} className="flex h-10 flex-1 items-center justify-center gap-1 rounded-full border text-[12px] font-semibold"
              style={{ borderColor: deadline === d ? 'var(--hot)' : 'var(--line)', color: deadline === d ? 'var(--hot-soft)' : 'var(--muted)' }}><Timer size={12} />{d}</motion.button>
          ))}
        </div>

        <p className="eyebrow mb-2 mt-5 text-muted">WORLD</p>
        <div className="flex flex-wrap gap-2">
          {worlds.map((w) => (
            <motion.button key={w.id} whileTap={{ scale: 0.92 }} onClick={() => setWorld(w.id)} className="h-9 rounded-full border px-3.5 text-[12px] font-semibold"
              style={{ borderColor: world === w.id ? toneColor(w.tone) : 'var(--line)', color: world === w.id ? toneColor(w.tone) : 'var(--muted)', background: world === w.id ? alpha(toneColor(w.tone), 0.12) : 'transparent' }}>{w.name}</motion.button>
          ))}
        </div>

        <div className="mt-5 rounded-[16px] border border-line bg-ink p-3.5">
          <div className="flex items-center justify-between text-[13px]"><span className="text-muted">Challenge for {handleOf(creatorId)}</span><span className="font-display text-[18px] font-bold text-gold">{fmtPrice(budget)}</span></div>
          <ul className="mt-2.5 space-y-1.5 text-[12px] text-muted">
            <li className="flex items-center gap-2"><Check size={13} className="text-green" />Charged only if accepted</li>
            <li className="flex items-center gap-2"><Check size={13} className="text-green" />Paid instantly to the creator, no wallet</li>
            <li className="flex items-center gap-2"><Shield size={13} className="text-green" />Delivered privately, yours forever</li>
          </ul>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={send} disabled={!ok}
          className="shine relative mt-5 flex h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-[16px] font-display text-[16px] font-bold text-on-gold disabled:opacity-50" style={{ background: 'var(--grad-gold-cta)' }}>
          <Sparkles size={18} />{ok ? `Send request · ${fmtPrice(budget)}` : 'Describe your challenge'}
        </motion.button>
      </div>
    </Sheet>
  );
}
