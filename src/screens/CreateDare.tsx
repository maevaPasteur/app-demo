import { AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { create, fmtPrice, person, subWorldName, world as getWorld } from '../data';
import { DareCard } from '../cards/Cards';
import { buildDare, publishDare } from '../lib/contentStore';
import { LivePreview, ReviewSheet, ValidationList } from './parts/CreateReview';
import C from '../data/screens/Create.json';
import { useDemo } from '../lib/store';
import { Clock, Sparkle, TrendingUp, Users } from '../ui/Icon';
import {
  BackFab, BottomBar, ChallengeField, CreateHero, CreatorSearch, EntryField, HowItPays, Pick, StepLabel, SubscriberNote, SuccessBurst, UserChip, WorldPicker, cc, textError,
} from './parts/CreateParts';

import { OpenDarePreview, FanEntryNote } from './parts/CreateDarePreview';

const D = C.dare;
const F = create.dare.fields;

/** Figma 487:7231 · Screen Create dare (accent cyan = compétition / vote) */
export default function CreateDare() {
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  const role = useDemo((s) => s.role);
  const asCreator = role === 'creator';
  const [worldId, setWorld] = useState('dance');
  const [subId, setSub] = useState('twerk');
  const [text, setText] = useState(D.value);
  const [invited, setInvited] = useState<string[]>(D.invited);
  const [duration, setDuration] = useState(F.durations[2]);
  const [price, setPrice] = useState(F.prices[1]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const [entry, setEntry] = useState('');
  const [review, setReview] = useState(false);
  const [tried, setTried] = useState(false);
  const input = { world: worldId, sub: subId, text, duration, price, entry, invited, asCreator };
  const preview = useMemo(() => (entry ? buildDare(input) : null), [worldId, subId, text, duration, price, entry, invited, asCreator]); // eslint-disable-line react-hooks/exhaustive-deps
  const err = textError(text);
  const issues = [err && 'Describe the dare (12 characters min)'].filter(Boolean) as string[];

  const submit = () => {
    setTried(true);
    if (issues.length) { notify(issues[0], 'hot'); return; }
    setReview(true);
  };
  const publish = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setReview(false); setDone(true); publishDare(input); }, 650);
    setTimeout(() => { notify(`${D.success} · creators are joining`, 'cyan'); nav('/'); }, 2100);
  };

  return (
    <div className="relative">
      <div className="relative"><div className="absolute left-[16px] top-0 z-20"><BackFab /></div></div>
      <CreateHero accent="cyan" icon={<Sparkle size={28} fill="currentColor" />} title={D.title} sub={D.sub}
        badges={[{ icon: <Clock size={13} />, label: D.badges[0] }, { icon: <Users size={13} />, label: D.badges[1] }, { icon: <TrendingUp size={13} />, label: D.badges[2] }]} />

      <WorldPicker accent="cyan" worldId={worldId} subId={subId} onWorld={setWorld} onSub={setSub} />
      <ChallengeField value={text} onChange={setText} placeholder={D.placeholder} error={tried || text.length > 0 ? err : ''} />
      {asCreator ? (
        <>
          <EntryField accent="cyan" file={D.file} meta={D.fileMeta} world={worldId} onVideo={setEntry} />
          <SubscriberNote />
        </>
      ) : (
        <FanEntryNote onReady={setEntry} world={worldId} />
      )}

      <section className="mt-6 grid grid-cols-2 gap-3 px-[18px]">
        <div>
          <StepLabel accent="cyan">{cc.duration}</StepLabel>
          <div className="flex gap-1.5">{F.durations.map((d) => <Pick key={d} accent="cyan" className="flex-1 !px-0" active={d === duration} onClick={() => setDuration(d)}>{d}</Pick>)}</div>
        </div>
        <div>
          <StepLabel accent="cyan">{cc.price}</StepLabel>
          <div className="flex gap-1.5">{F.prices.map((p) => <Pick key={p} accent="cyan" className="flex-1 !px-0" active={p === price} onClick={() => setPrice(p)}>{fmtPrice(p)}</Pick>)}</div>
        </div>
      </section>

      <section className="mt-6 px-[18px]">
        <StepLabel accent="cyan" right={<span className="text-[12px] text-muted">{cc.optional}</span>}>{D.invite}</StepLabel>
        <CreatorSearch accent="cyan" placeholder={D.invitePlaceholder} exclude={invited} onPick={(id) => invited.length < 10 && setInvited([...invited, id])} />
        <div className="mt-2.5 flex flex-wrap gap-2">
          <AnimatePresence>{invited.map((id) => <UserChip key={id} id={id} onRemove={() => setInvited(invited.filter((x) => x !== id))} />)}</AnimatePresence>
        </div>
        <p className="mt-2 text-[11px] leading-[16px] text-muted">{D.inviteHelp}</p>
      </section>

      <HowItPays title={cc.howItPays} rows={D.pays.map((r) => ({ ...r, text: r.text.replace('{price}', fmtPrice(price)) }))} />
      {preview && (
        <LivePreview accent="cyan" note={asCreator ? 'Your entry opens the dare' : 'Creators enter after you publish'}>
          {preview.entries.length ? <DareCard dare={preview} /> : <OpenDarePreview title={preview.title} world={worldId} sub={subId} invited={invited} />}
        </LivePreview>
      )}
      {tried && <ValidationList issues={issues} />}
      <BottomBar accent="cyan" label={issues.length ? 'Review and fix' : 'Review dare'} onClick={submit} busy={busy} />
      <ReviewSheet open={review} onClose={() => setReview(false)} onPublish={publish} busy={busy} accent="cyan" title={text.trim()} cta={D.cta}
        preview={preview && (preview.entries.length ? <DareCard dare={preview} /> : <OpenDarePreview title={preview.title} world={worldId} sub={subId} invited={invited} />)}
        rows={[
          { label: 'Posted by', value: asCreator ? person('nova.rey').handle : `${person('me').handle} (fan)` },
          { label: 'World', value: `${getWorld(worldId).name} · ${subWorldName(worldId, subId)}` },
          { label: 'Duration', value: duration },
          { label: 'Unlock price', value: <span className="text-cyan">{fmtPrice(price)}</span> },
          { label: 'Invited', value: invited.length ? invited.map((i) => person(i).handle).join(', ') : 'Open to all' },
        ]} />
      <SuccessBurst show={done} accent="cyan" title={D.success} sub={D.successSub} />
    </div>
  );
}
