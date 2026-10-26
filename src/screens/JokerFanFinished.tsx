import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Button, Eyebrow, Reveal, Timer, alpha } from '../ui';
import { CardFan, LootRow, SeasonBanner, jk } from './parts/JokerParts';

const D = jk.finished;

/** Figma 583:9148 · Joker · Fan (finished) */
export default function JokerFanFinished() {
  const nav = useNavigate();
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-[70px] right-[-60px] h-[420px] w-[380px] rounded-full blur-3xl" style={{ background: alpha('var(--hot)', 0.1) }} />
      <TopBar />
      <div className="relative px-4 pt-2.5">
        <SeasonBanner text={D.banner} tone="gold" />
        <div className="mt-4"><CardFan cards={jk.fan.cards} backs={jk.fan.cardBack} finished /></div>
      </div>

      <div className="relative text-center">
        <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 18 }}
          className="mt-6 font-display text-[28px] font-bold leading-8">{D.title}</motion.h1>
        <Reveal delay={0.7}><p className="mt-3 text-[14px] text-txt-90">{D.sub}</p></Reveal>
        <Reveal delay={0.8} className="mt-6 flex flex-col items-center gap-2.5">
          <p className="text-[14px] font-semibold">{D.newSeason}</p>
          <Timer label={D.timer} />
        </Reveal>
        <Confetti />
      </div>

      <section className="mt-8 px-4">
        <Eyebrow color="var(--gold)">{D.rewardsTitle}</Eyebrow>
        <div className="mt-3 space-y-3">{jk.fan.vault.map((l, i) => <LootRow key={l.name} loot={l} owned i={i} />)}</div>
      </section>
      <div className="mt-6 px-4"><Button full size="L" color="gold" onClick={() => nav('/joker')}>{D.cta}</Button></div>
    </div>
  );
}

/** Petite pluie de particules or et rose derrière le titre. */
function Confetti() {
  const bits = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[160px]">
      {bits.map((_, i) => {
        const x = (i * 53) % 360 + 16;
        const c = i % 3 === 0 ? 'var(--hot)' : 'var(--gold)';
        return (
          <motion.span key={i} className="absolute h-2 w-1 rounded-sm" style={{ left: x, background: c }}
            initial={{ y: -40, opacity: 0, rotate: 0 }}
            animate={{ y: [-40, 140], opacity: [0, 1, 0], rotate: 360 }}
            transition={{ duration: 2.2 + (i % 5) * 0.3, delay: 0.5 + (i % 7) * 0.15, repeat: Infinity, repeatDelay: 1.5 }} />
        );
      })}
    </div>
  );
}
