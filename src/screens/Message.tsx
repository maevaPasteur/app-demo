import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { creator, fmtPrice, world as getWorld } from '../data';
import copy from '../data/screens/Message.json';
import { activeRequest, dayLabel, handleOf, isCreatorId, isTeam, startAmbient, useMessages, type Msg } from '../lib/messagesStore';
import { useDemo } from '../lib/store';
import { IconButton, alpha } from '../ui';
import { ContactAvatar } from './parts/MessagesAvatar';
import { Bubble, Typing } from './parts/MessagesBubbles';
import { PrivateChallengeComposer } from './parts/MessagesComposer';
import { ArrowLeft, ArrowUp, Plus, ShieldCheck, Sparkles, Upload, X } from './parts/MessagesIcons';
import { AttachSheet, CounterSheet, DeliverSheet } from './parts/MessagesSheets';

/** Figma 815:6846 (Message) · 816:6893 (Message · Respond) */
export default function Message() {
  startAmbient();
  const { id = '' } = useParams();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  const thread = useMessages((s) => s.threads.find((t) => t.id === id));
  const { send, markRead } = useMessages.getState();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [attach, setAttach] = useState(false);
  const [compose, setCompose] = useState(false);
  const [deliverFor, setDeliverFor] = useState<Msg | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const count = thread?.msgs.length ?? 0;

  useEffect(() => { if (thread) markRead(thread.id); }, [thread?.id, count]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: first.current ? 'auto' : 'smooth', block: 'end' });
    first.current = false;
  }, [count, thread?.typing]);

  if (!thread) return <Navigate to="/messages" replace />;
  const t = thread;
  const req = activeRequest(t);
  const respondOpen = pathname.endsWith('/respond') && !!req && t.inbox === 'creator';
  const team = isTeam(t.with);
  const lastSelf = [...t.msgs].reverse().find((m) => m.from === 'self')?.id;
  const byId = Object.fromEntries(t.msgs.map((m) => [m.id, m]));
  const c = creator(t.with);
  const w = c ? getWorld(c.world) : undefined;

  const submit = () => {
    const s = text.trim();
    if (!s) return;
    send(t.id, s, replyTo?.id);
    setText('');
    setReplyTo(null);
  };

  const r = req?.request;
  const banner = r && ['requested', 'countered', 'paid'].includes(r.status);

  return (
    <div className="flex min-h-[var(--app-h,100dvh)] flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-xl">
        <div className="flex h-[66px] items-center gap-3 px-3.5">
          <IconButton label="Back" onClick={() => nav('/messages')}><ArrowLeft size={18} /></IconButton>
          <button onClick={() => !team && nav(isCreatorId(t.with) ? `/creator/${t.with}` : `/fan/${t.with}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <ContactAvatar id={t.with} size={40} online={t.online} to={false} />
            <span className="min-w-0">
              <span className="flex items-center gap-1 truncate text-[15px] font-semibold">{handleOf(t.with)}{(team || c?.verified) && <ShieldCheck size={14} className="text-txt-90" />}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={t.typing ? 'ty' : 'st'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className={`block text-[12px] ${t.typing || t.online ? 'text-green' : 'text-muted'}`}>
                  {t.typing ? 'typing…' : team ? 'Official account' : t.online ? copy.activeNow : copy.lastSeen}{!t.typing && w ? ` · ${w.name}` : ''}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
          <IconButton label="Safety" onClick={() => notify(copy.safety)}><ShieldCheck size={17} /></IconButton>
        </div>
        {banner && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
            <div className="mx-3.5 mb-2.5 flex items-center gap-2.5 rounded-[12px] border px-3 py-2" style={{ borderColor: alpha(r.status === 'paid' ? 'var(--cyan)' : 'var(--gold)', 0.4), background: alpha(r.status === 'paid' ? 'var(--cyan)' : 'var(--gold)', 0.08) }}>
              <Sparkles size={15} className={r.status === 'paid' ? 'text-cyan' : 'text-gold'} />
              <span className="min-w-0 flex-1 truncate text-[12px]">
                <b className="font-display">{fmtPrice(r.counter ?? r.offer)}</b> · {r.status === 'paid' ? 'paid, ready to deliver' : r.status === 'countered' ? 'counter offer sent' : t.inbox === 'creator' ? 'private challenge request' : 'waiting for answer'} · {r.deadline}
              </span>
              {t.inbox === 'creator' && r.status === 'requested' && <button onClick={() => nav(`/messages/${t.id}/respond`)} className="font-display text-[12px] font-bold text-gold">Respond</button>}
              {t.inbox === 'creator' && r.status === 'paid' && <button onClick={() => setDeliverFor(req!)} className="flex items-center gap-1 font-display text-[12px] font-bold text-cyan"><Upload size={13} />Deliver</button>}
            </div>
          </motion.div>
        )}
      </header>

      <div className="flex-1 space-y-3 px-4 pb-4 pt-3">
        {t.msgs.map((m, i) => {
          const prev = t.msgs[i - 1];
          const sep = !prev || dayLabel(prev.ts) !== dayLabel(m.ts);
          return (
            <Fragment key={m.id}>
              {sep && <p className="pt-2 text-center font-display text-[10px] font-semibold tracking-[1.4px] text-muted">{dayLabel(m.ts)}</p>}
              <Bubble m={m} thread={t} isLastSelf={m.id === lastSelf} replyTarget={m.replyTo ? byId[m.replyTo] : undefined}
                onReply={setReplyTo} onCounter={() => nav(`/messages/${t.id}/respond`)} onDeliver={() => setDeliverFor(m)} />
            </Fragment>
          );
        })}
        <AnimatePresence>{t.typing && <Typing />}</AnimatePresence>
        <div ref={end} />
      </div>

      <div className="sticky bottom-0 z-30 border-t border-line bg-bg/95 px-3.5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <AnimatePresence>
          {replyTo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mb-2 flex items-center gap-2 rounded-[12px] border-l-2 border-gold bg-panel px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-[12px] text-muted">Replying to {replyTo.from === 'self' ? 'yourself' : handleOf(t.with)} · {replyTo.text ?? 'video'}</span>
                <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="text-muted"><X size={15} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {team ? (
          <p className="py-2 text-center text-[12px] text-muted">Official account · replies are not monitored</p>
        ) : (
          <div className="flex items-center gap-2.5">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setAttach(true)} aria-label="Attach" className="grid h-[38px] w-[38px] place-items-center rounded-full border border-line bg-panel"><Plus size={18} /></motion.button>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={copy.placeholder}
              className="h-[42px] min-w-0 flex-1 rounded-full border border-line bg-panel px-4 text-[14px] outline-none placeholder:text-muted-2 focus:border-line-strong" />
            <motion.button whileTap={{ scale: 0.85 }} onClick={submit} aria-label="Send" className="grid h-[38px] w-[38px] place-items-center rounded-full text-white transition-opacity"
              style={{ background: 'linear-gradient(180deg,#ff4f8b,#ff1f6b)', opacity: text.trim() ? 1 : 0.55 }}>
              <ArrowUp size={18} strokeWidth={2.6} />
            </motion.button>
          </div>
        )}
      </div>

      <AttachSheet open={attach} onClose={() => setAttach(false)} thread={t} onPropose={() => setCompose(true)} />
      <CounterSheet open={respondOpen} onClose={() => nav(`/messages/${t.id}`, { replace: true })} thread={t} req={req} />
      <DeliverSheet open={!!deliverFor} onClose={() => setDeliverFor(null)} thread={t} req={deliverFor ?? undefined} />
      {isCreatorId(t.with) && <PrivateChallengeComposer open={compose} onClose={() => setCompose(false)} creatorId={t.with} threadId={t.inbox === 'fan' ? t.id : undefined} />}
    </div>
  );
}
