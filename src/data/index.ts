import raw from './demo.json';

// Tous les textes et médias de la démo viennent de demo.json. Aucun texte en dur dans les composants.
// Les chemins médias sont relatifs (media/...) pour fonctionner avec base './'.

export type Tone = 'cyan' | 'magenta' | 'pink' | 'purple' | 'blue' | 'violet' | 'green' | 'orange' | 'gold';
export type Medal = 'gold' | 'silver' | 'bronze';

export type World = {
  id: string; name: string; tone: Tone; icon: string; tagline: string;
  subWorlds: { id: string; name: string }[];
  champions: { allTime: string | null; season: string | null };
  liveChallenges: string[];
};

export type Creator = {
  id: string; handle: string; name: string; avatar: string; bio: string; world: string; subWorld: string;
  followers: number; seasonWins: number; subscriptionPrice: number; isNew: boolean; verified: boolean;
  medals: Record<Medal, number>;
};

export type Fan = {
  id: string; handle: string; name: string; avatar: string; joinedAt: string; following: number;
  subscriptions: number; votesCast: number; dropsOwned: number; favoriteWorlds: string[];
};

export type Video = {
  id: string; creator: string; world: string; subWorld: string; src: string; poster: string;
  durationSec: number; freePreviewSec: number; access: 'free' | 'locked' | 'subscribers'; price: number;
  caption: string; stats: { likes: number; comments: number; views: number }; postedAgo: string; mediaQuery: string;
};

export type Entry = { creator: string; video: string; votes: number; pct: number };
type ChallengeBase = { id: string; world: string; subWorld: string; status: 'live' | 'finished'; badge: string; title: string; videos: string[]; endsAt?: string; endsInLabel?: string };
export type Duel = ChallengeBase & { type: 'duel'; format: string; votePrice: number; entries: Entry[]; winner?: string; winnerMargin?: string; unlockPrice?: number };
export type Dare = ChallengeBase & {
  type: 'dare'; daredBy: string; entryCount: number; votePrice: number; singlePrice: number; bundleFullPrice: number; entries: Entry[];
  winner?: string; winnerLine?: string; winnerMargin?: string; unlockPrice?: number;
  bundlePrice?: number; bundleSavePct?: number; bundleLabel?: string; bundleSub?: string;
};
export type Drop = ChallengeBase & {
  type: 'drop'; creators: string[]; creatorsLabel: string; creatorsSub: string; price: number; raised: number; buyers: number; buyersLabel: string;
  milestones: { amount: number; label: string; desc: string; reached: boolean }[]; rulesTitle: string; rulesSub: string; cta: string; ctaSub: string;
};
export type Challenge = Duel | Dare | Drop;

export type Award = { medal: Medal; rank: number; scope: 'global' | 'world' | 'subWorld'; scopeName: string; world?: string; season: string };
export type FeedItem = { kind: 'challenge'; id: string } | { kind: 'video'; id: string } | { kind: 'risers' };
export type Comment = { author: string; ago: string; text: string; likes: number };
export type LeaderRow = { rank: number; creator: string; points: number; delta: number };
export type Board = { season: LeaderRow[]; allTime: LeaderRow[] };
export type Thread = {
  id: string; with: string; kind: 'primary' | 'request'; last: string; ago: string; unread: number;
  offer?: { kind: string; price: number; text: string };
  messages: { from: string; text: string; ago: string; offer?: { kind: string; price: number } }[];
};

const d = raw as unknown as {
  app: typeof raw.app;
  worlds: World[]; creators: Creator[]; fans: Fan[]; videos: Video[]; challenges: Challenge[]; feed: FeedItem[];
  risers: { creator: string; line: string; rank: number; points: number }[]; newCreators: string[];
  risersNext: { creator: string; line: string; price: number }[];
  feedFollowing: FeedItem[];
  me: typeof raw.me; tips: { amounts: number[]; title: string; sub: string; byVideo: Record<string, { total: number; fans: number }> };
  filters: typeof raw.filters; notifications: typeof raw.notifications; search: typeof raw.search; onboarding: typeof raw.onboarding;
  comments: Record<string, Comment[]>;
  leaderboards: {
    global: Board; worlds: Record<string, Board>; subWorlds: Record<string, Board>;
    scopes: { id: string; name: string; kind: 'global' | 'world'; tone?: Tone; children?: { id: string; name: string; kind: 'subWorld' }[] }[];
  };
  podium: typeof raw.podium;
  awards: { creator: string; ui: typeof raw.awards.ui; byCreator: Record<string, { list: Award[]; ranking: { season: { global: number }; allTime: { global: number }; detail?: typeof raw.awards.ranking } }> }; earnings: typeof raw.earnings; joker: typeof raw.joker;
  messages: { tabs: string[]; threads: Thread[]; respond: typeof raw.messages.respond };
  create: typeof raw.create; profileEdit: typeof raw.profileEdit; identity: typeof raw.identity;
};

export const { app, worlds, creators, fans, videos, challenges, feed, feedFollowing, risers, risersNext, newCreators, comments, leaderboards, podium, awards, earnings, joker, messages, create, profileEdit, identity, me, tips, filters, notifications, search, onboarding } = d;

const byId = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>;
const C = byId(creators), F = byId(fans), V = byId(videos), CH = byId(challenges), W = byId(worlds);

/** Contenus créés pendant la démo (create dare / duel / drop, vidéos uploadées). Appeler puis déclencher un re-render via un store. */
export function addRuntimeChallenge(ch: Challenge) {
  if (CH[ch.id]) return;
  challenges.unshift(ch);
  CH[ch.id] = ch;
  const w = W[ch.world];
  if (w && !w.liveChallenges.includes(ch.id)) w.liveChallenges.unshift(ch.id);
}
export function addRuntimeVideo(v: Video) {
  if (V[v.id]) return;
  videos.unshift(v);
  V[v.id] = v;
}

export const creator = (id: string) => C[id];
export const fan = (id: string) => F[id];
/** Créateur ou fan : pratique pour les commentaires et messages. */
export const person = (id: string): { handle: string; avatar: string; name: string } => C[id] ?? F[id];
export const video = (id: string) => V[id];
export const challenge = (id: string) => CH[id];
export const world = (id: string) => W[id];

export const fmtPrice = (n: number) => `${app.currency.symbol}${Number.isInteger(n) ? n : n.toFixed(2)}`;
export const fmtMoney = (n: number) => `${app.currency.symbol}${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
export const fmtNum = (n: number) => n.toLocaleString('en-US');
export const videosOf = (creatorId: string) => videos.filter((v) => v.creator === creatorId);
export const challengesOf = (worldId: string) => challenges.filter((c) => c.world === worldId);
export const subWorldName = (worldId: string, subId: string) => world(worldId)?.subWorlds.find((s) => s.id === subId)?.name ?? subId;
export const thread = (id: string) => messages.threads.find((t) => t.id === id);
export const fmtCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}k` : String(n));
export const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const toneVar = (t: Tone) => `var(--tone-${t})`;
