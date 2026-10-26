import { create } from 'zustand';
import seed from '../data/screens/MessagesSeed.json';
import { app, fmtPrice, person, videos } from '../data';
import { useDemo } from './store';

/**
 * Messagerie de démo : source de vérité unique des conversations à l'exécution.
 * Deux boîtes : 'creator' (vue de @nova.rey, créatrice à succès) et 'fan' (vue de @alex.m).
 * Tout est simulé : réponses avec indicateur de saisie, challenges privés, paiements instantanés.
 */

export type Inbox = 'creator' | 'fan';
export type Folder = 'primary' | 'general' | 'requests';
export type ReqStatus = 'requested' | 'countered' | 'accepted' | 'paid' | 'delivered' | 'declined';
export type PrivateRequest = { brief: string; offer: number; deadline: string; world: string; status: ReqStatus; counter?: number };
export type MsgKind = 'text' | 'media' | 'request' | 'counter' | 'private' | 'duel' | 'collab' | 'tip' | 'tipask' | 'system';

export type Msg = {
  id: string;
  kind: MsgKind;
  from: 'self' | 'other' | 'system';
  ts: number;
  text?: string;
  video?: string;
  price?: number;
  amount?: number;
  paid?: boolean;
  read?: boolean;
  title?: string;
  world?: string;
  goal?: number;
  split?: string;
  status?: string;
  request?: PrivateRequest;
  reactions?: string[];
  replyTo?: string;
};

export type Thread = {
  id: string;
  inbox: Inbox;
  with: string;
  folder: Folder;
  pinned: boolean;
  archived: boolean;
  unread: number;
  online: boolean;
  typing: boolean;
  msgs: Msg[];
};

type SeedMsg = { kind: string; from: string; ago: number; [k: string]: unknown };
type SeedThread = { id: string; with: string; folder: string; pinned?: boolean; online?: boolean; unread?: number; msgs: SeedMsg[] };

const MIN = 60_000;
let seq = 1;
const nid = () => `m${seq++}`;
const now = () => Date.now();

function hydrate(inbox: Inbox, list: SeedThread[]): Thread[] {
  const base = now();
  return list.map((t) => ({
    id: t.id,
    inbox,
    with: t.with,
    folder: t.folder as Folder,
    pinned: !!t.pinned,
    archived: false,
    unread: t.unread ?? 0,
    online: !!t.online,
    typing: false,
    msgs: t.msgs.map(({ ago, from, ...m }) => ({ ...(m as Partial<Msg>), id: nid(), from: from as Msg['from'], kind: m.kind as MsgKind, ts: base - ago * MIN })),
  }));
}

/** Identité du « moi » de chaque boîte. */
export const selfOf = (inbox: Inbox) => (inbox === 'creator' ? app.me.creator : app.me.fan);
export const isTeam = (id: string) => id === 'daresonly';
export const handleOf = (id: string) => (isTeam(id) ? 'DaresOnly Team' : person(id)?.handle ?? id);
export const isCreatorId = (id: string) => !isTeam(id) && !!person(id) && 'world' in (person(id) as object);

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
let replyIdx = 0;

/** Aperçu texte du dernier message d'un fil. */
export function preview(m: Msg | undefined, other: string): string {
  if (!m) return '';
  const you = m.from === 'self' ? 'You: ' : '';
  switch (m.kind) {
    case 'request': return `${m.from === 'self' ? 'You sent' : 'Private challenge'} · ${fmtPrice(m.request?.counter ?? m.request?.offer ?? 0)} · ${m.request?.status}`;
    case 'counter': return `${you}Counter offer · ${fmtPrice(m.amount ?? 0)}`;
    case 'private': return `${you}Private video · ${fmtPrice(m.price ?? 0)}${m.paid ? ' · paid' : ''}`;
    case 'media': return `${you}Shared a video`;
    case 'duel': return `Duel invite · ${m.title}`;
    case 'collab': return `Collab drop invite · ${m.title}`;
    case 'tip': return m.from === 'self' ? `You tipped ${fmtPrice(m.amount ?? 0)}` : `${handleOf(other)} tipped ${fmtPrice(m.amount ?? 0)} 💛`;
    case 'tipask': return `${you}Tip request`;
    case 'system': return m.text ?? '';
    default: return `${you}${m.text ?? ''}`;
  }
}

export function formatAgo(ts: number) {
  const d = Math.max(0, now() - ts);
  if (d < 45_000) return 'now';
  if (d < 60 * MIN) return `${Math.round(d / MIN)}m`;
  if (d < 23 * 60 * MIN) return `${Math.round(d / (60 * MIN))}h`;
  if (d < 48 * 60 * MIN) return 'Yesterday';
  const days = Math.floor(d / (24 * 60 * MIN));
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Date(ts).toLocaleDateString('en-US', { weekday: 'short' });
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
export function dayLabel(ts: number) {
  const a = new Date(ts); const b = new Date();
  const diff = Math.round((new Date(b.toDateString()).getTime() - new Date(a.toDateString()).getTime()) / (24 * 60 * MIN));
  if (diff <= 0) return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  return a.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
}
export const timeOf = (ts: number) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Requête privée active (la plus récente) d'un fil. */
export const activeRequest = (t: Thread) => [...t.msgs].reverse().find((m) => m.kind === 'request');
export const lastMsg = (t: Thread) => t.msgs[t.msgs.length - 1];

type State = {
  threads: Thread[];
  find: (id: string) => Thread | undefined;
  push: (id: string, m: Omit<Msg, 'id' | 'ts'> & { ts?: number }) => string;
  patch: (id: string, msgId: string, p: Partial<Msg>) => void;
  patchReq: (id: string, msgId: string, p: Partial<PrivateRequest>) => void;
  setThread: (id: string, p: Partial<Thread>) => void;
  markRead: (id: string) => void;
  send: (id: string, text: string, replyTo?: string) => void;
  react: (id: string, msgId: string, emoji: string) => void;
  /** Fait « taper » l'autre puis envoie un message. */
  typeThen: (id: string, delay: number, fn: () => void) => void;
  // Côté créateur
  acceptRequest: (id: string, msgId: string) => void;
  counterRequest: (id: string, msgId: string, amount: number) => void;
  declineRequest: (id: string, msgId: string) => void;
  deliver: (id: string, msgId: string, video: string) => void;
  sendPrivate: (id: string, video: string, price: number) => void;
  askTip: (id: string) => void;
  inviteDuel: (id: string) => void;
  acceptInvite: (id: string, msgId: string) => void;
  declineInvite: (id: string, msgId: string) => void;
  // Côté fan
  createRequest: (creatorId: string, r: Omit<PrivateRequest, 'status'>, threadId?: string) => string;
  payTip: (id: string, amount: number) => void;
  /** Fil fan avec ce créateur (créé vide si besoin). */
  openWith: (creatorId: string) => string;
  shareVideo: (id: string, video: string) => void;
};

const notify = (text: string, tone: 'gold' | 'cyan' | 'hot' | 'cool' | 'green' = 'gold') => useDemo.getState().notify(text, tone);

export const useMessages = create<State>((set, get) => ({
  threads: [...hydrate('creator', seed.creator as SeedThread[]), ...hydrate('fan', seed.fan as SeedThread[])],
  find: (id) => get().threads.find((t) => t.id === id),
  push: (id, m) => {
    const msg: Msg = { ...m, id: nid(), ts: m.ts ?? now() } as Msg;
    set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, msgs: [...t.msgs, msg], archived: false } : t)) }));
    return msg.id;
  },
  patch: (id, msgId, p) => set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, msgs: t.msgs.map((m) => (m.id === msgId ? { ...m, ...p } : m)) } : t)) })),
  patchReq: (id, msgId, p) => set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, msgs: t.msgs.map((m) => (m.id === msgId && m.request ? { ...m, request: { ...m.request, ...p } } : m)) } : t)) })),
  setThread: (id, p) => set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
  markRead: (id) => {
    const t = get().find(id);
    if (t && t.unread) get().setThread(id, { unread: 0 });
    // l'autre « voit » nos messages
    set((s) => ({ threads: s.threads.map((x) => (x.id === id ? { ...x, msgs: x.msgs.map((m) => (m.from === 'self' && !m.read ? { ...m, read: true } : m)) } : x)) }));
  },
  typeThen: (id, delay, fn) => {
    setTimeout(() => get().setThread(id, { typing: true }), Math.min(500, delay / 3));
    setTimeout(() => { get().setThread(id, { typing: false }); fn(); }, delay);
  },
  send: (id, text, replyTo) => {
    const t = get().find(id);
    if (!t) return;
    get().push(id, { kind: 'text', from: 'self', text, replyTo });
    setTimeout(() => get().markRead(id), 900);
    if (isTeam(t.with)) return;
    const pool = t.inbox === 'creator' ? (isCreatorId(t.with) ? seed.replies.creatorCreator : seed.replies.creatorFan) : seed.replies.fanCreator;
    get().typeThen(id, 1700, () => get().push(id, { kind: 'text', from: 'other', text: pick(pool, replyIdx++) }));
  },
  react: (id, msgId, emoji) => {
    const m = get().find(id)?.msgs.find((x) => x.id === msgId);
    if (!m) return;
    const r = m.reactions ?? [];
    get().patch(id, msgId, { reactions: r.includes(emoji) ? r.filter((x) => x !== emoji) : [...r, emoji] });
  },

  /* ---------- Créateur ---------- */
  acceptRequest: (id, msgId) => {
    const t = get().find(id);
    const m = t?.msgs.find((x) => x.id === msgId);
    if (!t || !m?.request) return;
    const amount = m.request.counter ?? m.request.offer;
    get().patchReq(id, msgId, { status: 'accepted' });
    get().setThread(id, { folder: 'primary' });
    get().push(id, { kind: 'system', from: 'system', text: `You accepted · ${handleOf(t.with)} is paying ${fmtPrice(amount)}` });
    setTimeout(() => {
      get().patchReq(id, msgId, { status: 'paid' });
      get().push(id, { kind: 'system', from: 'system', text: `${handleOf(t.with)} paid ${fmtPrice(amount)} · instantly to you 💸` });
      notify(`+${fmtPrice(amount)} · paid instantly by ${handleOf(t.with)}`, 'gold');
      get().typeThen(id, 1500, () => get().push(id, { kind: 'text', from: 'other', text: pick(seed.replies.creatorFan, replyIdx++) }));
    }, 1100);
  },
  counterRequest: (id, msgId, amount) => {
    const t = get().find(id);
    const m = t?.msgs.find((x) => x.id === msgId);
    if (!t || !m?.request) return;
    const offer = m.request.offer;
    get().patchReq(id, msgId, { status: 'countered', counter: amount });
    get().push(id, { kind: 'counter', from: 'self', amount, text: `I can do it for ${fmtPrice(amount)}. It needs proper setup 🎬` });
    get().setThread(id, { folder: 'primary' });
    if (amount <= offer * 1.35) {
      get().typeThen(id, 2200, () => {
        get().push(id, { kind: 'text', from: 'other', text: pick(seed.replies.acceptCounter, replyIdx++) });
        get().acceptRequest(id, msgId);
      });
    } else {
      const mid = Math.round((offer + amount) / 2);
      get().typeThen(id, 2200, () => {
        get().push(id, { kind: 'text', from: 'other', text: seed.replies.negotiate[0].replace('{mid}', fmtPrice(mid)) });
        get().patchReq(id, msgId, { status: 'requested', offer: mid, counter: undefined });
      });
    }
  },
  declineRequest: (id, msgId) => {
    get().patchReq(id, msgId, { status: 'declined' });
    get().push(id, { kind: 'system', from: 'system', text: 'Request declined · nothing was charged' });
    notify('Request declined', 'hot');
  },
  deliver: (id, msgId, video) => {
    const t = get().find(id);
    const m = t?.msgs.find((x) => x.id === msgId);
    if (!t || !m?.request) return;
    get().patchReq(id, msgId, { status: 'delivered' });
    get().push(id, { kind: 'private', from: 'self', video, price: m.request.counter ?? m.request.offer, paid: true, text: pick(seed.replies.creatorDelivers, replyIdx++) });
    notify('Delivered · already paid', 'green');
    get().typeThen(id, 2400, () => {
      get().push(id, { kind: 'text', from: 'other', text: pick(seed.replies.thanks, replyIdx++) });
      setTimeout(() => {
        const tip = [5, 10, 15, 20][replyIdx % 4];
        get().push(id, { kind: 'tip', from: 'other', amount: tip, text: 'You deserve it 💛' });
        notify(`+${fmtPrice(tip)} tip from ${handleOf(t.with)}`, 'gold');
      }, 1200);
    });
  },
  sendPrivate: (id, video, price) => {
    const t = get().find(id);
    if (!t) return;
    const mid = get().push(id, { kind: 'private', from: 'self', video, price, paid: false, text: 'Made this just for you. Nobody else gets to see it 🔒' });
    get().typeThen(id, 3200, () => {
      get().patch(id, mid, { paid: true });
      get().push(id, { kind: 'system', from: 'system', text: `${handleOf(t.with)} unlocked your video · +${fmtPrice(price)} to you instantly` });
      notify(`+${fmtPrice(price)} · private video unlocked`, 'gold');
      setTimeout(() => get().push(id, { kind: 'text', from: 'other', text: pick(seed.replies.thanks, replyIdx++) }), 900);
    });
  },
  askTip: (id) => {
    const t = get().find(id);
    if (!t) return;
    get().push(id, { kind: 'tipask', from: 'self', text: 'Liked the last one? A tip and the next one gets even bolder 😏' });
    get().typeThen(id, 2600, () => {
      const amount = [5, 10, 20][replyIdx++ % 3];
      get().push(id, { kind: 'tip', from: 'other', amount, text: 'Of course!' });
      notify(`+${fmtPrice(amount)} tip from ${handleOf(t.with)}`, 'gold');
    });
  },
  inviteDuel: (id) => {
    const t = get().find(id);
    if (!t) return;
    const mid = get().push(id, { kind: 'duel', from: 'self', title: '1v1 · best 30s one-take', world: 'content', price: 2, status: 'pending' });
    get().typeThen(id, 2400, () => {
      get().patch(id, mid, { status: 'accepted' });
      get().push(id, { kind: 'text', from: 'other', text: seed.replies.duelAccept[0] });
      notify(`${handleOf(t.with)} accepted your duel ⚔️`, 'cyan');
    });
  },
  acceptInvite: (id, msgId) => {
    const t = get().find(id);
    const m = t?.msgs.find((x) => x.id === msgId);
    if (!t || !m) return;
    get().patch(id, msgId, { status: 'accepted' });
    get().setThread(id, { folder: 'primary' });
    get().push(id, { kind: 'system', from: 'system', text: m.kind === 'duel' ? 'Duel accepted · it goes live when both entries are posted' : 'Collab accepted · earnings split instantly on every sale' });
    notify(m.kind === 'duel' ? 'Duel accepted ⚔️' : 'Collab drop accepted', m.kind === 'duel' ? 'cyan' : 'gold');
    get().typeThen(id, 1600, () => get().push(id, { kind: 'text', from: 'other', text: pick(seed.replies.creatorCreator, replyIdx++) }));
  },
  declineInvite: (id, msgId) => {
    get().patch(id, msgId, { status: 'declined' });
    get().push(id, { kind: 'system', from: 'system', text: 'Invite declined' });
    notify('Invite declined', 'hot');
  },

  /* ---------- Fan ---------- */
  createRequest: (creatorId, r, threadId) => {
    let id = threadId ?? get().threads.find((t) => t.inbox === 'fan' && t.with === creatorId)?.id;
    if (!id) {
      id = `req-${creatorId}-${seq++}`;
      const th: Thread = { id, inbox: 'fan', with: creatorId, folder: 'primary', pinned: false, archived: false, unread: 0, online: true, typing: false, msgs: [] };
      set((s) => ({ threads: [th, ...s.threads] }));
    }
    const tid = id;
    get().setThread(tid, { online: true, archived: false });
    const mid = get().push(tid, { kind: 'request', from: 'self', request: { ...r, status: 'requested' } });
    get().push(tid, { kind: 'system', from: 'system', text: `Request sent · you pay ${fmtPrice(r.offer)} only if ${handleOf(creatorId)} accepts` });
    get().typeThen(tid, 2600, () => {
      get().push(tid, { kind: 'text', from: 'other', text: pick(seed.replies.creatorAccepts, replyIdx++) });
      setTimeout(() => {
        get().patchReq(tid, mid, { status: 'accepted' });
        get().push(tid, { kind: 'system', from: 'system', text: `${handleOf(creatorId)} accepted your challenge` });
        setTimeout(() => {
          get().patchReq(tid, mid, { status: 'paid' });
          get().push(tid, { kind: 'system', from: 'system', text: `You paid ${fmtPrice(r.offer)} · instantly to ${handleOf(creatorId)}` });
          notify(`Accepted · ${fmtPrice(r.offer)} paid to ${handleOf(creatorId)}`, 'cyan');
          get().typeThen(tid, 4200, () => {
            get().patchReq(tid, mid, { status: 'delivered' });
            get().push(tid, { kind: 'private', from: 'other', video: deliveryVideo(creatorId), price: r.offer, paid: true, text: pick(seed.replies.creatorDelivers, replyIdx++) });
            get().setThread(tid, { unread: (get().find(tid)?.unread ?? 0) + 1 });
            notify(`${handleOf(creatorId)} delivered your private challenge 🎬`, 'green');
          });
        }, 1200);
      }, 1400);
    });
    return tid;
  },
  openWith: (creatorId) => {
    const ex = get().threads.find((t) => t.inbox === 'fan' && t.with === creatorId);
    if (ex) return ex.id;
    const id = `dm-${creatorId}`;
    set((s) => ({ threads: [{ id, inbox: 'fan', with: creatorId, folder: 'primary', pinned: false, archived: false, unread: 0, online: true, typing: false, msgs: [] }, ...s.threads] }));
    return id;
  },
  payTip: (id, amount) => {
    get().push(id, { kind: 'tip', from: 'self', amount, text: 'For your next shoot 💛' });
    const t = get().find(id);
    if (t) get().typeThen(id, 1600, () => get().push(id, { kind: 'text', from: 'other', text: 'You spoil me 🥵💛' }));
  },
  shareVideo: (id, video) => {
    get().push(id, { kind: 'media', from: 'self', video });
    get().typeThen(id, 1800, () => get().push(id, { kind: 'text', from: 'other', text: 'Ooh watching now 👀' }));
  },
}));

function deliveryVideo(creatorId: string) {
  const own = videos.filter((v) => v.creator === creatorId);
  return (own[own.length - 1] ?? videos[0]).id;
}

/** Non lus de la boîte courante (rôle), hors archives. */
export const useUnreadCount = (inbox?: Inbox) => {
  const role = useDemo((s) => s.role);
  const box = inbox ?? role;
  return useMessages((s) => s.threads.reduce((n, t) => n + (t.inbox === box && !t.archived ? t.unread : 0), 0));
};

/* ---------- Vie ambiante : un nouveau message arrive de temps en temps ---------- */
let ambientStarted = false;
let ambientIdx = 0;
export function startAmbient() {
  if (ambientStarted || typeof window === 'undefined') return;
  ambientStarted = true;
  setInterval(() => {
    const { onboarded, role } = useDemo.getState();
    if (!onboarded) return;
    const st = useMessages.getState();
    const box: Inbox = role;
    const tpl = box === 'creator' ? seed.ambient.creator : seed.ambient.fan;
    const from = box === 'creator' ? seed.ambient.creatorFrom : seed.ambient.fanFrom;
    const who = pick(from, ambientIdx);
    const m = pick(tpl, ambientIdx) as Partial<Msg> & { kind: string };
    ambientIdx++;
    let th = st.threads.find((t) => t.inbox === box && t.with === who);
    if (!th) return;
    if (location.hash.includes(`/messages/${th.id}`)) return; // pas d'interruption dans le fil ouvert
    const isReq = m.kind === 'request';
    st.push(th.id, { ...(m as Msg), from: 'other', request: isReq && m.request ? { ...(m.request as PrivateRequest) } : undefined });
    th = useMessages.getState().find(th.id)!;
    st.setThread(th.id, { unread: th.unread + 1, folder: isReq ? 'requests' : th.folder === 'requests' ? 'requests' : th.folder, online: true });
  }, 25_000);
}
