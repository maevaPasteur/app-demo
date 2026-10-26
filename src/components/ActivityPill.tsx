import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { challenges, fans, person, video, videos } from '../data';
import { startLiveSim } from '../lib/live';
import { useDemo } from '../lib/store';
import { Avatar } from '../ui';
import { Flame, Gift, LockOpen, TrendingUp, Zap } from '../ui/Icon';

type Act = { who: string; text: string; to: string; icon: typeof Zap; color: string };

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Génère un évènement « live » plausible à partir des données de la démo. */
function makeActivity(): Act {
  const fan = pick(fans.filter((f) => f.id !== 'me')).id;
  const paid = videos.filter((v) => v.access === 'locked');
  const duels = challenges.filter((c) => c.type === 'duel' && c.status === 'live');
  const drops = challenges.filter((c) => c.type === 'drop');
  const r = Math.random();
  if (r < 0.35) {
    const v = pick(paid);
    return { who: fan, text: `${person(fan).handle} just unlocked "${v.caption.replace(/\.$/, '').slice(0, 26)}"`, to: `/video/${v.id}`, icon: LockOpen, color: 'var(--cyan)' };
  }
  if (r < 0.6 && duels.length) {
    const d = pick(duels);
    const e = pick(d.type === 'duel' ? d.entries : []);
    return { who: e.creator, text: `${person(e.creator).handle} took the lead in a ${d.subWorld.replace('-', ' ')} duel. The crowd is loving it`, to: `/world/${d.world}`, icon: TrendingUp, color: 'var(--gold)' };
  }
  if (r < 0.8 && drops.length) {
    const d = pick(drops);
    const raised = d.type === 'drop' ? d.raised + 40 + Math.floor(Math.random() * 300) : 0;
    return { who: d.type === 'drop' ? d.creators[0] : fan, text: `Drop by ${d.type === 'drop' ? d.creatorsLabel.split(',')[0] : ''} hit $${raised.toLocaleString('en-US')}`, to: '/', icon: Gift, color: 'var(--gold)' };
  }
  const v = pick(videos);
  return { who: fan, text: `${person(fan).handle} can't stop voting for ${person(video(v.id).creator).handle}`, to: `/video/${v.id}`, icon: Flame, color: 'var(--hot)' };
}

/** Pastille d'activité en direct, discrète, toutes les ~20 s. */
export function ActivityPill() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const onboarded = useDemo((s) => s.onboarded);
  const busy = useDemo((s) => !!s.sheet || !!s.pending || !!s.toast);
  const [act, setAct] = useState<(Act & { k: number }) | null>(null);
  const blocked = useRef(false);
  blocked.current = !onboarded || busy || pathname.startsWith('/me/payout') || pathname.startsWith('/settings') || pathname.startsWith('/welcome') || pathname.startsWith('/watch') || pathname.startsWith('/stories') || pathname.startsWith('/create') || pathname.startsWith('/messages/');

  useEffect(() => { startLiveSim(); }, []);
  useEffect(() => {
    let hide: ReturnType<typeof setTimeout>;
    const show = () => {
      if (blocked.current || document.hidden) return;
      setAct({ ...makeActivity(), k: Date.now() });
      hide = setTimeout(() => setAct(null), 4200);
    };
    const first = setTimeout(show, 9000);
    const iv = setInterval(show, 20000);
    return () => { clearTimeout(first); clearInterval(iv); clearTimeout(hide); };
  }, []);
  useEffect(() => { if (blocked.current) setAct(null); }, [pathname, busy]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+82px)] z-[80] flex justify-start px-4">
      <AnimatePresence>
        {act && (
          <motion.button key={act.k} onClick={() => { setAct(null); nav(act.to); }}
            initial={{ y: 24, opacity: 0, scale: 0.92 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex max-w-[320px] items-center gap-2 rounded-full border border-line-strong bg-[#120c1c]/90 py-1 pl-1 pr-3 text-left shadow-[0_10px_30px_rgba(0,0,0,.45)] backdrop-blur-xl">
            <Avatar id={act.who} size={26} to={false} />
            <span className="relative flex h-1.5 w-1.5 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: act.color }} /><span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: act.color }} /></span>
            <span className="truncate text-[12px] font-semibold text-txt-90">{act.text}</span>
            <act.icon size={13} className="shrink-0" style={{ color: act.color }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
