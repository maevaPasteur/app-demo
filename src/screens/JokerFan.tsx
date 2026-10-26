import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useDemo } from '../lib/store';
import { Button, Counter, Eyebrow, Rail, Reveal, alpha } from '../ui';
import { ChevronRight, Diamond, Sparkle, Trophy } from '../ui/Icon';
import { CardFan, Checkbox, LootRow, SeasonBanner, XpTag, jk } from './parts/JokerParts';

const F = jk.fan;

/** Figma 492:7750 · Joker · Fan (progress) */
export default function JokerFan() {
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  const [xp, setXp] = useState(F.xp);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [flying, setFlying] = useState<{ id: string; xp: number } | null>(null);
  const pct = Math.min(100, (xp / F.xpNext) * 100);
  const done = F.quests.filter((q) => q.done).length;

  const claim = (id: string, gain: number) => {
    setFlying({ id, xp: gain });
    setTimeout(() => {
      setXp((v) => v + gain);
      setClaimed((c) => [...c, id]);
      setFlying(null);
      notify(`+${gain} XP`, 'gold');
    }, 650);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-[70px] left-1/2 h-[420px] w-[430px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: alpha('var(--gold)', 0.08) }} />
      <TopBar />

      <div className="relative px-4 pt-2.5">
        <SeasonBanner text={F.seasonBanner} />
        <div className="mt-4"><CardFan cards={F.cards} backs={F.cardBack} /></div>

        <Reveal className="mt-4 text-center">
          <p className="text-[12px] text-muted">{F.handle}</p>
          <h1 className="mt-1 font-display text-[34px] font-bold leading-[38px] tracking-[0.5px]">{F.title}</h1>
          <p className="mt-1.5 font-display text-[12px] font-bold tracking-[1.2px]">
            <Counter value={xp} format={(n) => Math.round(n).toLocaleString('en-US').replace(',', ' ')} className="text-gold" />
            <span className="text-muted"> / {F.xpNext.toLocaleString('en-US').replace(',', ' ')} XP</span>
          </p>
        </Reveal>

        {/* Barre XP avec graduations */}
        <div id="xpbar" className="relative mt-5">
          <div className="relative h-[12px] overflow-hidden rounded-full bg-panel-hi">
            <motion.div className="h-full rounded-full" style={{ background: 'var(--grad-gold-cta)', boxShadow: '0 0 16px rgba(255,182,39,.5)' }}
              initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} animate={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
            {[25, 50, 75].map((t) => <span key={t} className="absolute top-0 h-full w-px bg-bg/60" style={{ left: `${t}%` }} />)}
          </div>
          <AnimatePresence>
            {flying && (
              <motion.span key={flying.id} className="absolute right-6 font-display text-[16px] font-bold text-gold"
                initial={{ top: 180, opacity: 0, scale: 0.6 }} animate={{ top: -26, opacity: 1, scale: 1.2 }} exit={{ opacity: 0, scale: 1.6 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                +{flying.xp} XP
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-3 text-center text-[14px]"><b className="font-semibold">{Math.max(0, F.xpNext - xp)} XP</b> <span className="text-muted">{F.xpHint}</span></p>

        {/* Streak */}
        <Reveal className="mt-4 flex items-center gap-4 rounded-[14px] border border-line bg-panel px-4 py-3">
          <div className="flex gap-1.5">
            {Array.from({ length: F.streak.target }).map((_, i) => (
              <motion.span key={i} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 500, damping: 18 }}>
                <Diamond size={14} fill={i < F.streak.days ? 'var(--gold)' : 'var(--panel-hi)'} strokeWidth={0} />
              </motion.span>
            ))}
          </div>
          <div>
            <p className="text-[13px] font-semibold">{F.streak.title}</p>
            <p className="text-[12px] text-muted">{F.streak.sub}</p>
          </div>
        </Reveal>
      </div>

      {/* Quests */}
      <section className="mt-7 px-5">
        <div className="flex items-center justify-between">
          <Eyebrow color="var(--gold)">{F.questsTitle}</Eyebrow>
          <Eyebrow>{done} / {F.quests.length} DONE</Eyebrow>
        </div>
        <div className="mt-3 space-y-3">
          {F.quests.map((q, i) => {
            const isClaimed = claimed.includes(q.id);
            const ready = q.claimable && !isClaimed;
            const cur = q.cur ?? 0;
            const max = q.max ?? 1;
            const fmt = (n: number) => (q.money ? `$${n}` : `${n}`);
            return (
              <Reveal key={q.id} delay={i * 0.06}>
                <motion.div layout className="rounded-[16px] border p-4"
                  style={{ borderColor: ready ? 'var(--gold)' : 'var(--line)', background: ready ? 'linear-gradient(180deg,#1c1424,#140e1c)' : 'var(--panel)', boxShadow: ready ? '0 0 30px -14px rgba(255,182,39,.8)' : undefined }}>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={q.done} />
                    <span className="flex-1 font-display text-[15px] font-bold">{q.label}</span>
                    <XpTag xp={q.xp} />
                  </div>
                  {q.done ? (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[12px] text-muted">{isClaimed ? 'Collected' : q.status}</span>
                      {ready ? (
                        <Button size="S" color="gold" className="shine !h-[32px] !rounded-full !px-4" onClick={() => claim(q.id, q.xp)}>Claim +{q.xp} XP</Button>
                      ) : (
                        <span className="font-display text-[12px] font-bold text-gold">+{q.xp} XP collected</span>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 h-[6px] w-[66%] overflow-hidden rounded-full bg-panel-hi">
                        <motion.div className="h-full rounded-full bg-gold" initial={{ width: 0 }} whileInView={{ width: `${(cur / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[12px]">
                        <span><b className="font-semibold">{fmt(cur)}</b> <span className="text-muted">/ {fmt(max)}</span></span>
                        <span className="text-muted">{fmt(max - cur)} to go</span>
                      </div>
                    </>
                  )}
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Vault */}
      <section className="mt-7 px-4">
        <div className="flex items-center justify-between">
          <Eyebrow color="var(--gold)">{F.vaultTitle}</Eyebrow>
          <Eyebrow>{F.vaultCount}</Eyebrow>
        </div>
        <div className="mt-3 space-y-3">{F.vault.map((l, i) => <LootRow key={l.name} loot={l} i={i} />)}</div>
      </section>

      {/* Ladder */}
      <section className="mt-7">
        <div className="flex items-center justify-between px-4">
          <Eyebrow>{F.ladderTitle}</Eyebrow>
          <Eyebrow className="flex items-center gap-1">{F.ladderHint}<ChevronRight size={12} /></Eyebrow>
        </div>
        <Rail className="mt-3" gap={12}>
          {F.ladder.map((t) => (
            <motion.button key={t.tag} whileTap={{ scale: 0.97 }} onClick={() => notify(`${t.title} unlocks at ${t.tag.split(' · ')[0]}`, t.joker ? 'hot' : 'gold')}
              className="flex w-[180px] shrink-0 snap-start flex-col justify-start rounded-[16px] border-[1.5px] border-dashed p-3.5 text-left"
              style={{ borderColor: t.joker ? alpha('var(--hot)', 0.6) : 'var(--line-strong)', background: t.joker ? alpha('var(--hot)', 0.08) : 'var(--panel)' }}>
              <span className="eyebrow block !text-[10px]" style={{ color: t.joker ? 'var(--hot-soft)' : 'var(--muted)' }}>{t.tag}</span>
              <span className="mt-1.5 flex items-center gap-1.5 font-display text-[15px] font-bold">{t.joker && <Sparkle size={14} fill="currentColor" className="text-hot" />}{t.title}</span>
              <span className="mt-1 block text-[12px] leading-[17px] text-muted">{t.text}</span>
            </motion.button>
          ))}
        </Rail>
      </section>

      <div className="mt-6 space-y-3 px-4">
        <Button full size="L" color="gold" onClick={() => nav('/')}>{F.cta}</Button>
        <div className="flex gap-2">
          <Link to="/joker/invitations" className="flex h-11 flex-1 items-center justify-center gap-1 rounded-[12px] border border-line bg-panel font-display text-[13px] font-bold">{F.invitationsLink}<ChevronRight size={14} /></Link>
          <Link to="/joker/finished" className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] border border-line bg-panel font-display text-[13px] font-bold"><Trophy size={14} className="text-gold" />{F.recapLink}</Link>
        </div>
      </div>
    </div>
  );
}
