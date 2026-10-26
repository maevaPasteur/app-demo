import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { app, awards, creator, earnings, fmtMoney, person } from '../data';
import { TopBar } from '../components/TopBar';
import { useDemo } from '../lib/store';
import { Button, Counter, Medal, Reveal, Tag, alpha } from '../ui';
import { ArrowUp, ChevronRight, Gift, Plus, Repeat, Sparkle, TrendingUp, Zap } from '../ui/Icon';
import { Play } from 'lucide-react';
import { ProfileHead, ReferralCard, SectionLabel, SettingsList, StatsCard } from './parts/ProfileCreatorParts';
import { RankingPanel } from './parts/ProfileCreatorRankingPanel';
import { medalsByScope, rankOf, worldScopes } from './parts/ProfileCreatorRanking';
import t from '../data/screens/ProfileCreator.json';
import { usePayout } from '../lib/payoutStore';
import { useCreatorLive, useLiveSales } from './parts/ProfileCreatorLive';
import { Audience, BadgesRow, Goals, InboxCard, KpiGrid, LiveTicker, PayoutActiveChip, QuickCreate, RequestsSection, RevenueChart, TopVideos } from './parts/ProfileCreatorDash';

const ME = app.me.creator;
const segColor: Record<string, string> = {
  Subscriptions: 'var(--cool)', Duels: 'var(--cyan)', Dares: 'var(--tone-blue)', 'Exclusive drops': 'var(--gold)', 'Private challenges': 'var(--hot)',
};

/** Courbe animée du mois (earnings.chart). */
function Spark({ data }: { data: number[] }) {
  const w = 150, h = 56;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 4 - ((v - min) / (max - min)) * (h - 10)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs><linearGradient id="pc-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb627" stopOpacity=".35" /><stop offset="1" stopColor="#ffb627" stopOpacity="0" /></linearGradient></defs>
      <motion.path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#pc-area)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.6 }} />
      <motion.path d={d} fill="none" stroke="#ffb627" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
      <motion.circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="#ffd37a" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 }} />
    </svg>
  );
}

function EarningsBlock() {
  const [showRecent, setShowRecent] = useState(false);
  const total = earnings.breakdown.reduce((s, b) => s + b.amount, 0);
  const added = useCreatorLive((s) => s.added.month);
  return (
    <>
      <Reveal>
        <div className="relative mx-[18px] mt-2.5 overflow-hidden rounded-[18px] border p-4" style={{ borderColor: alpha('var(--gold)', 0.4), background: 'linear-gradient(160deg,#1d1426,#120c1c 60%)' }}>
          <span className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,182,39,.18), transparent 70%)' }} />
          <p className="eyebrow text-muted">{t.thisMonth} · {earnings.monthLabel.toUpperCase()}</p>
          <div className="mt-2 flex items-end justify-between">
            <Counter value={earnings.total + added} format={(n) => fmtMoney(Math.round(n * 100) / 100)} className="font-display text-[32px] font-bold leading-none text-gold" />
            <Spark data={earnings.chart} />
          </div>
          <p className="mt-2 flex items-center gap-1 text-[12px] text-muted"><ArrowUp size={13} strokeWidth={3} className="text-green" /><b className="text-green">{earnings.vsLastMonthPct}%</b> {t.vsLast}</p>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowRecent((s) => !s)} className="relative mt-3.5 flex w-full items-center gap-3 rounded-[14px] border border-line bg-white/[.04] p-3 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}><Zap size={18} fill="currentColor" /></span>
            <span className="flex-1 text-[12px] leading-[17px] text-txt-90">{t.paidInstantly}</span>
            <motion.span animate={{ rotate: showRecent ? 90 : 0 }}><ChevronRight size={18} /></motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {showRecent && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative overflow-hidden">
                <li className="mt-3 text-[11px] font-bold tracking-[1px] text-muted">{t.recentTitle.toUpperCase()}</li>
                {earnings.recent.map((r, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between border-b border-line py-2 text-[12px] last:border-0">
                    <span><span className="text-txt">{r.label}</span> <span className="text-muted">· {person(r.fan).handle}</span></span>
                    <span className="flex items-center gap-2"><span className="text-muted">{r.ago}</span><b className="font-display text-gold">+{fmtMoney(r.amount)}</b></span>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
      <Reveal>
        <div className="mx-[18px] mt-3 rounded-[18px] border border-line bg-panel p-4">
          <div className="flex h-2.5 gap-1 overflow-hidden">
            {earnings.breakdown.map((b, i) => (
              <motion.span key={b.type} initial={{ flexGrow: 0 }} whileInView={{ flexGrow: b.amount / total }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }} className="block min-w-[6px] basis-0 rounded-full" style={{ background: segColor[b.type] }} />
            ))}
          </div>
          <ul className="mt-3">
            {earnings.breakdown.map((b) => (
              <li key={b.type} className="flex items-center justify-between border-b border-line py-2.5 text-[14px] last:border-0">
                <span className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-full" style={{ background: segColor[b.type] }} />{b.type}</span>
                <Counter value={b.amount} format={(n) => fmtMoney(Math.round(n))} className="font-display font-bold text-gold" />
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </>
  );
}

function PayoutNotSet() {
  const nav = useNavigate();
  const p = earnings.payoutNotSet;
  return (
    <Reveal>
      <div className="mx-[18px] mt-2.5 rounded-[18px] border-2 border-dashed p-4" style={{ borderColor: alpha('var(--gold)', 0.55), background: alpha('var(--gold)', 0.04) }}>
        <div className="flex gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] text-on-gold" style={{ background: 'var(--grad-gold-cta)' }}><Gift size={22} /></span>
          <div>
            <p className="font-display text-[17px] font-bold">{p.title}</p>
            <p className="mt-1 text-[12px] leading-[18px] text-muted">{p.desc}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {p.steps.map((s, i) => <Tag key={s} accent={i === 0 ? 'gold' : 'muted'}>{i + 1} · {s}</Tag>)}
        </div>
        <div className="mt-4"><Button full size="L" color="gold" icon={<Plus size={18} strokeWidth={2.5} />} onClick={() => nav('/me/payout')}>{p.cta}</Button></div>
        <p className="mt-2 text-center text-[11px] text-muted">Pending · <b className="font-display text-gold">{fmtMoney(p.pending)}</b></p>
      </div>
    </Reveal>
  );
}

function AwardsBlock() {
  const nav = useNavigate();
  const { totals, list } = medalsByScope(ME);
  const c = creator(ME);
  const sub = worldScopes().find((w) => w.world.id === c.world)!.subs.find((s) => s.id === c.subWorld)!;
  const r = rankOf(ME, sub, 'season');
  const g = awards.byCreator[ME].ranking.season.global;
  return (
    <Reveal>
      <div className="relative mx-[18px] mt-2.5 overflow-hidden rounded-[18px] border border-line bg-panel p-4">
        <span className="pointer-events-none absolute -right-8 top-6 h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,182,39,.14), transparent 70%)' }} />
        <button onClick={() => nav('/awards')} className="relative flex w-full items-center gap-3.5 text-left">
          <span className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full border-2 border-gold text-center">
            <span><span className="block font-display text-[9px] font-bold tracking-[1px] text-muted">RANK</span><span className="block font-display text-[20px] font-bold leading-5 text-gold">{r.rank}</span></span>
          </span>
          <span className="flex-1">
            <span className="block font-display text-[16px] font-bold leading-5">#{r.rank} in {sub.name} · #{g} {t.worldwide}</span>
            <span className="block text-[12px] text-muted">{list.length} {t.medalsAllTime} · {c.seasonWins} {t.duelWins}</span>
          </span>
          <ChevronRight size={20} />
        </button>
        <div className="relative mt-3.5 grid grid-cols-3 gap-2">
          {(['gold', 'silver', 'bronze'] as const).map((m, i) => (
            <motion.div key={m} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-center justify-center gap-1.5 rounded-[12px] border border-line bg-ink py-2">
              <Medal medal={m} size={30} />
              <Counter value={totals[m]} className="font-display text-[16px] font-bold" />
              <span className="text-[11px] text-muted">{awards.ui.medals[m]}</span>
            </motion.div>
          ))}
        </div>
        <ul className="relative mt-3 space-y-1.5">
          {list.slice(0, 4).map((a, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.05 }} className="flex items-center gap-2.5 rounded-[12px] bg-ink px-2.5 py-2">
              <Medal medal={a.medal} size={32} />
              <span className="flex-1 text-[13px]"><b className="font-semibold">{a.rank === 1 ? '1st' : a.rank === 2 ? '2nd' : '3rd'} · {a.scopeName}</b> {a.scope !== 'global' && <span className="text-muted">{awards.ui.scopes[a.scope]}</span>}</span>
              <span className="text-[11px] text-muted">{a.season}</span>
            </motion.li>
          ))}
        </ul>
        <div className="relative mt-3 border-t border-line pt-3 text-[12px] text-muted">{t.awardsHint} <span className="text-gold">{sub.name}</span></div>
      </div>
    </Reveal>
  );
}

const tileIcon = { videos: Play, drops: Gift, duels: Sparkle, insights: TrendingUp } as const;

/** Figma 136:754 (earnings + awards) et 143:1054 (payout not set up). */
export default function ProfileCreator() {
  const { pathname } = useLocation();
  const payoutActive = usePayout((s) => s.active);
  const notSet = pathname.endsWith('/payout') && !payoutActive;
  const req = useCreatorLive((s) => s.req);
  const pendingReq = t.requests.filter((r) => req[r.id]?.status === 'pending' || req[r.id]?.status === 'countered').length;
  useLiveSales(!notSet);
  const nav = useNavigate();
  const c = creator(ME);
  const notify = useDemo((s) => s.notify);
  const setRole = useDemo((s) => s.setRole);
  const verified = useDemo((s) => s.verified);
  const earnRef = useRef<HTMLDivElement>(null);
  const status = notSet ? verified : 'verified';

  return (
    <div className="pb-4">
      <TopBar />
      <ProfileHead id={ME} name={c.name} handle={c.handle} />
      <BadgesRow />
      <StatsCard stats={t.stats} />
      <div className="mx-[18px] mt-3.5 flex gap-2.5">
        <div className="flex-1"><Button full color="ghost" onClick={() => nav(`/settings/profile/${notSet ? verified : 'verified'}`)}>{t.editProfile}</Button></div>
        <div className="flex-1"><Button full color="gold" onClick={() => nav(`/creator/${ME}`)}>{t.viewPublic}</Button></div>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setRole('fan'); notify('Switched to fan view', 'cool'); nav('/me/fan'); }}
        className="mx-auto mt-3 flex items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-[12px] font-semibold text-cool-300">
        <Repeat size={13} />{app.roles.switchToFan}
      </motion.button>

      {!notSet && <LiveTicker />}

      <SectionLabel right="AWARDS" onRight={() => nav('/awards')}>{t.kpiTitle}</SectionLabel>
      <KpiGrid />

      <SectionLabel right="OPEN" onRight={() => nav('/messages')}>{t.inbox.title}</SectionLabel>
      <InboxCard />

      <SectionLabel right={pendingReq ? `${pendingReq} PENDING` : undefined} onRight={() => nav('/messages/requests')}>{t.requestsTitle}</SectionLabel>
      <RequestsSection />

      <SectionLabel right="JOKER" onRight={() => nav('/joker/creator')}>{t.quickCreateTitle}</SectionLabel>
      <QuickCreate />

      <div ref={earnRef} />
      <SectionLabel right={t.seeAll} onRight={() => nav('/joker/creator')}>{t.earnings}</SectionLabel>
      {notSet ? <PayoutNotSet /> : <>{payoutActive && <PayoutActiveChip label={t.payoutActive} />}<EarningsBlock /></>}

      <SectionLabel>{t.revenue.title}</SectionLabel>
      <RevenueChart />

      <SectionLabel right="ALL VIDEOS" onRight={() => nav(`/creator/${ME}`)}>{t.topVideosTitle}</SectionLabel>
      <TopVideos />

      <SectionLabel>{t.audienceTitle}</SectionLabel>
      <Audience />

      <SectionLabel>{t.goalsTitle}</SectionLabel>
      <Goals />

      <SectionLabel>{t.referral}</SectionLabel>
      <ReferralCard title={t.referralTitle} pct={t.referralPct} sub={t.referralSub} onClick={() => { navigator.clipboard?.writeText('https://daresonly.app/r/nova-rey').catch(() => {}); notify(t.referralToast, 'green'); }} />

      <SectionLabel right={t.open} onRight={() => nav('/awards')}>{t.awards}</SectionLabel>
      <AwardsBlock />

      <SectionLabel right="ALL-TIME" onRight={() => nav('/awards/all-time')}>{t.ranking}</SectionLabel>
      <Reveal><RankingPanel me={ME} /></Reveal>

      <SectionLabel right={t.manage} onRight={() => nav(`/creator/${ME}`)}>{t.content}</SectionLabel>
      <div className="mx-[18px] mt-2.5 grid grid-cols-2 gap-2.5">
        {t.tiles.map((tile, i) => {
          const I = tileIcon[tile.id as keyof typeof tileIcon];
          return (
            <motion.button key={tile.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => (tile.to ? nav(tile.to) : notify(t.insightsToast, 'gold'))}
              className="flex items-center gap-3 rounded-[16px] border border-line bg-panel p-3 text-left">
              <span className="grid h-10 w-10 place-items-center rounded-[10px] border border-line bg-ink text-gold"><I size={18} fill={tile.id === 'videos' ? 'currentColor' : 'none'} /></span>
              <span>
                <span className="block font-display text-[14px] font-bold">{tile.title}</span>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: tile.dot ? 'var(--hot-soft)' : 'var(--muted)' }}>{tile.dot && <span className="h-1.5 w-1.5 rounded-full bg-hot" />}{tile.sub}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <SectionLabel>{t.settings}</SectionLabel>
      <SettingsList rows={t.settingsRows} status={{ label: t.status[status], ok: status === 'verified' }} onSubs={() => earnRef.current?.scrollIntoView({ behavior: 'smooth' })} restartLabel={t.restart} />
    </div>
  );
}
