import { challenges, creator, fmtPrice, person, video as getVideo, type Video } from '../data';
import { useDemo, type PayIntent } from './store';

/** Une vidéo est regardable en entier si : gratuite, débloquée, abonné au créateur, ou son challenge est débloqué (vote / bundle / drop). */
export function canWatch(v: Video, s: { unlocked: Set<string>; subscribed: Set<string> }) {
  if (v.access === 'free') return true;
  if (s.unlocked.has(v.id) || s.subscribed.has(v.creator)) return true;
  return challenges.some((c) => c.videos.includes(v.id) && s.unlocked.has(c.id));
}

export const useCanWatch = (id: string) =>
  useDemo((s) => {
    const v = getVideo(id);
    return v ? canWatch(v, s) : true;
  });

/** Ce que coûte le déblocage d'une vidéo, selon son contexte (duel, dare, drop, abonnés, vidéo seule). */
export function unlockIntent(id: string): { intent: PayIntent; label: string; color: 'gold' | 'cyan' | 'cool' } {
  const v = getVideo(id);
  const ch = challenges.find((c) => c.videos.includes(id));
  const c = creator(v.creator);
  if (v.access === 'subscribers') {
    return { label: `Subscribe · ${fmtPrice(c.subscriptionPrice)}/mo`, color: 'cool', intent: { kind: 'subscribe', label: `Subscribe to ${c.handle}`, sub: 'Monthly · every video unlocked', price: c.subscriptionPrice, targetId: c.id } };
  }
  if (ch?.type === 'duel' && ch.status === 'live') {
    return { label: `Unlock & vote · ${fmtPrice(ch.votePrice)}`, color: 'cyan', intent: { kind: 'vote', label: ch.title, sub: 'Unlock both videos and vote', price: ch.votePrice, targetId: ch.id } };
  }
  if (ch?.type === 'dare' && ch.status === 'live') {
    return { label: `Unlock & vote · ${fmtPrice(ch.singlePrice)}`, color: 'cyan', intent: { kind: 'vote', label: `Vote for ${person(v.creator).handle}`, sub: ch.title, price: ch.singlePrice, targetId: ch.id, extra: v.creator } };
  }
  if (ch?.type === 'drop') {
    return { label: `Buy the drop · ${fmtPrice(ch.price)}`, color: 'gold', intent: { kind: 'drop', label: 'Exclusive drop', sub: ch.creatorsLabel, price: ch.price, targetId: ch.id } };
  }
  const price = ch && 'unlockPrice' in ch && ch.unlockPrice ? ch.unlockPrice : v.price;
  return { label: `Unlock full video · ${fmtPrice(price)}`, color: 'gold', intent: { kind: 'unlock', label: v.caption, sub: 'The full uncut video in HD · yours forever', price, targetId: id } };
}
