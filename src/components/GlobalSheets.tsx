import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creators, feed, filters, notifications, search, worlds } from '../data';
import { activeCount, creatorMatches, itemMatches, useFilters } from '../lib/filterStore';
import { useDemo } from '../lib/store';
import { Avatar, Chip, Eyebrow, Button, toneColor } from '../ui';
import { Bell, ChevronRight, Flame, Gift, Mail, Medal, Search, Swords, Target, TrendingUp, UserPlus, Zap } from './icons';
import { Sheet } from './Sheet';

export function GlobalSheets() {
  const sheet = useDemo((s) => s.sheet);
  const close = () => useDemo.setState({ sheet: null });
  return (
    <>
      <Sheet open={sheet === 'create'} onClose={close}><CreateMenu close={close} /></Sheet>
      <Sheet open={sheet === 'notifications'} onClose={close}><Notifs close={close} /></Sheet>
      <Sheet open={sheet === 'search'} onClose={close} full><SearchPanel close={close} /></Sheet>
      <Sheet open={sheet === 'filters'} onClose={close}><FilterPanel close={close} /></Sheet>
    </>
  );
}

function CreateMenu({ close }: { close: () => void }) {
  const nav = useNavigate();
  const role = useDemo((s) => s.role);
  const items = [
    { to: '/create/dare', title: 'Post a dare', text: 'Challenge every creator in a world. The crowd votes.', icon: Target, c: 'var(--hot)', ok: true },
    { to: '/create/duel', title: 'Start a duel', text: 'Pick a rival, same brief, fans unlock and vote.', icon: Swords, c: 'var(--cyan)', ok: role === 'creator' },
    { to: '/create/drop', title: 'Launch a drop', text: 'Sell once, never again. Milestones unlock bonuses.', icon: Gift, c: 'var(--gold)', ok: role === 'creator' },
  ];
  return (
    <div className="px-5 pb-8">
      <h3 className="font-display text-[22px] font-bold">Create</h3>
      <p className="mt-1 text-[13px] text-muted">{role === 'creator' ? 'What are you launching today?' : 'Fans can dare creators. Duels and drops are for creators.'}</p>
      <div className="mt-4 space-y-2.5">
        {items.map((it, i) => (
          <motion.button key={it.to} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} whileTap={{ scale: 0.98 }}
            onClick={() => { close(); nav(it.to); }}
            className="flex w-full items-center gap-3.5 rounded-[16px] border border-line bg-ink p-3.5 text-left" style={{ opacity: it.ok ? 1 : 0.55 }}>
            <span className="grid h-11 w-11 place-items-center rounded-[12px]" style={{ background: `color-mix(in srgb, ${it.c} 14%, transparent)`, color: it.c }}><it.icon size={20} /></span>
            <span className="flex-1"><span className="block font-display text-[15px] font-bold">{it.title}</span><span className="block text-[12px] text-muted">{it.ok ? it.text : 'Switch to a creator account to unlock'}</span></span>
            <ChevronRight size={18} className="text-muted" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const nIcon = { vote: Zap, drop: Gift, medal: Medal, follow: UserPlus, message: Mail } as const;
function Notifs({ close }: { close: () => void }) {
  const nav = useNavigate();
  return (
    <div className="px-5 pb-8">
      <h3 className="flex items-center gap-2 font-display text-[22px] font-bold"><Bell size={20} />Notifications</h3>
      <div className="mt-4 divide-y divide-line">
        {notifications.map((n, i) => {
          const I = nIcon[n.kind as keyof typeof nIcon] ?? Flame;
          return (
            <motion.button key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} onClick={() => { close(); nav(n.to); }} className="flex w-full items-center gap-3 py-3 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-panel-hi text-gold"><I size={16} /></span>
              <span className="flex-1 text-[13px]">{n.text}</span>
              <span className="text-[11px] text-muted">{n.ago}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function SearchPanel({ close }: { close: () => void }) {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const res = creators.filter((c) => !q || c.handle.toLowerCase().includes(q.toLowerCase()) || c.name.toLowerCase().includes(q.toLowerCase()));
  const ws = worlds.filter((w) => !q || w.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="px-5 pb-8">
      <label className="flex h-12 items-center gap-2 rounded-[14px] border border-line bg-ink px-3.5">
        <Search size={18} className="text-muted" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={search.placeholder} className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-2" />
      </label>
      {!q && (
        <div className="mt-4">
          <Eyebrow>TRENDING</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-2">{search.trending.map((t) => <Chip key={t} onClick={() => setQ(t)}><TrendingUp size={13} />{t}</Chip>)}</div>
        </div>
      )}
      <div className="mt-5">
        <Eyebrow>WORLDS</Eyebrow>
        <div className="mt-2 flex flex-wrap gap-2">{ws.map((w) => <Chip key={w.id} tone={w.tone} active onClick={() => { close(); nav(`/world/${w.id}`); }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: toneColor(w.tone) }} />{w.name}</Chip>)}</div>
      </div>
      <div className="mt-5">
        <Eyebrow>CREATORS</Eyebrow>
        <div className="mt-1 divide-y divide-line">
          {res.map((c) => (
            <button key={c.id} onClick={() => { close(); nav(`/creator/${c.id}`); }} className="flex w-full items-center gap-3 py-2.5 text-left">
              <Avatar id={c.id} size={40} to={false} />
              <span className="flex-1"><span className="block text-[14px] font-semibold">{c.handle}</span><span className="block text-[12px] text-muted">{c.name} · {worlds.find((w) => w.id === c.world)?.name}</span></span>
              <ChevronRight size={16} className="text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ close }: { close: () => void }) {
  const f = useFilters();
  const notify = useDemo((st) => st.notify);
  const tog = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const n = feed.filter((it) => itemMatches(it, f)).length;
  const nCreators = creators.filter((c) => creatorMatches(c.id, f)).length;
  const H = filters.height;
  const pct = (v: number) => ((v - H.min) / (H.max - H.min)) * 100;
  return (
    <div className="px-5 pb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[22px] font-bold">{filters.title}</h3>
        <button onClick={f.reset} className="text-[13px] font-semibold text-muted">{filters.reset}</button>
      </div>
      <p className="mt-1 text-[12px] text-muted">{nCreators} creators · {n} posts match</p>

      <Eyebrow className="mt-4">FORMAT</Eyebrow>
      <div className="mt-2 flex flex-wrap gap-2">{filters.types.map((t) => <Chip key={t} active={f.types.includes(t)} onClick={() => f.set({ types: tog(f.types, t) })}>{t}</Chip>)}</div>
      <Eyebrow className="mt-4">WORLDS</Eyebrow>
      <div className="mt-2 flex flex-wrap gap-2">{worlds.map((w) => <Chip key={w.id} tone={w.tone} active={f.worlds.includes(w.id)} onClick={() => f.set({ worlds: tog(f.worlds, w.id) })}>{w.name}</Chip>)}</div>

      {filters.groups.map((g) => (
        <div key={g.id}>
          <Eyebrow className="mt-4">{g.label.toUpperCase()}</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-2">
            {g.options.map((o) => {
              const cur = f.sel[g.id] ?? [];
              return <Chip key={o} active={cur.includes(o)} onClick={() => f.set({ sel: { ...f.sel, [g.id]: tog(cur, o) } })}>{o}</Chip>;
            })}
          </div>
        </div>
      ))}

      <div className="mt-4 flex items-center justify-between">
        <Eyebrow>{H.label.toUpperCase()}</Eyebrow>
        <span className="font-display text-[13px] font-bold text-gold">{f.height[0]} to {f.height[1]} {H.unit}</span>
      </div>
      <div className="relative mt-3 h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-panel-hi" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={{ left: `${pct(f.height[0])}%`, right: `${100 - pct(f.height[1])}%`, background: 'var(--grad-gold-cta)' }} />
        {[0, 1].map((i) => (
          <input key={i} type="range" min={H.min} max={H.max} step={1} value={f.height[i]} aria-label={i ? 'Max height' : 'Min height'}
            onChange={(e) => {
              const v = Number(e.target.value);
              const h: [number, number] = i ? [f.height[0], Math.max(v, f.height[0] + 5)] : [Math.min(v, f.height[1] - 5), f.height[1]];
              f.set({ height: h });
            }}
            className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent" />
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-4 text-muted-2">{filters.selfDeclared}</p>

      <div className="sticky bottom-0 -mx-5 mt-4 bg-panel px-5 pb-2 pt-3">
        <Button full size="L" disabled={n === 0} onClick={() => { close(); notify(activeCount(f) ? `${activeCount(f)} filters applied` : 'Filters cleared'); }}>
          {n === 0 ? filters.empty : filters.apply.replace('{n}', String(n))}
        </Button>
      </div>
    </div>
  );
}
