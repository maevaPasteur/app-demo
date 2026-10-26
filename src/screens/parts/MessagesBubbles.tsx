import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState, type ReactNode } from 'react';
import { Media } from '../../components/Media';
import { fmtPrice, video as getVideo, world as getWorld } from '../../data';
import { handleOf, timeOf, useMessages, type Msg, type ReqStatus, type Thread } from '../../lib/messagesStore';
import { useDemo } from '../../lib/store';
import { alpha } from '../../ui';
import { Check, CornerUpLeft, Gift, Lock, LockOpen, Play, Sparkles, Swords, Timer, Upload } from './MessagesIcons';

const anim = { initial: { opacity: 0, y: 12, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: 'spring' as const, stiffness: 420, damping: 30 } };
export const EMOJIS = ['❤️', '🔥', '😂', '😮', '🙏', '💸'];

/** Bulle avec appui long : réactions + répondre. */
function Pressable({ m, thread, onReply, children, mine }: { m: Msg; thread: Thread; onReply: (m: Msg) => void; children: ReactNode; mine: boolean }) {
  const react = useMessages((s) => s.react);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = () => { timer.current = setTimeout(() => setOpen(true), 420); };
  const stop = () => clearTimeout(timer.current);
  return (
    <div className="relative" onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onContextMenu={(e) => { e.preventDefault(); setOpen(true); }}>
      {children}
      {!!m.reactions?.length && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`absolute -bottom-3 flex gap-0.5 rounded-full border border-line bg-panel px-1.5 py-0.5 text-[12px] ${mine ? 'right-2' : 'left-2'}`}>
          {m.reactions.map((r) => <span key={r}>{r}</span>)}
        </motion.div>
      )}
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="scrim" className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div key="pop" initial={{ opacity: 0, y: 8, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className={`absolute -top-14 z-50 flex items-center gap-1 rounded-full border border-line-strong bg-panel-hi px-2 py-1.5 shadow-[0_12px_30px_rgba(0,0,0,.5)] ${mine ? 'right-0' : 'left-0'}`}>
              {EMOJIS.map((e, i) => (
                <motion.button key={e} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.03 }} whileTap={{ scale: 1.4 }} onClick={() => { react(thread.id, m.id, e); setOpen(false); }}
                  className="grid h-9 w-9 place-items-center rounded-full text-[20px] hover:bg-white/10">{e}</motion.button>
              ))}
              <span className="mx-0.5 h-6 w-px bg-line-strong" />
              <button onClick={() => { onReply(m); setOpen(false); }} className="grid h-9 w-9 place-items-center rounded-full text-muted" aria-label="Reply"><CornerUpLeft size={17} /></button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Timeline d'un challenge privé ---------- */
const STEPS: { s: ReqStatus; label: string }[] = [
  { s: 'requested', label: 'Requested' },
  { s: 'accepted', label: 'Accepted' },
  { s: 'paid', label: 'Paid' },
  { s: 'delivered', label: 'Delivered' },
];
const rank = (s: ReqStatus) => (s === 'countered' ? 0 : s === 'declined' ? -1 : STEPS.findIndex((x) => x.s === s));

export function ReqTimeline({ status }: { status: ReqStatus }) {
  const r = rank(status);
  return (
    <div className="mt-3 flex items-center">
      {STEPS.map((st, i) => {
        const done = i <= r;
        return (
          <div key={st.s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <motion.span className="grid h-6 w-6 place-items-center rounded-full" initial={false}
                animate={{ background: done ? 'var(--green)' : 'var(--panel-hi)', scale: i === r ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.45 }}>
                {done ? <Check size={13} strokeWidth={3} className="text-on-green" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-2" />}
              </motion.span>
              <span className={`mt-1 text-[10px] font-semibold ${done ? 'text-green' : 'text-muted-2'}`}>{st.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-1 mb-4 h-0.5 flex-1 overflow-hidden rounded-full bg-panel-hi">
                <motion.div className="h-full bg-green" initial={false} animate={{ width: i < r ? '100%' : '0%' }} transition={{ duration: 0.6 }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const statusLabel: Record<ReqStatus, { t: string; c: string }> = {
  requested: { t: 'Waiting for answer', c: 'var(--hot)' },
  countered: { t: 'Counter offer sent', c: 'var(--gold)' },
  accepted: { t: 'Accepted · payment processing', c: 'var(--cyan)' },
  paid: { t: 'Paid instantly', c: 'var(--green)' },
  delivered: { t: 'Delivered', c: 'var(--green)' },
  declined: { t: 'Declined · nothing charged', c: 'var(--danger)' },
};

/** Carte de challenge privé (créateur : accepter / contre-proposer / refuser / livrer ; fan : suivi). */
export function RequestCard({ m, thread, onCounter, onDeliver }: { m: Msg; thread: Thread; onCounter: () => void; onDeliver: () => void }) {
  const r = m.request!;
  const { acceptRequest, declineRequest } = useMessages.getState();
  const creatorSide = thread.inbox === 'creator';
  const w = getWorld(r.world);
  const amount = r.counter ?? r.offer;
  const [pop, setPop] = useState(false);
  const accept = () => { acceptRequest(thread.id, m.id); setTimeout(() => setPop(true), 1100); setTimeout(() => setPop(false), 2600); };
  const st = statusLabel[r.status];
  return (
    <div className="relative w-[300px] overflow-hidden rounded-[20px] border p-3.5" style={{ borderColor: alpha('var(--gold)', 0.45), background: `linear-gradient(170deg, ${alpha('var(--gold)', 0.13)}, var(--panel) 55%)` }}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-display text-[11px] font-bold tracking-[1.4px] text-gold"><Sparkles size={13} />PRIVATE CHALLENGE</span>
        <span className="font-display text-[20px] font-bold text-gold">
          {r.counter && r.status !== 'requested' ? <><s className="mr-1.5 text-[13px] text-muted">{fmtPrice(r.offer)}</s>{fmtPrice(r.counter)}</> : fmtPrice(r.offer)}
        </span>
      </div>
      <p className="mt-2 text-[14px] leading-[20px]">{r.brief}</p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-full bg-panel-hi px-2 py-0.5 text-muted"><Timer size={11} />{r.deadline}</span>
        {w && <span className="rounded-full px-2 py-0.5" style={{ background: alpha(`var(--tone-${w.tone})`, 0.14), color: `var(--tone-${w.tone})` }}>{w.name}</span>}
        <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: alpha(st.c, 0.14), color: st.c }}>{st.t}</span>
      </div>
      {r.status !== 'declined' && <ReqTimeline status={r.status} />}

      {creatorSide && r.status === 'requested' && (
        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={accept} className="h-10 rounded-[12px] font-display text-[13px] font-bold text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}>Accept · {fmtPrice(r.offer)}</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onCounter} className="h-10 rounded-[12px] border border-line-strong px-3 font-display text-[13px] font-bold">Counter</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => declineRequest(thread.id, m.id)} className="h-10 rounded-[12px] px-2.5 font-display text-[13px] font-bold text-danger">Decline</motion.button>
        </div>
      )}
      {creatorSide && r.status === 'paid' && (
        <motion.button whileTap={{ scale: 0.96 }} onClick={onDeliver} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="shine relative mt-3 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] font-display text-[14px] font-bold text-on-cyan" style={{ background: 'var(--grad-cyan)' }}>
          <Upload size={16} />Deliver the video
        </motion.button>
      )}
      {!creatorSide && r.status === 'requested' && <p className="mt-3 text-[12px] text-muted">You pay {fmtPrice(r.offer)} only if {handleOf(thread.with)} accepts. Then it goes instantly to them.</p>}

      <AnimatePresence>
        {pop && (
          <motion.span key="pop" className="pointer-events-none absolute right-4 top-10 font-display text-[22px] font-bold text-gold" initial={{ y: 10, opacity: 0, scale: 0.6 }} animate={{ y: -26, opacity: 1, scale: 1.1 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.6 }}>
            +{fmtPrice(amount)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Bulle générique ---------- */
export function Bubble({ m, thread, onReply, onCounter, onDeliver, isLastSelf, replyTarget }: {
  m: Msg; thread: Thread; onReply: (m: Msg) => void; onCounter: () => void; onDeliver: () => void; isLastSelf: boolean; replyTarget?: Msg;
}) {
  const mine = m.from === 'self';
  const align = mine ? 'items-end' : 'items-start';
  const ask = useDemo((s) => s.ask);
  const unlockedKey = `pm-${thread.id}-${m.id}`;
  const unlocked = useDemo((s) => s.unlocked.has(unlockedKey));
  const { acceptInvite, declineInvite } = useMessages.getState();
  const foot = (
    <p className={`mt-1 flex items-center gap-1 text-[10px] text-muted-2 ${mine ? 'justify-end' : ''}`}>
      {timeOf(m.ts)}
      {mine && isLastSelf && <span className={m.read ? 'text-cyan' : ''}>· {m.read ? 'Seen' : 'Delivered'}</span>}
    </p>
  );

  if (m.kind === 'system') {
    return (
      <motion.div {...anim} className="flex justify-center">
        <span className="max-w-[300px] rounded-full bg-panel px-3 py-1.5 text-center text-[11px] text-muted">{m.text}</span>
      </motion.div>
    );
  }
  if (m.kind === 'tip') {
    return (
      <motion.div {...anim} className="flex justify-center">
        <motion.div initial={{ scale: 0.6 }} animate={{ scale: [0.6, 1.08, 1] }} className="flex items-center gap-2.5 rounded-[16px] border px-4 py-2.5" style={{ borderColor: alpha('var(--gold)', 0.45), background: alpha('var(--gold)', 0.08) }}>
          <span className="grid h-9 w-9 place-items-center rounded-full text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}><Gift size={17} /></span>
          <span>
            <span className="block font-display text-[15px] font-bold text-gold">{mine ? 'You tipped' : `${handleOf(thread.with)} tipped`} {fmtPrice(m.amount ?? 0)}</span>
            <span className="block text-[11px] text-muted">{m.text ? `“${m.text}” · ` : ''}100% to the creator, instantly</span>
          </span>
        </motion.div>
      </motion.div>
    );
  }
  if (m.kind === 'request') {
    return (
      <motion.div {...anim} className={`flex flex-col ${align}`}>
        <Pressable m={m} thread={thread} onReply={onReply} mine={mine}><RequestCard m={m} thread={thread} onCounter={onCounter} onDeliver={onDeliver} /></Pressable>
        {foot}
      </motion.div>
    );
  }
  if (m.kind === 'duel' || m.kind === 'collab') {
    const duel = m.kind === 'duel';
    const c = duel ? 'var(--cyan)' : 'var(--gold)';
    const w = m.world ? getWorld(m.world) : undefined;
    return (
      <motion.div {...anim} className={`flex flex-col ${align}`}>
        <div className="w-[290px] rounded-[20px] border p-3.5" style={{ borderColor: alpha(c, 0.45), background: `linear-gradient(170deg, ${alpha(c, 0.12)}, var(--panel) 60%)` }}>
          <p className="flex items-center gap-1.5 font-display text-[11px] font-bold tracking-[1.4px]" style={{ color: c }}>{duel ? <Swords size={13} /> : <Sparkles size={13} />}{duel ? 'DUEL INVITE' : 'COLLAB DROP INVITE'}</p>
          <p className="mt-2 text-[14px] font-semibold leading-5">{m.title}</p>
          <p className="mt-1 text-[12px] text-muted">{duel ? `${w?.name ?? 'Lifestyle'} · fans pay ${fmtPrice(m.price ?? 2)} to unlock both and vote` : `Goal ${fmtPrice(m.goal ?? 0)} · ${m.split} · paid instantly`}</p>
          {m.status === 'pending' && !mine ? (
            <div className="mt-3 flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => acceptInvite(thread.id, m.id)} className="h-10 flex-1 rounded-[12px] font-display text-[13px] font-bold" style={{ background: duel ? 'var(--grad-cyan)' : 'var(--grad-gold-cta)', color: duel ? 'var(--on-cyan)' : 'var(--on-gold)' }}>{duel ? 'Accept duel' : 'Join drop'}</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => declineInvite(thread.id, m.id)} className="h-10 rounded-[12px] border border-line-strong px-4 font-display text-[13px] font-bold">Decline</motion.button>
            </div>
          ) : (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: alpha(m.status === 'declined' ? 'var(--danger)' : m.status === 'accepted' ? 'var(--green)' : 'var(--hot)', 0.14), color: m.status === 'declined' ? 'var(--danger)' : m.status === 'accepted' ? 'var(--green)' : 'var(--hot-soft)' }}>
              {m.status === 'accepted' ? <><Check size={12} />Accepted</> : m.status === 'declined' ? 'Declined' : 'Waiting for answer'}
            </p>
          )}
        </div>
        {foot}
      </motion.div>
    );
  }
  if (m.kind === 'private' || m.kind === 'media') {
    const v = m.video ? getVideo(m.video) : undefined;
    const isPrivate = m.kind === 'private';
    const canSee = !isPrivate || mine || m.paid || unlocked;
    return (
      <motion.div {...anim} className={`flex flex-col ${align}`}>
        <Pressable m={m} thread={thread} onReply={onReply} mine={mine}>
          <div className="relative h-[210px] w-[170px] overflow-hidden rounded-[18px] border border-line bg-media">
            {v && canSee ? <Media video={v} className="absolute inset-0" /> : v && <img src={v.poster} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-xl" />}
            <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 50%,rgba(8,5,16,.85))' }} />
            {isPrivate && (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 font-display text-[10px] font-bold text-white">
                {canSee ? <LockOpen size={11} /> : <Lock size={11} />}PRIVATE
              </span>
            )}
            {isPrivate && !canSee ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2.2, repeat: Infinity }} className="grid h-11 w-11 place-items-center rounded-full" style={{ background: alpha('var(--gold)', 0.18), boxShadow: `inset 0 0 0 1.5px ${alpha('var(--gold)', 0.7)}` }}>
                  <Lock size={20} className="text-gold" />
                </motion.span>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => ask({ kind: 'unlock', label: `Private video · ${handleOf(thread.with)}`, sub: 'Made for you · yours forever', price: m.price ?? 0, targetId: unlockedKey })}
                  className="h-[30px] rounded-full px-3.5 font-display text-[12px] font-bold text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}>
                  Unlock · {fmtPrice(m.price ?? 0)}
                </motion.button>
              </div>
            ) : (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-semibold text-white"><Play size={11} fill="currentColor" />{isPrivate ? (m.paid ? `Paid · ${fmtPrice(m.price ?? 0)}` : mine ? `Locked · ${fmtPrice(m.price ?? 0)}` : 'Unlocked') : 'Video'}</span>
            )}
          </div>
        </Pressable>
        {m.text && <p className={`mt-1.5 max-w-[240px] text-[13px] ${mine ? 'text-right' : ''}`}>{m.text}</p>}
        {foot}
      </motion.div>
    );
  }

  // text, counter, tipask
  const special = m.kind === 'counter' || m.kind === 'tipask';
  return (
    <motion.div {...anim} className={`flex flex-col ${align}`}>
      <Pressable m={m} thread={thread} onReply={onReply} mine={mine}>
        <div className={`max-w-[270px] px-4 py-2.5 text-[15px] leading-[21px] ${mine ? 'rounded-[18px] rounded-br-[6px] text-white' : 'rounded-[18px] rounded-bl-[6px] bg-panel-hi'}`}
          style={mine ? { background: special ? 'linear-gradient(180deg,#ffd37a,#ffb627)' : 'linear-gradient(180deg,#c05cff,#a148f0)', color: special ? 'var(--on-gold)' : undefined } : undefined}>
          {replyTarget && (
            <span className={`mb-1.5 block border-l-2 pl-2 text-[12px] ${mine ? 'border-white/60 text-white/80' : 'border-gold text-muted'}`}>
              {replyTarget.from === 'self' ? 'You' : handleOf(thread.with)} · {replyTarget.text ?? 'video'}
            </span>
          )}
          {m.kind === 'counter' && <span className="mb-0.5 block font-display text-[11px] font-bold tracking-[1.2px] opacity-75">COUNTER OFFER · {fmtPrice(m.amount ?? 0)}</span>}
          {m.kind === 'tipask' && <span className="mb-0.5 block font-display text-[11px] font-bold tracking-[1.2px] opacity-75">TIP REQUEST</span>}
          {m.text}
        </div>
      </Pressable>
      {foot}
    </motion.div>
  );
}

export function Typing() {
  return (
    <motion.div key="typing" initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex w-fit items-center gap-1 rounded-[18px] rounded-bl-[6px] bg-panel-hi px-4 py-3" aria-label="typing">
      {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted" animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />)}
    </motion.div>
  );
}
