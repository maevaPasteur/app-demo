import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemo } from '../lib/store';
import { Avatar, Button, IconButton, Reveal, alpha } from '../ui';
import { Bell, ChevronRight, Gift, Play, Sparkle, Target } from '../ui/Icon';
import { AvatarPile, GoldTimer, InvitationCard, OutlineTag, jk, type Invite } from './parts/JokerParts';

const C = jk.creator;
type Prog = (typeof C.progress)[number] | { id: string; type: string; tags: string[]; timer: string; fresh: true; from: string; to: string };

const fmtIcon = { video: Play, duel: Sparkle, dare: Target, drop: Gift } as const;
const accent = { cool: 'var(--cool)', hot: 'var(--hot)', cyan: 'var(--cyan)', gold: 'var(--gold)' } as const;

/** Figma 488:7332 · Joker · Creator */
export default function JokerCreator() {
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  const open = useDemo((s) => s.openSheet);
  const [needs, setNeeds] = useState<Invite[]>(jk.invitations.items.slice(0, 2));
  const [progress, setProgress] = useState<Prog[]>(C.progress);

  const accept = (inv: Invite) => {
    setNeeds((n) => n.filter((x) => x.id !== inv.id));
    setProgress((p) => [{ id: `n-${inv.id}`, type: inv.type === 'DROP' ? 'Drop' : inv.type === 'DARE' ? 'Dare' : 'Duel', tags: inv.tags, timer: inv.timer, fresh: true, from: inv.from, to: '/' }, ...p]);
    notify(`Accepted · moved to in progress`, 'gold');
  };
  const decline = (inv: Invite) => { setNeeds((n) => n.filter((x) => x.id !== inv.id)); notify('Invitation declined', 'hot'); };

  return (
    <div className="px-4">
      <header className="flex h-[56px] items-center justify-between pt-2">
        <span className="w-9" />
        <IconButton label="Notifications" dot onClick={() => open('notifications')}><Bell size={18} /></IconButton>
      </header>

      {/* Hero */}
      <div className="mt-3 flex flex-col items-center text-center">
        <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="grid h-[68px] w-[68px] place-items-center rounded-full text-white" style={{ background: 'radial-gradient(circle at 35% 30%,#ff5a92,#c0124f)', boxShadow: '0 0 40px -6px rgba(255,31,107,.75)' }}>
          <Sparkle size={22} fill="currentColor" />
        </motion.span>
        <h1 className="mt-4 font-display text-[24px] font-bold">{C.title}</h1>
        <p className="mt-2 text-[14px] text-muted">{C.sub}</p>
      </div>

      {/* Needs you */}
      <Section title={C.needsYou} count={needs.length} to="/joker/invitations" />
      <div className="mt-3 space-y-3">
        <AnimatePresence initial={false}>
          {needs.map((inv) => (
            <motion.div key={inv.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 80, height: 0, marginTop: 0 }} transition={{ duration: 0.3 }}>
              <InvitationCard inv={inv} onAccept={() => accept(inv)} onDecline={() => decline(inv)} />
            </motion.div>
          ))}
        </AnimatePresence>
        {needs.length === 0 && (
          <Link to="/joker/invitations" className="flex items-center justify-center gap-1 rounded-[16px] border border-dashed border-line-strong py-5 text-[13px] text-muted">All caught up · see past invitations<ChevronRight size={14} /></Link>
        )}
      </div>

      {/* In progress */}
      <Section title={C.inProgress} count={progress.length} to="/me/creator" />
      <div className="mt-3 space-y-2.5">
        <AnimatePresence initial={false}>
          {progress.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <ProgressRow p={p} onOpen={() => nav(p.to)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Start new */}
      <Section title={C.startNew} />
      <div className="mt-3 space-y-3">
        {C.formats.map((f, i) => {
          const c = accent[f.accent as keyof typeof accent];
          const I = fmtIcon[f.id as keyof typeof fmtIcon];
          const btn = f.accent as 'cool' | 'hot' | 'cyan' | 'gold';
          return (
            <Reveal key={f.id} delay={i * 0.05}>
              <div className="rounded-[18px] border border-line p-4" style={{ background: 'linear-gradient(180deg,#221833 0%,#1a1228 100%)' }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-[12px]" style={{ background: alpha(c, 0.35), color: '#fff' }}><I size={18} fill={f.id === 'video' || f.id === 'duel' ? 'currentColor' : 'none'} /></span>
                  <div>
                    <p className="font-display text-[17px] font-bold">{f.title}</p>
                    <span className="mt-1 inline-block rounded-[6px] px-2 py-0.5 font-display text-[10px] font-bold" style={{ color: c, background: alpha(c, 0.16) }}>{f.tag}</span>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-[19px] text-muted">{f.text}</p>
                <div className="mt-3.5 flex gap-2">
                  {'secondary' in f && f.secondary && (
                    <button onClick={() => nav(f.secondaryTo ?? '/')} className="h-11 flex-1 rounded-[12px] font-display text-[14px] font-bold" style={{ background: alpha(c, 0.16), color: c }}>{f.secondary}</button>
                  )}
                  <div className="flex-[1.4]"><Button full color={btn} onClick={() => nav(f.to)}>{f.primary}</Button></div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, count, to }: { title: string; count?: number; to?: string }) {
  return (
    <div className="mt-7 flex items-center justify-between">
      <p className="eyebrow flex items-center gap-2 text-muted">{title}{count ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-hot px-1 text-[10px] tracking-normal text-white">{count}</span> : null}</p>
      {to && <Link to={to} className="flex items-center text-[12px] font-semibold text-txt-90">{jk.creator.seeAll}<ChevronRight size={13} /></Link>}
    </div>
  );
}

function ProgressRow({ p, onOpen }: { p: Prog; onOpen: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.985 }} onClick={onOpen} className="w-full rounded-[18px] border border-line p-4 text-left" style={{ background: 'linear-gradient(180deg,#221833 0%,#1a1228 100%)' }}>
      <div className="flex items-center gap-2">
        <span className="font-display text-[16px] font-bold">{p.type}</span>
        {p.tags.map((t) => <OutlineTag key={t}>{t}</OutlineTag>)}
        <span className="ml-auto"><GoldTimer label={p.timer} /></span>
      </div>
      {'fresh' in p ? (
        <div className="mt-3 flex items-center gap-3">
          <Avatar id={p.from} size={36} ring="hot" to={false} />
          <span className="flex-1 text-[13px] text-txt-90">Just accepted · upload your entry</span>
          <span className="rounded-full bg-gold px-2.5 py-1 font-display text-[11px] font-bold text-on-gold">NEW</span>
        </div>
      ) : 'you' in p && p.you !== undefined ? (
        <div className="mt-3 flex items-center gap-2.5">
          <Avatar id="nova.rey" size={36} ring="hot" to={false} />
          <span className="text-[12px] text-muted">VS</span>
          <Avatar id={p.rival} size={36} to={false} />
          <div className="ml-1 flex-1">
            <div className="flex justify-between text-[12px]"><b className="font-display text-gold">YOU {p.you}%</b><span className="text-muted">@{p.rival} {p.rivalPct}%</span></div>
            <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-panel-hi"><motion.div className="h-full rounded-full bg-gold" initial={{ width: 0 }} whileInView={{ width: `${p.you}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} /></div>
          </div>
        </div>
      ) : 'rank' in p && p.rank ? (
        <>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar id="nova.rey" size={36} ring="hot" to={false} />
            <span className="text-[12px] text-muted">VS</span>
            <AvatarPile ids={p.others ?? []} more={p.more} size={32} />
          </div>
          <div className="mt-3 flex justify-between text-[13px]"><b className="font-display text-gold">YOU · Rank #{p.rank} of {p.of}</b><span className="text-[12px] text-muted">leader {p.leader}</span></div>
          <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-panel-hi"><motion.div className="h-full rounded-full bg-gold" initial={{ width: 0 }} whileInView={{ width: `${p.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} /></div>
        </>
      ) : 'raised' in p ? (
        <>
          <div className="mt-3 flex items-center gap-3">
            <AvatarPile ids={['lena_k', 'marco', 'yuki', 'bea']} more={(p.backers ?? 0) - 4} size={30} />
            <span className="text-[12px] text-muted">{p.backers} backers</span>
          </div>
          <div className="mt-3 flex justify-between text-[13px]"><b className="font-display text-gold">${p.raised} raised</b><span className="text-[12px] text-muted">goal ${p.goal}</span></div>
          <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-panel-hi"><motion.div className="h-full rounded-full bg-gold" initial={{ width: 0 }} whileInView={{ width: `${((p.raised ?? 0) / (p.goal ?? 1)) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} /></div>
        </>
      ) : null}
    </motion.button>
  );
}
