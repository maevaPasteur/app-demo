import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { create, fmtPrice, person, subWorldName, world as getWorld } from '../data';
import { DropCard } from '../cards/Cards';
import { buildDrop, publishDrop } from '../lib/contentStore';
import { LivePreview, ReviewSheet, ValidationList } from './parts/CreateReview';
import C from '../data/screens/Create.json';
import { useDemo } from '../lib/store';
import { alpha } from '../ui';
import { Clock, Gift, IdCard, Lock, Plus, X } from '../ui/Icon';
import { BackFab, BottomBar, CreateHero, CreatorSearch, EntryField, HowItPays, Pick, StepLabel, SuccessBurst, TEXT_MAX, TextArea, UserChip, WorldPicker, cc, textError } from './parts/CreateParts';

const D = C.drop;
const F = create.drop.fields;
const fmtGoal = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : `$${n}`);

/** Figma 754:6929 · Screen Create drop (accent or = argent / prestige) */
export default function CreateDrop() {
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  const [format, setFormat] = useState(0);
  const [collab, setCollab] = useState<string[]>(D.collabDefault);
  const [worldId, setWorld] = useState('content');
  const [subId, setSub] = useState('beach');
  const [text, setText] = useState(D.value);
  const [price, setPrice] = useState<string>(String(D.priceValue));
  const [duration, setDuration] = useState(F.durations[1]);
  const [goals, setGoals] = useState(D.goalsDefault.map((g, i) => ({ ...g, key: i })));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const addGoal = () => {
    const last = goals[goals.length - 1]?.amount ?? 500;
    const idea = D.goalIdeas[(goals.length - 1) % D.goalIdeas.length];
    setGoals([...goals, { amount: last * 2, text: idea, key: Date.now() }]);
  };
  const [entry, setEntry] = useState('');
  const [review, setReview] = useState(false);
  const [tried, setTried] = useState(false);
  const team = format === 1 ? collab : [];
  const goalList = goals.map((g) => ({ amount: g.amount, text: g.text }));
  const input = { world: worldId, sub: subId, text, duration, price: Number(price) || 0, entry, collab: team, goals: goalList };
  const preview = useMemo(() => (entry ? buildDrop(input) : null), [worldId, subId, text, duration, price, entry, format, collab, goals]); // eslint-disable-line react-hooks/exhaustive-deps
  const err = textError(text);
  const sortedOk = goals.every((g, i) => i === 0 || g.amount > goals[i - 1].amount);
  const issues = [
    err && 'Describe the drop (12 characters min)',
    !(Number(price) > 0) && 'Set a backer price',
    !sortedOk && 'Each stretch goal must be higher than the previous one',
    format === 1 && collab.length === 0 && 'Invite at least one creator for a collab',
  ].filter(Boolean) as string[];

  const submit = () => {
    setTried(true);
    if (issues.length) { notify(issues[0], 'hot'); return; }
    setReview(true);
  };
  const publish = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setReview(false); setDone(true); publishDrop(input); }, 650);
    setTimeout(() => { notify(`${D.success} · first backers incoming`, 'gold'); nav('/'); }, 2100);
  };

  return (
    <div className="relative">
      <div className="relative"><div className="absolute left-[16px] top-0 z-20"><BackFab /></div></div>
      <CreateHero accent="gold" icon={<Gift size={28} />} title={D.title} sub={D.sub}
        badges={[{ icon: <IdCard size={13} />, label: D.badges[0] }, { icon: <Clock size={13} />, label: D.badges[1] }, { icon: <Lock size={13} />, label: D.badges[2] }]} />

      <section className="mt-6 px-[18px]">
        <p className="eyebrow mb-2.5 text-muted">{D.format}</p>
        <div className="relative flex h-[50px] rounded-[14px] border border-line-strong bg-panel p-1">
          {D.formats.map((f, i) => (
            <button key={f} onClick={() => setFormat(i)} className="relative z-10 flex-1 font-display text-[15px] font-bold" style={{ color: format === i ? 'var(--on-gold)' : 'var(--muted)' }}>
              {format === i && <motion.span layoutId="dropfmt" className="absolute inset-0 -z-10 rounded-[11px]" style={{ background: 'var(--grad-gold-cta)' }} transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              {f}
            </button>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {format === 1 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-3">
                <CreatorSearch accent="gold" placeholder="Invite a creator to collab" exclude={['nova.rey', ...collab]} onPick={(id) => collab.length < 3 && setCollab([...collab, id])} />
                <div className="mt-2.5 flex flex-wrap gap-2"><AnimatePresence>{collab.map((id) => <UserChip key={id} id={id} onRemove={() => setCollab(collab.filter((x) => x !== id))} />)}</AnimatePresence></div>
                <p className="mt-2 text-[11px] text-muted">{D.collabHelp}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <WorldPicker accent="gold" worldId={worldId} subId={subId} onWorld={setWorld} onSub={setSub} start={2} />

      <section className="mt-6 px-[18px]">
        <p className="eyebrow mb-2.5 text-muted">{D.about}</p>
        <TextArea value={text} onChange={setText} placeholder={D.placeholder} max={TEXT_MAX} error={tried || text.length > 0 ? err : ''} />
      </section>

      <EntryField accent="gold" file="rooftop_teaser.mp4" meta="0:30 · 18.2 MB" world={worldId} onVideo={setEntry} />

      <section className="mt-6 px-[18px]">
        <p className="eyebrow mb-2.5 text-muted">{D.backerPrice}</p>
        <label style={{ background: alpha('var(--panel-hi)', 0.6) }} className="flex h-[54px] items-center gap-1.5 rounded-[16px] border border-line-strong px-4 focus-within:shadow-[0_0_0_2px_rgba(255,182,39,.35)]">
          <span className="font-display text-[20px] font-bold text-muted">$</span>
          <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, '').slice(0, 5))} className="w-20 flex-1 bg-transparent font-display text-[20px] font-bold outline-none" />
          <span className="text-[12px] text-muted">{D.perBacker}</span>
        </label>
        <div className="mt-2 flex gap-1.5">{F.prices.map((p) => <Pick key={p} accent="gold" className="flex-1 !h-[32px] !px-0 !text-[12px]" active={Number(price) === p} onClick={() => setPrice(String(p))}>{fmtPrice(p)}</Pick>)}</div>
        <p className="mt-2 text-[11px] text-muted">{D.priceHelp}</p>
      </section>

      <section className="mt-6 px-[18px]">
        <StepLabel accent="gold">{cc.duration}</StepLabel>
        <div className="flex gap-1.5">{F.durations.map((d) => <Pick key={d} accent="gold" className="flex-1" active={d === duration} onClick={() => setDuration(d)}>{d}</Pick>)}</div>
      </section>

      <section className="mt-6 px-[18px]">
        <p className="eyebrow mb-2.5 text-muted">{D.goals}</p>
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {goals.map((g, i) => (
              <motion.div key={g.key} layout initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 60, height: 0 }}
                className="flex items-center gap-3 rounded-[16px] border p-2.5" style={{ borderColor: i === 0 ? alpha('var(--gold)', 0.45) : 'var(--line-strong)', background: i === 0 ? alpha('var(--gold)', 0.06) : 'var(--panel)' }}>
                <button onClick={() => setGoals(goals.map((x) => (x.key === g.key ? { ...x, amount: x.amount + (x.amount >= 1000 ? 500 : 100) } : x)))}
                  className="flex h-[52px] w-[66px] shrink-0 flex-col items-center justify-center rounded-[10px]" style={{ background: alpha('var(--gold)', 0.12), boxShadow: `inset 0 0 0 1px ${alpha('var(--gold)', 0.4)}` }}>
                  <span className="eyebrow !text-[9px] text-gold">{D.goalWord}</span>
                  <span className="font-display text-[17px] font-bold text-gold">{fmtGoal(g.amount)}</span>
                </button>
                <span className="min-w-0 flex-1">
                  <input value={g.text} onChange={(e) => setGoals(goals.map((x) => (x.key === g.key ? { ...x, text: e.target.value } : x)))} className="w-full bg-transparent text-[13px] outline-none" />
                  {i === 0 && <span className="eyebrow mt-0.5 block !text-[9px] text-gold">{D.baseTag}</span>}
                </span>
                {i > 0 && <motion.button whileTap={{ scale: 0.85 }} onClick={() => setGoals(goals.filter((x) => x.key !== g.key))} aria-label="Remove goal" className="grid h-8 w-8 place-items-center text-muted"><X size={20} /></motion.button>}
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.98 }} onClick={addGoal} disabled={goals.length >= 6}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed font-display text-[13px] font-bold text-gold disabled:opacity-40"
            style={{ borderColor: alpha('var(--gold)', 0.5), background: alpha('var(--gold)', 0.06) }}>
            <Plus size={17} />{D.addGoal}
          </motion.button>
        </div>
        <p className="mt-2 text-[11px] leading-[16px] text-muted">{D.goalsHelp}</p>
      </section>

      <HowItPays title={D.how} rows={D.pays} />
      {preview && <LivePreview accent="gold" note="Backers see this card"><DropCard drop={preview} /></LivePreview>}
      {tried && <ValidationList issues={issues} />}
      <BottomBar accent="gold" label={issues.length ? 'Review and fix' : 'Review drop'} onClick={submit} busy={busy} />
      <ReviewSheet open={review} onClose={() => setReview(false)} onPublish={publish} busy={busy} accent="gold" title="Your exclusive drop" cta={`${D.cta} · ${fmtPrice(Number(price) || 0)}`}
        preview={preview && <DropCard drop={preview} />}
        rows={[
          { label: 'Format', value: format === 1 ? `Collab with ${collab.map((c) => person(c).handle).join(', ')}` : 'Solo' },
          { label: 'World', value: `${getWorld(worldId).name} · ${subWorldName(worldId, subId)}` },
          { label: 'Backer price', value: <span className="text-gold">{fmtPrice(Number(price) || 0)}</span> },
          { label: 'Duration', value: duration },
          { label: 'Stretch goals', value: goals.slice(1).map((g) => fmtGoal(g.amount)).join(' · ') || 'None' },
        ]} />
      <SuccessBurst show={done} accent="gold" title={D.success} sub={D.successSub} />
    </div>
  );
}
