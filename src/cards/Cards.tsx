import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  app, challenge as getChallenge, creator as getCreator, fmtMoney, fmtNum, fmtPrice, person, risers, subWorldName, tips, videos as allVideos, video as getVideo, world as getWorld,
  type Dare, type Drop, type Duel, type FeedItem,
} from '../data';
import { useDemo } from '../lib/store';
import { useLastBump, useLiveVotes } from '../lib/live';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Card, Counter, Eyebrow, ProgressBar, Rail, Reveal, Tag, Timer, TugBar, alpha, toneColor } from '../ui';
import { ArrowUp, Check, Gift, Sparkle, TrendingUp } from '../ui/Icon';
import { VideoThumb } from './VideoThumb';

const ui = app.feedUi;

export function CardHead({ eyebrow, timer, tags }: { eyebrow: React.ReactNode; timer?: string; tags?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-[18px]">
      <Eyebrow className="flex items-center gap-2">{eyebrow}</Eyebrow>
      <div className="flex items-center gap-1.5">{tags}{timer && <Timer label={timer} />}</div>
    </div>
  );
}
const Title = ({ children }: { children: React.ReactNode }) => <p className="mt-2 px-[18px] text-[14px] leading-5 text-txt-90">{children}</p>;

/* ---------- Bouton Follow (rose) ---------- */
export function FollowButton({ id, size = 'M', full }: { id: string; size?: 'S' | 'M' | 'L'; full?: boolean }) {
  const on = useDemo((s) => s.followed.has(id));
  const toggle = useDemo((s) => s.toggleFollow);
  const notify = useDemo((s) => s.notify);
  return (
    <Button size={size} full={full} color={on ? 'ghost' : 'hot'} icon={on ? <Check size={15} /> : undefined}
      onClick={() => { toggle(id); if (!on) notify(`Following ${person(id).handle}`, 'hot'); }}>
      {on ? ui.following : ui.follow}
    </Button>
  );
}
/* ---------- Bouton Subscribe (violet) ---------- */
export function SubscribeButton({ id, full, size = 'M', label }: { id: string; full?: boolean; size?: 'S' | 'M' | 'L'; label?: string }) {
  const c = getCreator(id);
  const on = useDemo((s) => s.subscribed.has(id));
  const ask = useDemo((s) => s.ask);
  return (
    <Button size={size} full={full} color={on ? 'ghost' : 'cool'} icon={on ? <Check size={15} /> : undefined}
      onClick={() => !on && ask({ kind: 'subscribe', label: `Subscribe to ${c.handle}`, sub: 'Monthly · cancel anytime · every video unlocked', price: c.subscriptionPrice, targetId: id })}>
      {on ? 'Subscribed' : label ?? `${ui.subscribe} · ${fmtPrice(c.subscriptionPrice)}/mo`}
    </Button>
  );
}

/* ---------- Live : particules « +N » et halo de ton vote ---------- */
function VoteParticles({ ch, creator, color, right }: { ch: string; creator: string; color: string; right?: boolean }) {
  const bump = useLastBump(ch, creator);
  return (
    <AnimatePresence>
      {bump && (
        <motion.span key={bump.at} className={`pointer-events-none absolute -top-1 ${right ? 'right-0' : 'left-0'} font-display text-[11px] font-bold`} style={{ color }}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: [0, 1, 0], y: -18 }} transition={{ duration: 1.1 }}>
          +{bump.n}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
function MyVoteGlow({ ch, creators, children }: { ch: string; creators: string[]; children: React.ReactNode }) {
  const counts = useDemo((s) => creators.map((c) => s.extraVotes[`${ch}:${c}`] ?? 0).join(','));
  const prev = useRef(counts);
  const [pulse, setPulse] = useState<{ at: number; side: number } | null>(null);
  useEffect(() => {
    const a = prev.current.split(',').map(Number);
    const b = counts.split(',').map(Number);
    const side = b.findIndex((n, k) => n > (a[k] ?? 0));
    if (side >= 0) setPulse({ at: Date.now(), side });
    prev.current = counts;
  }, [counts]);
  const color = creators.length === 2 && pulse?.side === 0 ? 'var(--gold)' : 'var(--cyan)';
  const left = creators.length === 2 ? (pulse?.side === 0 ? '22%' : '78%') : '50%';
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {pulse && (
          <motion.div key={pulse.at} className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.8 }} onAnimationComplete={() => setPulse(null)}>
            <div className="absolute -inset-1 rounded-full" style={{ boxShadow: `0 0 18px 4px ${color}` }} />
            <motion.span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 font-display text-[10px] font-bold" style={{ left, background: color, color: color === 'var(--gold)' ? 'var(--on-gold)' : 'var(--on-cyan)' }}
              initial={{ y: 6, scale: 0.6 }} animate={{ y: -4, scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>+1 your vote</motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- DuelCard (Figma 36:19) ---------- */
export function DuelCard({ duel }: { duel: Duel }) {
  const [a, b] = duel.entries;
  const va = useLiveVotes(duel.id, a.creator, a.votes);
  const vb = useLiveVotes(duel.id, b.creator, b.votes);
  const pa = Math.round((100 * va) / (va + vb));
  const voted = useDemo((s) => s.votes[duel.id]);
  const ask = useDemo((s) => s.ask);
  const lead = pa >= 50 ? a.creator : b.creator;
  return (
    <section>
      <CardHead eyebrow={<>DUEL · 1 VS 1</>} timer={duel.endsInLabel} />
      <Title>{duel.title}</Title>
      <Rail className="mt-3">
        {duel.entries.map((e) => (
          <VideoThumb key={e.video} id={e.video} border={e.creator === lead ? 'var(--gold)' : undefined}
            badge={e.creator === lead ? <Tag accent="gold" solid><ArrowUp size={11} strokeWidth={3} />LEADING</Tag> : undefined} />
        ))}
      </Rail>
      <div className="mt-3 flex items-center gap-2.5 px-[18px]">
        <Avatar id={a.creator} size={36} ring="gold" />
        <div className="relative flex-1">
          <div className="mb-1.5 flex justify-between text-[12px]">
            <span className="relative text-muted">{person(a.creator).handle} <b className="font-display text-gold tabular-nums">{pa}%</b><VoteParticles ch={duel.id} creator={a.creator} color="var(--gold)" /></span>
            <span className="relative text-muted"><b className="font-display text-cyan tabular-nums">{100 - pa}%</b> {person(b.creator).handle}<VoteParticles ch={duel.id} creator={b.creator} color="var(--cyan)" right /></span>
          </div>
          <MyVoteGlow ch={duel.id} creators={[a.creator, b.creator]}><TugBar left={pa} /></MyVoteGlow>
        </div>
        <Avatar id={b.creator} size={36} ring="cyan" />
      </div>
      <div className="mt-3 px-[18px]">
        <Button full color={voted ? 'ghost' : 'cyan'} size="L" done={!!voted}
          icon={voted ? <Check size={16} /> : undefined}
          onClick={() => ask({ kind: 'vote', label: duel.title, sub: 'Unlock both videos and vote', price: duel.votePrice, targetId: duel.id, extra: voted ?? undefined })}>
          {voted ? `You voted ${person(voted).handle} · vote again` : `${ui.unlockVote} · ${fmtPrice(duel.votePrice)}`}
        </Button>
      </div>
    </section>
  );
}

/* ---------- DareCard (Figma 37:46) ---------- */
function DareEntry({ dare, i }: { dare: Dare; i: number }) {
  const e = dare.entries[i];
  const votes = useLiveVotes(dare.id, e.creator, e.votes);
  const total = dare.entries.reduce((s, x) => s + x.votes, 0);
  const pct = Math.round((100 * votes) / total);
  const voted = useDemo((s) => s.votes[dare.id] === e.creator);
  const unlocked = useDemo((s) => s.unlocked.has(dare.id));
  const ask = useDemo((s) => s.ask);
  return (
    <div className="w-[285px] shrink-0 snap-start">
      <VideoThumb id={e.video} badge={<Tag accent="gold" solid>#{i + 1}</Tag>} border={i === 0 ? 'var(--gold)' : undefined} />
      <div className="mt-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px]"><Avatar id={e.creator} size={26} />{person(e.creator).handle}</span>
        <span className="relative flex items-center gap-1 font-display text-[12px] font-bold text-gold tabular-nums"><ArrowUp size={14} strokeWidth={3} /><Counter value={votes} /> · {pct}%<VoteParticles ch={dare.id} creator={e.creator} color="var(--gold)" right /></span>
      </div>
      <div className="mt-2"><MyVoteGlow ch={dare.id} creators={[e.creator]}><ProgressBar pct={Math.min(100, pct * 2.2)} color={i === 0 ? 'gold' : 'cyan'} h={6} /></MyVoteGlow></div>
      <div className="mt-2.5">
        <Button full color={voted ? 'ghost' : 'cyan'} done={voted} icon={voted ? <Check size={15} /> : undefined}
          onClick={() => ask({ kind: 'vote', label: `Vote for ${person(e.creator).handle}`, sub: dare.title, price: unlocked ? 0.5 : dare.singlePrice, targetId: dare.id, extra: e.creator })}>
          {voted ? 'Voted' : `${ui.unlockVote} · ${fmtPrice(dare.singlePrice)}`}
        </Button>
      </div>
    </div>
  );
}
export function DareCard({ dare }: { dare: Dare }) {
  const ask = useDemo((s) => s.ask);
  const unlocked = useDemo((s) => s.unlocked.has(dare.id));
  return (
    <section>
      <CardHead eyebrow={<>DARE · {dare.entryCount} {dare.entryCount === 1 ? 'ENTRY' : 'ENTRIES'}</>} timer={dare.endsInLabel} />
      <Title>{dare.title}</Title>
      <p className="mt-1 px-[18px] text-[11px] text-muted">Dared by {person(dare.daredBy).handle} · {getWorld(dare.world).name} · {subWorldName(dare.world, dare.subWorld)}</p>
      {dare.entries.length ? <Rail className="mt-3">{dare.entries.map((_, i) => <DareEntry key={i} dare={dare} i={i} />)}</Rail> : (
        <div className="mx-[18px] mt-3 grid h-[160px] place-items-center rounded-[18px] border border-dashed border-line-strong text-center text-[13px] text-muted"><span>Open dare · waiting for the first entry<br /><span className="text-[11px] text-muted-2">Creators get notified in this world</span></span></div>
      )}
      {dare.bundlePrice && (
        <div className="mt-3 px-[18px]">
          <motion.button whileTap={{ scale: 0.98 }} disabled={unlocked}
            onClick={() => ask({ kind: 'bundle', label: dare.bundleLabel ?? '', sub: dare.bundleSub, price: dare.bundlePrice!, targetId: dare.id })}
            className="relative flex w-full items-center justify-between overflow-hidden rounded-[16px] px-4 py-3.5 text-left text-on-gold" style={{ background: unlocked ? 'var(--panel-hi)' : 'var(--grad-gold-cta)', color: unlocked ? 'var(--txt)' : undefined }}>
            <span>
              <span className="block font-display text-[15px] font-bold">{unlocked ? 'All entries unlocked' : dare.bundleLabel}</span>
              <span className="block text-[12px] opacity-80">{dare.bundleSub}</span>
            </span>
            {!unlocked && (
              <span className="flex flex-col items-end">
                <span className="flex items-baseline gap-1.5"><s className="text-[13px] opacity-60">{fmtPrice(dare.bundleFullPrice)}</s><b className="font-display text-[24px] leading-none">{fmtPrice(dare.bundlePrice)}</b></span>
                <span className="mt-1 rounded-full bg-on-gold px-2 py-0.5 font-display text-[10px] font-bold text-gold">SAVE {dare.bundleSavePct}%</span>
              </span>
            )}
            {!unlocked && <span className="shine pointer-events-none absolute inset-0" />}
          </motion.button>
        </div>
      )}
    </section>
  );
}

/* ---------- Winner (Figma DareWinnerCard 231:849 / DuelWinnerCard 231:909) ---------- */
export function WinnerCard({ ch }: { ch: Duel | Dare }) {
  const winner = ch.winner!;
  const e = ch.entries.find((x) => x.creator === winner) ?? ch.entries[0];
  const v = getVideo(e.video);
  const w = getWorld(ch.world);
  const unlocked = useDemo((s) => s.unlocked.has(e.video));
  const ask = useDemo((s) => s.ask);
  const others = ch.type === 'dare' ? ch.entryCount - 1 : 1;
  return (
    <section>
      <CardHead eyebrow={ch.type === 'dare' ? 'DARE WINNER' : 'DUEL WINNER'} />
      <Title>{ch.title}</Title>
      <div className="mt-3 px-[18px]"><VideoThumb id={e.video} w="100%" h={440} border="var(--gold)" badge={<Tag accent="gold" solid>WINNER</Tag>} /></div>
      <div className="mt-3 flex items-center gap-3 px-[18px]">
        <Avatar id={winner} size={40} ring="gold" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">{person(winner).handle} <span className="font-normal text-muted">won</span></p>
          <p className="truncate text-[12px] text-muted">beat {others} challenger{others > 1 ? 's' : ''} · {w.name} · {subWorldName(ch.world, ch.subWorld)}</p>
        </div>
        <span className="flex items-center gap-1 rounded-[12px] border px-2.5 py-1.5 font-display text-[12px] font-bold text-gold" style={{ borderColor: alpha('var(--gold)', 0.35), background: alpha('var(--gold)', 0.08) }}><Sparkle size={14} fill="currentColor" />{ch.winnerMargin}</span>
      </div>
      <div className="mt-3 flex gap-2 px-[18px]">
        <div className="flex-[1.6]">
          <Button full size="L" color={unlocked ? 'ghost' : 'gold'} done={unlocked} onClick={() => !unlocked && ask({ kind: 'unlock', label: v.caption, sub: 'Full video in HD · yours forever', price: ch.unlockPrice ?? v.price, targetId: e.video })}>
            {unlocked ? 'Unlocked · watch' : `${ui.unlockFull} · ${fmtPrice(ch.unlockPrice ?? v.price)}`}
          </Button>
        </div>
        <div className="flex-1"><FollowButton id={winner} size="L" full /></div>
      </div>
    </section>
  );
}

/* ---------- DropCard (Figma 38:52) ---------- */
export function DropCard({ drop }: { drop: Drop }) {
  const owned = useDemo((s) => s.unlocked.has(drop.id));
  const ask = useDemo((s) => s.ask);
  return (
    <div className="px-[18px]">
      <Card className="p-4" glow={alpha('var(--gold)', 0.45)}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="eyebrow text-gold">EXCLUSIVE DROP</span>
            {drop.creators.length > 1 && <Tag accent="cool">Collab</Tag>}
          </span>
          <Timer label={drop.endsInLabel ?? ''} />
        </div>
        <div className="mt-3.5 flex items-center gap-3">
          <div className="flex -space-x-3">{drop.creators.map((c, i) => <Avatar key={c} id={c} size={40} ring={(['gold', 'cool', 'hot'] as const)[i % 3]} />)}</div>
          <div>
            <p className="text-[14px] font-semibold">{drop.creatorsLabel}</p>
            <p className="font-display text-[11px] font-semibold text-gold">{drop.creatorsSub}</p>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-[22px] text-txt-90">{drop.title}</p>
        <p className="mt-3 flex items-baseline gap-2"><Counter value={drop.raised} format={(n) => fmtMoney(Math.round(n))} className="font-display text-[26px] font-bold text-gold" /><span className="text-[12px] text-muted">{drop.buyersLabel}</span></p>
        <div className="mt-3 rounded-[14px] border border-line bg-bg/60 p-3.5">
          <p className="font-display text-[14px] font-bold text-gold">{drop.rulesTitle}</p>
          <p className="mt-1 text-[12px] leading-[18px] text-muted">{drop.rulesSub}</p>
          <ol className="relative mt-3 space-y-4">
            <span className="absolute bottom-3 left-[10px] top-3 w-0.5 bg-line-strong" />
            {drop.milestones.map((m, i) => {
              const next = !m.reached && (i === 0 || drop.milestones[i - 1].reached);
              return (
                <Reveal key={i} delay={i * 0.08} className="relative flex gap-3">
                  <span className="relative z-10 mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full" style={{ background: m.reached ? 'var(--grad-gold-cta)' : 'var(--bg)', boxShadow: m.reached ? undefined : `inset 0 0 0 2px ${next ? 'var(--gold)' : 'var(--muted-2)'}` }}>
                    {m.reached ? <Check size={13} strokeWidth={3} className="text-on-gold" /> : <span className="h-2 w-2 rounded-full" style={{ background: next ? 'var(--gold)' : 'var(--muted-2)' }} />}
                  </span>
                  <span>
                    <span className="block font-display text-[13px] font-bold" style={{ color: m.reached || next ? 'var(--gold)' : 'var(--muted)' }}>{m.label}</span>
                    <span className="block text-[12px] text-muted">{m.desc}</span>
                  </span>
                </Reveal>
              );
            })}
          </ol>
        </div>
        <div className="mt-4">
          <Button full size="L" color={owned ? 'ghost' : 'gold'} done={owned} icon={owned ? <Check size={16} /> : undefined}
            onClick={() => !owned && ask({ kind: 'drop', label: 'Exclusive drop', sub: drop.creatorsLabel, price: drop.price, targetId: drop.id })}>
            {owned ? 'Drop secured · every bonus included' : drop.cta}
          </Button>
        </div>
        <p className="mt-2.5 text-center text-[11px] text-hot-soft">{drop.ctaSub}</p>
      </Card>
    </div>
  );
}

/* ---------- FreeMediaCard (Figma 232:941) ---------- */
export function FreeMediaCard({ id }: { id: string }) {
  const v = getVideo(id);
  const w = getWorld(v.world);
  const ask = useDemo((s) => s.ask);
  const t = tips.byVideo[id] ?? { total: 120, fans: 40 };
  return (
    <section>
      <CardHead eyebrow="FREE MEDIA" tags={<><Tag accent="cool" dot>{w.name}</Tag><Tag>{subWorldName(v.world, v.subWorld)}</Tag></>} />
      <div className="mt-3 px-[18px]"><VideoThumb id={id} w="100%" h={440} /></div>
      <div className="mt-3 flex items-center gap-3 px-[18px]">
        <Avatar id={v.creator} size={40} ring="green" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">{person(v.creator).handle}</p>
          <p className="truncate text-[12px] text-muted">{v.caption}</p>
        </div>
        <FollowButton id={v.creator} />
      </div>
      <div className="mx-[18px] mt-3 flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5" style={{ borderColor: alpha('var(--gold)', 0.35), background: alpha('var(--gold)', 0.06) }}>
        <Gift size={20} className="text-gold" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[16px] font-bold text-gold">{fmtMoney(t.total)} in tips</p>
          <p className="truncate text-[11px] text-muted">from {t.fans} fans · paid to the creator instantly</p>
        </div>
        <Button color="gold" onClick={() => ask({ kind: 'tip', label: `Tip ${person(v.creator).handle}`, sub: tips.sub, price: tips.amounts[1], targetId: v.creator })}>{ui.sendTip}</Button>
      </div>
    </section>
  );
}

/* ---------- Rising (Figma Feed : RISING NEXT THIS SEASON) ---------- */
export function RisersBlock() {
  return (
    <section>
      <CardHead eyebrow={<><TrendingUp size={13} className="text-gold" />{ui.risingSub.toUpperCase()}</>} tags={<Tag accent="gold">{app.season.label}</Tag>} />
      <Rail className="mt-3">
        {risers.map((r) => {
          const c = getCreator(r.creator);
          const vids = videosFor(r.creator).slice(0, 3);
          return (
            <Card key={r.creator} className="w-[320px] shrink-0 snap-start p-3.5">
              <div className="flex items-center gap-3">
                <Avatar id={r.creator} size={52} ring="cool" />
                <div className="min-w-0 flex-1">
                  <Link to={`/creator/${r.creator}`} className="block truncate text-[15px] font-semibold">{c.handle}</Link>
                  <p className="truncate text-[11px] text-muted">{r.line}</p>
                </div>
                <span className="font-display text-[28px] font-bold text-gold"><sup className="text-[14px]">#</sup>{r.rank}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {vids.map((v) => <VideoThumb key={v} id={v} w="100%" h={120} compact className="!rounded-[10px]" />)}
              </div>
              <div className="mt-3 flex gap-2">
                <FollowButton id={r.creator} size="M" />
                <div className="flex-1"><SubscribeButton id={r.creator} full label={`Subscribe · ${fmtPrice(c.subscriptionPrice)}/mo`} /></div>
              </div>
            </Card>
          );
        })}
      </Rail>
    </section>
  );
}
const videosFor = (cid: string) => {
  const own = allVideos.filter((v) => v.creator === cid).map((v) => v.id);
  return own.length >= 3 ? own : [...own, ...allVideos.filter((v) => v.world === getCreator(cid).world && v.creator !== cid).map((v) => v.id)];
};

/* ---------- Dispatcher ---------- */
export function ChallengeCard({ id }: { id: string }) {
  const ch = getChallenge(id);
  if (!ch) return null;
  if (ch.type === 'drop') return <DropCard drop={ch} />;
  if (ch.status === 'finished') return <WinnerCard ch={ch} />;
  if (ch.type === 'duel') return <DuelCard duel={ch} />;
  return <DareCard dare={ch} />;
}
export function FeedItemView({ item }: { item: FeedItem }) {
  if (item.kind === 'risers') return <RisersBlock />;
  if (item.kind === 'video') {
    const v = getVideo(item.id);
    return v.access === 'free' ? <FreeMediaCard id={item.id} /> : <SingleVideoCard id={item.id} />;
  }
  return <ChallengeCard id={item.id} />;
}
/** Vidéo payante seule dans le feed (même grammaire que Winner). */
export function SingleVideoCard({ id }: { id: string }) {
  const v = getVideo(id);
  const w = getWorld(v.world);
  const unlocked = useDemo((s) => s.unlocked.has(id));
  const ask = useDemo((s) => s.ask);
  const subs = v.access === 'subscribers';
  return (
    <section>
      <CardHead eyebrow={subs ? 'SUBSCRIBERS ONLY' : 'NEW VIDEO'} tags={<Tag dot accent="muted"><span style={{ color: toneColor(w.tone) }}>{w.name}</span></Tag>} />
      <Title>{v.caption}</Title>
      <div className="mt-3 px-[18px]"><VideoThumb id={id} w="100%" h={440} /></div>
      <div className="mt-3 flex items-center gap-3 px-[18px]">
        <Avatar id={v.creator} size={40} ring={subs ? 'cool' : 'none'} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">{person(v.creator).handle}</p>
          <p className="text-[12px] text-muted">{fmtNum(getCreator(v.creator).followers)} followers · {v.postedAgo} ago</p>
        </div>
        <FollowButton id={v.creator} />
      </div>
      <div className="mt-3 px-[18px]">
        {subs ? <SubscribeButton id={v.creator} full size="L" /> : (
          <Button full size="L" color={unlocked ? 'ghost' : 'gold'} done={unlocked} onClick={() => !unlocked && ask({ kind: 'unlock', label: v.caption, sub: 'Full video in HD · yours forever', price: v.price, targetId: id })}>
            {unlocked ? 'Unlocked · watch' : `${ui.unlockFull} · ${fmtPrice(v.price)}`}
          </Button>
        )}
      </div>
    </section>
  );
}
