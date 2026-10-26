import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { app, creator, feed, feedFollowing, me, newCreators, person, risers, subWorldName, world } from '../data';
import { FeedItemView, FollowButton } from '../cards/Cards';
import { TopBar } from '../components/TopBar';
import { useDemo } from '../lib/store';
import { activeCount, itemMatches, useFilters } from '../lib/filterStore';
import { Avatar, Counter, Eyebrow, Rail, Reveal, Tag, alpha } from '../ui';
import { Crown, SlidersHorizontal, TrendingUp } from '../ui/Icon';
import { useContent } from '../lib/contentStore';
import { CreatedCard, PullToRefresh, YourLiveStrip } from './parts/FeedLive';

const ui = app.feedUi;

/** Figma 210:182 · Screen Feed (Discover) */
export default function Feed() {
  const [tab, setTabRaw] = useState<'foryou' | 'following'>('foryou');
  const tabsRef = useRef<HTMLDivElement>(null);
  const setTab = (t: 'foryou' | 'following') => {
    setTabRaw(t);
    const el = document.getElementById('app-scroll');
    const anchor = tabsRef.current;
    if (el && anchor && el.scrollTop > anchor.offsetTop - 60) el.scrollTo({ top: anchor.offsetTop - 60, behavior: 'smooth' });
  };
  const subscribed = useDemo((s) => s.subscribed);
  const followed = useDemo((s) => s.followed);
  const open = useDemo((s) => s.openSheet);
  const circle = [...me.circle.subscribed.filter((c) => subscribed.has(c)), ...[...subscribed].filter((c) => !me.circle.subscribed.includes(c))];
  const following = [...followed].filter((c) => !subscribed.has(c) && creator(c));
  const nav = useNavigate();
  const role = useDemo((s) => s.role);
  const notify = useDemo((s) => s.notify);
  const created = useContent((s) => s.created);
  const [seed, setSeed] = useState(0);
  const fl = useFilters();
  const nFilters = activeCount(fl);
  const items = useMemo(() => {
    const base = (tab === 'foryou' ? feed : feedFollowing).filter((it) => itemMatches(it, fl));
    if (!seed) return base;
    // rafraîchissement : on remonte quelques éléments plus bas dans le fil
    const out = [...base];
    for (let i = 0; i < 3; i++) {
      const from = 3 + ((seed * 7 + i * 5) % Math.max(1, out.length - 3));
      const [it] = out.splice(from, 1);
      out.splice(i, 0, it);
    }
    return out;
  }, [tab, seed, fl]);
  const refresh = () => { setSeed((s) => s + 1); notify('Fresh drops loaded', 'gold'); };
  const openCreated = (id: string) => {
    if (tab !== 'foryou') setTabRaw('foryou');
    useContent.setState({ highlight: null });
    setTimeout(() => useContent.setState({ highlight: id }), 30);
  };

  return (
    <div>
      <TopBar />
      <PullToRefresh onRefresh={refresh}>

      {/* Your circle */}
      <section className="pt-2">
        <div className="flex items-center justify-between px-[18px]">
          <h2 className="font-display text-[22px] font-bold">{ui.circleTitle}</h2>
          <Link to="/me/fan" className="eyebrow text-muted">{ui.circleManage}</Link>
        </div>
        <div className="mt-2 flex gap-4 px-[18px] text-[12px] text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cool" />{ui.circleTabs[0]}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-hot" />{ui.circleTabs[1]}</span>
        </div>
        <Rail className="mt-3 pb-1" gap={14}>
          {[...circle.map((c) => ({ c, sub: true })), ...following.map((c) => ({ c, sub: false }))].map(({ c, sub }, i) => (
            <motion.div key={c} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 25 }} className="flex w-[64px] shrink-0 snap-start flex-col items-center">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => nav(`/stories/${c}`)} className="relative" aria-label={`Stories of ${person(c).handle}`}>
                <Avatar id={c} size={64} ring={sub ? 'cool' : 'hot'} to={false} />
                {sub && <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-cool text-white ring-2 ring-bg"><Crown size={11} fill="currentColor" /></span>}
              </motion.button>
              <span className="mt-1.5 w-full truncate text-center text-[11px] font-semibold" style={{ color: sub ? 'var(--violet-300)' : 'var(--txt)' }}>{person(c).handle}</span>
            </motion.div>
          ))}
        </Rail>
      </section>

      {(role === 'creator' || created.length > 0) && <YourLiveStrip onOpen={openCreated} />}

      {/* New creators */}
      <section className="mt-5">
        <div className="flex items-center justify-between px-[18px]">
          <h2 className="font-display text-[18px] font-bold">{ui.newCreators}</h2>
          <Link to="/worlds" className="eyebrow text-muted">{ui.seeAll}</Link>
        </div>
        <Rail className="mt-3">
          {newCreators.map((id) => {
            const c = creator(id);
            return (
              <div key={id} className="relative flex w-[150px] shrink-0 snap-start flex-col items-center rounded-[18px] border border-line bg-panel px-3 pb-3 pt-4">
                <span className="absolute left-2.5 top-2.5"><Tag accent="cyan">NEW</Tag></span>
                <Avatar id={id} size={58} ring="cyan" />
                <p className="mt-2 text-[14px] font-semibold">{c.handle}</p>
                <p className="mb-3 text-[11px] text-muted">{world(c.world).name} · {subWorldName(c.world, c.subWorld)}</p>
                <FollowButton id={id} full />
              </div>
            );
          })}
        </Rail>
      </section>

      {/* Tabs */}
      <div ref={tabsRef} className="sticky top-[60px] z-20 mt-5 flex items-center gap-2.5 bg-bg/95 px-[18px] py-2.5 backdrop-blur-xl">
        <div className="relative flex h-[46px] flex-1 rounded-[14px] border border-line bg-panel p-1">
          {(['foryou', 'following'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="relative z-10 flex-1 font-display text-[14px] font-bold" style={{ color: tab === t ? 'var(--on-gold)' : 'var(--muted)' }}>
              {tab === t && <motion.span layoutId="feedtab" className="absolute inset-0 -z-10 rounded-[11px]" style={{ background: 'var(--grad-gold-cta)' }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              {t === 'foryou' ? 'For you' : 'Following'}
            </button>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => open('filters')} className="relative grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-line bg-panel" aria-label="Filters">
          <SlidersHorizontal size={18} />
          {nFilters > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold font-display text-[10px] font-bold text-on-gold">{nFilters}</span>}
        </motion.button>
      </div>

      {/* Rising */}
      {tab === 'foryou' && (
        <section className="mt-3">
          <div className="flex items-center justify-between px-[18px]">
            <h2 className="flex items-center gap-2 font-display text-[22px] font-bold"><TrendingUp size={20} className="text-gold" />{ui.rising}</h2>
            <Tag accent="gold">{app.season.label}</Tag>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2.5 px-[18px]">
            {risers.map((r, i) => (
              <Reveal key={r.creator} delay={i * 0.06}>
                <Link to={`/creator/${r.creator}`} className="relative flex flex-col items-center rounded-[16px] border border-line bg-panel px-2 pb-3 pt-4">
                  <span className="absolute left-2.5 top-2 font-display text-[12px] font-bold text-gold">#{r.rank}</span>
                  <Avatar id={r.creator} size={58} ring={(['gold', 'cool', 'cyan'] as const)[i]} to={false} />
                  <p className="mt-2 text-[12px] font-semibold">{person(r.creator).handle}</p>
                  <p className="mt-0.5 font-display text-[17px] font-bold text-gold"><Counter value={r.points} /> <span className="text-[11px] font-medium text-muted">pts</span></p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, x: tab === 'foryou' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-8 space-y-10">
          {tab === 'foryou' && created.map((id) => (
            <div key={id}>
              <CreatedCard id={id} />
              <div className="mx-[18px] mt-10 h-px" style={{ background: alpha('var(--line-strong)', 0.7) }} />
            </div>
          ))}
          {items.map((it, i) => (
            <Reveal key={`${it.kind}-${'id' in it ? it.id : i}`}>
              <FeedItemView item={it} />
              {i < items.length - 1 && <div className="mx-[18px] mt-10 h-px" style={{ background: alpha('var(--line-strong)', 0.7) }} />}
            </Reveal>
          ))}
          <div className="px-[18px] pb-4 text-center"><Eyebrow>YOU'RE ALL CAUGHT UP · {app.season.label}</Eyebrow></div>
        </motion.div>
      </AnimatePresence>
      </PullToRefresh>
    </div>
  );
}
