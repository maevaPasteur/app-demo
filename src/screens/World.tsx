import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { app, challenges, creator, leaderboards, person, videos, world as getWorld, type Challenge } from '../data';
import copy from '../data/screens/Worlds.json';
import { ChallengeCard } from '../cards/Cards';
import { CreatedCard } from './parts/FeedLive';
import { VideoThumb } from '../cards/VideoThumb';
import { useDemo } from '../lib/store';
import { useContent } from '../lib/contentStore';
import { Avatar, Button, Chip, Counter, Medal, Reveal, Tag, alpha, toneColor } from '../ui';
import { ArrowLeft, Eye, Heart, SlidersHorizontal, Swords, TrendingUp, Gift, Target, LayoutGrid } from '../ui/Icon';
import { WorldIcon } from './parts/WorldIcon';
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
  const notify = useDemo((s) => s.notify);
  const podiumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.get('view') === 'ranking') setTimeout(() => podiumRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }, [params]);

  const version = useContent((s) => s.version);
  const list = useMemo(() => challenges.filter((c) => c.world === id && (!sub || c.subWorld === sub)), [id, sub, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const vids = useMemo(() => videos.filter((v) => v.world === id && (!sub || v.subWorld === sub)), [id, sub]);
  if (!w) return <Navigate to="/worlds" replace />;

  const c = toneColor(w.tone);
  const board = sub && leaderboards.subWorlds[sub] ? leaderboards.subWorlds[sub] : leaderboards.worlds[id];
  const champ = board.allTime[0];
  const champVid = videos.find((v) => v.creator === champ.creator) ?? vids[0];
  const subName = sub ? w.subWorlds.find((s) => s.id === sub)?.name : undefined;
  const rising = board.season.slice(0, 3);

  const sections: { key: string; title: string; icon: React.ReactNode; items: Challenge[] }[] = [
    { key: 'duels', title: ui.sections.duels, icon: <Swords size={18} style={{ color: 'var(--cyan)' }} />, items: list.filter((x) => x.type === 'duel') },
    { key: 'dares', title: ui.sections.dares, icon: <Target size={18} style={{ color: 'var(--hot)' }} />, items: list.filter((x) => x.type === 'dare') },
    { key: 'drops', title: ui.sections.drops, icon: <Gift size={18} style={{ color: 'var(--gold)' }} />, items: list.filter((x) => x.type === 'drop') },
  ];

  const setSub = (s: string | null) => setParams(s ? { sub: s } : {}, { replace: true });

  return (
    <div>
      {/* Header (Figma 92:238) */}
      <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 bg-bg/85 px-[18px] backdrop-blur-xl">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => nav(-1)} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel"><ArrowLeft size={18} /></motion.button>
        <span className="grid h-8 w-8 place-items-center rounded-[10px]" style={{ background: alpha(c, 0.16), color: c }}><WorldIcon name={w.icon} size={17} /></span>
        <h1 className="flex-1 truncate font-display text-[22px] font-bold">{subName ?? w.name}</h1>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleFav(id)} aria-label="Favorite" className="grid h-10 w-10 place-items-center rounded-[12px] border border-line" style={{ background: fav ? alpha('var(--hot)', 0.16) : 'var(--panel)' }}>
          <Heart size={19} className={fav ? 'fill-hot text-hot' : 'text-muted'} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => open('filters')} aria-label="Filters" className="relative grid h-10 w-10 place-items-center rounded-[12px] border border-line bg-panel">
          <SlidersHorizontal size={17} />
          <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold font-display text-[10px] font-bold text-on-gold">2</span>
        </motion.button>
      </header>

      {/* Sous-mondes */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-[18px] pb-1 pt-1">
        <Chip active={!sub} tone={w.tone} onClick={() => setSub(null)}>{t.all}</Chip>
        {w.subWorlds.map((s) => <Chip key={s.id} active={sub === s.id} tone={w.tone} onClick={() => setSub(s.id)}>{s.name}</Chip>)}
      </div>
      <p className="mt-2 px-[18px] text-[12px] text-muted">{w.tagline}</p>

      <AnimatePresence mode="wait">
        <motion.div key={sub ?? 'all'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {/* Hero champion */}
          {champVid && (
            <Reveal className="mx-[18px] mt-4">
              <div className="relative overflow-hidden rounded-[20px] border p-4" style={{ borderColor: alpha(c, 0.4), background: `linear-gradient(140deg, ${alpha(c, 0.14)}, ${alpha(c, 0.02)} 60%), var(--panel)` }}>
                <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full" style={{ background: alpha(c, 0.2), filter: 'blur(30px)' }} />
                <div className="relative flex items-center gap-3.5">
                  <span className="relative">
                    <Avatar id={champ.creator} size={64} ring="gold" />
                    <span className="absolute -bottom-1.5 -right-1.5"><Medal medal="gold" size={28} /></span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block text-gold">{t.champion}</span>
                    <Link to={`/creator/${champ.creator}`} className="block truncate font-display text-[22px] font-bold">{person(champ.creator)?.handle}</Link>
                    <span className="block text-[12px] text-muted"><Counter value={champ.points} /> pts · {subName ?? w.name}</span>
                  </span>
                </div>
                <div className="relative mt-4 flex gap-2">
                  <div className="flex-1"><Button full color="cyan" icon={<Swords size={16} />} onClick={() => notify(fill(t.challengeSent, 'handle', person(champ.creator)?.handle ?? ''), 'cyan')}>{t.challenge}</Button></div>
                  <div className="flex-1"><Button full color="ghost" icon={<Eye size={16} />} to={`/video/${champVid.id}`}>{t.watch}</Button></div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Leaderboard */}
          <div ref={podiumRef} className="mt-5 scroll-mt-[70px]">
            <WorldPodium key={sub ?? id} season={board.season} allTime={board.allTime} title={`${t.leaderboard} · ${(subName ?? w.name).toUpperCase()}`} />
          </div>

          {/* Duels / Dares / Drops */}
          {sections.map((s) => (
            <section key={s.key} className="mt-9">
              <div className="mb-3 flex items-center justify-between px-[18px]">
                <h2 className="flex items-center gap-2 font-display text-[22px] font-bold">{s.icon}{s.title}<span className="ml-1 font-display text-[13px] text-muted-2">{s.items.length}</span></h2>
              </div>
              {s.items.length ? (
                <div className="space-y-9">{s.items.map((ch) => <Reveal key={ch.id}>{ch.id.includes('-new-') ? <CreatedCard id={ch.id} /> : <ChallengeCard id={ch.id} />}</Reveal>)}</div>
              ) : (
                <div className="mx-[18px] flex items-center gap-3 rounded-[16px] border border-dashed border-line-strong p-4">
                  <p className="flex-1 text-[13px] text-muted">{t.emptySection}</p>
                  <Button size="S" color="hot" to="/create/dare">{t.postDare}</Button>
                </div>
              )}
            </section>
          ))}

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

          {/* Explore */}
          <section className="mt-10">
            <div className="flex items-center justify-between px-[18px]">
              <h2 className="flex items-center gap-2 font-display text-[22px] font-bold"><LayoutGrid size={19} style={{ color: c }} />{ui.sections.explore}</h2>
              <Tag accent="muted">{vids.length}</Tag>
            </div>
            <p className="mt-1 px-[18px] text-[12px] text-muted">{t.exploreSub}</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 px-[18px]">
              {vids.map((v, i) => (
                <Reveal key={v.id} delay={(i % 2) * 0.05}>
                  <VideoThumb id={v.id} w="100%" h={240} compact />
                  <p className="mt-1.5 truncate text-[12px] text-txt-90">{v.caption}</p>
                  <p className="truncate text-[11px] text-muted">{person(v.creator)?.handle}</p>
                </Reveal>
              ))}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
