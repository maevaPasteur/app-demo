import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { app, challenges, comments as allComments, creator as getCreator, fmtCount, fmtDuration, fmtNum, fmtPrice, leaderboards, person, subWorldName, tips, video as getVideo, videos, world as getWorld, type Comment } from '../data';
import copy from '../data/screens/Worlds.json';
import { FollowButton, SubscribeButton } from '../cards/Cards';
import { VideoThumb } from '../cards/VideoThumb';
import { useDemo } from '../lib/store';
import { canWatch, unlockIntent } from '../lib/access';
import { Media, type MediaHandle } from '../components/Media';
import { LockedPreview, usePreviewState } from '../components/LockedPreview';
import { Avatar, Button, Rail, Reveal, Tag, alpha, toneColor } from '../ui';
import { Maximize2 } from 'lucide-react';
import { ArrowLeft, Bookmark, ChevronRight, Eye, Heart, Lock, LockOpen, MessageSquare, Send, Share2, Volume2, VolumeX } from '../ui/Icon';

const ov = app.openVideo;
const t = copy.video;

/** Figma 662:13148 · Screen Feed (Open video) */
export default function VideoOpen() {
  const { id = '' } = useParams();
  const v = getVideo(id);
  const nav = useNavigate();
  const unlockedSet = useDemo((s) => s.unlocked);
  const subscribedSet = useDemo((s) => s.subscribed);
  const subscribed = v ? subscribedSet.has(v.creator) : false;
  const liked = useDemo((s) => s.liked.has(id));
  const saved = useDemo((s) => s.saved.has(id));
  const { ask, toggleLike, toggleSave, notify } = useDemo.getState();
  const [muted, setMuted] = useState(true);
  const [list, setList] = useState<(Comment & { mine?: boolean })[]>(() => allComments[id] ?? []);
  const [likedC, setLikedC] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState('');
  const media = useRef<MediaHandle>(null);
  const pv = usePreviewState();

  useEffect(() => { setList(allComments[id] ?? []); setLikedC(new Set()); }, [id]);
  useEffect(() => { pv.reset(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v) return <Navigate to="/" replace />;

  const c = getCreator(v.creator);
  const w = getWorld(v.world);
  const rank = leaderboards.global.season.find((r) => r.creator === v.creator)?.rank;
  const ch = challenges.find((x) => x.videos.includes(id));
  const open = canWatch(v, { unlocked: unlockedSet, subscribed: subscribedSet });
  const related = videos.filter((x) => x.world === v.world && x.id !== id).slice(0, 8);

  const post = () => {
    const text = draft.trim();
    if (!text) return;
    setList((l) => [{ author: 'me', ago: t.now, text, likes: 0, mine: true }, ...l]);
    setDraft('');
    notify(t.posted, 'gold');
  };

  return (
    <div className="pb-[84px]">
      {/* Stage vidéo */}
      <div className="relative h-[540px] overflow-hidden rounded-b-[28px] bg-media">
        <motion.div key={id} className="absolute inset-0" initial={{ scale: 1.06, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <Media ref={media} video={v} eager muted={muted} previewSec={open ? undefined : v.freePreviewSec} onPreviewEnd={pv.onPreviewEnd} onPreviewStart={pv.onPreviewStart} />
        </motion.div>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(8,5,16,.55) 0%,transparent 20%,transparent 60%,rgba(8,5,16,.92) 100%)' }} />

        <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => nav(-1)} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur"><ArrowLeft size={18} /></motion.button>
          {v.access === 'free' ? <Tag accent="green">FREE</Tag> : open ? <Tag accent="cyan" solid><LockOpen size={11} />UNLOCKED</Tag> : (
            <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-black/70 px-2.5 font-display text-[12px] font-semibold text-white backdrop-blur"><Lock size={13} />0:{String(v.freePreviewSec).padStart(2, '0')} free</span>
          )}
          <span className="flex-1" />
          {rank && <span className="rounded-full bg-black/70 px-2.5 py-1 font-display text-[13px] font-bold text-white backdrop-blur">#{rank}</span>}
        </div>

        {/* Actions latérales */}
        <div className="absolute bottom-16 right-3 z-10 flex flex-col items-center gap-3">
          <SideAction label={fmtCount(v.stats.likes + (liked ? 1 : 0))} active={liked} onClick={() => toggleLike(id)}>
            <Heart size={22} className={liked ? 'fill-hot text-hot' : ''} />
          </SideAction>
          <SideAction label={fmtCount(list.length > (allComments[id]?.length ?? 0) ? v.stats.comments + 1 : v.stats.comments)} onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}><MessageSquare size={21} /></SideAction>
          <SideAction label="" active={saved} onClick={() => { toggleSave(id); notify(saved ? 'Removed from saved' : 'Saved', 'gold'); }}>
            <Bookmark size={21} className={saved ? 'fill-gold text-gold' : ''} />
          </SideAction>
          <SideAction label="" onClick={() => notify('Link copied', 'gold')}><Share2 size={20} /></SideAction>
          <SideAction label="" onClick={() => nav(`/watch/${id}`)}><Maximize2 size={20} /></SideAction>
          <SideAction label="" onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</SideAction>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-white">
          <div className="min-w-0 pr-16">
            <p className="line-clamp-2 text-[14px] font-semibold leading-5">{v.caption}</p>
            <div className="mt-2 flex items-center gap-3 text-[13px] font-semibold">
              <span className="flex items-center gap-1"><Heart size={16} className={liked ? 'fill-hot text-hot' : ''} />{fmtCount(v.stats.likes + (liked ? 1 : 0))}</span>
              <span className="flex items-center gap-1"><MessageSquare size={16} />{fmtCount(v.stats.comments)}</span>
              <span className="flex items-center gap-1"><Eye size={16} />{fmtCount(v.stats.views)}</span>
            </div>
          </div>
          <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[12px] font-semibold">{fmtDuration(v.durationSec)}</span>
        </div>

        {/* Preview gratuite puis flou + verrou */}
        <LockedPreview video={v} locked={!open} ended={pv.ended} playing={pv.playing} size="stage" onReplay={() => media.current?.replay()} />
      </div>

      {/* CTA */}
      <div className="px-4 pt-4">
        {v.access === 'free' ? (
          <Button full size="L" color="gold" onClick={() => ask({ kind: 'tip', label: `Tip ${c.handle}`, sub: tips.sub, price: tips.amounts[1], targetId: c.id })}>{t.tip}</Button>
        ) : v.access === 'subscribers' && !subscribed ? (
          <SubscribeButton id={c.id} full size="L" />
        ) : open ? (
          <Button full size="L" color="ghost" done icon={<LockOpen size={17} />}>{t.unlocked}</Button>
        ) : (
          <Button full size="L" color={unlockIntent(id).color === 'cyan' ? 'cyan' : 'gold'} icon={<Lock size={17} />} onClick={() => ask(unlockIntent(id).intent)}>
            {unlockIntent(id).label}
          </Button>
        )}
        <p className="mt-2.5 text-center text-[12px] text-muted">
          {v.access === 'free' ? t.freeLabel : v.access === 'subscribers' && !subscribed ? `${t.subsOnly} · ${fmtPrice(c.subscriptionPrice)}/mo` : ov.unlockSub.replace('{price}', fmtPrice(unlockIntent(id).intent.price))}
        </p>
      </div>

      {/* Lien challenge */}
      {ch && (
        <Reveal className="mx-4 mt-3">
          <Link to={`/world/${ch.world}?sub=${ch.subWorld}`} className="flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5" style={{ borderColor: alpha(toneColor(w.tone), 0.35), background: alpha(toneColor(w.tone), 0.07) }}>
            <span className="h-2 w-2 rounded-full" style={{ background: toneColor(w.tone) }} />
            <span className="min-w-0 flex-1">
              <span className="eyebrow block text-muted">{t.partOf} {ch.type.toUpperCase()} · {w.name} · {subWorldName(ch.world, ch.subWorld)}</span>
              <span className="block truncate text-[13px] font-semibold">{ch.title}</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        </Reveal>
      )}

      {/* Créateur */}
      <Reveal className="mx-4 mt-4">
        <div className="rounded-[20px] border border-line bg-panel p-4">
          <div className="flex items-center gap-3.5">
            <Avatar id={c.id} size={60} ring="gold" />
            <div className="min-w-0 flex-1">
              <Link to={`/creator/${c.id}`} className="block truncate font-display text-[18px] font-bold">{c.handle}</Link>
              <p className="truncate text-[12px] text-muted">{fmtCount(c.followers)} {t.followers} · {c.seasonWins} {t.winsSeason}</p>
            </div>
            {rank && <span className="font-display text-[34px] font-bold leading-none text-gold"><sup className="text-[16px]">#</sup>{rank}</span>}
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <FollowButton id={c.id} full />
            <SubscribeButton id={c.id} full label={app.feedUi.subscribe} />
          </div>
        </div>
      </Reveal>

      {/* Commentaires */}
      <section id="comments" className="mt-6 scroll-mt-4 px-4">
        <h2 className="flex items-baseline gap-2 font-display text-[22px] font-bold">{ov.comments}<span className="text-[13px] font-medium text-muted">{fmtNum(v.stats.comments + list.filter((x) => x.mine).length)}</span></h2>
        <ul className="mt-3">
          <AnimatePresence initial={false}>
            {list.map((cm, i) => {
              const on = likedC.has(i);
              const p = person(cm.author);
              return (
                <motion.li key={`${cm.author}-${cm.text}-${i}`} layout initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} className="flex gap-3 py-3">
                  <Avatar id={cm.author} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px]"><span className="font-semibold">{p?.handle}</span>{cm.mine && <span className="text-muted"> ({t.you})</span>}<span className="text-muted"> · {cm.ago}</span></p>
                    <p className="mt-0.5 text-[14px] leading-5 text-txt-90">{cm.text}</p>
                    <div className="mt-1.5 flex items-center gap-4 text-[12px] text-muted">
                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => setLikedC((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className="flex items-center gap-1">
                        <Heart size={13} className={on ? 'fill-hot text-hot' : ''} />{cm.likes + (on ? 1 : 0)}
                      </motion.button>
                      <button onClick={() => { setDraft(`${p?.handle} `); document.getElementById('cm-input')?.focus(); }}>{t.reply}</button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-6">
          <h2 className="px-4 font-display text-[18px] font-bold">{t.related.replace('{world}', w.name)}</h2>
          <Rail className="mt-3 !px-4" gap={10}>
            {related.map((r) => <VideoThumb key={r.id} id={r.id} w={140} h={210} compact />)}
          </Rail>
        </section>
      )}

      {/* Composer */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3" style={{ background: 'linear-gradient(180deg,transparent,var(--bg) 35%)' }}>
        <form onSubmit={(e) => { e.preventDefault(); post(); }} className="flex h-[52px] items-center gap-2.5 rounded-[18px] border border-line bg-panel pl-2 pr-1.5">
          <Avatar id="me" size={34} to={false} />
          <input id="cm-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={ov.addComment} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-2" />
          <motion.button whileTap={{ scale: 0.85 }} type="submit" aria-label="Send" className="grid h-10 w-10 place-items-center rounded-[13px]" style={{ background: draft.trim() ? 'var(--grad-gold-cta)' : 'transparent', color: draft.trim() ? 'var(--on-gold)' : 'var(--muted)' }}>
            {draft.trim() ? <Send size={17} /> : <MessageSquare size={19} />}
          </motion.button>
        </form>
      </div>
    </div>
  );
}

function SideAction({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.8 }} onClick={onClick} className="flex flex-col items-center gap-0.5 text-white">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-black/45 backdrop-blur" style={{ boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,.3)' : undefined }}>{children}</span>
      {label && <span className="text-[11px] font-semibold">{label}</span>}
    </motion.button>
  );
}
