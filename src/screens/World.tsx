import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { app, challenges, creator, leaderboards, videos, world as getWorld } from '../data';
import copy from '../data/screens/Worlds.json';
import { FeedItemView } from '../cards/Cards';
import type { FeedItem } from '../data';
import { activeCount, itemMatches, useFilters } from '../lib/filterStore';
import { CreatedCard } from './parts/FeedLive';
import { useDemo } from '../lib/store';
import { useContent } from '../lib/contentStore';
import { Avatar, Button, Counter, Reveal, alpha } from '../ui';
import { ChevronLeft, Heart, SlidersHorizontal, TrendingUp } from '../ui/Icon';
import { WorldPodium } from './parts/WorldPodium';
import { toggleFav } from './Worlds';

const ui = app.worldsUi;
const t = copy.world;
const fill = (s: string, k: string, v: string) => s.replace(`{${k}}`, v);

/** Figma 92:218 · Screen World (Content), générique pour les 6 mondes. */
export default function World() {
  const { id = 'content' } = useParams();
  const w = getWorld(id);
  const [params, setParams] = useSearchParams();
  const sub = params.get('sub');
  const nav = useNavigate();
  const fav = useDemo((s) => s.favWorlds.includes(id));
  const open = useDemo((s) => s.openSheet);
  const podiumRef = useRef<HTMLDivElement>(null);
  const fl = useFilters();
  const nFilters = activeCount(fl);

  useEffect(() => {
    if (params.get('view') === 'ranking') setTimeout(() => podiumRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }, [params]);

  const version = useContent((s) => s.version);
  const list = useMemo(() => challenges.filter((c) => c.world === id && (!sub || c.subWorld === sub)), [id, sub, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const vids = useMemo(() => videos.filter((v) => v.world === id && (!sub || v.subWorld === sub)), [id, sub]);
  if (!w) return <Navigate to="/worlds" replace />;

  const board = sub && leaderboards.subWorlds[sub] ? leaderboards.subWorlds[sub] : leaderboards.worlds[id];
  const subName = sub ? w.subWorlds.find((s) => s.id === sub)?.name : undefined;
  const rising = board.season.slice(0, 3);

  const setSub = (s: string | null) => setParams(s ? { sub: s } : {}, { replace: true });
  void setSub;

  // Feed du monde (Figma 92:218 : FeedList directement sous le classement), même grammaire que Discover.
  const inChallenges = new Set(list.flatMap((x) => x.videos));
  const solo = vids.filter((v) => !inChallenges.has(v.id));
  const live = list.filter((x) => x.status === 'live');
  const done = list.filter((x) => x.status !== 'live');
  const ordered: { kind: 'challenge' | 'video'; id: string }[] = [];
  const queue = [...live, ...done];
  let vi = 0;
  queue.forEach((ch, i) => {
    ordered.push({ kind: 'challenge', id: ch.id });
    if (i % 2 === 1 && solo[vi]) ordered.push({ kind: 'video', id: solo[vi++].id });
  });
  while (solo[vi]) ordered.push({ kind: 'video', id: solo[vi++].id });
  const items = ordered.filter((it) => it.id.includes('-new-') || itemMatches(it as FeedItem, fl));

  return (
    <div>
      {/* Header (Figma 92:238) */}
      <header className="sticky top-0 z-30 flex h-[66px] items-center gap-2 bg-bg/95 px-[18px] backdrop-blur-xl">
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => nav(-1)} aria-label="Back" className="grid h-8 w-6 place-items-center text-muted"><ChevronLeft size={20} /></motion.button>
        <h1 className="flex-1 truncate font-display text-[22px] font-bold">{subName ?? w.name}</h1>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleFav(id)} aria-label="Favorite" className="grid h-10 w-10 place-items-center rounded-[12px] border border-line" style={{ background: fav ? alpha('var(--hot)', 0.22) : 'var(--panel)' }}>
          <Heart size={19} className={fav ? 'fill-hot-soft text-hot-soft' : 'text-muted'} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => open('filters')} aria-label="Filters" className="relative grid h-10 w-10 place-items-center rounded-[12px] border border-line bg-panel">
          <SlidersHorizontal size={17} />
          {nFilters > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold font-display text-[10px] font-bold text-on-gold">{nFilters}</span>}
        </motion.button>
      </header>

      <motion.div key={sub ?? 'all'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {/* Leaderboard (Figma 372:4951) */}
          <div ref={podiumRef} className="mt-2 scroll-mt-[70px]">
            <WorldPodium key={sub ?? id} season={board.season} allTime={board.allTime} title={t.leaderboard} />
          </div>

          {/* Feed (Figma FeedList 304:2) */}
          <div className="mt-8 space-y-10">
            {items.map((it, i) => (
              <Reveal key={`${it.kind}-${it.id}`}>
                {it.id.includes('-new-') ? <CreatedCard id={it.id} /> : <FeedItemView item={it as FeedItem} />}
                {i < items.length - 1 && <div className="mx-[18px] mt-10 h-px" style={{ background: alpha('var(--line-strong)', 0.7) }} />}
              </Reveal>
            ))}
            {!items.length && (
              <div className="mx-[18px] flex items-center gap-3 rounded-[16px] border border-dashed border-line-strong p-4">
                <p className="flex-1 text-[13px] text-muted">{t.emptySection}</p>
                <Button size="S" color="hot" to="/create/dare">{t.postDare}</Button>
              </div>
            )}
          </div>

          {/* Rising (Figma 93:492) */}
          <section className="mt-10">
            <div className="flex items-center justify-between px-[18px]">
              <h2 className="flex items-center gap-2 font-display text-[22px] font-bold"><TrendingUp size={20} className="text-gold" />{ui.sections.rising}</h2>
              <Link to="/podium" className="eyebrow text-muted">SEE ALL</Link>
            </div>
            <p className="mt-1 px-[18px] text-[12px] text-muted">{fill(t.risingSub, 'world', subName ?? w.name)}</p>
            <div className="mt-3 grid grid-cols-3 gap-2.5 px-[18px]">
              {rising.map((r, i) => (
                <Reveal key={r.creator} delay={i * 0.06}>
                  <Link to={`/creator/${r.creator}`} className="relative flex flex-col items-center rounded-[16px] border border-line bg-panel px-2 pb-3 pt-4">
                    <span className="absolute left-2.5 top-2 font-display text-[12px] font-bold text-gold">#{r.rank}</span>
                    <Avatar id={r.creator} size={58} ring="gold" to={false} />
                    <p className="mt-2 max-w-full truncate text-[12px] font-semibold">{creator(r.creator)?.handle}</p>
                    <p className="mt-0.5 font-display text-[16px] font-bold text-gold"><Counter value={r.points} /> <span className="text-[11px] font-medium text-muted">pts</span></p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>

      </motion.div>
    </div>
  );
}
