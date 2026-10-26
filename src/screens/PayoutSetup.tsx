import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { earnings, fmtMoney } from '../data';
import { Burst } from '../components/Burst';
import { usePayout } from '../lib/payoutStore';
import { useDemo } from '../lib/store';
import { Avatar, Button, Counter, alpha } from '../ui';
import { ArrowLeft, Banknote, Check, ChevronRight, IdCard, Lock, Pencil, ScanFace, ShieldCheck, Zap } from './parts/PayoutIcons';
import p from '../data/screens/Payout.json';

type Sched = 'instant' | 'daily' | 'weekly';

/** Mise en place du payout créateur, en 6 étapes. Paiement instantané à chaque vente (concept v2, aucun wallet). */
export default function PayoutSetup() {
  const nav = useNavigate();
  const activate = usePayout((s) => s.activate);
  const notify = useDemo((s) => s.notify);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [country, setCountry] = useState('ae');
  const [type, setType] = useState<'individual' | 'company'>('individual');
  const [schedule, setSchedule] = useState<Sched>('instant');
  const [currency, setCurrency] = useState('USD');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); document.getElementById('app-scroll')?.scrollTo(0, 0); };
  const back = () => (step === 0 ? nav(-1) : go(step - 1));
  const confirm = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setDone(true); activate({ country, type, schedule, currency }); }, 1300);
  };

  if (done) return <Done onBack={() => { notify(p.done.toast, 'green'); nav('/me/creator', { replace: true }); }} />;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 bg-bg/95 px-4 pb-3 pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={back} aria-label={p.back} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel"><ArrowLeft size={18} /></motion.button>
          <div className="flex-1">
            <p className="font-display text-[17px] font-bold leading-5">{p.title}</p>
            <p className="text-[11px] text-muted">Step {step + 1} of {p.steps.length} · {p.steps[step]}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-green" style={{ background: alpha('var(--green)', 0.1) }}><Lock size={11} />Secure</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {p.steps.map((s, i) => (
            <button key={s} onClick={() => i < step && go(i)} className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-hi" aria-label={s}>
              <motion.div className="h-full rounded-full" style={{ background: 'var(--grad-gold-cta)' }} initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="popLayout" custom={dir} initial={false}>
        <motion.div key={step} custom={dir} className="flex flex-1 flex-col"
          variants={{ enter: (d: number) => ({ x: d * 50, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -50, opacity: 0 }) }}
          initial="enter" animate="center" exit="exit" transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
          {step === 0 && <StepAccount country={country} setCountry={(c) => { setCountry(c); const cur = p.account.countries.find((x) => x.id === c)?.currency; if (cur && p.prefs.currencies.includes(cur)) setCurrency(cur); }} type={type} setType={setType} onNext={() => go(1)} />}
          {step === 1 && <StepIdentity onNext={() => go(2)} />}
          {step === 2 && <StepBank onNext={() => go(3)} />}
          {step === 3 && <StepTax country={country} onNext={() => go(4)} />}
          {step === 4 && <StepPrefs schedule={schedule} setSchedule={setSchedule} currency={currency} setCurrency={setCurrency} onNext={() => go(5)} />}
          {step === 5 && <StepReview country={country} type={type} schedule={schedule} currency={currency} onEdit={go} busy={busy} onConfirm={confirm} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- briques ---------- */
const Title = ({ t, s }: { t: string; s: string }) => (
  <div className="px-[18px] pt-3">
    <h1 className="font-display text-[26px] font-bold leading-[30px]">{t}</h1>
    <p className="mt-1.5 text-[13px] text-muted">{s}</p>
  </div>
);
const Foot = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-bg via-bg to-transparent px-[18px] pb-[max(18px,env(safe-area-inset-bottom))] pt-6">{children}</div>
);
function Radio({ on }: { on: boolean }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors" style={{ borderColor: on ? 'var(--gold)' : 'var(--line-strong)', background: on ? 'var(--gold)' : 'transparent' }}>
      {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={13} strokeWidth={3} className="text-on-gold" /></motion.span>}
    </span>
  );
}
function Field({ label, value, onChange, valid, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; valid?: boolean; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[12px] font-semibold text-muted">{label}</span>
      <span className="flex h-[52px] items-center rounded-[14px] border bg-ink px-4 transition-colors" style={{ borderColor: valid ? alpha('var(--green)', 0.5) : 'var(--line)' }}>
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-2 ${mono ? 'font-mono tracking-wide' : ''}`} />
        <AnimatePresence>{valid && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="grid h-5 w-5 place-items-center rounded-full bg-green text-on-green"><Check size={12} strokeWidth={3} /></motion.span>}</AnimatePresence>
      </span>
    </label>
  );
}

/* ---------- 1. pays + type ---------- */
function StepAccount({ country, setCountry, type, setType, onNext }: { country: string; setCountry: (c: string) => void; type: 'individual' | 'company'; setType: (t: 'individual' | 'company') => void; onNext: () => void }) {
  return (
    <>
      <Title t={p.account.title} s={p.account.sub} />
      <div className="mt-5 space-y-2 px-[18px]">
        {p.account.countries.map((c, i) => (
          <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.98 }} onClick={() => setCountry(c.id)}
            className="flex w-full items-center gap-3 rounded-[16px] border p-3.5 text-left transition-colors"
            style={{ borderColor: country === c.id ? 'var(--gold)' : 'var(--line)', background: country === c.id ? alpha('var(--gold)', 0.07) : 'var(--panel)' }}>
            <span className="text-[24px] leading-none">{c.flag}</span>
            <span className="flex-1"><span className="block text-[14px] font-semibold">{c.name}</span><span className="block text-[11px] text-muted">Paid in {c.currency} or USD</span></span>
            <Radio on={country === c.id} />
          </motion.button>
        ))}
      </div>
      <p className="eyebrow mt-6 px-[18px] text-muted">{p.account.typeLabel}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 px-[18px]">
        {p.account.types.map((t) => (
          <motion.button key={t.id} whileTap={{ scale: 0.97 }} onClick={() => setType(t.id as 'individual' | 'company')} className="rounded-[16px] border p-3.5 text-left"
            style={{ borderColor: type === t.id ? 'var(--gold)' : 'var(--line)', background: type === t.id ? alpha('var(--gold)', 0.07) : 'var(--panel)' }}>
            <span className="flex items-center justify-between"><span className="font-display text-[15px] font-bold">{t.title}</span><Radio on={type === t.id} /></span>
            <span className="mt-1 block text-[11px] text-muted">{t.sub}</span>
          </motion.button>
        ))}
      </div>
      <Foot><Button full size="L" onClick={onNext}>{p.continue}</Button></Foot>
    </>
  );
}

/* ---------- 2. identité ---------- */
function StepIdentity({ onNext }: { onNext: () => void }) {
  const nav = useNavigate();
  const verified = useDemo((s) => s.verified);
  const setVerified = useDemo((s) => s.setVerified);
  const [scanning, setScanning] = useState(false);
  const ok = verified === 'verified';
  const quick = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setVerified('verified'); }, 2200);
  };
  return (
    <>
      <Title t={p.identity.title} s={p.identity.sub} />
      <div className="mt-5 px-[18px]">
        <motion.div layout className="relative overflow-hidden rounded-[20px] border p-5 text-center" style={{ borderColor: ok ? alpha('var(--green)', 0.45) : 'var(--line)', background: ok ? `linear-gradient(160deg, ${alpha('var(--green)', 0.14)}, var(--panel) 65%)` : 'var(--panel)' }}>
          <div className="relative mx-auto grid h-[120px] w-[120px] place-items-center">
            {scanning && (
              <>
                <motion.span className="absolute inset-0 rounded-full border-2 border-cyan" animate={{ scale: [0.85, 1.15], opacity: [1, 0] }} transition={{ duration: 1.1, repeat: Infinity }} />
                <motion.span className="absolute inset-x-3 h-0.5 bg-cyan shadow-[0_0_14px_var(--cyan)]" animate={{ y: [-46, 46, -46] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
              </>
            )}
            <span className="relative">
              <Avatar id="me" size={84} ring={ok ? 'green' : scanning ? 'cyan' : 'none'} to={false} />
              <AnimatePresence>{ok && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-green text-on-green ring-4 ring-bg"><Check size={16} strokeWidth={3} /></motion.span>}</AnimatePresence>
            </span>
          </div>
          <p className="mt-3 font-display text-[18px] font-bold">{ok ? p.identity.verified : scanning ? p.identity.scanning : p.identity.notVerified}</p>
          <p className="mt-1 text-[12px] text-muted">{ok ? p.identity.verifiedSub : p.identity.notVerifiedSub}</p>
          {!ok && !scanning && (
            <div className="mt-4 space-y-2">
              <Button full color="cyan" icon={<ScanFace size={17} />} onClick={quick}>{p.identity.quick}</Button>
              <Button full color="ghost" icon={<IdCard size={16} />} onClick={() => nav('/settings/identity')}>{p.identity.full}</Button>
            </div>
          )}
        </motion.div>
        <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-line bg-panel px-3.5 py-3 text-[12px] text-muted"><ShieldCheck size={16} className="text-green" />Encrypted, never shown on your profile, never shared with fans.</div>
      </div>
      <Foot><Button full size="L" disabled={!ok} onClick={onNext}>{ok ? p.continue : 'Verify to continue'}</Button></Foot>
    </>
  );
}

/* ---------- 3. banque ---------- */
function StepBank({ onNext }: { onNext: () => void }) {
  const b = p.bank;
  const [holder, setHolder] = useState(b.holder);
  const [iban, setIban] = useState(b.iban);
  const [swift, setSwift] = useState(b.swift);
  const [state, setState] = useState<'checking' | 'ok'>('checking');
  useEffect(() => {
    setState('checking');
    const tm = setTimeout(() => setState('ok'), 1400);
    return () => clearTimeout(tm);
  }, [iban]);
  const ok = state === 'ok' && iban.replace(/\s/g, '').length >= 15;
  return (
    <>
      <Title t={b.title} s={b.sub} />
      <div className="mt-5 px-[18px]">
        <motion.div initial={{ rotateX: 18, opacity: 0, y: 10 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative h-[150px] overflow-hidden rounded-[20px] p-4" style={{ background: 'linear-gradient(135deg,#2b1d45 0%,#1a1228 55%,#3a2609 120%)', boxShadow: '0 20px 40px -18px rgba(255,182,39,.45), inset 0 0 0 1px rgba(255,255,255,.08)' }}>
          <motion.span className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent)' }} animate={{ x: ['-120%', '380%'] }} transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.2 }} />
          <div className="flex items-center justify-between">
            <Banknote size={22} className="text-gold" />
            <AnimatePresence mode="wait">
              {state === 'checking' ? (
                <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11px] text-muted"><span className="h-3 w-3 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />{b.checking}</motion.span>
              ) : (
                <motion.span key="o" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-green" style={{ background: alpha('var(--green)', 0.14) }}>{b.detected}</motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-6 font-mono text-[16px] tracking-[2px] text-txt">{iban.slice(0, 4)} •••• •••• {iban.replace(/\s/g, '').slice(-4)}</p>
          <p className="mt-2 text-[12px] uppercase tracking-[1.5px] text-muted">{holder || 'Account holder'}</p>
        </motion.div>
      </div>
      <div className="mt-5 space-y-3.5 px-[18px]">
        <Field label={b.holderLabel} value={holder} onChange={setHolder} valid={holder.length > 3} />
        <Field label={b.ibanLabel} value={iban} onChange={setIban} valid={ok} mono />
        <Field label={b.swiftLabel} value={swift} onChange={setSwift} valid={swift.length >= 8} mono />
        <p className="flex items-center gap-2 text-[11px] text-muted"><Lock size={12} />{b.secure}</p>
      </div>
      <Foot><Button full size="L" disabled={!ok} onClick={onNext}>{ok ? p.continue : b.checking}</Button></Foot>
    </>
  );
}

/* ---------- 4. fiscalité ---------- */
function StepTax({ country, onNext }: { country: string; onNext: () => void }) {
  const t = p.tax;
  const residence = p.account.countries.find((c) => c.id === country)?.name ?? t.residence;
  const [checks, setChecks] = useState<boolean[]>(t.attestations.map(() => false));
  const [tin, setTin] = useState(t.tin);
  const [sign, setSign] = useState('');
  const all = checks.every(Boolean) && sign.trim().length > 3;
  return (
    <>
      <Title t={t.title} s={t.sub} />
      <div className="mt-5 space-y-3.5 px-[18px]">
        <div className="flex items-center justify-between rounded-[14px] border border-line bg-panel px-4 py-3.5">
          <span className="text-[12px] text-muted">{t.residenceLabel}</span><span className="text-[14px] font-semibold">{residence}</span>
        </div>
        <Field label={t.tinLabel} value={tin} onChange={setTin} placeholder={t.tinPlaceholder} />
        <div className="space-y-2">
          {t.attestations.map((a, i) => (
            <motion.button key={a} whileTap={{ scale: 0.98 }} onClick={() => setChecks((c) => c.map((x, k) => (k === i ? !x : x)))}
              className="flex w-full items-start gap-3 rounded-[14px] border p-3.5 text-left" style={{ borderColor: checks[i] ? alpha('var(--green)', 0.45) : 'var(--line)', background: 'var(--panel)' }}>
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors" style={{ borderColor: checks[i] ? 'var(--green)' : 'var(--line-strong)', background: checks[i] ? 'var(--green)' : 'transparent' }}>
                {checks[i] && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={12} strokeWidth={3.5} className="text-on-green" /></motion.span>}
              </span>
              <span className="text-[13px] leading-[19px]">{a}</span>
            </motion.button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 font-display text-[12px] font-semibold text-muted"><Pencil size={12} />{t.signLabel}</span>
          <span className="relative flex h-[64px] items-center rounded-[14px] border border-dashed bg-ink px-4" style={{ borderColor: sign ? 'var(--gold)' : 'var(--line-strong)' }}>
            <input value={sign} onChange={(e) => setSign(e.target.value)} placeholder={t.sign} className="flex-1 bg-transparent font-display text-[24px] italic text-gold outline-none placeholder:text-muted-2 placeholder:not-italic" />
            {!sign && <button onClick={() => setSign(t.sign)} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">Tap to sign</button>}
          </span>
        </label>
      </div>
      <Foot><Button full size="L" disabled={!all} onClick={onNext}>{all ? p.continue : 'Confirm and sign to continue'}</Button></Foot>
    </>
  );
}

/* ---------- 5. préférences ---------- */
function StepPrefs({ schedule, setSchedule, currency, setCurrency, onNext }: { schedule: Sched; setSchedule: (s: Sched) => void; currency: string; setCurrency: (c: string) => void; onNext: () => void }) {
  const t = p.prefs;
  const [receipt, setReceipt] = useState(true);
  return (
    <>
      <Title t={t.title} s={t.sub} />
      <div className="mt-5 space-y-2.5 px-[18px]">
        {t.options.map((o, i) => {
          const on = schedule === o.id;
          const hero = o.id === 'instant';
          return (
            <motion.button key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.98 }} onClick={() => setSchedule(o.id as Sched)}
              className="relative w-full overflow-hidden rounded-[18px] border p-4 text-left"
              style={{ borderColor: on ? 'var(--gold)' : 'var(--line)', background: on ? `linear-gradient(160deg, ${alpha('var(--gold)', hero ? 0.16 : 0.08)}, var(--panel) 65%)` : 'var(--panel)' }}>
              {hero && <span className="shine pointer-events-none absolute inset-0" />}
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px]" style={{ background: hero ? 'var(--grad-gold-cta)' : 'var(--panel-hi)', color: hero ? 'var(--on-gold)' : 'var(--muted)' }}><Zap size={18} fill={hero ? 'currentColor' : 'none'} /></span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-display text-[15px] font-bold">{o.title}{o.tag && <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold tracking-[1px] text-on-gold">{o.tag}</span>}</span>
                  <span className="mt-0.5 block text-[12px] leading-[17px] text-muted">{o.sub}</span>
                </span>
                <Radio on={on} />
              </span>
            </motion.button>
          );
        })}
      </div>
      <p className="eyebrow mt-6 px-[18px] text-muted">{t.currencyLabel}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 px-[18px]">
        {t.currencies.map((c) => (
          <motion.button key={c} whileTap={{ scale: 0.95 }} onClick={() => setCurrency(c)} className="h-12 rounded-[12px] border font-display text-[15px] font-bold"
            style={{ borderColor: currency === c ? 'var(--gold)' : 'var(--line)', color: currency === c ? 'var(--gold)' : 'var(--txt)', background: currency === c ? alpha('var(--gold)', 0.1) : 'var(--panel)' }}>{c}</motion.button>
        ))}
      </div>
      <button onClick={() => setReceipt((r) => !r)} className="mx-[18px] mt-4 flex items-center justify-between rounded-[14px] border border-line bg-panel px-4 py-3.5 text-left">
        <span className="text-[13px]">{t.receiptLabel}</span>
        <span className="relative h-7 w-12 rounded-full transition-colors" style={{ background: receipt ? 'var(--green)' : 'var(--panel-hi)' }}>
          <motion.span className="absolute top-1 h-5 w-5 rounded-full bg-white" animate={{ left: receipt ? 24 : 4 }} transition={{ type: 'spring', stiffness: 600, damping: 32 }} />
        </span>
      </button>
      <Foot><Button full size="L" onClick={onNext}>{p.continue}</Button></Foot>
    </>
  );
}

/* ---------- 6. récap ---------- */
function StepReview({ country, type, schedule, currency, onEdit, busy, onConfirm }: { country: string; type: string; schedule: Sched; currency: string; onEdit: (s: number) => void; busy: boolean; onConfirm: () => void }) {
  const r = p.review;
  const c = p.account.countries.find((x) => x.id === country)!;
  const rows: { k: keyof typeof r.rows; v: string; step: number }[] = [
    { k: 'country', v: `${c.flag}  ${c.name}`, step: 0 },
    { k: 'type', v: p.account.types.find((t) => t.id === type)?.title ?? type, step: 0 },
    { k: 'identity', v: 'Verified', step: 1 },
    { k: 'bank', v: `Emirates NBD ••${p.bank.iban.replace(/\s/g, '').slice(-4)}`, step: 2 },
    { k: 'tax', v: 'Signed today', step: 3 },
    { k: 'schedule', v: p.prefs.options.find((o) => o.id === schedule)?.title ?? schedule, step: 4 },
    { k: 'currency', v: currency, step: 4 },
  ];
  return (
    <>
      <Title t={r.title} s={r.sub} />
      <div className="mx-[18px] mt-5 overflow-hidden rounded-[18px] border border-line bg-panel">
        {rows.map((row, i) => (
          <motion.div key={row.k} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <span className="w-24 text-[12px] text-muted">{r.rows[row.k]}</span>
            <span className="flex flex-1 items-center gap-1.5 text-[13px] font-semibold">{(row.k === 'identity' || row.k === 'tax') && <Check size={14} strokeWidth={3} className="text-green" />}{row.v}</span>
            <button onClick={() => onEdit(row.step)} className="flex items-center text-[11px] font-semibold text-muted">{r.edit}<ChevronRight size={13} /></button>
          </motion.div>
        ))}
      </div>
      <div className="mx-[18px] mt-3 flex items-center gap-3 rounded-[16px] border p-3.5" style={{ borderColor: alpha('var(--gold)', 0.4), background: alpha('var(--gold)', 0.06) }}>
        <Zap size={20} className="text-gold" fill="currentColor" />
        <p className="flex-1 text-[12px] leading-[17px] text-txt-90"><b className="font-display text-gold">{fmtMoney(earnings.payoutNotSet.pending)}</b> from 38 sales will be released the second you activate.</p>
      </div>
      <Foot>
        <Button full size="L" disabled={busy} onClick={onConfirm} icon={busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-gold/30 border-t-on-gold" /> : <ShieldCheck size={18} />}>
          {busy ? r.processing : r.cta}
        </Button>
      </Foot>
    </>
  );
}

/* ---------- succès ---------- */
function Done({ onBack }: { onBack: () => void }) {
  const d = p.done;
  const [flow, setFlow] = useState(false);
  useEffect(() => { const tm = setTimeout(() => setFlow(true), 500); return () => clearTimeout(tm); }, []);
  return (
    <div className="relative flex min-h-[calc(var(--app-h,100dvh)-60px)] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <Burst count={46} spread={180} />
      <motion.div className="absolute top-[24%] h-[280px] w-[280px] rounded-full blur-[80px]" style={{ background: 'rgba(53,208,127,.35)' }} animate={{ scale: [0.7, 1.1, 1] }} transition={{ duration: 1.6 }} />
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        className="relative grid h-24 w-24 place-items-center rounded-[28px] text-on-green shadow-[0_16px_50px_-10px_rgba(53,208,127,.8)]" style={{ background: 'linear-gradient(180deg,#8affce,#35d07f)' }}>
        <Check size={46} strokeWidth={3} />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="relative mt-6 font-display text-[30px] font-bold">{d.title}</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="relative mt-1.5 text-[14px] text-muted">{d.sub}</motion.p>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative mt-8 w-full rounded-[20px] border border-line bg-panel p-4">
        <div className="flex items-center justify-between text-[12px] text-muted"><span>{d.pendingLabel}</span><span>Emirates NBD ••{p.bank.iban.replace(/\s/g, '').slice(-4)}</span></div>
        <div className="relative mt-3 flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}><Zap size={20} fill="currentColor" /></span>
          <div className="relative mx-2 h-1 flex-1 overflow-hidden rounded-full bg-panel-hi">
            {flow && [0, 1, 2, 3].map((i) => (
              <motion.span key={i} className="absolute top-0 h-1 w-6 rounded-full bg-gold" initial={{ left: '-10%' }} animate={{ left: '110%' }} transition={{ duration: 0.9, delay: i * 0.18, repeat: 1, ease: 'easeIn' }} />
            ))}
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-green text-on-green"><Banknote size={20} /></span>
        </div>
        <p className="mt-3 font-display text-[30px] font-bold text-gold">{flow ? <Counter value={earnings.payoutNotSet.pending} format={(n) => fmtMoney(Math.round(n * 100) / 100)} /> : fmtMoney(0)}</p>
        <p className="text-[12px] text-green">{d.released}</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="relative mt-8 w-full"><Button full size="L" onClick={onBack}>{d.cta}</Button></motion.div>
    </div>
  );
}
