import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChallengeCard, FollowButton, SubscribeButton } from '../cards/Cards';
import { awards, challenges, creator as getCreator, fmtCount, fmtPrice, subWorldName, videosOf, world as getWorld } from '../data';
import copy from '../data/screens/CreatorPublic.json';
import { useDemo } from '../lib/store';
import { MediaTile } from './parts/CreatorPublicTile';
import { PrivateChallengeComposer } from './parts/MessagesComposer';
import { useMessages } from '../lib/messagesStore';
import { Avatar, Button, Card, Chip, Counter, Eyebrow, IconButton, Medal, Reveal, Tag, alpha, toneColor, type Accent } from '../ui';
import { ArrowLeft, Check, Clock, Crown, Mail, MessageSquare, Share2, ShieldCheck, Sparkle } from '../ui/Icon';

const fill = (s: string, vars: Record<string, string | number>) => Object.entries(vars).reduce((a, [k, v]) => a.replace(`{${k}}`, String(v)), s);
const trustIcon = { shield: ShieldCheck, clock: Clock, chat: MessageSquare, spark: Sparkle } as const;
type Filter = 'All' | 'Paid' | 'Subs' | 'Free';

/** Figma 487:7369 · Creator profile (public) */
export default function CreatorPublic() {
  const { handle = '' } = useParams();
  const c = getCreator(handle);
  const nav = useNavigate();
  const [composer, setComposer] = useState(false);
  const notify = useDemo((s) => s.notify);
  const subscribed = useDemo((s) => s.subscribed.has(handle));
  const unlocked = useDemo((s) => s.unlocked);
  const [filter, setFilter] = useState<Filter>('All');
  const [allAwards, setAllAwards] = useState(false);

  const vids = useMemo(() => (c ? videosOf(c.id) : []), [c]);
  const live = useMemo(
    () => challenges.filter((ch) => ch.status === 'live' && (ch.type === 'drop' ? ch.creators.includes(handle) : ch.entries.some((e) => e.creator === handle))),
    [handle],
  );
  if (!c) return <Navigate to="/" replace />;

  const w = getWorld(c.world);
  const tone = toneColor(w.tone);
  const aw = awards.byCreator[c.id];
  const list = aw?.list ?? [];
  const shown = allAwards ? list : list.slice(0, 3);
  const filtered = vids.filter((v) =>
    filter === 'All' ? true : filter === 'Paid' ? v.access === 'locked' : filter === 'Subs' ? v.access === 'subscribers' : v.access === 'free',
  );
  const cover = vids[0]?.poster;
  const total = c.medals.gold + c.medals.silver + c.medals.bronze;

  return (
    <div className="relative min-h-full">
      {/* Halo */}
      <div className="glowpulse pointer-events-none absolute -top-[200px] left-1/2 h-[460px] w-[540px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: `radial-gradient(closest-side, ${alpha(tone, 0.4)}, ${alpha('var(--gold)', 0.12)} 60%, transparent)` }} />

      {/* Barre haute flottante */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 pt-2">
        <IconButton label="Back" onClick={() => nav(-1)} className="bg-bg/70 backdrop-blur"><ArrowLeft size={18} /></IconButton>
        <IconButton label="Share" onClick={() => notify(copy.share)} className="bg-bg/70 backdrop-blur"><Share2 size={16} /></IconButton>
      </div>

      {/* Cover */}
      <motion.div initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative mx-4 -mt-[34px] h-[158px] overflow-hidden rounded-[20px] border border-line">
        {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, rgba(8,5,16,.85)), linear-gradient(90deg, ${alpha(tone, 0.25)}, transparent)` }} />
        <span className="absolute bottom-3 right-3"><Tag accent="muted" dot><span style={{ color: tone }}>{w.name}</span> · {subWorldName(c.world, c.subWorld)}</Tag></span>
      </motion.div>

      <div className="relative px-4">
        {/* Avatar + médaille */}
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }} className="relative -mt-11 inline-block">
          <Avatar id={c.id} size={88} ring="gold" to={false} />
          {c.medals.gold > 0 && <span className="absolute -bottom-1 -right-2 drop-shadow-[0_4px_10px_rgba(255,182,39,.5)]"><Medal medal="gold" size={34} /></span>}
        </motion.div>

        {/* Identité */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[26px] font-bold leading-[30px]">{c.name}</h1>
          {c.verified && <ShieldCheck size={20} className="text-green" />}
          {c.medals.gold > 0 && <Tag accent="gold"><Crown size={11} />{subWorldName(c.world, c.subWorld)} {copy.championSuffix}</Tag>}
          {c.isNew && <Tag accent="cyan">NEW</Tag>}
        </div>
        <p className="mt-1 text-[13px] text-muted">{c.handle} · {fill(copy.statsLine, { followers: fmtCount(c.followers), wins: c.seasonWins })}</p>
        <p className="mt-2 text-[14px] leading-5 text-txt-90">{c.bio}</p>

        {/* Pastilles de confiance */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {copy.trust.filter((_, i) => c.verified || i > 0).map((t, i) => {
            const I = trustIcon[t.icon as keyof typeof trustIcon];
            return (
              <motion.span key={t.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                <Tag accent={t.accent as Accent}><I size={12} />{t.label}</Tag>
              </motion.span>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2.5">
          <div className="flex-1"><FollowButton id={c.id} full /></div>
          <IconButton label="Message" onClick={() => nav(`/messages/${useMessages.getState().openWith(c.id)}`)} className="h-[44px] w-[44px] rounded-[12px]"><Mail size={18} /></IconButton>
        </div>

        {/* Plan d'abonnement (violet = subscribe) */}
        <Reveal className="mt-5">
          <Card className="relative overflow-hidden p-[17px]" glow={alpha('var(--cool)', 0.45)}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl" style={{ background: alpha('var(--cool)', 0.35) }} />
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[17px] font-bold">{copy.plan.title}</h2>
              <p><span className="font-display text-[22px] font-bold text-cool-300">{fmtPrice(c.subscriptionPrice)}</span><span className="text-[12px] text-muted"> /mo</span></p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {copy.plan.perks.map((p, i) => (
                <motion.li key={p} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex items-center gap-2.5 text-[13px]">
                  <span className="grid h-5 w-5 place-items-center rounded-[6px] bg-cool text-white"><Check size={13} strokeWidth={3} /></span>
                  {fill(p, { count: vids.length, name: c.name.split(' ')[0] })}
                </motion.li>
              ))}
            </ul>
            <div className="mt-4"><SubscribeButton id={c.id} full size="L" /></div>
            <p className="mt-2.5 text-center text-[11px] text-muted">{subscribed ? copy.plan.subscribedNote : copy.plan.note}</p>
          </Card>
        </Reveal>

        {/* Awards */}
        <Reveal className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-[22px] font-bold">{copy.awards.title}</h2>
              <p className="text-[12px] text-muted">{copy.awards.sub}</p>
            </div>
            {list.length > 3 && <button onClick={() => setAllAwards((v) => !v)} className="eyebrow text-muted">{allAwards ? copy.awards.showLess : copy.awards.showAll}</button>}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['gold', 'silver', 'bronze'] as const).map((m) => (
              <Card key={m} className="flex flex-col items-center py-3">
                <Medal medal={m} size={40} laurel={m === 'gold'} />
                <Counter value={c.medals[m]} className="mt-1 font-display text-[20px] font-bold" />
                <span className="eyebrow text-muted">{m}</span>
              </Card>
            ))}
          </div>
          {total === 0 ? (
            <p className="mt-3 text-[13px] text-muted">{copy.awards.empty}</p>
          ) : (
            <motion.ul layout className="mt-2 divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-panel">
              <AnimatePresence initial={false}>
                {shown.map((a, i) => (
                  <motion.li key={`${a.season}-${a.scopeName}-${i}`} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 px-3.5 py-2.5">
                    <Medal medal={a.medal} size={30} />
                    <span className="flex-1">
                      <span className="block text-[13px] font-semibold">#{a.rank} · {a.scopeName}</span>
                      <span className="block text-[11px] text-muted">{a.scope === 'global' ? 'Global ranking' : a.scope === 'world' ? 'World ranking' : `${a.world ?? w.name} · sub-world ranking`}</span>
                    </span>
                    <span className="text-[11px] text-muted">{a.season}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </Reveal>
      </div>

      {/* Challenges en cours */}
      {live.length > 0 && (
        <section className="mt-8">
          <div className="px-4">
            <h2 className="flex items-center gap-2 font-display text-[22px] font-bold"><span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-hot opacity-70" /><span className="h-2 w-2 rounded-full bg-hot" /></span>{copy.live.title}</h2>
            <p className="text-[12px] text-muted">{fill(copy.live.sub, { name: c.name.split(' ')[0] })}</p>
          </div>
          <div className="mt-4 space-y-8">
            {live.map((ch) => <Reveal key={ch.id}><ChallengeCard id={ch.id} /></Reveal>)}
          </div>
        </section>
      )}

      {/* Vidéos */}
      <section className="mt-8 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[22px] font-bold">{copy.content.title}</h2>
          <span className="text-[12px] text-muted">{vids.length}</span>
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {(copy.content.filters as Filter[]).map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
        </div>
        <motion.div layout className="mt-3.5 grid grid-cols-2 gap-x-2.5 gap-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((v) => {
              const own = unlocked.has(v.id) || (v.access === 'subscribers' && subscribed);
              const badge = v.access === 'free' ? <Tag accent="green">{copy.content.freeTag}</Tag> : v.access === 'subscribers' ? <Tag accent="cool">{copy.content.subsTag}</Tag> : own ? undefined : <Tag accent="gold">{fmtPrice(v.price)}</Tag>;
              return (
                <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.2 }}>
                  <MediaTile id={v.id} badge={badge} locked={!own && v.access !== 'free'} />
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-[17px] text-txt-90">{v.caption}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
        {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-muted">{copy.content.empty}</p>}
      </section>

      <div className="mt-8 px-4"><Eyebrow className="text-center">{c.handle} · {w.name}</Eyebrow></div>

      {/* Barre de demande */}
      <div className="sticky bottom-0 z-30 mt-4">
        <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-6" style={{ background: 'linear-gradient(180deg, transparent, rgba(8,5,16,.95) 40%)' }}>
          <div className="shine relative overflow-hidden rounded-[14px]">
            <Button full size="L" color="gold" onClick={() => setComposer(true)}>
              {copy.request.cta}
            </Button>
          </div>
        </div>
      </div>
      <PrivateChallengeComposer open={composer} onClose={() => setComposer(false)} creatorId={c.id} />
    </div>
  );
}
