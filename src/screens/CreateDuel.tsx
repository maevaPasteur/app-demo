import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { create, fmtPrice, person, subWorldName, world as getWorld } from '../data';
import { DuelCard } from '../cards/Cards';
import { buildDuel, publishDuel } from '../lib/contentStore';
import { LivePreview, ReviewSheet, ValidationList } from './parts/CreateReview';
import C from '../data/screens/Create.json';
import { useDemo } from '../lib/store';
import { Avatar, alpha } from '../ui';
import { Clock, Sparkle, Swords, TrendingUp } from '../ui/Icon';
import { BackFab, BottomBar, ChallengeField, CreateHero, CreatorSearch, EntryField, HowItPays, Pick, StepLabel, SubscriberNote, SuccessBurst, WorldPicker, cc, textError } from './parts/CreateParts';

const D = C.duel;
const F = create.duel.fields;
const ME = 'nova.rey';

/** Figma 742:6775 · Screen Create duel (accent rose = Follow / live) */
export default function CreateDuel() {
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  const [rival, setRival] = useState(D.defaultRival);
  const [worldId, setWorld] = useState('content');
  const [subId, setSub] = useState('beach');
  const [text, setText] = useState(D.value);
  const [duration, setDuration] = useState(F.durations[1]);
  const [price, setPrice] = useState(F.prices[1]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [entry, setEntry] = useState('');
  const [review, setReview] = useState(false);
  const [tried, setTried] = useState(false);
  const rh = person(rival).handle;
  const fill = (s: string) => s.split('{rival}').join(rh).replace('{price}', fmtPrice(price));
  const input = { rival, world: worldId, sub: subId, text, duration, price, entry };
  const preview = useMemo(() => (entry ? buildDuel(input) : null), [rival, worldId, subId, text, duration, price, entry]); // eslint-disable-line react-hooks/exhaustive-deps
  const err = textError(text);
  const issues = [err && 'Describe the brief (12 characters min)', !rival && 'Pick a rival'].filter(Boolean) as string[];

  const submit = () => {
    setTried(true);
    if (issues.length) { notify(issues[0], 'hot'); return; }
    setReview(true);
  };
  const publish = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setReview(false); setDone(true); publishDuel(input); }, 650);
    setTimeout(() => { notify(`Duel sent to ${rh} · waiting for them to accept`, 'hot'); nav('/'); }, 2100);
  };

  return (
    <div className="relative">
      <div className="relative"><div className="absolute left-[16px] top-0 z-20"><BackFab /></div></div>
      <CreateHero accent="hot" icon={<Sparkle size={28} fill="currentColor" />} title={D.title} sub={D.sub}
        badges={[{ icon: <Swords size={13} />, label: D.badges[0] }, { icon: <Clock size={13} />, label: D.badges[1] }, { icon: <TrendingUp size={13} />, label: D.badges[2] }]} />

      <section className="mt-6 px-[18px]">
        <StepLabel n={1} accent="hot" right={<span className="text-[12px] text-hot">{cc.required}</span>}>{D.rival}</StepLabel>
        <CreatorSearch accent="hot" placeholder={D.rivalPlaceholder} exclude={[ME, rival]} onPick={setRival} />
        <div className="relative mt-3 overflow-hidden rounded-[18px] border border-line-strong px-4 py-5" style={{ background: `linear-gradient(110deg, ${alpha('var(--hot)', 0.28)} 0%, var(--panel) 50%, ${alpha('var(--cool)', 0.28)} 100%)` }}>
          <div className="flex items-center justify-between">
            <div className="flex w-[110px] flex-col items-center">
              <Avatar id={ME} size={78} ring="hot" to={false} />
              <p className="mt-2 font-display text-[14px] font-bold">{person(ME).handle}</p>
              <p className="eyebrow mt-0.5 !text-[9px] text-muted">{D.you}</p>
            </div>
            <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-bg font-display text-[13px] font-bold">VS</motion.span>
            <div className="flex w-[110px] flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div key={rival} initial={{ scale: 0.5, opacity: 0, rotate: 20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                  <Avatar id={rival} size={78} ring="cool" to={false} />
                </motion.div>
              </AnimatePresence>
              <p className="mt-2 font-display text-[14px] font-bold">{rh}</p>
              <button onClick={() => document.querySelector<HTMLInputElement>('input')?.focus()} className="eyebrow mt-0.5 !text-[9px] text-cool-300">{D.change}</button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">{fill(D.acceptNote)}</p>
      </section>

      <WorldPicker accent="hot" worldId={worldId} subId={subId} onWorld={setWorld} onSub={setSub} start={2} />
      <ChallengeField value={text} onChange={setText} placeholder={D.placeholder} error={tried || text.length > 0 ? err : ''} />
      <EntryField accent="hot" file={D.file} meta={D.fileMeta} world={worldId} onVideo={setEntry} />
      <SubscriberNote text={cc.subscriberNote.replace('you start with', 'you walk into the duel with')} />

      <section className="mt-6 grid grid-cols-2 gap-3 px-[18px]">
        <div>
          <StepLabel accent="hot">{cc.duration}</StepLabel>
          <div className="flex gap-1.5">{F.durations.map((d) => <Pick key={d} accent="hot" className="flex-1 !px-0" active={d === duration} onClick={() => setDuration(d)}>{d}</Pick>)}</div>
        </div>
        <div>
          <StepLabel accent="hot">VOTE PRICE</StepLabel>
          <div className="flex gap-1.5">{F.prices.map((p) => <Pick key={p} accent="hot" className="flex-1 !px-0" active={p === price} onClick={() => setPrice(p)}>{fmtPrice(p)}</Pick>)}</div>
        </div>
      </section>

      <HowItPays title={cc.howItPays} rows={D.pays.map((r) => ({ ...r, text: fill(r.text) }))} />
      {preview && <LivePreview accent="hot" note={`${rh} joins once they accept`}><DuelCard duel={preview} /></LivePreview>}
      {tried && <ValidationList issues={issues} />}
      <BottomBar accent="hot" label={issues.length ? 'Review and fix' : 'Review duel'} onClick={submit} busy={busy} />
      <ReviewSheet open={review} onClose={() => setReview(false)} onPublish={publish} busy={busy} accent="hot" title={`You vs ${rh}`} cta={fill(D.cta)}
        preview={preview && <DuelCard duel={preview} />}
        rows={[
          { label: 'Rival', value: rh },
          { label: 'World', value: `${getWorld(worldId).name} · ${subWorldName(worldId, subId)}` },
          { label: 'Duration', value: duration },
          { label: 'Vote price', value: <span className="text-cyan">{fmtPrice(price)}</span> },
          { label: 'Goes live', value: `When ${rh} accepts` },
        ]} />
      <SuccessBurst show={done} accent="hot" title={D.success} sub={fill(D.successSub)} />
    </div>
  );
}
