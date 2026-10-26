import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sheet as BaseSheet } from '../../components/Sheet';
import { PhonePortal } from './MessagesPortal';
import type { ComponentProps } from 'react';
const Sheet = (p: ComponentProps<typeof BaseSheet>) => <PhonePortal><BaseSheet {...p} /></PhonePortal>;
import { app, fmtPrice, tips, videos } from '../../data';
import { handleOf, isCreatorId, selfOf, useMessages, type Msg, type Thread } from '../../lib/messagesStore';
import { payThen } from './MessagesComposer';
import { alpha } from '../../ui';
import { Check, Film, Gift, HandCoins, Lock, Minus, Plus, Sparkles, Swords, Upload } from './MessagesIcons';

const chip = (on: boolean, c = 'var(--gold)') => ({ borderColor: on ? c : 'var(--line)', color: on ? c : 'var(--muted)', background: on ? alpha(c, 0.1) : 'transparent' });

/* ---------- Contre-proposition (route /messages/:id/respond) ---------- */
export function CounterSheet({ open, onClose, thread, req }: { open: boolean; onClose: () => void; thread: Thread; req?: Msg }) {
  const base = req?.request?.offer ?? 25;
  const [price, setPrice] = useState(base + 20);
  const { counterRequest, acceptRequest, declineRequest } = useMessages.getState();
  useEffect(() => { if (open) setPrice(Math.round((base * 1.3) / 5) * 5); }, [open, base]);
  if (!req?.request) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const r = req.request;
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pb-7">
        <h3 className="font-display text-[22px] font-bold">Respond to request</h3>
        <p className="mt-1 text-[13px] text-muted">{handleOf(thread.with)} · “{r.brief}”</p>
        <div className="mt-4 flex items-center rounded-[14px] bg-ink px-4 py-3 text-[14px]">
          <span className="text-muted">Their offer</span>
          <span className="ml-2 font-display text-[16px] font-bold text-gold">{fmtPrice(r.offer)}</span>
          <span className="ml-auto text-[12px] text-muted">Deadline {r.deadline}</span>
        </div>
        <p className="eyebrow mt-5 text-muted">YOUR COUNTER OFFER</p>
        <div className="mt-2.5 flex h-[54px] items-center gap-3 rounded-[14px] border border-line bg-ink px-3">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setPrice((p) => Math.max(5, p - 5))} className="grid h-8 w-8 place-items-center rounded-full bg-panel-hi" aria-label="Lower"><Minus size={15} /></motion.button>
          <motion.span key={price} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-[22px] font-bold">{fmtPrice(price)}</motion.span>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setPrice((p) => p + 5)} className="grid h-8 w-8 place-items-center rounded-full bg-panel-hi" aria-label="Raise"><Plus size={15} /></motion.button>
          <span className="ml-auto text-[12px] text-muted">{price > r.offer * 1.35 ? 'They may negotiate' : 'Likely accepted'}</span>
        </div>
        <div className="mt-2 flex gap-2">
          {[r.offer + 10, r.offer + 20, Math.round(r.offer * 1.5), r.offer * 2].map((v) => (
            <motion.button key={v} whileTap={{ scale: 0.92 }} onClick={() => setPrice(v)} className="h-8 flex-1 rounded-full border font-display text-[12px] font-bold" style={chip(price === v)}>{fmtPrice(v)}</motion.button>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { counterRequest(thread.id, req.id, price); onClose(); }}
          className="mt-5 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] font-display text-[15px] font-bold text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}>
          Send counter · {fmtPrice(price)}
        </motion.button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => { acceptRequest(thread.id, req.id); onClose(); }} className="h-11 rounded-[14px] border border-line-strong font-display text-[14px] font-bold">Accept {fmtPrice(r.offer)}</button>
          <button onClick={() => { declineRequest(thread.id, req.id); onClose(); }} className="h-11 rounded-[14px] font-display text-[14px] font-bold text-danger">Decline</button>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------- Livraison d'une vidéo (créateur) ---------- */
function VideoPicker({ owner, picked, setPicked }: { owner: string; picked: string | null; setPicked: (v: string) => void }) {
  const list = [...videos.filter((v) => v.creator === owner), ...videos.filter((v) => v.creator !== owner && v.world === 'content')].slice(0, 9);
  return (
    <div className="grid grid-cols-3 gap-2">
      {list.map((v) => (
        <motion.button key={v.id} whileTap={{ scale: 0.95 }} onClick={() => setPicked(v.id)} className="relative h-[120px] overflow-hidden rounded-[12px] bg-media"
          style={{ boxShadow: picked === v.id ? 'inset 0 0 0 2px var(--cyan)' : 'inset 0 0 0 1px var(--line)' }}>
          <img src={v.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {picked === v.id && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-cyan text-on-cyan"><Check size={14} strokeWidth={3} /></motion.span>}
          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white">0:{String(Math.min(59, v.durationSec)).padStart(2, '0')}</span>
        </motion.button>
      ))}
    </div>
  );
}

function UploadButton({ label, disabled, onDone, color = 'cyan' }: { label: string; disabled?: boolean; onDone: () => void; color?: 'cyan' | 'gold' }) {
  const [p, setP] = useState(-1);
  useEffect(() => {
    if (p < 0 || p >= 100) return;
    const t = setTimeout(() => setP((x) => Math.min(100, x + 7 + Math.random() * 12)), 90);
    return () => clearTimeout(t);
  }, [p]);
  useEffect(() => { if (p >= 100) { const t = setTimeout(onDone, 350); return () => clearTimeout(t); } }, [p, onDone]);
  const bg = color === 'cyan' ? 'var(--grad-cyan)' : 'var(--grad-gold-cta)';
  return (
    <motion.button whileTap={{ scale: 0.97 }} disabled={disabled || p >= 0} onClick={() => setP(0)}
      className="relative mt-4 flex h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-[14px] font-display text-[15px] font-bold disabled:opacity-90"
      style={{ background: p >= 0 ? 'var(--panel-hi)' : bg, color: p >= 0 ? 'var(--txt)' : color === 'cyan' ? 'var(--on-cyan)' : 'var(--on-gold)', opacity: disabled ? 0.5 : 1 }}>
      {p >= 0 && <motion.span className="absolute inset-y-0 left-0" style={{ background: bg, opacity: 0.35 }} animate={{ width: `${p}%` }} />}
      <span className="relative flex items-center gap-2">
        {p < 0 && <><Upload size={17} />{label}</>}
        {p >= 0 && p < 100 && <>Uploading · {Math.round(p)}%</>}
        {p >= 100 && <><Check size={17} />Sent</>}
      </span>
    </motion.button>
  );
}

export function DeliverSheet({ open, onClose, thread, req }: { open: boolean; onClose: () => void; thread: Thread; req?: Msg }) {
  const [picked, setPicked] = useState<string | null>(null);
  const deliver = useMessages((s) => s.deliver);
  useEffect(() => { if (open) setPicked(null); }, [open]);
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pb-7">
        <h3 className="font-display text-[22px] font-bold">Deliver the challenge</h3>
        <p className="mt-1 text-[13px] text-muted">Already paid by {handleOf(thread.with)} · {fmtPrice(req?.request?.counter ?? req?.request?.offer ?? 0)} is in your account.</p>
        <p className="eyebrow mb-2 mt-4 text-muted">PICK YOUR CLIP</p>
        <VideoPicker owner={selfOf(thread.inbox)} picked={picked} setPicked={setPicked} />
        {open && <UploadButton key={String(open)} label="Upload & deliver" disabled={!picked} onDone={() => { if (req && picked) deliver(thread.id, req.id, picked); onClose(); }} />}
      </div>
    </Sheet>
  );
}

/* ---------- Menu pièce jointe ---------- */
type Mode = 'menu' | 'private' | 'tip' | 'share';
export function AttachSheet({ open, onClose, thread, onPropose }: { open: boolean; onClose: () => void; thread: Thread; onPropose: () => void }) {
  const [mode, setMode] = useState<Mode>('menu');
  const [picked, setPicked] = useState<string | null>(null);
  const [price, setPrice] = useState(9.99);
  const [tip, setTip] = useState(tips.amounts[1]);
  const st = useMessages.getState();
  useEffect(() => { if (open) { setMode('menu'); setPicked(null); } }, [open]);
  const creatorBox = thread.inbox === 'creator';
  const otherIsCreator = isCreatorId(thread.with);

  const items = creatorBox
    ? [
        { k: 'private', icon: Lock, c: 'var(--gold)', t: 'Send a private video', d: 'Locked until they pay · paid to you instantly' },
        { k: 'tip', icon: HandCoins, c: 'var(--gold)', t: 'Ask for a tip', d: 'A friendly nudge, 100% to you' },
        ...(otherIsCreator ? [{ k: 'duel', icon: Swords, c: 'var(--cyan)', t: 'Invite to a duel', d: 'Same brief, fans unlock and vote' }] : []),
        { k: 'share', icon: Film, c: 'var(--muted)', t: 'Share a video', d: 'Send one of your public videos' },
      ]
    : [
        ...(otherIsCreator ? [{ k: 'propose', icon: Sparkles, c: 'var(--gold)', t: 'Propose a private challenge', d: 'You pay only if they accept' }] : []),
        ...(otherIsCreator ? [{ k: 'tip', icon: Gift, c: 'var(--gold)', t: 'Send a tip', d: '100% to the creator, instantly' }] : []),
        { k: 'share', icon: Film, c: 'var(--muted)', t: 'Share a video', d: 'Send a video from the feed' },
      ];

  const choose = (k: string) => {
    if (k === 'propose') { onClose(); setTimeout(onPropose, 250); return; }
    if (k === 'duel') { st.inviteDuel(thread.id); onClose(); return; }
    if (k === 'tip' && creatorBox) { st.askTip(thread.id); onClose(); return; }
    setMode(k as Mode);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pb-7">
        <AnimatePresence mode="popLayout" initial={false}>
          {mode === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="font-display text-[22px] font-bold">Send</h3>
              <div className="mt-4 space-y-2.5">
                {items.map((it, i) => (
                  <motion.button key={it.k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.98 }} onClick={() => choose(it.k)}
                    className="flex w-full items-center gap-3.5 rounded-[16px] border border-line bg-ink p-3.5 text-left">
                    <span className="grid h-11 w-11 place-items-center rounded-[12px]" style={{ background: alpha(it.c, 0.14), color: it.c }}><it.icon size={20} /></span>
                    <span><span className="block font-display text-[15px] font-bold">{it.t}</span><span className="block text-[12px] text-muted">{it.d}</span></span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {(mode === 'private' || mode === 'share') && (
            <motion.div key="pick" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h3 className="font-display text-[22px] font-bold">{mode === 'private' ? 'Private video' : 'Share a video'}</h3>
              <p className="mb-3 mt-1 text-[13px] text-muted">{mode === 'private' ? `${handleOf(thread.with)} sees a blurred preview until they unlock it.` : 'Pick a clip to share.'}</p>
              <VideoPicker owner={creatorBox ? selfOf(thread.inbox) : thread.with} picked={picked} setPicked={setPicked} />
              {mode === 'private' && (
                <div className="mt-3 flex gap-2">
                  {[4.99, 9.99, 14.99, 24.99].map((v) => <motion.button key={v} whileTap={{ scale: 0.92 }} onClick={() => setPrice(v)} className="h-9 flex-1 rounded-full border font-display text-[12px] font-bold" style={chip(price === v)}>{fmtPrice(v)}</motion.button>)}
                </div>
              )}
              {mode === 'private'
                ? <UploadButton label={`Send locked · ${fmtPrice(price)}`} color="gold" disabled={!picked} onDone={() => { if (picked) st.sendPrivate(thread.id, picked, price); onClose(); }} />
                : <motion.button whileTap={{ scale: 0.97 }} disabled={!picked} onClick={() => { if (picked) st.shareVideo(thread.id, picked); onClose(); }} className="mt-4 h-[50px] w-full rounded-[14px] border border-line-strong font-display text-[15px] font-bold disabled:opacity-50">Send</motion.button>}
            </motion.div>
          )}
          {mode === 'tip' && (
            <motion.div key="tip" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h3 className="font-display text-[22px] font-bold">Tip {handleOf(thread.with)}</h3>
              <p className="mt-1 text-[13px] text-muted">{tips.sub}</p>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {tips.amounts.map((a) => <motion.button key={a} whileTap={{ scale: 0.92 }} onClick={() => setTip(a)} className="h-12 rounded-[12px] border font-display text-[16px] font-bold" style={chip(tip === a)}>{fmtPrice(a)}</motion.button>)}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                onClose();
                payThen({ kind: 'tip', label: `Tip ${handleOf(thread.with)}`, sub: tips.sub, price: tip, targetId: thread.with }, () => st.payTip(thread.id, tip));
              }} className="mt-4 h-[50px] w-full rounded-[14px] font-display text-[15px] font-bold text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}>
                Continue · {fmtPrice(tip)}
              </motion.button>
              <p className="mt-2 text-center text-[11px] text-muted">{app.paySheet.note}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}
