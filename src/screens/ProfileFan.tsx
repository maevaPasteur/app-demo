import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { app, challenge, creator, fan, fmtDuration, fmtMoney, fmtPrice, joker, me, person, podium, video } from '../data';
import { TopBar } from '../components/TopBar';
import { Media } from '../components/Media';
import { useDemo } from '../lib/store';
import { Avatar, Button, Counter, PlayDot, Rail, Reveal, alpha } from '../ui';
import { Check, ChevronRight, Repeat, Trophy, Zap } from '../ui/Icon';
import { ProfileHead, ReferralCard, SectionLabel, SettingsList, StatsCard } from './parts/ProfileCreatorParts';
import t from '../data/screens/ProfileFan.json';

/** Tuile achetée (Figma PurchasedTile 395:48). */
function PurchasedTile({ id }: { id: string }) {
  const nav = useNavigate();
  const v = video(id);
  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={() => nav(`/video/${id}`)} className="relative h-[150px] w-[112px] shrink-0 snap-start overflow-hidden rounded-[14px] border border-line bg-media">
      <Media video={v} className="absolute inset-0" />
      <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(8,5,16,.5),transparent 35%,transparent 65%,rgba(8,5,16,.85))' }} />
      <span className="absolute left-2 top-2 font-display text-[11px] font-bold text-white">{fmtDuration(v.durationSec)}</span>
      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-green text-on-green"><Check size={12} strokeWidth={3.5} /></span>
      <span className="absolute inset-0 grid place-items-center"><PlayDot size={30} /></span>
      <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-white">{person(v.creator).handle}</span>
    </motion.button>
  );
}

/** Figma 143:1267 · Profile Fan */
export default function ProfileFan() {
  const nav = useNavigate();
  const f = fan(app.me.fan);
  const followed = useDemo((s) => s.followed);
  const subscribed = useDemo((s) => s.subscribed);
  const unlocked = useDemo((s) => s.unlocked);
  const votes = useDemo((s) => s.votes);
  const verified = useDemo((s) => s.verified);
  const setRole = useDemo((s) => s.setRole);
  const notify = useDemo((s) => s.notify);
  const subsRef = useRef<HTMLDivElement>(null);
  const jf = joker.fan;
  const myRank = podium.yourRank;

  const purchased = [...unlocked].filter((id) => video(id)).reverse();
  const subs = [...subscribed].filter((id) => creator(id));
  const newVotes = Object.entries(votes).map(([ch, who]) => ({ challenge: ch, for: who, ago: 'now' }));
  const voteList = [...newVotes, ...me.votes.filter((v) => !votes[v.challenge])];

  return (
    <div className="pb-4">
      <TopBar />
      <ProfileHead id={f.id} name={f.name} handle={f.handle} />
      <StatsCard stats={[
        { label: t.stats.following, value: f.following - me.circle.following.length + followed.size, fmt: 'n' },
        { label: t.stats.subscriptions, value: subs.length, fmt: 'n' },
        { label: t.stats.votes, value: f.votesCast + newVotes.length, fmt: 'n' },
      ]} />
      <div className="mx-[18px] mt-3.5 flex gap-2.5">
        <div className="flex-1"><Button full color="ghost" onClick={() => nav('/settings/profile/verified')}>{t.editProfile}</Button></div>
        <div className="flex-1"><Button full color="gold" icon={<Repeat size={15} />} onClick={() => { setRole('creator'); notify('Switched to creator view', 'gold'); nav('/me/creator'); }}>{app.roles.switchToCreator}</Button></div>
      </div>
      <p className="mt-3 text-center text-[12px] text-muted"><b className="font-display text-gold">{fmtMoney(me.spentThisMonth)}</b> {t.spent}</p>

      {/* Joker */}
      <SectionLabel right={t.jokerOpen} onRight={() => nav('/joker')}>{t.joker}</SectionLabel>
      <Reveal>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => nav('/joker')} className="relative mx-[18px] mt-2.5 flex w-[calc(100%-36px)] items-center gap-3.5 overflow-hidden rounded-[18px] border p-3.5 text-left"
          style={{ borderColor: alpha('var(--hot)', 0.45), background: `linear-gradient(120deg, ${alpha('var(--hot)', 0.16)}, transparent 70%)` }}>
          <span className="floaty relative grid h-[62px] w-[46px] shrink-0 place-items-center rounded-[8px] border-2 bg-[#fff8ec] font-display text-[18px] font-bold text-[#c8102e]" style={{ borderColor: 'var(--gold)', transform: 'rotate(-6deg)' }}>10<span className="absolute bottom-1 right-1 text-[12px]">♥</span></span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[18px] font-bold">{jf.title} <span className="text-[13px] text-muted">{t.jokerLine} {jf.level}</span></span>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-panel-hi">
              <motion.span className="block h-full rounded-full" style={{ background: 'var(--grad-gold-cta)' }} initial={{ width: 0 }} whileInView={{ width: `${jf.xpPct}%` }} viewport={{ once: true }} transition={{ duration: 1 }} />
            </span>
            <span className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
              <span><b className="text-gold">{jf.xpNext - jf.xp}</b> {t.jokerXp}</span>
              <span className="flex items-center gap-1"><Trophy size={12} className="text-gold" />#{myRank.rank} {t.podiumLine}</span>
            </span>
          </span>
          <ChevronRight size={18} />
        </motion.button>
      </Reveal>

      {/* Referral */}
      <SectionLabel>{t.referral}</SectionLabel>
      <ReferralCard title={t.referralTitle} pct={t.referralPct} sub={t.referralSub} onClick={() => { navigator.clipboard?.writeText(`https://${me.referral.link}`).catch(() => {}); notify(t.referralToast, 'green'); }} />

      {/* Purchased */}
      <SectionLabel right={t.seeAll} onRight={() => purchased[0] && nav(`/video/${purchased[0]}`)}>{t.purchased} · {purchased.length}</SectionLabel>
      {purchased.length ? (
        <Rail className="mt-2.5" gap={10}>
          {purchased.map((id, i) => (
            <motion.div key={id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}><PurchasedTile id={id} /></motion.div>
          ))}
        </Rail>
      ) : <p className="mx-[18px] mt-2.5 text-[13px] text-muted">{t.purchasedEmpty}</p>}

      {/* Subscriptions */}
      <div ref={subsRef} />
      <SectionLabel>{t.subscriptions} · {subs.length}</SectionLabel>
      <div className="mx-[18px] mt-2.5 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-panel">
        {subs.map((id, i) => {
          const c = creator(id);
          return (
            <motion.button key={id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} onClick={() => nav(`/creator/${id}`)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
              <Avatar id={id} size={40} ring="cool" to={false} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">{c.handle}</span>
                <span className="block text-[11px] text-muted">{t.renews} {12 + i * 3}</span>
              </span>
              <span className="font-display text-[14px] font-bold text-cool-300">{fmtPrice(c.subscriptionPrice)}<span className="text-[11px] font-medium text-muted">{t.perMonth}</span></span>
              <ChevronRight size={16} className="text-muted" />
            </motion.button>
          );
        })}
      </div>

      {/* Votes */}
      <SectionLabel right="PODIUM" onRight={() => nav('/podium')}>{t.votes}</SectionLabel>
      <div className="mx-[18px] mt-2.5 space-y-2">
        {voteList.map((v, i) => {
          const ch = challenge(v.challenge);
          return (
            <motion.button key={v.challenge + i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              onClick={() => ch && 'videos' in ch && nav(`/video/${ch.videos[0]}`)} className="flex w-full items-center gap-3 rounded-[14px] border border-line bg-panel px-3 py-2.5 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] text-cyan" style={{ background: alpha('var(--cyan)', 0.12) }}><Zap size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{t.votedFor} {person(v.for).handle}</span>
                <span className="block truncate text-[11px] text-muted">{ch?.title}</span>
              </span>
              <span className="text-[11px] text-muted">{v.ago}</span>
            </motion.button>
          );
        })}
      </div>

      <SectionLabel>{t.settings}</SectionLabel>
      <SettingsList rows={t.settingsRows} status={{ label: t.status[verified], ok: verified === 'verified' }} onSubs={() => subsRef.current?.scrollIntoView({ behavior: 'smooth' })} restartLabel={t.restart} />
      <p className="mt-1 text-center text-[11px] text-muted-2"><Counter value={podium.yourRank.points} /> pts this season</p>
    </div>
  );
}
