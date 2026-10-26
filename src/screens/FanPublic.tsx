import { motion } from 'framer-motion';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { challenge, creator, fan as getFan, messages, person, world } from '../data';
import copy from '../data/screens/FanPublic.json';
import { useDemo } from '../lib/store';
import { Avatar, Button, Card, Chip, Counter, Eyebrow, IconButton, ProgressBar, Reveal, Tag, alpha, toneColor } from '../ui';
import { ArrowLeft, Check, ChevronRight, Crown, Mail, Share2, Sparkle, Trophy, Zap } from '../ui/Icon';

const fill = (s: string, vars: Record<string, string | number>) => Object.entries(vars).reduce((a, [k, v]) => a.replace(`{${k}}`, String(v)), s);
const badgeIcon = { trophy: Trophy, spark: Sparkle, crown: Crown } as const;
type Lvl = { level: number; xp: number; xpNext: number; rankLabel: string; bio: string };

/** Figma 778:7240 · Fan profile (public) */
export default function FanPublic() {
  const { handle = '' } = useParams();
  const f = getFan(handle);
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  const following = useDemo((s) => s.followed.has(handle));
  const toggle = useDemo((s) => s.toggleFollow);
  if (!f) return creator(handle) ? <Navigate to={`/creator/${handle}`} replace /> : <Navigate to="/" replace />;

  const lv: Lvl = (copy.byFan as Record<string, Lvl>)[f.id] ?? copy.default;
  const L = copy.labels;
  const first = f.name.split(' ')[0];
  const pct = Math.round((100 * lv.xp) / lv.xpNext);
  const thread = messages.threads.find((t) => t.with === f.id);
  const year = f.joinedAt.slice(0, 4);

  return (
    <div className="relative min-h-full">
      <div className="glowpulse pointer-events-none absolute -top-[200px] left-1/2 h-[460px] w-[540px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: `radial-gradient(closest-side, ${alpha('var(--gold)', 0.28)}, transparent)` }} />

      <div className="sticky top-0 z-30 flex items-center justify-between px-4 pt-2">
        <IconButton label="Back" onClick={() => nav(-1)} className="bg-bg/70 backdrop-blur"><ArrowLeft size={18} /></IconButton>
        <IconButton label="Share" onClick={() => notify('Profile link copied')} className="bg-bg/70 backdrop-blur"><Share2 size={16} /></IconButton>
      </div>

      <div className="relative px-4 pt-4">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} className="inline-block">
          <Avatar id={f.id} size={88} ring="gold" to={false} />
        </motion.div>
        <div className="mt-3 flex items-center gap-2">
          <h1 className="font-display text-[26px] font-bold leading-[30px]">{f.name}</h1>
          <Tag accent="gold">LVL {lv.level}</Tag>
        </div>
        <p className="mt-1 text-[13px] text-muted">{f.handle} · Level {lv.level} · {L.memberSince} {year}</p>
        <p className="mt-2 text-[14px] leading-5 text-txt-90">{lv.bio}</p>

        <div className="mt-4 flex gap-2.5">
          <div className="flex-1">
            <Button full color="ghost" icon={<Mail size={16} />} onClick={() => nav(thread ? `/messages/${thread.id}` : '/messages')}>{L.message}</Button>
          </div>
          <IconButton label="Share" onClick={() => notify('Profile link copied')} className="h-[44px] w-[44px] rounded-[12px]"><Share2 size={17} /></IconButton>
        </div>

        {/* Stats */}
        <Reveal className="mt-4">
          <Card className="grid grid-cols-3 divide-x divide-line py-4">
            {[
              { v: lv.level, sub: lv.rankLabel.split(' · ')[0], l: L.level, gold: true },
              { v: f.following, sub: `${f.votesCast.toLocaleString('en-US')} votes`, l: L.following },
              { v: f.subscriptions, sub: 'active', l: L.subscribed },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center px-1 text-center">
                <Counter value={s.v} className={`font-display text-[20px] font-bold ${s.gold ? 'text-gold' : ''}`} />
                <span className="mt-0.5 text-[11px] text-muted">{s.sub}</span>
                <span className="eyebrow mt-1 text-muted">{s.l}</span>
              </div>
            ))}
          </Card>
        </Reveal>

        {/* Niveau */}
        <Reveal className="mt-4">
          <Card className="relative overflow-hidden p-4" glow={alpha('var(--gold)', 0.4)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-[26px] font-bold leading-[30px] text-gold">LEVEL {lv.level}</p>
                <p className="text-[12px] text-muted">{lv.rankLabel}</p>
              </div>
              <motion.span initial={{ rotate: -90, opacity: 0 }} whileInView={{ rotate: 0, opacity: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                className="floaty grid h-[56px] w-[56px] place-items-center rounded-full border-2 border-gold text-center font-display text-gold">
                <span className="leading-none"><span className="block text-[9px]">LVL</span><span className="text-[17px] font-bold">{lv.level}</span></span>
              </motion.span>
            </div>
            <div className="mt-4 flex justify-between text-[12px]">
              <span className="font-display font-bold text-gold"><Counter value={lv.xp} /> XP</span>
              <span className="text-muted">{fill(L.next, { n: lv.level + 1 })}</span>
            </div>
            <div className="mt-2"><ProgressBar pct={pct} /></div>
            <p className="mt-2 text-[11px] text-muted">{fill(L.toNext, { n: (lv.xpNext - lv.xp).toLocaleString('en-US'), l: lv.level + 1 })}</p>
          </Card>
        </Reveal>

        {/* Mondes favoris */}
        <Reveal className="mt-6">
          <Eyebrow>{L.worlds.toUpperCase()}</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-2">
            {f.favoriteWorlds.map((wid) => {
              const w = world(wid);
              return (
                <Link key={wid} to={`/world/${wid}`}>
                  <Chip tone={w.tone} active><span className="h-1.5 w-1.5 rounded-full" style={{ background: toneColor(w.tone) }} />{w.name}</Chip>
                </Link>
              );
            })}
          </div>
        </Reveal>

        {/* Badges */}
        <Reveal className="mt-6">
          <div className="flex items-center justify-between">
            <Eyebrow color="var(--gold)">{L.badges}</Eyebrow>
            <button onClick={() => notify(`${copy.badges.length} badges unlocked by ${first}`)} className="eyebrow flex items-center text-muted">{L.seeAll}<ChevronRight size={12} /></button>
          </div>
          <div className="mt-2 divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-panel">
            {copy.badges.map((b, i) => {
              const I = badgeIcon[b.icon as keyof typeof badgeIcon];
              return (
                <motion.div key={b.title} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3.5 px-3.5 py-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[10px] border text-gold" style={{ borderColor: alpha('var(--gold)', 0.3), background: alpha('var(--gold)', 0.08) }}><I size={17} fill="currentColor" /></span>
                  <span>
                    <span className="block text-[14px] font-semibold">{b.title}</span>
                    <span className="block text-[12px] text-muted">{b.text}</span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </Reveal>

        {/* Votes récents */}
        <Reveal className="mt-6">
          <Eyebrow>{L.recent.toUpperCase()}</Eyebrow>
          <div className="mt-2 space-y-2">
            {copy.recentVotes.map((v) => {
              const ch = challenge(v.challenge);
              return (
                <Link key={v.challenge} to={`/creator/${v.for}`} className="flex items-center gap-3 rounded-[14px] border border-line bg-panel px-3 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full text-cyan" style={{ background: alpha('var(--cyan)', 0.12) }}><Zap size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px]">{L.voted} <b>{person(v.for).handle}</b></span>
                    <span className="block truncate text-[11px] text-muted">{ch?.title}</span>
                  </span>
                  <span className="text-[11px] text-muted">{v.ago}</span>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>

      <div className="sticky bottom-0 z-30 mt-6 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-6" style={{ background: 'linear-gradient(180deg, transparent, rgba(8,5,16,.95) 40%)' }}>
        <Button full size="L" color={following ? 'ghost' : 'hot'} icon={following ? <Check size={16} /> : undefined}
          onClick={() => { toggle(f.id); if (!following) notify(`Following ${f.handle}`, 'hot'); }}>
          {fill(following ? L.following2 : L.follow, { name: first })}
        </Button>
      </div>
    </div>
  );
}
