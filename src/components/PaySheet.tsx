import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { app, challenge, fmtPrice, person, tips } from '../data';
import { useDemo } from '../lib/store';
import { Avatar } from '../ui';
import { Check, CreditCard, Lock } from '../ui/Icon';
import { Sheet } from './Sheet';

/** Fausse feuille de paiement. Paiement immédiat au créateur (concept v2), aucun wallet. */
export function PaySheet() {
  const pending = useDemo((s) => s.pending);
  const cancel = useDemo((s) => s.cancel);
  const confirm = useDemo((s) => s.confirm);
  const [step, setStep] = useState<'idle' | 'busy' | 'done'>('idle');
  const [choice, setChoice] = useState<string | undefined>();
  const [tip, setTip] = useState(tips.amounts[1]);

  useEffect(() => {
    setStep('idle');
    setTip(tips.amounts[1]);
    setChoice(pending?.extra);
  }, [pending]);

  const ch = pending?.kind === 'vote' ? challenge(pending.targetId) : undefined;
  const duelChoices = ch && ch.type === 'duel' ? ch.entries.map((e) => e.creator) : null;
  const price = pending?.kind === 'tip' ? tip : pending?.price ?? 0;
  const needChoice = !!duelChoices && !choice;

  const pay = () => {
    if (!pending || needChoice) return;
    if (choice && pending.kind === 'vote') useDemo.setState({ pending: { ...pending, extra: choice } });
    setStep('busy');
    setTimeout(() => { setStep('done'); try { navigator.vibrate?.([12, 40, 18]); } catch { /* non supporté */ } }, 750);
    setTimeout(() => confirm(), 1350);
  };

  return (
    <Sheet open={!!pending} onClose={cancel}>
      {pending && (
        <div className="px-5 pb-7">
          <p className="eyebrow text-muted">{app.paySheet.title}</p>
          <h3 className="mt-1 font-display text-[22px] font-bold leading-[26px]">{pending.label}</h3>
          {pending.sub && <p className="mt-1 text-[13px] text-muted">{pending.sub}</p>}

          {duelChoices && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {duelChoices.map((c, i) => (
                <motion.button key={c} whileTap={{ scale: 0.96 }} onClick={() => setChoice(c)}
                  className="flex items-center gap-2 rounded-[14px] border p-2.5 text-left"
                  style={{ borderColor: choice === c ? (i ? 'var(--cyan)' : 'var(--gold)') : 'var(--line)', background: choice === c ? 'color-mix(in srgb, var(--panel-hi) 80%, transparent)' : 'var(--ink-700)' }}>
                  <Avatar id={c} size={34} ring={i ? 'cyan' : 'gold'} to={false} />
                  <span className="flex-1 truncate text-[13px] font-semibold">{person(c).handle}</span>
                  {choice === c && <Check size={16} className={i ? 'text-cyan' : 'text-gold'} />}
                </motion.button>
              ))}
            </div>
          )}

          {pending.kind === 'tip' && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {tips.amounts.map((a) => (
                <motion.button key={a} whileTap={{ scale: 0.94 }} onClick={() => setTip(a)} className="h-12 rounded-[12px] border font-display text-[16px] font-bold"
                  style={{ borderColor: tip === a ? 'var(--gold)' : 'var(--line)', color: tip === a ? 'var(--gold)' : 'var(--txt)', background: tip === a ? 'color-mix(in srgb, var(--gold) 10%, transparent)' : 'var(--ink-700)' }}>
                  {fmtPrice(a)}
                </motion.button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-[14px] border border-line bg-ink px-4 py-3">
            <span className="flex items-center gap-3">
              <SavedCard />
              <span className="flex flex-col">
                <span className="text-[13px] font-semibold text-txt">{app.paySheet.method} {app.paySheet.card}</span>
                <span className="text-[11px] text-muted">{app.paySheet.cardExp} · <button onClick={() => useDemo.getState().notify('Saved cards · demo', 'gold')} className="font-semibold text-gold">{app.paySheet.change}</button></span>
              </span>
            </span>
            <span className="font-display text-[20px] font-bold text-gold">{fmtPrice(price)}</span>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted"><Lock size={12} />{app.paySheet.note}</p>

          <motion.button whileTap={{ scale: 0.97 }} onClick={pay} disabled={step !== 'idle' || needChoice}
            className="relative mt-5 flex h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-[16px] font-display text-[16px] font-bold disabled:opacity-90"
            style={{ background: needChoice ? 'var(--panel-hi)' : 'var(--grad-gold-cta)', color: needChoice ? 'var(--txt)' : 'var(--on-gold)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)' }}>
            <AnimatePresence mode="wait" initial={false}>
              {step === 'idle' && <motion.span key="i" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">{needChoice ? 'Pick who you vote for' : <><Lock size={17} />{app.paySheet.cta} {fmtPrice(price)}</>}</motion.span>}
              {step === 'busy' && <motion.span key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {step === 'done' && <motion.span key="d" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} className="grid h-8 w-8 place-items-center rounded-full bg-green text-on-green"><Check size={18} strokeWidth={3} /></motion.span>}
            </AnimatePresence>
          </motion.button>
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-2"><CreditCard size={12} />Demo payment · no card is charged</p>
        </div>
      )}
    </Sheet>
  );
}

/** Carte bancaire enregistrée (visuel générique, sans marque). */
function SavedCard() {
  return (
    <span className="relative block h-[30px] w-[46px] overflow-hidden rounded-[6px]" style={{ background: 'linear-gradient(135deg,#2b1f45 0%,#7b5cff 100%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)' }}>
      <span className="absolute left-[6px] top-[8px] h-[9px] w-[12px] rounded-[2px]" style={{ background: 'linear-gradient(135deg,#ffe7b0,#ffb627)' }} />
      <span className="absolute bottom-[5px] right-[6px] text-[7px] font-bold tracking-[.5px] text-white/80">4821</span>
    </span>
  );
}
