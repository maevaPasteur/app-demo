import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { person } from '../../data';
import J from '../../data/screens/Joker.json';
import { useDemo } from '../../lib/store';
import { Avatar, Button, alpha } from '../../ui';
import { Check, Heart, Lock, Play, Sparkle } from '../../ui/Icon';

export const jk = J;

/* ---------- Season banner ---------- */
export function SeasonBanner({ text, tone = 'hot' }: { text: string; tone?: 'hot' | 'gold' }) {
  const c = tone === 'hot' ? 'var(--hot)' : 'var(--gold)';
  return (
    <div className="flex h-[29px] items-center justify-center gap-2 rounded-[8px] font-display text-[11px] font-bold tracking-[1.4px]"
      style={{ background: alpha(c, 0.12), boxShadow: `inset 0 0 0 1px ${alpha(c, 0.4)}`, color: tone === 'hot' ? 'var(--hot-soft)' : 'var(--gold)' }}>
      <span className="glowpulse h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {text}
    </div>
  );
}

/* ---------- Playing card (Figma PlayCard 548:1708) ---------- */
export type CardState = 'owned' | 'current' | 'next' | 'locked' | 'mythic';
type CardDef = { rank: string; level: string; state: string };

function Face({ rank, state, big }: { rank: string; state: CardState; big?: boolean }) {
  const gold = state === 'current';
  const mythic = state === 'mythic';
  const border = gold ? 'var(--gold)' : mythic ? 'var(--hot)' : state === 'next' ? alpha('var(--gold)', 0.55) : 'var(--line-strong)';
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[12px] [backface-visibility:hidden]"
      style={{
        background: mythic ? 'linear-gradient(160deg,#1c0f1d,#0c0712)' : gold ? 'linear-gradient(160deg,#1c1424,#0d0914)' : 'linear-gradient(160deg,#1a1424,#100b18)',
        boxShadow: `inset 0 0 0 ${gold || mythic ? 2 : 1}px ${border}${gold ? ',0 0 34px -6px rgba(255,182,39,.65)' : mythic ? ',0 0 30px -8px rgba(255,31,107,.7)' : ''}`,
      }}>
      {state === 'locked' && <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-linear-gradient(135deg,transparent 0 6px,rgba(255,255,255,.06) 6px 8px)' }} />}
      {mythic ? (
        <Sparkle size={big ? 30 : 22} fill="currentColor" className="absolute left-2.5 top-2.5 text-white" />
      ) : (
        <span className="absolute left-2.5 top-1.5 font-display font-bold"
          style={{ fontSize: big ? 30 : 22, color: gold ? 'var(--gold-soft)' : state === 'next' ? alpha('var(--gold)', 0.7) : 'var(--muted)' }}>{rank}</span>
      )}
      {(gold || mythic) && (
        <Heart size={big ? 22 : 18} fill="currentColor" className="absolute bottom-2.5 right-2.5" style={{ color: gold ? 'var(--gold)' : 'var(--hot)' }} />
      )}
      {(state === 'owned' || state === 'next' || state === 'locked') && <span className="absolute bottom-2 right-2.5 text-[12px] text-muted-2">◆</span>}
    </div>
  );
}

function Back({ text, state }: { text: string; state: CardState }) {
  const c = state === 'mythic' ? 'var(--hot)' : 'var(--gold)';
  return (
    <div className="absolute inset-0 grid place-items-center rounded-[12px] px-1.5 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
      style={{ background: `radial-gradient(circle at 50% 30%, ${alpha(c, 0.35)}, #120c1c 70%)`, boxShadow: `inset 0 0 0 2px ${alpha(c, 0.7)}` }}>
      <span className="font-display text-[10px] font-bold leading-3" style={{ color: c }}>{text}</span>
    </div>
  );
}

export function PlayCard({ card, w, h, big, flipText, onTap }: { card: CardDef; w: number; h: number; big?: boolean; flipText: string; onTap?: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const state = card.state as CardState;
  return (
    <motion.button onClick={() => { setFlipped((f) => !f); onTap?.(); }} whileTap={{ scale: 0.95 }}
      className="relative block [perspective:700px]" style={{ width: w, height: h }} aria-label={`${card.level} ${card.rank}`}>
      <motion.div className="relative h-full w-full [transform-style:preserve-3d]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
        <Face rank={card.rank} state={state} big={big} />
        <Back text={flipText} state={state} />
      </motion.div>
    </motion.button>
  );
}

/** Éventail de 7 cartes (Figma CardFan 552:7489). */
const SLOTS = [
  { x: 30, y: 66, r: -14 }, { x: 74, y: 52, r: -8 }, { x: 128, y: 6, r: 0 }, { x: 200, y: 48, r: 7 },
  { x: 232, y: 62, r: 12 }, { x: 262, y: 78, r: 16 }, { x: 290, y: 98, r: 20 },
];
export function CardFan({ cards, backs, finished }: { cards: CardDef[]; backs: Record<string, string>; finished?: boolean }) {
  return (
    <div className="relative mx-auto h-[206px] w-[360px]">
      {!finished && <div className="pointer-events-none absolute left-[110px] top-[-10px] h-[180px] w-[140px] rounded-full blur-3xl" style={{ background: alpha('var(--gold)', 0.25) }} />}
      {cards.map((c, i) => {
        const s = finished ? { x: 16 + i * 38, y: 30 + (i < 6 ? 0 : -24), r: i < 6 ? -10 + i * 2 : 6 } : SLOTS[i];
        const isCur = !finished && c.state === 'current';
        const isYou = finished && i === cards.length - 1;
        const w = isCur ? 84 : isYou ? 92 : 64;
        const h = isCur ? 120 : isYou ? 128 : 96;
        const state = finished ? (isYou ? 'mythic' : 'owned') : c.state;
        return (
          <motion.div key={i} className="absolute"
            style={{ left: isYou ? 262 : s.x, top: isYou ? 8 : s.y, zIndex: isCur || isYou ? 10 : i }}
            initial={{ opacity: 0, y: 120, x: 180 - s.x, rotate: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, x: 0, rotate: s.r, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.08 + i * 0.07 }}>
            <div className={isCur || isYou ? 'floaty' : ''}>
              <PlayCard card={{ ...c, state }} w={w} h={h} big={isCur || isYou} flipText={backs[state] ?? ''} />
            </div>
            <span className="mt-1.5 block text-center font-display text-[9px] font-bold tracking-[1px]" style={{ color: isYou ? 'var(--gold)' : 'var(--muted-2)', fontSize: isYou ? 12 : 9 }}>
              {isYou ? jk.finished.you : isCur ? '' : c.level}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------- Checkbox (Figma 517:1597) ---------- */
export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px]"
      style={{ background: checked ? 'var(--grad-gold-cta)' : 'transparent', boxShadow: checked ? undefined : 'inset 0 0 0 1.5px var(--muted-2)' }}>
      <AnimatePresence>{checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}><Check size={16} strokeWidth={3} className="text-on-gold" /></motion.span>}</AnimatePresence>
    </span>
  );
}
export const XpTag = ({ xp }: { xp: number }) => (
  <span className="rounded-full px-2.5 py-1 font-display text-[12px] font-bold text-gold" style={{ background: alpha('var(--gold)', 0.12), boxShadow: `inset 0 0 0 1px ${alpha('var(--gold)', 0.4)}` }}>+{xp}</span>
);

/* ---------- LootRow (Figma 554:1725) ---------- */
const rarityColor: Record<string, string> = { Legendary: 'var(--gold)', Epic: 'var(--hot)', Rare: 'var(--silver)' };
const rarityBg: Record<string, string> = { Legendary: alpha('var(--gold)', 0.1), Epic: alpha('var(--hot)', 0.12), Rare: 'var(--panel)' };
type Loot = { rarity: string; kind: string; name: string; desc: string; icon: string; preview?: { label: string; text: string } };

export function JackMini() {
  return (
    <span className="relative inline-grid h-[30px] w-[22px] place-items-start rounded-[4px] px-1 font-display text-[11px] font-bold text-gold" style={{ boxShadow: 'inset 0 0 0 1.5px var(--gold)', background: '#140e1c' }}>
      J<Heart size={8} fill="currentColor" className="absolute bottom-1 right-1" />
    </span>
  );
}

export function LootRow({ loot, owned, i }: { loot: Loot; owned?: boolean; i: number }) {
  const [shake, setShake] = useState(0);
  const [shine, setShine] = useState(0);
  const notify = useDemo((s) => s.notify);
  const c = rarityColor[loot.rarity] ?? 'var(--silver)';
  const tap = () => {
    if (owned) { setShine((n) => n + 1); notify(`${loot.name} equipped`, 'gold'); }
    else { setShake((n) => n + 1); notify('Reach level 4 to unlock', 'hot'); }
  };
  const icon: ReactNode = loot.icon === 'play' ? <Play size={20} fill="currentColor" /> : loot.icon === 'jack' ? <JackMini /> : <Sparkle size={20} fill="currentColor" />;
  return (
    <motion.button onClick={tap} whileTap={{ scale: 0.985 }}
      initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
      className="relative flex w-full items-start gap-3.5 overflow-hidden rounded-[14px] border border-line py-3.5 pl-5 pr-4 text-left" style={{ background: rarityBg[loot.rarity] }}>
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: c }} />
      <span className="mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-panel-hi text-txt">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[10px] font-bold" style={{ color: loot.rarity === 'Rare' ? 'var(--txt-90)' : c }}>{loot.rarity} · {loot.kind}</span>
        <span className="block font-display text-[15px] font-bold leading-5">{loot.name}</span>
        <span className="mt-0.5 block text-[12px] leading-[17px] text-muted">{loot.desc}</span>
        {loot.preview && (
          <span className="mt-2.5 block rounded-[10px] border border-line bg-bg/60 p-2.5">
            <span className="eyebrow block !text-[9px] text-muted-2">{loot.preview.label}</span>
            <span className="mt-1.5 flex items-center gap-2 text-[12px]">
              <span className="h-5 w-5 shrink-0 rounded-full bg-[#e9e6ef]" /><b className="font-semibold">{jk.fan.handle}</b><JackMini /><span className="truncate text-muted-2">{loot.preview.text}</span>
            </span>
          </span>
        )}
      </span>
      <motion.span key={shake} animate={shake ? { rotate: [0, -14, 12, -8, 6, 0] } : {}} transition={{ duration: 0.45 }} className="mt-1 self-center text-txt-90">
        {owned ? <Check size={20} /> : <Lock size={20} />}
      </motion.span>
      {shine > 0 && <motion.span key={`s${shine}`} className="pointer-events-none absolute inset-y-0 w-1/2" style={{ background: 'linear-gradient(110deg,transparent,rgba(255,255,255,.25),transparent)' }} initial={{ left: '-50%' }} animate={{ left: '120%' }} transition={{ duration: 0.8 }} />}
    </motion.button>
  );
}

/* ---------- InvitationCard (Figma 487:7282) ---------- */
export type Invite = (typeof J.invitations.items)[number];
const accentMap = { hot: 'var(--hot)', gold: 'var(--gold)', cyan: 'var(--cyan)', cool: 'var(--cool)' } as const;
const ringMap = { hot: 'hot', gold: 'gold', cyan: 'cyan', cool: 'cool' } as const;

export function GoldTimer({ label }: { label: string }) {
  return (
    <span className="inline-flex h-[28px] shrink-0 items-center gap-1.5 rounded-full px-3 font-display text-[12px] font-bold text-hot-soft" style={{ background: alpha('var(--hot)', 0.12), boxShadow: `inset 0 0 0 1px ${alpha('var(--hot)', 0.4)}` }}>
      <span className="glowpulse h-1.5 w-1.5 rounded-full bg-hot" />{label}
    </span>
  );
}
export const OutlineTag = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex h-[24px] items-center rounded-full px-2.5 text-[11px] font-semibold text-txt-90" style={{ boxShadow: 'inset 0 0 0 1px var(--line-strong)' }}>{children}</span>
);

export function InvitationCard({ inv, onAccept, onDecline }: { inv: Invite; onAccept: () => void; onDecline: () => void }) {
  const acc = inv.accent as keyof typeof accentMap;
  const c = accentMap[acc];
  const btn = acc === 'hot' ? 'hot' : acc === 'gold' ? 'gold' : acc === 'cyan' ? 'cyan' : 'cool';
  return (
    <div className="rounded-[18px] border border-line p-4" style={{ background: 'linear-gradient(180deg,#221833 0%,#1a1228 100%)' }}>
      <div className="flex items-start gap-3">
        <Avatar id={inv.from} size={40} ring={ringMap[acc]} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold" style={{ color: c, background: alpha(c, 0.14), boxShadow: `inset 0 0 0 1px ${alpha(c, 0.45)}` }}>{inv.type}</span>
            <GoldTimer label={inv.timer} />
          </div>
          <p className="mt-1.5 text-[14px] font-semibold"><span className="text-txt">{person(inv.from)?.handle}</span> <span className="text-txt-90">{inv.verb}</span></p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{inv.tags.map((t) => <OutlineTag key={t}>{t}</OutlineTag>)}</div>
      {inv.with.length > 0 && (
        <div className="mt-3 flex items-center gap-2.5">
          <div className="flex -space-x-2.5">{[inv.from, ...inv.with].map((p, i) => <Avatar key={p} id={p} size={28} ring={(['cool', 'hot', 'cyan'] as const)[i % 3]} />)}</div>
          <span className="text-[12px] text-muted">{jk.invitations.with} {inv.with.map((w) => person(w)?.handle).join(' & ')}</span>
        </div>
      )}
      <p className="mt-3 text-[13px] leading-[19px] text-txt-90">{inv.text}{'price' in inv && inv.price ? <b className="ml-1 font-display text-gold">${inv.price}</b> : null}</p>
      {'unlocks' in inv && inv.unlocks && (
        <div className="mt-3 rounded-[12px] border border-line bg-bg/70 p-3">
          <p className="eyebrow !text-[9px] text-muted-2">{jk.invitations.fundedTitle}</p>
          <ul className="mt-2 space-y-1.5">
            {inv.unlocks.map((u) => (
              <li key={u.label} className="flex items-center justify-between text-[12px] text-txt-90">
                <span className="flex items-center gap-2"><Lock size={13} className="text-muted" />{u.label}</span>
                <b className="font-display text-gold">${u.amount.toLocaleString('en-US')}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button color="ghost" onClick={onDecline}>{jk.invitations.decline}</Button>
        <div className="flex-1"><Button full color={btn} onClick={onAccept}>{inv.cta}</Button></div>
      </div>
    </div>
  );
}

/** Pile d'avatars + compteur (+6). */
export function AvatarPile({ ids, more, size = 30 }: { ids: string[]; more?: number; size?: number }) {
  return (
    <div className="flex items-center -space-x-2">
      {ids.map((id) => <Avatar key={id} id={id} size={size} />)}
      {more ? <span className="grid place-items-center rounded-full bg-panel-hi font-display text-[11px] font-bold ring-2 ring-bg" style={{ width: size, height: size }}>+{more}</span> : null}
    </div>
  );
}
