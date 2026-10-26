import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { creator, fmtPrice } from '../data';
import copy from '../data/screens/Messages.json';
import {
  activeRequest, formatAgo, handleOf, lastMsg, preview, selfOf, startAmbient, useMessages, useUnreadCount, type Folder, type Inbox, type Thread,
} from '../lib/messagesStore';
import { useDemo } from '../lib/store';
import { IconButton, Tag, alpha } from '../ui';
import { ContactAvatar } from './parts/MessagesAvatar';
import { Archive, ArchiveRestore, ArrowLeft, ChevronDown, Pin, PinOff, Plus, Search, ShieldCheck, Sparkles, Swords } from './parts/MessagesIcons';

type Filter = 'all' | 'unread' | 'offers' | 'paid';
const tabIds: Folder[] = ['primary', 'general', 'requests'];
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'offers', label: 'Offers' },
  { id: 'paid', label: 'Paid' },
];

const hasOffer = (t: Thread) => t.msgs.some((m) => m.kind === 'request' || m.kind === 'duel' || m.kind === 'collab');
const isPaid = (t: Thread) => t.msgs.some((m) => m.kind === 'tip' || (m.kind === 'private' && m.paid) || (m.request && ['paid', 'delivered'].includes(m.request.status)));
const lastTs = (t: Thread) => lastMsg(t)?.ts ?? 0;
/** Boîte affichée en dernier (mémorisée pendant la session). */
let lastInbox: Inbox | null = null;

/** Figma 811:6828 (Primary) · 818:7033 (Requests) */
export default function Messages() {
  startAmbient();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const role = useDemo((s) => s.role);
  const openSheet = useDemo((s) => s.openSheet);
  const threads = useMessages((s) => s.threads);
  const [inbox, setInboxRaw] = useState<Inbox>(lastInbox ?? role);
  const setInbox = (b: Inbox) => { lastInbox = b; setInboxRaw(b); };
  const [tab, setTab] = useState<Folder>(pathname.endsWith('/requests') ? 'requests' : 'primary');
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const unreadCreator = useUnreadCount('creator');
  const unreadFan = useUnreadCount('fan');

  const box = useMemo(() => threads.filter((t) => t.inbox === inbox), [threads, inbox]);
  const counts = useMemo(() => Object.fromEntries(tabIds.map((f) => [f, box.filter((t) => t.folder === f && !t.archived).length])) as Record<Folder, number>, [box]);
  const reqUnread = box.filter((t) => t.folder === 'requests' && !t.archived).length;

  const match = (t: Thread) => {
    if (q) {
      const s = q.toLowerCase();
      if (!handleOf(t.with).toLowerCase().includes(s) && !t.msgs.some((m) => (m.text ?? m.request?.brief ?? m.title ?? '').toLowerCase().includes(s))) return false;
    }
    if (filter === 'unread' && !t.unread) return false;
    if (filter === 'offers' && !hasOffer(t)) return false;
    if (filter === 'paid' && !isPaid(t)) return false;
    return true;
  };
  const list = box.filter((t) => t.folder === tab && !t.archived && match(t)).sort((a, b) => lastTs(b) - lastTs(a));
  const pinned = tab === 'primary' ? list.filter((t) => t.pinned) : [];
  const rest = tab === 'primary' ? list.filter((t) => !t.pinned) : list;
  const archived = box.filter((t) => t.archived);

  const go = (t: Folder) => { setTab(t); nav(t === 'requests' ? '/messages/requests' : '/messages', { replace: true }); };

  // chiffres clés côté créateur
  const earnedToday = box.reduce((n, t) => n + t.msgs.filter((m) => m.ts > Date.now() - 864e5).reduce((a, m) => a + (m.kind === 'tip' && m.from === 'other' ? m.amount ?? 0 : 0), 0), 0);
  const openOffers = box.reduce((n, t) => n + t.msgs.filter((m) => m.request?.status === 'requested' && m.from === 'other').reduce((a, m) => a + (m.request?.offer ?? 0), 0), 0);
  const toDeliver = box.filter((t) => t.msgs.some((m) => m.request?.status === 'paid')).length;

  return (
    <div className="min-h-full pb-6">
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-xl">
        <div className="flex h-[62px] items-center gap-3 px-[18px]">
          <IconButton label="Back" onClick={() => nav(-1)}><ArrowLeft size={18} /></IconButton>
          <h1 className="flex-1 font-display text-[22px] font-bold">{copy.title}</h1>
          <IconButton label="New message" onClick={() => openSheet('search')}><Plus size={18} /></IconButton>
        </div>

        {/* Boîte créateur / fan */}
        <div className="mx-[18px] mb-2.5 flex rounded-[14px] border border-line bg-panel p-1">
          {(['creator', 'fan'] as Inbox[]).map((b) => (
            <button key={b} onClick={() => setInbox(b)} className="relative flex h-9 flex-1 items-center justify-center gap-1.5 font-display text-[13px] font-bold" style={{ color: inbox === b ? 'var(--txt)' : 'var(--muted)' }}>
              {inbox === b && <motion.span layoutId="inboxswitch" className="absolute inset-0 rounded-[10px] bg-panel-hi" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <span className="relative">{b === 'creator' ? `Creator · ${handleOf(selfOf('creator'))}` : `Fan · ${handleOf(selfOf('fan'))}`}</span>
              {(b === 'creator' ? unreadCreator : unreadFan) > 0 && <span className="relative grid h-[18px] min-w-[18px] place-items-center rounded-full bg-hot px-1 text-[10px] font-bold text-white">{b === 'creator' ? unreadCreator : unreadFan}</span>}
            </button>
          ))}
        </div>

        <div className="px-[18px] pb-2">
          <label className="flex h-11 items-center gap-2.5 rounded-[14px] border border-line bg-panel px-3.5">
            <Search size={17} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={copy.search} className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-2" />
          </label>
        </div>
        <div className="flex gap-6 border-b border-line px-[18px]">
          {tabIds.map((t, i) => (
            <button key={t} onClick={() => go(t)} className="relative flex h-[44px] items-center gap-1.5 font-display text-[14px] font-semibold" style={{ color: tab === t ? 'var(--txt)' : 'var(--muted)' }}>
              {copy.tabs[i]}
              <span className={`grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold ${t === 'requests' && reqUnread ? 'bg-hot text-white' : 'bg-panel-hi text-muted'}`}>{counts[t]}</span>
              {tab === t && <motion.span layoutId="inboxtab" className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-hot" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            </button>
          ))}
        </div>
      </header>

      {/* Bandeau chiffres clés (créateur) */}
      {inbox === 'creator' && (
        <div className="mx-[18px] mt-3 grid grid-cols-3 gap-2">
          {[
            { k: 'Open offers', v: fmtPrice(openOffers), c: 'var(--gold)' },
            { k: 'To deliver', v: String(toDeliver), c: 'var(--cyan)' },
            { k: 'Tips today', v: fmtPrice(earnedToday), c: 'var(--green)' },
          ].map((s) => (
            <div key={s.k} className="rounded-[14px] border border-line bg-panel px-3 py-2.5">
              <p className="font-display text-[17px] font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[11px] text-muted">{s.k}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-[18px]">
        {FILTERS.map((f) => (
          <motion.button key={f.id} whileTap={{ scale: 0.94 }} onClick={() => setFilter(f.id)} className="h-8 shrink-0 rounded-full border px-3.5 text-[12px] font-semibold"
            style={{ borderColor: filter === f.id ? 'var(--hot)' : 'var(--line)', color: filter === f.id ? 'var(--hot-soft)' : 'var(--muted)', background: filter === f.id ? alpha('var(--hot)', 0.1) : 'transparent' }}>
            {f.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={`${inbox}-${tab}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="mt-2">
          {tab === 'requests' && <p className="px-[18px] py-2 text-[12px] leading-[18px] text-muted">{inbox === 'creator' ? 'Private challenges, duel and collab invites. Accept and you are paid instantly.' : copy.requestsIntro}</p>}
          {pinned.length > 0 && <p className="eyebrow px-[18px] pb-1 pt-2 text-muted"><Pin size={11} className="mr-1 inline" />PINNED</p>}
          <AnimatePresence initial={false}>
            {pinned.map((t, i) => <Row key={t.id} t={t} i={i} />)}
          </AnimatePresence>
          {pinned.length > 0 && rest.length > 0 && <p className="eyebrow px-[18px] pb-1 pt-3 text-muted">ALL MESSAGES</p>}
          <AnimatePresence initial={false}>
            {rest.map((t, i) => (tab === 'requests' ? <RequestRow key={t.id} t={t} i={i} /> : <Row key={t.id} t={t} i={i + pinned.length} />))}
          </AnimatePresence>
          {list.length === 0 && <p className="px-[18px] py-10 text-center text-[13px] text-muted">{q || filter !== 'all' ? copy.empty : 'Nothing here yet.'}</p>}
        </motion.div>
      </AnimatePresence>

      {archived.length > 0 && (
        <div className="mt-4 px-[18px]">
          <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
            <Archive size={14} />Archived ({archived.length})<motion.span animate={{ rotate: showArchived ? 180 : 0 }}><ChevronDown size={14} /></motion.span>
          </button>
          <AnimatePresence>
            {showArchived && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="-mx-[18px] overflow-hidden">
                {archived.map((t, i) => <Row key={t.id} t={t} i={i} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <p className="mt-6 px-[18px] text-center text-[11px] text-muted-2">Tip · swipe a conversation left to pin or archive</p>
    </div>
  );
}

/* ---------- Ligne de conversation, glissable ---------- */
function Row({ t, i }: { t: Thread; i: number }) {
  const nav = useNavigate();
  const setThread = useMessages((s) => s.setThread);
  const notify = useDemo((s) => s.notify);
  const controls = useAnimationControls();
  const m = lastMsg(t);
  const req = activeRequest(t);
  const verified = creator(t.with)?.verified;
  const close = () => controls.start({ x: 0 });
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }} exit={{ opacity: 0, height: 0 }} className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex">
        <button onClick={() => { setThread(t.id, { pinned: !t.pinned }); notify(t.pinned ? 'Unpinned' : 'Pinned to top', 'gold'); close(); }} className="flex w-[70px] flex-col items-center justify-center gap-1 bg-gold text-[11px] font-bold text-on-gold">
          {t.pinned ? <PinOff size={18} /> : <Pin size={18} />}{t.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button onClick={() => { setThread(t.id, { archived: !t.archived }); notify(t.archived ? 'Restored' : 'Archived', 'cool'); close(); }} className="flex w-[70px] flex-col items-center justify-center gap-1 bg-panel-hi text-[11px] font-bold">
          {t.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}{t.archived ? 'Restore' : 'Archive'}
        </button>
      </div>
      <motion.button drag="x" dragConstraints={{ left: -140, right: 0 }} dragElastic={0.08} animate={controls}
        onDragEnd={(_, info) => controls.start({ x: info.offset.x < -60 ? -140 : 0 })}
        onClick={() => nav(`/messages/${t.id}`)}
        className="relative flex h-[76px] w-full items-center gap-3 bg-bg px-[18px] text-left active:bg-white/[.03]">
        <ContactAvatar id={t.with} size={52} ring={t.unread ? 'hot' : 'none'} online={t.online} to={false} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[14px] font-semibold">
            {handleOf(t.with)}{verified && <ShieldCheck size={14} className="text-txt-90" />}
            {req && ['requested', 'paid'].includes(req.request!.status) && (
              <span className="rounded-full px-1.5 py-px font-display text-[10px] font-bold" style={req.request!.status === 'paid' ? { background: alpha('var(--cyan)', 0.16), color: 'var(--cyan)' } : { background: alpha('var(--gold)', 0.16), color: 'var(--gold)' }}>
                {req.request!.status === 'paid' ? 'TO DELIVER' : fmtPrice(req.request!.offer)}
              </span>
            )}
          </span>
          <span className={`block truncate text-[13px] ${t.unread ? 'font-medium text-txt' : 'text-muted'}`}>{t.typing ? <span className="text-green">typing…</span> : preview(m, t.with)}</span>
        </span>
        <span className="flex flex-col items-end gap-2">
          <span className={`text-[11px] ${t.unread ? 'text-hot-soft' : 'text-muted'}`}>{formatAgo(m?.ts ?? 0)}</span>
          {t.unread > 0 ? <motion.span key={t.unread} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="grid h-5 min-w-[20px] place-items-center rounded-full bg-hot px-1 text-[10px] font-bold text-white">{t.unread}</motion.span> : t.pinned ? <Pin size={12} className="text-muted-2" /> : <span className="h-5" />}
        </span>
      </motion.button>
    </motion.div>
  );
}

/* ---------- Demandes : accepter / refuser en un geste ---------- */
function RequestRow({ t, i }: { t: Thread; i: number }) {
  const nav = useNavigate();
  const st = useMessages.getState();
  const m = [...t.msgs].reverse().find((x) => x.kind === 'request' || x.kind === 'duel' || x.kind === 'collab');
  const fanSide = t.inbox === 'fan';
  const pending = m && (m.kind === 'request' ? m.request?.status === 'requested' && m.from === 'other' : m.status === 'pending' && m.from === 'other');
  const accept = () => {
    if (!m) return;
    if (m.kind === 'request') st.acceptRequest(t.id, m.id);
    else st.acceptInvite(t.id, m.id);
  };
  const decline = () => {
    if (!m) return;
    if (m.kind === 'request') st.declineRequest(t.id, m.id);
    else st.declineInvite(t.id, m.id);
    st.setThread(t.id, { archived: true });
  };
  const icon = m?.kind === 'duel' ? <Swords size={12} /> : <Sparkles size={12} />;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.04 } }} exit={{ opacity: 0, x: -80, height: 0 }} className="overflow-hidden border-b border-line">
      <div className="flex gap-3 px-[18px] py-3.5">
        <ContactAvatar id={t.with} size={48} online={t.online} to={false} />
        <div className="min-w-0 flex-1">
          <button onClick={() => nav(`/messages/${t.id}`)} className="block w-full text-left">
            <span className="flex items-center justify-between">
              <span className="text-[14px] font-semibold">{handleOf(t.with)}</span>
              <span className="text-[11px] text-muted">{formatAgo(lastMsg(t)?.ts ?? 0)}</span>
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5">
              {m?.kind === 'request' && <Tag accent="gold">{icon}Private challenge · {fmtPrice(m.request!.offer)}</Tag>}
              {m?.kind === 'duel' && <Tag accent="cyan">{icon}Duel invite</Tag>}
              {m?.kind === 'collab' && <Tag accent="gold">{icon}Collab drop · goal {fmtPrice(m.goal ?? 0)}</Tag>}
              {m?.kind === 'request' && <span className="text-[11px] text-muted">{m.request!.deadline}</span>}
            </span>
            <span className="mt-1.5 line-clamp-2 block text-[13px] leading-[18px] text-txt-90">{m?.request?.brief ?? m?.title ?? preview(lastMsg(t), t.with)}</span>
          </button>
          {pending && !fanSide ? (
            <div className="mt-2.5 flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={accept} className="h-10 flex-1 rounded-[12px] font-display text-[13px] font-bold" style={{ background: m?.kind === 'duel' ? 'var(--grad-cyan)' : 'var(--grad-gold-cta)', color: m?.kind === 'duel' ? 'var(--on-cyan)' : 'var(--on-gold)' }}>
                {m?.kind === 'request' ? `Accept · ${fmtPrice(m.request!.offer)}` : m?.kind === 'duel' ? 'Accept duel' : 'Join drop'}
              </motion.button>
              {m?.kind === 'request' && <motion.button whileTap={{ scale: 0.95 }} onClick={() => nav(`/messages/${t.id}/respond`)} className="h-10 rounded-[12px] border border-line-strong px-3.5 font-display text-[13px] font-bold">Counter</motion.button>}
              <motion.button whileTap={{ scale: 0.95 }} onClick={decline} className="h-10 rounded-[12px] px-2.5 font-display text-[13px] font-bold text-danger">Decline</motion.button>
            </div>
          ) : (
            <button onClick={() => nav(`/messages/${t.id}`)} className="mt-2 text-[12px] font-semibold text-gold">Open conversation</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
