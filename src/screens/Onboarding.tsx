import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { app, creators, onboarding as ob, risers, subWorldName, videos, worlds, type Tone } from '../data';
import { Burst } from '../components/Burst';
import { useDemo, type Role } from '../lib/store';
import { Avatar, Button, Chip, alpha, toneColor } from '../ui';
import {
  ArrowLeft, Check, Globe, LockOpen, Mail, Music, Shield, Sparkles, Trophy, Zap,
} from '../ui/Icon';
import { Dumbbell, Footprints, Heart, Sun, WandSparkles } from 'lucide-react';
import { IdentityStep } from './parts/OnboardingIdentity';

type Step = 'splash' | 'slides' | 'signup' | 'email' | 'role' | 'worlds' | 'follow' | 'profile' | 'identity' | 'done';
const FAN: Step[] = ['signup', 'email', 'role', 'worlds', 'follow', 'done'];
const CREATOR: Step[] = ['signup', 'email', 'role', 'worlds', 'profile', 'identity', 'done'];

const worldIcon: Record<string, typeof Music> = { content: Sun, art: WandSparkles, music: Footprints, dance: Sparkles, action: Dumbbell, gaming: Heart };

/** Parcours d'inscription : premier écran de la démo. Pas de maquette Figma, construit avec le DS. */
export default function Onboarding() {
  const nav = useNavigate();
  const finish = useDemo((s) => s.finishOnboarding);
  const setVerified = useDemo((s) => s.setVerified);
  const [step, setStep] = useState<Step>('splash');
  const [dir, setDir] = useState(1);
  const [role, setRole] = useState<Role>('fan');
  const [picked, setPicked] = useState<string[]>([]);
  const [sub, setSub] = useState<string | null>(null);
  const [follows, setFollows] = useState<string[]>([]);
  const [price, setPrice] = useState(ob.creatorProfile.prices[1]);
  const [verifiedNow, setVerifiedNow] = useState(false);

  const flow = role === 'creator' ? CREATOR : FAN;
  const idx = flow.indexOf(step);
  const go = (s: Step, d = 1) => { setDir(d); setStep(s); document.getElementById('app-scroll')?.scrollTo(0, 0); };
  const next = () => go(flow[Math.min(idx + 1, flow.length - 1)]);
  const back = () => (idx > 0 ? go(flow[idx - 1], -1) : go(step === 'signup' ? 'slides' : 'splash', -1));

  const done = () => {
    finish(role, picked, follows);
    if (role === 'creator') {
      useDemo.setState({ verified: verifiedNow ? 'verified' : 'unverified' });
      if (verifiedNow) setVerified('verified');
    }
    nav(role === 'creator' ? '/me/creator' : '/', { replace: true });
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden sm:min-h-[804px]">
      {step !== 'splash' && step !== 'slides' && step !== 'done' && (
        <div className="sticky top-0 z-20 flex items-center gap-3 bg-bg/80 px-[18px] pb-3 pt-3 backdrop-blur-xl">
          <motion.button whileTap={{ scale: 0.9 }} onClick={back} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel" aria-label="Back"><ArrowLeft size={18} /></motion.button>
          <div className="flex flex-1 gap-1.5">
            {flow.slice(0, -1).map((s, i) => (
              <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-hi">
                <motion.div className="h-full rounded-full" style={{ background: 'var(--grad-gold-cta)' }} initial={false} animate={{ width: i <= idx ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
              </div>
            ))}
          </div>
        </div>
      )}
      <AnimatePresence mode="popLayout" custom={dir} initial={false}>
        <motion.div key={step} custom={dir}
          variants={{ enter: (d: number) => ({ x: d * 60, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -60, opacity: 0 }) }}
          initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          {step === 'splash' && <Splash onStart={() => go('slides')} onLogin={() => { setRole('fan'); go('done'); }} />}
          {step === 'slides' && <Slides onDone={() => go('signup')} />}
          {step === 'signup' && <Signup onEmail={() => go('email')} onSocial={() => go('role')} />}
          {step === 'email' && <EmailForm onNext={next} />}
          {step === 'role' && <RolePick role={role} setRole={setRole} onNext={next} />}
          {step === 'worlds' && <WorldsPick role={role} picked={picked} setPicked={setPicked} sub={sub} setSub={setSub} onNext={next} />}
          {step === 'follow' && <FollowPick picked={picked} follows={follows} setFollows={setFollows} onNext={next} />}
          {step === 'profile' && <CreatorProfile price={price} setPrice={setPrice} world={picked[0]} sub={sub} onNext={next} />}
          {step === 'identity' && <IdentityStep onDone={() => { setVerifiedNow(true); next(); }} onLater={next} />}
          {step === 'done' && <Done role={role} onGo={done} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Écrans ---------- */
const H = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="px-[22px] pt-4">
    <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-display text-[30px] font-bold leading-[34px]">{title}</motion.h1>
    {sub && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="mt-2 text-[14px] text-muted">{sub}</motion.p>}
  </div>
);
const Footer = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 z-10 mt-6 bg-gradient-to-t from-bg via-bg to-transparent px-[22px] pb-[max(22px,env(safe-area-inset-bottom))] pt-6">{children}</div>
);

function PosterWall() {
  const cols = useMemo(() => {
    const ids = videos.map((v) => v.poster);
    return [0, 1, 2].map((c) => ids.filter((_, i) => i % 3 === c).slice(0, 8));
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60" style={{ maskImage: 'linear-gradient(180deg,#000 0%,#000 40%,transparent 78%)', WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 40%,transparent 78%)' }}>
      <div className="absolute left-[-30px] top-[-80px] flex w-[480px] origin-top rotate-[-8deg] gap-3">
        {cols.map((col, c) => (
          <motion.div key={c} className="flex w-[152px] shrink-0 flex-col gap-3" initial={{ y: c % 2 ? -360 : 0 }} animate={{ y: c % 2 ? 0 : -360 }} transition={{ duration: 26, repeat: Infinity, repeatType: 'mirror', ease: 'linear' }}>
            {[...col, ...col].map((p, i) => <img key={i} src={p} alt="" className="h-[220px] w-[152px] rounded-[18px] object-cover" />)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Splash({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  const word = 'DaresOnly';
  return (
    <div className="relative flex min-h-[100dvh] flex-col justify-end sm:min-h-[804px]">
      <PosterWall />
      <motion.div className="absolute left-1/2 top-[30%] h-[340px] w-[340px] -translate-x-1/2 rounded-full blur-[90px]" style={{ background: 'radial-gradient(circle, rgba(255,182,39,.55), rgba(123,92,255,.35) 55%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 5, repeat: Infinity }} />
      <div className="relative z-10 px-[22px] pb-[max(26px,env(safe-area-inset-bottom))]">
        <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
          className="mb-5 grid h-16 w-16 place-items-center rounded-[20px] shadow-[0_12px_40px_-8px_rgba(255,182,39,.8)]" style={{ background: 'var(--grad-gold-cta)' }}>
          <Sparkles size={30} className="text-on-gold" fill="currentColor" />
        </motion.div>
        <h1 className="flex font-display text-[44px] font-bold leading-[46px] tracking-[1px]">
          {word.split('').map((ch, i) => (
            <motion.span key={i} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.04, type: 'spring', stiffness: 400, damping: 22 }} className={i < 5 ? 'text-gold' : 'text-txt'}>{ch}</motion.span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-3 text-[18px] leading-6 text-txt-90">{ob.splash.tagline}</motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-4 flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[12px] font-bold text-hot-soft" style={{ background: alpha('var(--hot)', 0.14) }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hot" />{app.season.label} IS LIVE
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[12px] font-bold text-cyan" style={{ background: alpha('var(--cyan)', 0.12) }}>{(creators.length * 1000 + 412).toLocaleString('en-US')} creators</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }} className="mt-7 space-y-3">
          <div className="shine relative overflow-hidden rounded-[14px]"><Button full size="L" onClick={onStart}>{ob.splash.cta}</Button></div>
          <button onClick={onLogin} className="w-full py-2 text-center text-[14px] font-semibold text-muted">{ob.splash.login}</button>
        </motion.div>
      </div>
    </div>
  );
}

const slideIcon = { zap: Zap, 'lock-open': LockOpen, trophy: Trophy } as const;
function Slides({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = ob.slides[i];
  const I = slideIcon[s.icon as keyof typeof slideIcon] ?? Zap;
  const c = `var(--${s.accent})`;
  useEffect(() => {
    const t = setTimeout(() => (i < ob.slides.length - 1 ? setI(i + 1) : undefined), 3800);
    return () => clearTimeout(t);
  }, [i]);
  return (
    <div className="flex min-h-[100dvh] flex-col sm:min-h-[804px]">
      <div className="flex justify-end px-[22px] pt-4"><button onClick={onDone} className="text-[14px] font-semibold text-muted">Skip</button></div>
      <motion.div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center" drag="x" dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => { if (info.offset.x < -60 && i < ob.slides.length - 1) setI(i + 1); if (info.offset.x > 60 && i > 0) setI(i - 1); }}>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="flex flex-col items-center">
            <div className="relative mb-10 grid h-[180px] w-[180px] place-items-center">
              <motion.div className="absolute inset-0 rounded-full blur-[50px]" style={{ background: c, opacity: 0.35 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} />
              <motion.div className="absolute inset-4 rounded-[44px] border" style={{ borderColor: alpha(c, 0.4) }} animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} />
              <div className="floaty relative grid h-[104px] w-[104px] place-items-center rounded-[30px]" style={{ background: alpha(c, 0.16), boxShadow: `inset 0 0 0 1px ${alpha(c, 0.5)}` }}>
                <I size={48} style={{ color: c }} />
              </div>
            </div>
            <h2 className="font-display text-[28px] font-bold leading-8">{s.title}</h2>
            <p className="mt-3 max-w-[300px] text-[15px] leading-[22px] text-muted">{s.text}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div className="flex justify-center gap-2 pb-6">
        {ob.slides.map((_, k) => <motion.button key={k} onClick={() => setI(k)} className="h-2 rounded-full" animate={{ width: k === i ? 26 : 8, background: k === i ? 'var(--gold)' : 'var(--panel-hi)' }} />)}
      </div>
      <Footer><Button full size="L" onClick={() => (i < ob.slides.length - 1 ? setI(i + 1) : onDone())}>{i < ob.slides.length - 1 ? 'Next' : ob.splash.cta}</Button></Footer>
    </div>
  );
}

function Signup({ onEmail, onSocial }: { onEmail: () => void; onSocial: () => void }) {
  const t = ob.signup;
  const [busy, setBusy] = useState<string | null>(null);
  const social = (k: string) => { setBusy(k); setTimeout(onSocial, 700); };
  return (
    <div className="flex min-h-[calc(100dvh-60px)] flex-col sm:min-h-[744px]">
      <H title={t.title} sub={t.sub} />
      <div className="mt-8 space-y-3 px-[22px]">
        {[
          { k: 'apple', label: t.apple, icon: <AppleLogo />, cls: 'bg-white text-black' },
          { k: 'google', label: t.google, icon: <GoogleLogo />, cls: 'border border-line-strong bg-panel text-txt' },
        ].map((b, i) => (
          <motion.button key={b.k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} whileTap={{ scale: 0.97 }} onClick={() => social(b.k)}
            className={`flex h-[54px] w-full items-center justify-center gap-3 rounded-[16px] font-display text-[15px] font-bold ${b.cls}`}>
            {busy === b.k ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <>{b.icon}{b.label}</>}
          </motion.button>
        ))}
        <div className="flex items-center gap-3 py-2 text-[12px] text-muted-2"><span className="h-px flex-1 bg-line" />{t.or}<span className="h-px flex-1 bg-line" /></div>
        <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} whileTap={{ scale: 0.97 }} onClick={onEmail}
          className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[16px] border border-line-strong bg-ink font-display text-[15px] font-bold"><Mail size={18} />{t.email}</motion.button>
      </div>
      <p className="mt-auto px-[30px] pb-8 pt-10 text-center text-[11px] leading-4 text-muted-2">{t.terms}</p>
    </div>
  );
}

function TypedField({ label, value, delay, secure }: { label: string; value: string; delay: number; secure?: boolean }) {
  const [n, setN] = useState(0);
  const [v, setV] = useState('');
  useEffect(() => {
    let i = 0;
    const start = setTimeout(() => {
      const t = setInterval(() => { i += 1; setN(i); if (i >= value.length) clearInterval(t); }, 34);
    }, delay);
    return () => clearTimeout(start);
  }, [value, delay]);
  useEffect(() => setV(value.slice(0, n)), [n, value]);
  const focused = n > 0 && n < value.length;
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[12px] font-semibold text-muted">{label}</span>
      <span className="flex h-[52px] items-center rounded-[14px] border bg-ink px-4 transition-colors" style={{ borderColor: focused ? 'var(--gold)' : 'var(--line)' }}>
        <input value={v} onChange={(e) => { setV(e.target.value); setN(value.length); }} type={secure ? 'password' : 'text'} className="flex-1 bg-transparent text-[15px] outline-none" />
        {n >= value.length && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-5 w-5 place-items-center rounded-full bg-green text-on-green"><Check size={12} strokeWidth={3} /></motion.span>}
      </span>
    </label>
  );
}

function EmailForm({ onNext }: { onNext: () => void }) {
  const t = ob.signup;
  return (
    <div className="flex min-h-[calc(100dvh-60px)] flex-col sm:min-h-[744px]">
      <H title={t.title} sub={t.sub} />
      <div className="mt-6 space-y-4 px-[22px]">
        <TypedField label={t.emailLabel} value={t.emailValue} delay={250} />
        <TypedField label={t.handleLabel} value={t.handleValue} delay={1100} />
        <TypedField label={t.passwordLabel} value="dares-demo-2026" delay={1500} secure />
        <TypedField label={t.dobLabel} value={t.dobValue} delay={2200} />
      </div>
      <p className="mt-4 flex items-center gap-2 px-[22px] text-[12px] text-muted"><Shield size={14} className="text-green" />{t.terms}</p>
      <div className="mt-auto"><Footer><Button full size="L" onClick={onNext}>{t.cta}</Button></Footer></div>
    </div>
  );
}

function RolePick({ role, setRole, onNext }: { role: Role; setRole: (r: Role) => void; onNext: () => void }) {
  const t = ob.role;
  return (
    <div className="flex min-h-[calc(100dvh-60px)] flex-col sm:min-h-[744px]">
      <H title={t.title} sub={t.sub} />
      <div className="mt-6 space-y-3 px-[22px]">
        {t.options.map((o, i) => {
          const on = role === o.id;
          const c = `var(--${o.accent})`;
          return (
            <motion.button key={o.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} whileTap={{ scale: 0.98 }} onClick={() => setRole(o.id as Role)}
              className="relative w-full overflow-hidden rounded-[20px] border p-4 text-left transition-colors"
              style={{ borderColor: on ? c : 'var(--line)', background: on ? `linear-gradient(160deg, ${alpha(c, 0.18)}, var(--panel) 60%)` : 'var(--panel)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-[22px] font-bold">{o.title}</p>
                  <p className="mt-1 text-[13px] text-muted">{o.text}</p>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-full border-2 transition-colors" style={{ borderColor: on ? c : 'var(--line-strong)', background: on ? c : 'transparent' }}>
                  {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={15} strokeWidth={3} className="text-bg" /></motion.span>}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {o.perks.map((p) => <li key={p} className="flex items-center gap-2 text-[13px]"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{p}</li>)}
              </ul>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-auto"><Footer><Button full size="L" color={role === 'creator' ? 'gold' : 'cool'} onClick={onNext}>{t.cta} as {role}</Button></Footer></div>
    </div>
  );
}

function WorldsPick({ role, picked, setPicked, sub, setSub, onNext }: { role: Role; picked: string[]; setPicked: (w: string[]) => void; sub: string | null; setSub: (s: string | null) => void; onNext: () => void }) {
  const t = ob.worlds;
  const creator = role === 'creator';
  const toggle = (id: string) => {
    if (creator) { setPicked([id]); setSub(null); return; }
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  };
  const ok = creator ? picked.length === 1 && !!sub : picked.length >= t.min;
  const w0 = worlds.find((w) => w.id === picked[0]);
  return (
    <div className="flex min-h-[calc(100dvh-60px)] flex-col sm:min-h-[744px]">
      <H title={creator ? t.creatorTitle : t.title} sub={creator ? t.creatorSub : t.sub} />
      <div className="mt-6 grid grid-cols-2 gap-3 px-[22px]">
        {worlds.map((w, i) => {
          const on = picked.includes(w.id);
          const c = toneColor(w.tone as Tone);
          const I = worldIcon[w.id] ?? Globe;
          return (
            <motion.button key={w.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 26 }}
              whileTap={{ scale: 0.95 }} onClick={() => toggle(w.id)}
              className="relative h-[120px] overflow-hidden rounded-[20px] border p-3.5 text-left"
              style={{ borderColor: on ? c : 'var(--line)', background: on ? `linear-gradient(150deg, ${alpha(c, 0.28)}, var(--panel) 70%)` : 'var(--panel)' }}>
              <span className="grid h-10 w-10 place-items-center rounded-[12px]" style={{ background: alpha(c, 0.16), color: c }}><I size={20} /></span>
              <span className="absolute bottom-3 left-3.5 font-display text-[18px] font-bold">{w.name}</span>
              <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full" style={{ background: c }}><Check size={14} strokeWidth={3} className="text-bg" /></motion.span>}</AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      {creator && w0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 px-[22px]">
          <p className="eyebrow mb-2 text-muted">SUB-WORLD IN {w0.name.toUpperCase()}</p>
          <div className="flex flex-wrap gap-2">{w0.subWorlds.map((s) => <Chip key={s.id} tone={w0.tone as Tone} active={sub === s.id} onClick={() => setSub(s.id)}>{s.name}</Chip>)}</div>
        </motion.div>
      )}
      <div className="mt-auto">
        <Footer>
          <Button full size="L" disabled={!ok} onClick={onNext}>{ok ? t.cta : creator ? 'Pick a world and a sub-world' : `Pick ${Math.max(0, t.min - picked.length)} more`}</Button>
        </Footer>
      </div>
    </div>
  );
}

function FollowPick({ picked, follows, setFollows, onNext }: { picked: string[]; follows: string[]; setFollows: (f: string[]) => void; onNext: () => void }) {
  const t = ob.follow;
  const list = useMemo(() => {
    const inWorlds = creators.filter((c) => picked.includes(c.world));
    const rest = creators.filter((c) => !picked.includes(c.world));
    const top = risers.map((r) => r.creator);
    return [...inWorlds, ...rest].sort((a, b) => Number(top.includes(b.id)) - Number(top.includes(a.id))).slice(0, 8);
  }, [picked]);
  const tog = (id: string) => setFollows(follows.includes(id) ? follows.filter((x) => x !== id) : [...follows, id]);
  return (
    <div className="flex min-h-[calc(100dvh-60px)] flex-col sm:min-h-[744px]">
      <H title={t.title} sub={t.sub} />
      <div className="mt-5 space-y-2 px-[22px]">
        {list.map((c, i) => {
          const on = follows.includes(c.id);
          const w = worlds.find((x) => x.id === c.world)!;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 rounded-[16px] border border-line bg-panel p-2.5 pr-3">
              <Avatar id={c.id} size={46} ring={on ? 'hot' : 'none'} to={false} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{c.handle}</p>
                <p className="truncate text-[12px] text-muted"><span style={{ color: toneColor(w.tone as Tone) }}>{w.name}</span> · {subWorldName(c.world, c.subWorld)} · {(c.followers / 1000).toFixed(0)}k</p>
              </div>
              <Button size="S" color={on ? 'ghost' : 'hot'} onClick={() => tog(c.id)} icon={on ? <Check size={13} /> : undefined}>{on ? 'Following' : 'Follow'}</Button>
            </motion.div>
          );
        })}
      </div>
      <Footer>
        <div className="flex gap-2">
          <Button color="ghost" size="L" onClick={onNext}>{t.skip}</Button>
          <div className="flex-1"><Button full size="L" onClick={onNext}>{follows.length ? `${t.cta} · ${follows.length} followed` : t.cta}</Button></div>
        </div>
      </Footer>
    </div>
  );
}

function CreatorProfile({ price, setPrice, world: wid, sub, onNext }: { price: number; setPrice: (p: number) => void; world?: string; sub: string | null; onNext: () => void }) {
  const t = ob.creatorProfile;
  const w = worlds.find((x) => x.id === wid);
  return (
    <div className="flex min-h-[calc(100dvh-60px)] flex-col sm:min-h-[744px]">
      <H title={t.title} sub={t.sub} />
      <div className="mt-5 px-[22px]">
        <div className="relative overflow-hidden rounded-[20px] border border-line p-4" style={{ background: w ? `linear-gradient(150deg, ${alpha(toneColor(w.tone as Tone), 0.22)}, var(--panel) 65%)` : 'var(--panel)' }}>
          <div className="flex items-center gap-3">
            <Avatar id="me" size={64} ring="gold" to={false} />
            <div>
              <p className="font-display text-[20px] font-bold">{t.nameValue}</p>
              <p className="text-[13px] text-muted">{t.handleValue}{w ? ` · ${w.name}${sub ? ` · ${subWorldName(w.id, sub)}` : ''}` : ''}</p>
            </div>
          </div>
          <p className="mt-3 text-[13px] text-txt-90">{t.bioValue}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4 px-[22px]">
        <TypedField label={t.nameLabel} value={t.nameValue} delay={150} />
        <TypedField label={t.bioLabel} value={t.bioValue} delay={700} />
        <div>
          <span className="mb-1.5 block font-display text-[12px] font-semibold text-muted">{t.priceLabel}</span>
          <div className="grid grid-cols-4 gap-2">
            {t.prices.map((p) => (
              <motion.button key={p} whileTap={{ scale: 0.94 }} onClick={() => setPrice(p)} className="h-12 rounded-[12px] border font-display text-[15px] font-bold"
                style={{ borderColor: price === p ? 'var(--cool)' : 'var(--line)', color: price === p ? 'var(--violet-300)' : 'var(--txt)', background: price === p ? alpha('var(--cool)', 0.14) : 'var(--ink-700)' }}>
                ${p}
              </motion.button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-muted">Subscribers unlock all your videos. Paid to you instantly, every month.</p>
        </div>
      </div>
      <div className="mt-auto"><Footer><Button full size="L" onClick={onNext}>{t.cta}</Button></Footer></div>
    </div>
  );
}

function Done({ role, onGo }: { role: Role; onGo: () => void }) {
  const t = ob.done;
  const creator = role === 'creator';
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-8 text-center sm:min-h-[804px]">
      <Burst count={48} spread={190} />
      <motion.div className="absolute top-[28%] h-[300px] w-[300px] rounded-full blur-[80px]" style={{ background: creator ? 'rgba(255,182,39,.45)' : 'rgba(123,92,255,.45)' }} animate={{ scale: [0.8, 1.1, 1] }} transition={{ duration: 1.6 }} />
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        className="relative grid h-24 w-24 place-items-center rounded-[28px] shadow-[0_16px_50px_-10px_rgba(255,182,39,.8)]" style={{ background: 'var(--grad-gold-cta)' }}>
        <Check size={46} strokeWidth={3} className="text-on-gold" />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="relative mt-7 font-display text-[34px] font-bold">{creator ? t.creatorTitle : t.fanTitle}</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative mt-2 max-w-[290px] text-[15px] text-muted">{creator ? t.creatorSub : t.fanSub}</motion.p>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="relative mt-10 w-full"><Button full size="L" onClick={onGo}>{t.cta}</Button></motion.div>
    </div>
  );
}

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.65.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.1 8.79.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.15.84-1.23 1.19-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.5zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.08 1.96-.49 2.56-1.21z" /></svg>
);
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" /><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" /><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" /><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" /></svg>
);
