import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { fan, identity } from '../data';
import I from '../data/screens/Identity.json';
import { useDemo } from '../lib/store';
import { Button, NavHeader, alpha } from '../ui';
import { Camera, Check, Clock, IdCard, Lock, ShieldCheck } from '../ui/Icon';

type Phase = 'intro' | 'id' | 'selfie' | 'payout' | 'processing' | 'done';
const needIcon: Record<string, ReactNode> = { id: <IdCard size={20} />, camera: <Camera size={20} />, clock: <Clock size={20} /> };
const ease = [0.22, 1, 0.36, 1] as const;

function Steps({ n }: { n: number }) {
  return (
    <div className="px-[18px] pt-2">
      <div className="flex gap-1.5">{[1, 2, 3].map((i) => <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-panel-hi"><motion.div className="h-full bg-cyan" initial={false} animate={{ width: i <= n ? '100%' : '0%' }} transition={{ duration: 0.5, ease }} /></div>)}</div>
      <p className="eyebrow mt-2 text-muted">{I.stepOf.replace('{n}', String(n))}</p>
    </div>
  );
}

/** Étape 1 : faux viseur caméra, carte ID qui glisse, ligne de scan, flash à la capture. */
function ScanId({ onNext }: { onNext: () => void }) {
  const s = identity.stepsDetail[0];
  const [st, setSt] = useState<'aim' | 'shoot' | 'ok'>('aim');
  const shoot = () => { setSt('shoot'); setTimeout(() => setSt('ok'), 1100); };
  return (
    <div className="px-[18px]">
      <h2 className="mt-5 font-display text-[22px] font-bold">{s.title}</h2>
      <p className="mt-1 text-[13px] text-muted">{s.sub}</p>
      <div className="relative mt-5 h-[300px] overflow-hidden rounded-[22px] bg-[#05030a]" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
        <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 30% 20%, #2a1d40, transparent 60%), radial-gradient(circle at 80% 90%, #0f2a2a, transparent 50%)' }} />
        <div className="absolute inset-0 grid place-items-center">
        <motion.div initial={{ x: 60, rotate: 8, opacity: 0 }} animate={{ x: 0, rotate: st === 'aim' ? [-1.2, 1.2, -1.2] : 0, opacity: 1 }} transition={{ x: { duration: 0.7, ease }, rotate: { repeat: st === 'aim' ? Infinity : 0, duration: 3 } }}
          className="h-[170px] w-[270px] rounded-[14px] p-3.5" style={{ background: 'linear-gradient(135deg,#e9e6ef,#c9c3d6)', color: '#1b1426' }}>
          <div className="flex h-full gap-3">
            <img src={fan('me')?.avatar} alt="" className="h-[96px] w-[76px] rounded-[8px] object-cover" />
            <div className="flex-1 text-[9px] font-semibold leading-[13px]">
              <p className="font-display text-[11px] font-bold tracking-[1.5px]">{I.idMeta[0]}</p>
              <p className="mt-2 font-display text-[13px] font-bold">{I.idName}</p>
              {I.idMeta.slice(1).map((m) => <p key={m} className="mt-1 opacity-70">{m}</p>)}
              <div className="mt-2 h-1.5 w-3/4 rounded bg-black/15" /><div className="mt-1 h-1.5 w-1/2 rounded bg-black/15" />
            </div>
          </div>
        </motion.div>
        </div>
        {['left-6 top-6 border-l-[3px] border-t-[3px]', 'right-6 top-6 border-r-[3px] border-t-[3px]', 'bottom-6 left-6 border-b-[3px] border-l-[3px]', 'bottom-6 right-6 border-b-[3px] border-r-[3px]'].map((p) => (
          <motion.span key={p} className={`absolute h-7 w-7 rounded-[6px] ${p}`} style={{ borderColor: st === 'ok' ? 'var(--green)' : 'var(--cyan)' }} animate={{ scale: st === 'aim' ? [1, 1.08, 1] : 1 }} transition={{ repeat: Infinity, duration: 1.6 }} />
        ))}
        {st !== 'ok' && <motion.div className="absolute inset-x-8 h-0.5 bg-cyan shadow-[0_0_16px_4px_rgba(37,230,196,.6)]" animate={{ top: ['14%', '86%', '14%'] }} transition={{ repeat: Infinity, duration: st === 'shoot' ? 0.9 : 2.4, ease: 'easeInOut' }} />}
        <AnimatePresence>{st === 'shoot' && <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.5, delay: 0.5 }} />}</AnimatePresence>
        <div className="absolute inset-x-0 bottom-3 text-center text-[12px] font-semibold">
          {st === 'ok' ? <span className="inline-flex items-center gap-1.5 rounded-full bg-green px-3 py-1 text-on-green"><Check size={14} strokeWidth={3} />{s.done}</span> : <span className="rounded-full bg-black/60 px-3 py-1 text-white">{st === 'shoot' ? I.capturing : I.align}</span>}
        </div>
      </div>
      <div className="mt-5 flex gap-2.5">
        {st === 'ok' && <Button color="ghost" onClick={() => setSt('aim')}>{I.retake}</Button>}
        <div className="flex-1"><Button full size="L" color="cyan" onClick={st === 'ok' ? onNext : shoot} disabled={st === 'shoot'} icon={st === 'ok' ? undefined : <Camera size={18} />}>{st === 'ok' ? I.next : s.cta}</Button></div>
      </div>
    </div>
  );
}

/** Étape 2 : selfie dans un cercle, anneau de progression qui se remplit. */
function Selfie({ onNext }: { onNext: () => void }) {
  const s = identity.stepsDetail[1];
  const [p, setP] = useState(0);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run || p >= 100) return;
    const t = setTimeout(() => setP((x) => Math.min(100, x + 4)), 55);
    return () => clearTimeout(t);
  }, [run, p]);
  const done = p >= 100;
  const R = 112, L = 2 * Math.PI * R;
  return (
    <div className="px-[18px]">
      <h2 className="mt-5 font-display text-[22px] font-bold">{s.title}</h2>
      <p className="mt-1 text-[13px] text-muted">{s.sub}</p>
      <div className="relative mx-auto mt-6 grid h-[250px] w-[250px] place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 250 250">
          <circle cx="125" cy="125" r={R} fill="none" stroke="var(--panel-hi)" strokeWidth="6" />
          <circle cx="125" cy="125" r={R} fill="none" stroke={done ? 'var(--green)' : 'var(--cyan)'} strokeWidth="6" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p / 100)} style={{ transition: 'stroke-dashoffset .1s linear, stroke .3s' }} />
        </svg>
        <motion.div className="h-[206px] w-[206px] overflow-hidden rounded-full bg-[#05030a]" animate={run && !done ? { rotate: [0, -6, 6, 0] } : { rotate: 0 }} transition={run && !done ? { repeat: Infinity, duration: 2.2 } : { duration: 0.3 }}>
          <img src={fan('me')?.avatar} alt="" className="h-full w-full object-cover" style={{ filter: run ? 'none' : 'brightness(.5) blur(2px)' }} />
        </motion.div>
        <AnimatePresence>{done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }} className="absolute bottom-3 grid h-12 w-12 place-items-center rounded-full bg-green text-on-green ring-4 ring-bg"><Check size={24} strokeWidth={3} /></motion.span>}</AnimatePresence>
      </div>
      <p className="mt-4 text-center text-[13px] font-semibold" style={{ color: done ? 'var(--green)' : 'var(--txt)' }}>{done ? s.done : run ? I.selfieTurn : I.selfieAlign}</p>
      <div className="mt-5"><Button full size="L" color="cyan" onClick={done ? onNext : () => setRun(true)} disabled={run && !done} icon={done ? undefined : <Camera size={18} />}>{done ? I.next : s.cta}</Button></div>
    </div>
  );
}

/** Étape 3 : coordonnées de paiement. */
function Payout({ onNext }: { onNext: () => void }) {
  const s = identity.stepsDetail[2];
  const [vals, setVals] = useState((s.fields ?? []).map((f) => f.value));
  return (
    <div className="px-[18px]">
      <h2 className="mt-5 font-display text-[22px] font-bold">{s.title}</h2>
      <p className="mt-1 text-[13px] text-muted">{s.sub}</p>
      <div className="mt-5 space-y-3">
        {(s.fields ?? []).map((f, i) => (
          <motion.label key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="block">
            <span className="mb-1.5 block text-[12px] text-muted">{f.label}</span>
            <input value={vals[i]} onChange={(e) => setVals(vals.map((v, j) => (j === i ? e.target.value : v)))} className="h-[48px] w-full rounded-[14px] border border-line-strong bg-panel px-3.5 text-[15px] outline-none focus:shadow-[0_0_0_2px_rgba(37,230,196,.35)]" />
          </motion.label>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted"><Lock size={13} />{identity.privacy}</p>
      <div className="mt-6"><Button full size="L" color="cyan" onClick={onNext}>{s.cta}</Button></div>
    </div>
  );
}

function Processing({ onNext }: { onNext: () => void }) {
  useEffect(() => { const t = setTimeout(onNext, 1900); return () => clearTimeout(t); }, [onNext]);
  return (
    <div className="flex min-h-[460px] flex-col items-center justify-center px-8 text-center">
      <div className="relative h-24 w-24">
        {[0, 1, 2].map((i) => <motion.span key={i} className="absolute inset-0 rounded-full border-2 border-cyan" initial={{ scale: 0.5, opacity: 0.8 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.6 }} />)}
        <span className="absolute inset-0 grid place-items-center rounded-full text-cyan" style={{ background: alpha('var(--cyan)', 0.14) }}><ShieldCheck size={38} /></span>
      </div>
      <p className="mt-8 font-display text-[18px] font-bold">{identity.processing}</p>
      <p className="mt-1.5 text-[13px] text-muted">{I.footer}</p>
    </div>
  );
}

function Done({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center px-8 text-center">
      <div className="relative">
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <motion.span key={i} className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full" style={{ background: i % 2 ? 'var(--cyan)' : 'var(--green)' }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(a) * 120, y: Math.sin(a) * 120, opacity: 0 }} transition={{ duration: 1.1, ease, delay: 0.15 }} />;
        })}
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 14 }} className="grid h-[96px] w-[96px] place-items-center rounded-[26px] text-on-green" style={{ background: 'linear-gradient(180deg,#8affce,#35d07f)', boxShadow: '0 0 60px rgba(53,208,127,.55)' }}>
          <ShieldCheck size={48} />
        </motion.div>
      </div>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-7 font-display text-[26px] font-bold">{I.doneTitle}</motion.h2>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-2 text-[14px] leading-[20px] text-muted">{I.doneSub}</motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-7 w-full"><Button full size="L" color="green" onClick={onDone}>{I.doneCta}</Button></motion.div>
    </div>
  );
}

/** Intro fidèle au Figma 154:1016. */
function Intro({ onStart, onLater }: { onStart: () => void; onLater: () => void }) {
  const status = useDemo((s) => s.verified);
  const pillC = status === 'verified' ? 'var(--green)' : status === 'pending' ? 'var(--gold)' : 'var(--hot)';
  return (
    <div>
      <div className="relative px-[18px] pt-6 text-center">
        <div className="pointer-events-none absolute left-1/2 top-2 h-[180px] w-[240px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: alpha('var(--cyan)', 0.2) }} />
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 16 }} className="floaty relative mx-auto grid h-[76px] w-[76px] place-items-center rounded-[20px] text-on-cyan" style={{ background: 'var(--grad-cyan)', boxShadow: '0 0 50px rgba(37,230,196,.45)' }}>
          <ShieldCheck size={38} />
        </motion.div>
        <h1 className="relative mt-5 font-display text-[22px] font-bold">{I.title}</h1>
        <p className="relative mx-auto mt-2 max-w-[330px] text-[14px] leading-[20px] text-muted">{I.sub}</p>
        <span className="relative mt-3 inline-flex h-[24px] items-center rounded-full px-3 font-display text-[11px] font-bold" style={{ background: pillC, color: status === 'unverified' ? '#fff' : 'var(--on-gold)' }}>{I.status[status]}</span>
      </div>

      <p className="eyebrow mb-2.5 mt-6 px-[18px] text-muted">{I.need}</p>
      <div className="mx-[18px] divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-panel">
        {I.needRows.map((r, i) => (
          <motion.div key={r.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="flex items-center gap-3 px-3.5 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-[11px] text-on-cyan" style={{ background: 'var(--grad-cyan)' }}>{needIcon[r.icon]}</span>
            <span><span className="block text-[15px] font-semibold">{r.title}</span><span className="block text-[12px] text-muted">{r.text}</span></span>
          </motion.div>
        ))}
      </div>

      <p className="eyebrow mb-3 mt-6 px-[18px] text-muted">{I.how}</p>
      <ol className="px-[18px]">
        {I.howRows.map((r, i) => (
          <li key={r.title} className="relative flex gap-3.5 pb-4">
            {i < I.howRows.length - 1 && <span className="absolute bottom-0 left-[15px] top-[36px] w-0.5" style={{ background: 'var(--txt)' }} />}
            <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full font-display text-[13px] font-bold text-cyan" style={{ background: alpha('var(--cyan)', 0.1), boxShadow: `inset 0 0 0 1.5px ${alpha('var(--cyan)', 0.5)}` }}>{i + 1}</span>
            <span><span className="block text-[15px] font-semibold">{r.title}</span><span className="mt-0.5 block text-[12px] leading-[17px] text-muted">{r.text}</span></span>
          </li>
        ))}
      </ol>

      <p className="eyebrow mb-2.5 mt-3 px-[18px] text-muted">{I.why}</p>
      <div className="mx-[18px] divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-panel">
        {I.whyRows.map((r) => (
          <div key={r} className="flex items-center gap-3 px-3.5 py-3">
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-green text-on-green"><Check size={14} strokeWidth={3} /></span>
            <span className="text-[14px]">{r}</span>
          </div>
        ))}
      </div>

      <div className="mx-[18px] mt-5 flex gap-3 rounded-[16px] border border-line p-3.5" style={{ background: 'var(--ink-700)' }}>
        <Lock size={18} className="mt-0.5 shrink-0 text-muted" />
        <p className="text-[12px] leading-[17px] text-muted">{identity.privacy} Never shown on your profile.</p>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 border-t border-line px-[18px] pb-[max(14px,env(safe-area-inset-bottom))] pt-4 text-center" style={{ background: 'rgba(8,5,16,.94)' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onStart} className="shine relative mx-auto inline-flex h-[46px] items-center gap-2 overflow-hidden rounded-[14px] px-5 font-display text-[15px] font-bold text-white" style={{ background: 'linear-gradient(180deg,#9a82ff,#7b5cff)' }}>
          <ShieldCheck size={18} />{I.start}
        </motion.button>
        <button onClick={onLater} className="mt-2 block w-full text-[13px] font-semibold text-muted">{I.later}</button>
        <p className="mt-2 text-[11px] text-muted-2">{I.footer}</p>
      </div>
    </div>
  );
}

/** Flux de vérification réutilisable (onboarding créateur). */
export function IdentityFlow({ onDone, embedded, onLater }: { onDone: () => void; embedded?: boolean; onLater?: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const setVerified = useDemo((s) => s.setVerified);
  const go = (p: Phase) => {
    setPhase(p);
    document.getElementById('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const n = phase === 'id' ? 1 : phase === 'selfie' ? 2 : phase === 'payout' ? 3 : 0;
  return (
    <div className={embedded ? '' : 'pb-4'}>
      {n > 0 && <Steps n={n} />}
      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease }}>
          {phase === 'intro' && <Intro onStart={() => go('id')} onLater={onLater ?? onDone} />}
          {phase === 'id' && <ScanId onNext={() => go('selfie')} />}
          {phase === 'selfie' && <Selfie onNext={() => go('payout')} />}
          {phase === 'payout' && <Payout onNext={() => { setVerified('pending'); go('processing'); }} />}
          {phase === 'processing' && <Processing onNext={() => { setVerified('verified'); go('done'); }} />}
          {phase === 'done' && <Done onDone={onDone} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Figma 154:1016 · Identity verification */
export default function Identity() {
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  return (
    <div>
      <NavHeader title={I.navTitle} />
      <IdentityFlow
        onDone={() => { notify(I.toast, 'green'); nav('/settings/profile/verified', { replace: true }); }}
        onLater={() => nav(-1)}
      />
    </div>
  );
}
