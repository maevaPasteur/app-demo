import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creator, fmtMoney, fmtPrice, person, video, world, type Tone } from '../../data';
import { useDemo } from '../../lib/store';
import { Avatar, Button, Counter, Reveal, Tag, alpha, toneColor, type Accent } from '../../ui';
import { ArrowUp, Check, ChevronRight, Clock, Eye, Gift, LockOpen, Mail, Swords, Target, TrendingUp, Upload, X, Zap } from '../../ui/Icon';
import t from '../../data/screens/ProfileCreator.json';
import { useCreatorLive, type ReqStatus } from './ProfileCreatorLive';

const ME = 'nova.rey';

/* ---------- formats ---------- */
export const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n).toLocaleString('en-US'));
const fmtBy = (f: string) => (n: number) =>
  f === 'k' ? fmtK(n) : f === 'money' ? fmtMoney(Math.round(n)) : f === 'pct' ? `${Math.round(n)}%` : f === 'pct1' ? `${n.toFixed(1)}%` : f === 'pts' ? `${Math.round(n).toLocaleString('en-US')} pts` : Math.round(n).toLocaleString('en-US');
const accentCss = (a?: string) => (a ? `var(--${a})` : 'var(--gold)');

/* ---------- badges ---------- */
export function BadgesRow() {
  return (
    <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 px-[18px]">
      {t.badges.map((b, i) => (
        <motion.span key={b.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
          <Tag accent={b.accent as Accent}>{b.label}</Tag>
        </motion.span>
      ))}
    </div>
  );
}

/* ---------- mini sparkline ---------- */
function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const w = 64, h = 22;
  const max = Math.max(...data), min = Math.min(...data);
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${((i / (data.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <motion.path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.1 }} />
    </svg>
  );
}

/* ---------- live sales ---------- */
export function LiveTicker() {
  const sales = useCreatorLive((s) => s.sales);
  const added = useCreatorLive((s) => s.added);
  return (
    <Reveal>
      <div className="relative mx-[18px] mt-2.5 overflow-hidden rounded-[18px] border border-line bg-panel p-3.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-[12px] font-bold tracking-[1px] text-hot-soft">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hot opacity-70" /><span className="relative h-2 w-2 rounded-full bg-hot" /></span>
            {t.liveTitle}
          </span>
          <span className="text-[12px] text-muted">Today <Counter value={1286.4 + added.month} format={(n) => fmtMoney(Math.round(n * 100) / 100)} className="font-display font-bold text-gold" /></span>
        </div>
        <div className="mt-2.5 h-[132px] overflow-hidden">
          {sales.length === 0 && (
            <div className="flex h-full items-center justify-center text-[12px] text-muted">
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}>Listening for the next sale…</motion.span>
            </div>
          )}
          <AnimatePresence initial={false}>
            {sales.slice(0, 3).map((s, i) => (
              <motion.div key={s.k} layout initial={{ opacity: 0, y: -26, scale: 0.96 }} animate={{ opacity: 1 - i * 0.22, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="mb-1.5 flex items-center gap-2.5 rounded-[12px] px-2.5 py-2" style={{ background: i === 0 ? alpha('var(--gold)', 0.08) : 'var(--ink-700)', boxShadow: i === 0 ? `inset 0 0 0 1px ${alpha('var(--gold)', 0.3)}` : undefined }}>
                <Avatar id={s.fan} size={26} />
                <span className="min-w-0 flex-1 truncate text-[12px]"><b className="font-semibold">{person(s.fan)?.handle}</b> <span className="text-muted">{s.label}</span></span>
                <motion.b initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-display text-[13px] text-gold">+{fmtPrice(s.amount)}</motion.b>
                <span className="w-7 text-right text-[10px] text-muted">{i === 0 ? 'now' : `${i * 6}s`}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------- KPI grid ---------- */
export function KpiGrid() {
  const added = useCreatorLive((s) => s.added);
  const notify = useDemo((s) => s.notify);
  const live: Record<string, number> = {
    subscribers: added.subscribers, mrr: added.subscribers * 9.99, lifetime: added.lifetime, votes: added.votes,
  };
  return (
    <div className="mx-[18px] mt-2.5 grid grid-cols-2 gap-2.5">
      {t.kpis.map((k, i) => {
        const c = accentCss(k.accent);
        return (
          <motion.button key={k.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 2) * 0.05 + Math.floor(i / 2) * 0.04 }}
            whileTap={{ scale: 0.97 }} onClick={() => notify(`${k.label} · ${k.delta}`, (k.accent as 'gold' | 'cyan' | 'cool') ?? 'gold')}
            className="relative overflow-hidden rounded-[16px] border border-line bg-panel p-3 text-left">
            <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full" style={{ background: `radial-gradient(circle, ${alpha(c, 0.16)}, transparent 70%)` }} />
            <span className="block text-[11px] text-muted">{k.label}</span>
            <span className="mt-1 flex items-end justify-between gap-1">
              <Counter value={k.value + (live[k.id] ?? 0)} format={fmtBy(k.fmt)} className="font-display text-[20px] font-bold leading-6" />
              <MiniSpark data={k.spark} color={c} />
            </span>
            <span className="mt-1 flex items-center gap-1 truncate text-[10.5px] text-green">{k.delta.startsWith('+') && <ArrowUp size={11} strokeWidth={3} />}{k.delta}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ---------- inbox ---------- */
export function InboxCard() {
  const nav = useNavigate();
  const ib = t.inbox;
  return (
    <Reveal>
      <div className="relative mx-[18px] mt-2.5 overflow-hidden rounded-[18px] border p-4" style={{ borderColor: alpha('var(--hot)', 0.35), background: 'linear-gradient(150deg,#2a1226,#150e1f 60%)' }}>
        <div className="flex items-center gap-3">
          <span className="relative grid h-12 w-12 place-items-center rounded-[14px]" style={{ background: alpha('var(--hot)', 0.16) }}>
            <Mail size={22} className="text-hot-soft" />
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }} className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-hot px-1.5 font-display text-[11px] font-bold text-white ring-2 ring-bg">{ib.unread}</motion.span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[17px] font-bold">Your fans are talking</p>
            <p className="truncate text-[12px] text-muted">{ib.line}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-2.5">{ib.people.map((pp) => <Avatar key={pp} id={pp} size={30} to={false} className="ring-2 ring-[#1e1024]" />)}<span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-panel-hi font-display text-[10px] font-bold ring-2 ring-[#1e1024]">+42</span></div>
          <span className="ml-1 text-[11px] text-muted">replied within 1h · 98% response rate</span>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex-1"><Button full size="M" color="ghost" onClick={() => nav('/messages/requests')}>{ib.ctaReq} · {ib.requests}</Button></div>
          <div className="flex-1"><Button full size="M" color="hot" onClick={() => nav('/messages')}>{ib.cta}</Button></div>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------- challenge requests ---------- */
const kindIcon = { 'Private challenge': Target, 'Duel invite': Swords, 'Collab drop': Gift } as const;
type Req = (typeof t.requests)[number];

function RequestCard({ r }: { r: Req }) {
  const st = useCreatorLive((s) => s.req[r.id]);
  const setReq = useCreatorLive((s) => s.setReq);
  const notify = useDemo((s) => s.notify);
  const [countering, setCountering] = useState(false);
  const [bump, setBump] = useState(25);
  const ui = t.requestUi;
  const c = accentCss(r.accent);
  const I = kindIcon[r.kind as keyof typeof kindIcon] ?? Target;
  const counterPrice = Math.round(r.offer * (1 + bump / 100));
  const acceptColor = r.accent === 'cyan' ? 'cyan' : 'gold';

  useEffect(() => {
    if (st?.status !== 'countered') return;
    const tm = setTimeout(() => { setReq(r.id, 'accepted'); notify(`${person(r.from).handle} accepted your counter · ${fmtPrice(st.counter ?? r.offer)}`, 'green'); }, 3800);
    return () => clearTimeout(tm);
  }, [st?.status, st?.counter, r.id, r.from, r.offer, setReq, notify]);

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60, height: 0, marginTop: 0, transition: { duration: 0.35 } }}
      className="mt-2.5 overflow-hidden rounded-[18px] border bg-panel p-3.5" style={{ borderColor: alpha(c, 0.32) }}>
      <div className="flex items-center gap-2.5">
        <Avatar id={r.from} size={38} ring={r.accent === 'cyan' ? 'cyan' : r.accent === 'gold' ? 'gold' : 'hot'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">{person(r.from)?.handle}</p>
          <p className="flex items-center gap-1 text-[11px]" style={{ color: c }}><I size={12} />{r.kind}</p>
        </div>
        <span className="text-[11px] text-muted">{r.ago}</span>
      </div>
      <p className="mt-2.5 text-[13px] leading-[19px] text-txt-90">{r.brief}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] text-muted"><Clock size={12} />{r.deadline}</span>
        {r.offer > 0 ? (
          <span className="font-display text-[18px] font-bold text-gold">{fmtPrice(st?.status === 'countered' ? st.counter ?? r.offer : r.offer)}</span>
        ) : (
          <Tag accent="gold">{r.revenue}</Tag>
        )}
      </div>
      {st?.status === 'countered' ? (
        <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-ink px-3 py-2.5 text-[12px] text-muted">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />{ui.waiting}
        </div>
      ) : (
        <>
          <AnimatePresence initial={false}>
            {countering && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 rounded-[12px] border border-line bg-ink p-3">
                  <div className="flex items-center justify-between text-[12px] text-muted"><span>Your price</span><b className="font-display text-[18px] text-gold">{fmtPrice(counterPrice)}</b></div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {[10, 25, 50].map((b) => (
                      <motion.button key={b} whileTap={{ scale: 0.94 }} onClick={() => setBump(b)} className="h-9 rounded-[10px] border font-display text-[13px] font-bold"
                        style={{ borderColor: bump === b ? 'var(--gold)' : 'var(--line)', color: bump === b ? 'var(--gold)' : 'var(--txt)', background: bump === b ? alpha('var(--gold)', 0.1) : 'transparent' }}>+{b}%</motion.button>
                    ))}
                  </div>
                  <div className="mt-2.5"><Button full size="M" color="gold" onClick={() => { setReq(r.id, 'countered', counterPrice); setCountering(false); notify(ui.toastCounter, 'gold'); }}>{ui.sendCounter} · {fmtPrice(counterPrice)}</Button></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-3 flex gap-2">
            <Button size="M" color="ghost" onClick={() => { setReq(r.id, 'declined'); notify(ui.toastDecline, 'hot'); }} icon={<X size={14} />}>{ui.decline}</Button>
            {r.offer > 0 && <Button size="M" color="ghost" onClick={() => setCountering((v) => !v)}>{ui.counter}</Button>}
            <div className="flex-1">
              <Button full size="M" color={acceptColor} icon={<Check size={15} />} onClick={() => { setReq(r.id, 'accepted'); notify(r.kind === 'Duel invite' ? ui.toastDuel : ui.toastAccept, 'green'); }}>{ui.accept}</Button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function ProgressItem({ r }: { r: Req }) {
  const st = useCreatorLive((s) => s.req[r.id]);
  const setReq = useCreatorLive((s) => s.setReq);
  const push = useCreatorLive((s) => s.push);
  const notify = useDemo((s) => s.notify);
  const nav = useNavigate();
  const ui = t.requestUi;
  const amount = st.counter ?? r.offer;
  const step = st.status === 'delivered' ? 2 : st.status === 'delivering' ? 1 : 0;
  const isPrivate = r.offer > 0;
  const deliver = () => {
    setReq(r.id, 'delivering');
    setTimeout(() => {
      setReq(r.id, 'delivered');
      push({ fan: r.from, kind: 'private', label: 'paid for a private challenge', amount });
      notify(ui.toastDeliver.replace('{amount}', fmtPrice(amount)), 'gold');
    }, 2000);
  };
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-2.5 rounded-[16px] border border-line bg-panel p-3.5">
      <div className="flex items-center gap-2.5">
        <Avatar id={r.from} size={30} />
        <p className="min-w-0 flex-1 truncate text-[13px]"><b className="font-semibold">{r.kind}</b> <span className="text-muted">· {person(r.from)?.handle}</span></p>
        {isPrivate ? <b className="font-display text-[14px] text-gold">{fmtPrice(amount)}</b> : <Tag accent={r.accent === 'cyan' ? 'cyan' : 'gold'}>{r.revenue}</Tag>}
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {ui.steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-panel-hi">
              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: i < step || (i === step && st.status !== 'accepted') || i === 0 ? '100%' : '0%' }}
                transition={{ duration: st.status === 'delivering' && i === 1 ? 1.9 : 0.5, ease: 'easeOut' }} style={{ background: i === 2 && step === 2 ? 'var(--green)' : 'var(--gold)' }} />
            </div>
            <span className={`mt-1 block text-[10px] ${i <= step ? 'text-txt' : 'text-muted'}`}>{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5">
        {st.status === 'delivered' ? (
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-green"><Check size={14} strokeWidth={3} />{ui.delivered} · <span className="font-display text-gold">+{fmtPrice(amount)}</span></p>
        ) : st.status === 'delivering' ? (
          <p className="flex items-center gap-2 text-[12px] text-muted"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />{ui.delivering}</p>
        ) : isPrivate ? (
          <Button full size="M" color="gold" icon={<Upload size={15} />} onClick={deliver}>{ui.deliver}</Button>
        ) : (
          <Button full size="M" color={r.accent === 'cyan' ? 'cyan' : 'gold'} icon={<Zap size={15} />} onClick={() => nav(r.kind === 'Duel invite' ? '/create/duel' : '/create/drop')}>
            {r.kind === 'Duel invite' ? 'Record your entry' : 'Set up the drop'}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function RequestsSection() {
  const req = useCreatorLive((s) => s.req);
  const pending = t.requests.filter((r) => req[r.id]?.status === 'pending' || req[r.id]?.status === 'countered');
  const progress = t.requests.filter((r) => ['accepted', 'delivering', 'delivered'].includes(req[r.id]?.status as ReqStatus));
  return (
    <div className="px-[18px]">
      <AnimatePresence initial={false}>{pending.map((r) => <RequestCard key={r.id} r={r} />)}</AnimatePresence>
      {pending.length === 0 && <p className="mt-2.5 rounded-[14px] border border-dashed border-line px-4 py-4 text-center text-[12px] text-muted">{t.requestUi.empty}</p>}
      {progress.length > 0 && (
        <>
          <p className="eyebrow mt-5 text-muted">{t.inProgressTitle} · {progress.length}</p>
          {progress.map((r) => <ProgressItem key={r.id} r={r} />)}
        </>
      )}
    </div>
  );
}

export const pendingCount = () => t.requests.length;

/* ---------- create quick actions ---------- */
const qcIcon = { dare: Target, duel: Swords, drop: Gift } as const;
export function QuickCreate() {
  const nav = useNavigate();
  return (
    <div className="mx-[18px] mt-2.5 grid grid-cols-3 gap-2">
      {t.quickCreate.map((q, i) => {
        const I = qcIcon[q.id as keyof typeof qcIcon];
        const c = accentCss(q.accent);
        return (
          <motion.button key={q.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => nav(q.to)} className="flex flex-col items-center rounded-[16px] border p-3 text-center" style={{ borderColor: alpha(c, 0.3), background: `linear-gradient(170deg, ${alpha(c, 0.12)}, var(--panel) 70%)` }}>
            <span className="grid h-10 w-10 place-items-center rounded-[12px]" style={{ background: alpha(c, 0.16), color: c }}><I size={19} /></span>
            <span className="mt-2 font-display text-[13px] font-bold leading-4">{q.title}</span>
            <span className="mt-0.5 text-[10.5px] text-muted">{q.sub}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ---------- revenue chart ---------- */
export function RevenueChart() {
  const [rid, setRid] = useState(t.revenue.ranges[1].id);
  const [hover, setHover] = useState<number | null>(null);
  const added = useCreatorLive((s) => s.added.month);
  const range = t.revenue.ranges.find((r) => r.id === rid)!;
  const W = 320, H = 130, P = 6;
  const vals = range.points.map((p) => p.v);
  const max = Math.max(...vals) * 1.12, min = 0;
  const pts = useMemo(() => vals.map((v, i) => [P + (i / (vals.length - 1)) * (W - P * 2), H - 8 - ((v - min) / (max - min)) * (H - 22)] as const), [vals, max]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const svgRef = useRef<SVGSVGElement>(null);
  const onMove = (clientX: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(pts[best][0] - x)) best = i; });
    setHover(best);
  };
  const hp = hover !== null ? pts[hover] : null;
  return (
    <Reveal>
      <div className="mx-[18px] mt-2.5 rounded-[18px] border border-line bg-panel p-4">
        <div className="flex items-start justify-between">
          <div>
            <Counter value={range.total + (rid !== '7d' ? added : added)} format={(n) => fmtMoney(Math.round(n))} className="font-display text-[26px] font-bold leading-7 text-gold" />
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted"><TrendingUp size={13} className="text-green" /><b className="text-green">{range.delta}</b> vs previous period</p>
          </div>
          <div className="flex rounded-[12px] border border-line bg-ink p-0.5">
            {t.revenue.ranges.map((r) => (
              <button key={r.id} onClick={() => { setRid(r.id); setHover(null); }} className="relative px-2.5 py-1.5 font-display text-[11px] font-bold" style={{ color: rid === r.id ? 'var(--on-gold)' : 'var(--muted)' }}>
                {rid === r.id && <motion.span layoutId="rev-range" className="absolute inset-0 rounded-[10px]" style={{ background: 'var(--grad-gold-cta)' }} transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                <span className="relative">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-3">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none overflow-visible"
            onPointerDown={(e) => onMove(e.clientX)} onPointerMove={(e) => e.buttons > 0 || e.pointerType === 'mouse' ? onMove(e.clientX) : undefined} onPointerLeave={() => setHover(null)}>
            <defs><linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb627" stopOpacity=".38" /><stop offset="1" stopColor="#ffb627" stopOpacity="0" /></linearGradient></defs>
            {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,.06)" strokeDasharray="3 5" />)}
            <motion.path key={`a-${rid}`} d={`${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`} fill="url(#rev-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} />
            <motion.path key={`l-${rid}`} d={line} fill="none" stroke="#ffb627" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
            {hp && (
              <g>
                <line x1={hp[0]} x2={hp[0]} y1={0} y2={H} stroke="rgba(255,211,122,.5)" strokeDasharray="2 3" />
                <circle cx={hp[0]} cy={hp[1]} r="5" fill="#ffd37a" stroke="#120c1c" strokeWidth="2" />
              </g>
            )}
          </svg>
          {hp && hover !== null && (
            <motion.div key={hover} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-none absolute -top-2 rounded-[10px] border border-line-strong bg-[#1d1428] px-2.5 py-1.5 text-center shadow-lg"
              style={{ left: `clamp(0px, calc(${(hp[0] / W) * 100}% - 44px), calc(100% - 88px))`, width: 88 }}>
              <span className="block font-display text-[13px] font-bold text-gold">{fmtMoney(Math.round(vals[hover]))}</span>
              <span className="block text-[10px] text-muted">{range.points[hover].l}</span>
            </motion.div>
          )}
          <div className="mt-1 flex justify-between text-[10px] text-muted-2">
            <span>{range.points[0].l}</span><span>{range.points[Math.floor(range.points.length / 2)].l}</span><span>{range.points[range.points.length - 1].l}</span>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-2">Tap the chart to inspect a day</p>
      </div>
    </Reveal>
  );
}

/* ---------- top videos ---------- */
export function TopVideos() {
  const nav = useNavigate();
  const max = Math.max(...t.topVideos.map((v) => v.revenue));
  return (
    <div className="mx-[18px] mt-2.5 overflow-hidden rounded-[18px] border border-line bg-panel">
      {t.topVideos.map((tv, i) => {
        const v = video(tv.video);
        if (!v) return null;
        return (
          <motion.button key={tv.video} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} whileTap={{ scale: 0.98 }}
            onClick={() => nav(`/video/${tv.video}`)} className="flex w-full items-center gap-3 border-b border-line p-3 text-left last:border-0">
            <span className="w-4 font-display text-[14px] font-bold text-muted">{i + 1}</span>
            <img src={v.poster} alt="" className="h-[58px] w-[44px] rounded-[8px] object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{v.caption}</span>
              <span className="mt-0.5 flex items-center gap-2.5 text-[11px] text-muted"><span className="flex items-center gap-1"><Eye size={12} />{tv.views}</span><span className="flex items-center gap-1"><LockOpen size={12} className="text-cyan" />{tv.unlocks.toLocaleString('en-US')}</span></span>
              <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-panel-hi"><motion.span className="block h-full rounded-full" style={{ background: 'var(--grad-gold-cta)' }} initial={{ width: 0 }} whileInView={{ width: `${(tv.revenue / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 + i * 0.06 }} /></span>
            </span>
            <span className="text-right">
              <span className="block font-display text-[14px] font-bold text-gold">{fmtMoney(tv.revenue)}</span>
              <span className="block text-[10.5px] text-green">{tv.trend}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ---------- audience ---------- */
export function Audience() {
  const a = t.audience;
  const [tab, setTab] = useState(0);
  const rows = tab === 0
    ? a.worlds.map((w) => ({ label: world(w.id)?.name ?? w.id, pct: w.pct, color: toneColor((world(w.id)?.tone ?? 'gold') as Tone) }))
    : tab === 1 ? a.countries.map((c) => ({ label: `${c.flag}  ${c.name}`, pct: c.pct, color: 'var(--gold)' }))
      : a.ages.map((g) => ({ label: g.label, pct: g.pct, color: 'var(--cool)' }));
  const r = 30, circ = 2 * Math.PI * r;
  return (
    <Reveal>
      <div className="mx-[18px] mt-2.5 rounded-[18px] border border-line bg-panel p-4">
        <div className="flex items-center gap-4">
          <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
            <circle cx="38" cy="38" r={r} fill="none" stroke="var(--panel-hi)" strokeWidth="9" />
            <motion.circle cx="38" cy="38" r={r} fill="none" stroke="var(--cyan)" strokeWidth="9" strokeLinecap="round" strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }} whileInView={{ strokeDashoffset: circ * (1 - a.returning / 100) }} viewport={{ once: true }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
          <div>
            <p className="font-display text-[24px] font-bold leading-7"><Counter value={a.returning} format={(n) => `${Math.round(n)}%`} /></p>
            <p className="text-[12px] text-muted"><span className="text-cyan">●</span> {a.returningLabel} · <span className="text-muted-2">●</span> {100 - a.returning}% {a.newLabel.toLowerCase()}</p>
            <p className="mt-1 text-[11px] text-green">Fans come back: 3.4 sessions a week</p>
          </div>
        </div>
        <div className="mt-4 flex rounded-[12px] border border-line bg-ink p-0.5">
          {a.tabs.map((tb, i) => (
            <button key={tb} onClick={() => setTab(i)} className="relative flex-1 py-1.5 font-display text-[12px] font-bold" style={{ color: tab === i ? 'var(--txt)' : 'var(--muted)' }}>
              {tab === i && <motion.span layoutId="aud-tab" className="absolute inset-0 rounded-[10px] bg-panel-hi" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              <span className="relative">{tb}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.ul key={tab} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }} className="mt-3 space-y-2.5">
            {rows.map((row, i) => (
              <li key={row.label}>
                <div className="flex justify-between text-[12px]"><span>{row.label}</span><b className="font-display">{row.pct}%</b></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel-hi">
                  <motion.div className="h-full rounded-full" style={{ background: row.color }} initial={{ width: 0 }} animate={{ width: `${(row.pct / rows[0].pct) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} />
                </div>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

/* ---------- goals ---------- */
export function Goals() {
  const added = useCreatorLive((s) => s.added.month);
  return (
    <div className="mx-[18px] mt-2.5 space-y-2.5">
      {t.goals.map((g, i) => {
        const cur = g.fmt === 'money' ? g.current + added : g.current;
        const pct = Math.min(100, (cur / g.target) * 100);
        const c = accentCss(g.accent);
        return (
          <Reveal key={g.label} delay={i * 0.05}>
            <div className="rounded-[16px] border border-line bg-panel p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-display text-[14px] font-bold">{g.label}</span>
                <span className="font-display text-[13px] font-bold" style={{ color: c }}><Counter value={pct} format={(n) => `${Math.round(n)}%`} /></span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel-hi">
                <motion.div className="h-full rounded-full" style={{ background: g.accent === 'gold' ? 'var(--grad-gold-cta)' : c }} initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                <span>{fmtBy(g.fmt)(cur)} / {fmtBy(g.fmt)(g.target)}</span><span>{g.eta}</span>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ---------- payout status chip ---------- */
export function PayoutActiveChip({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-[18px] mt-2.5 flex items-center gap-2 rounded-[12px] px-3 py-2 text-[12px] font-semibold text-green" style={{ background: alpha('var(--green)', 0.1), boxShadow: `inset 0 0 0 1px ${alpha('var(--green)', 0.35)}` }}>
      <Zap size={14} fill="currentColor" />{label}<ChevronRight size={14} className="ml-auto" />
    </motion.div>
  );
}

export const meCreator = () => creator(ME);
