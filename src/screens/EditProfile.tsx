import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { app, creator } from '../data';
import E from '../data/screens/EditProfile.json';
import { useDemo } from '../lib/store';
import { Avatar, Button, NavHeader, alpha } from '../ui';
import { Camera, Check, Clock, Copy, Download, Globe, Instagram, Plus, Share2, ShieldCheck, Shield, X } from '../ui/Icon';

type State = 'verified' | 'pending' | 'unverified';
const ME = app.me.creator;

const TikTok = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2.3 1.9 3.9 4.2 4.1v3.1c-1.5.1-2.9-.4-4.2-1.2v6.3c0 3.5-2.6 5.9-5.8 5.9A5.8 5.8 0 0 1 5 15.3c0-3.6 3.2-6.3 6.8-5.7v3.2c-1.7-.4-3.5.7-3.5 2.5 0 1.5 1.2 2.6 2.6 2.6 1.6 0 2.6-1.1 2.6-3V3h3.1z" /></svg>
);
const XLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.3l-7.2 8.2L22.3 21h-6.6l-5.2-6.8L4.6 21H1.3l7.7-8.8L1 3h6.8l4.7 6.2L17.8 3zm-1.2 16h1.8L7.5 4.9H5.5L16.6 19z" /></svg>
);
const linkIcon: Record<string, ReactNode> = { web: <Globe size={20} />, instagram: <Instagram size={20} />, tiktok: <TikTok />, x: <XLogo /> };

const bannerStyle: Record<State, { c: string; icon: ReactNode }> = {
  verified: { c: 'var(--green)', icon: <ShieldCheck size={22} /> },
  pending: { c: 'var(--gold)', icon: <Clock size={22} /> },
  unverified: { c: 'var(--hot)', icon: <Shield size={22} /> },
};

/** Figma VerificationBanner 146:115 */
function VerificationBanner({ state }: { state: State }) {
  const nav = useNavigate();
  const notify = useDemo((s) => s.notify);
  const b = E.banner[state];
  const { c, icon } = bannerStyle[state];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-[18px] mt-6 flex items-center gap-3 rounded-[16px] p-3"
      style={{ background: `linear-gradient(100deg, ${alpha(c, 0.14)}, var(--panel) 70%)`, boxShadow: `inset 0 0 0 1px ${alpha(c, 0.55)}` }}>
      <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[12px]" style={{ background: c, color: state === 'unverified' ? '#fff' : 'var(--on-green)' }}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 font-display text-[15px] font-bold">{b.title}{state === 'verified' && <Check size={18} strokeWidth={3} className="text-green" />}</span>
        <span className="mt-0.5 block text-[12px] leading-[16px] text-muted">{b.text}</span>
      </span>
      {state === 'verified' && <button onClick={() => nav('/settings/identity')} className="font-display text-[13px] font-bold text-cool-300">{b.cta}</button>}
      {state === 'pending' && <button onClick={() => notify('Usually done within minutes', 'gold')} className="rounded-[10px] px-2.5 py-1.5 font-display text-[12px] font-bold text-gold" style={{ boxShadow: `inset 0 0 0 1px ${alpha('var(--gold)', 0.5)}`, background: alpha('var(--gold)', 0.1) }}>{b.cta}</button>}
      {state === 'unverified' && <Button size="S" color="hot" onClick={() => nav('/settings/identity')} className="!h-[34px] !px-3 !text-[13px]">{b.cta}</Button>}
    </motion.div>
  );
}

/** QR décoratif déterministe (pas un vrai QR). */
function FakeQR({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const out: boolean[] = [];
    for (let i = 0; i < 25 * 25; i++) { h = Math.imul(h ^ (h >>> 13), 1274126177); out.push((h >>> 7) % 100 < 46); }
    return out;
  }, [seed]);
  const finder = (x: number, y: number) => [[0, 0], [18, 0], [0, 18]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  return (
    <svg viewBox="0 0 25 25" className="h-full w-full" shapeRendering="crispEdges">
      {cells.map((on, i) => { const x = i % 25, y = Math.floor(i / 25); return on && !finder(x, y) ? <rect key={i} x={x + 0.1} y={y + 0.1} width={0.8} height={0.8} rx={0.3} fill="#080510" /> : null; })}
      {[[0, 0], [18, 0], [0, 18]].map(([x, y]) => (
        <g key={`${x}${y}`}><rect x={x} y={y} width={7} height={7} rx={1.6} fill="#080510" /><rect x={x + 1} y={y + 1} width={5} height={5} rx={1.1} fill="#fff" /><rect x={x + 2} y={y + 2} width={3} height={3} rx={0.8} fill="#080510" /></g>
      ))}
    </svg>
  );
}

const Label = ({ children }: { children: ReactNode }) => <p className="eyebrow mb-2.5 mt-6 px-[18px] text-muted">{children}</p>;

/** Figma 149:987 / 152:1245 / 152:1598 · Edit profile (verified / pending / unverified) */
export default function EditProfile() {
  const { state: raw } = useParams();
  const state: State = raw === 'pending' || raw === 'unverified' ? raw : 'verified';
  const c = creator(ME);
  const notify = useDemo((s) => s.notify);
  const [name, setName] = useState(c.name);
  const [user, setUser] = useState(c.id);
  const [bio, setBio] = useState(c.bio + ' Subscribe for full cuts, BTS and exclusive drops.');
  const [links, setLinks] = useState(E.linkRows);
  const [hasPhoto, setHasPhoto] = useState(true);
  const [flash, setFlash] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const ok = /^[a-z0-9._]{3,}$/i.test(user);
  const url = E.domain + user;

  const save = () => {
    if (!ok) return notify('Pick a valid username', 'hot');
    setSaving(true);
    setTimeout(() => { setSaving(false); notify(E.saved, 'cool'); }, 600);
  };
  const copy = () => {
    navigator.clipboard?.writeText(`https://${url}`).catch(() => {});
    setCopied(true);
    notify(E.copied, 'cool');
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="pb-10">
      <NavHeader title={E.title} />

      <div className="mt-4 flex flex-col items-center">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setHasPhoto(true); setFlash((f) => f + 1); notify(E.photoChanged, 'cool'); }} className="relative">
          <motion.div key={flash} initial={{ scale: 0.85, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
            {hasPhoto ? <Avatar id={ME} size={84} ring="gold" to={false} /> : <span className="block h-[84px] w-[84px] rounded-full border-[3px] border-gold bg-media" />}
          </motion.div>
          <span className="absolute -bottom-0.5 -right-0.5 grid h-8 w-8 place-items-center rounded-full bg-cool text-white ring-[3px] ring-bg"><Camera size={15} /></span>
        </motion.button>
        <button onClick={() => { setHasPhoto(true); setFlash((f) => f + 1); notify(E.photoChanged, 'cool'); }} className="mt-3 font-display text-[14px] font-bold text-cool-300">{E.changePhoto}</button>
        <button onClick={() => { setHasPhoto(false); notify(E.photoRemoved, 'hot'); }} className="mt-0.5 text-[12px] text-muted">{E.removePhoto}</button>
      </div>

      <VerificationBanner state={state} />

      <Label>{E.section}</Label>
      <div className="mx-[18px] overflow-hidden rounded-[18px] border border-line bg-panel">
        <div className="border-b border-line p-3.5">
          <p className="mb-2 text-[12px] text-muted">{E.nameLabel}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-[44px] w-full rounded-[12px] bg-bg px-3 text-[14px] outline-none focus:shadow-[0_0_0_2px_var(--line-strong)]" />
        </div>
        <div className="border-b border-line p-3.5">
          <p className="mb-2 text-[12px] text-muted">{E.userLabel}</p>
          <label className="flex h-[44px] items-center gap-2 rounded-[12px] bg-bg px-3 focus-within:shadow-[0_0_0_2px_var(--line-strong)]">
            <span className="text-[13px] text-muted">@</span>
            <input value={user} onChange={(e) => setUser(e.target.value.replace(/\s/g, '').toLowerCase())} className="flex-1 bg-transparent text-[14px] outline-none" />
            <AnimatePresence mode="wait">
              <motion.span key={String(ok)} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`flex items-center gap-1 text-[12px] ${ok ? 'text-green' : 'text-hot'}`}>
                {ok ? <Check size={15} strokeWidth={3} /> : <X size={14} />}{ok ? E.available : E.taken}
              </motion.span>
            </AnimatePresence>
          </label>
        </div>
        <div className="p-3.5">
          <p className="mb-2 text-[12px] text-muted">{E.bioLabel}</p>
          <textarea value={bio} maxLength={E.bioMax} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full resize-none rounded-[12px] bg-bg px-3 py-2.5 text-[14px] leading-[20px] outline-none focus:shadow-[0_0_0_2px_var(--line-strong)]" />
          <div className="mt-1.5 flex justify-between text-[11px] text-muted"><span>{E.bioHelp}</span><span className={bio.length > E.bioMax - 10 ? 'text-hot' : ''}>{bio.length}/{E.bioMax}</span></div>
        </div>
      </div>
      <div className="mt-3 px-[18px]">
        <Button color="cool" onClick={save} icon={saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : undefined}>{E.save}</Button>
      </div>

      <Label>{E.links}</Label>
      <div className="mx-[18px] overflow-hidden rounded-[18px] border border-line bg-panel">
        <AnimatePresence initial={false}>
          {links.map((l, i) => (
            <motion.div key={l.kind + i} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 border-b border-line px-3.5 py-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-ink">{linkIcon[l.kind] ?? <Globe size={18} />}</span>
              <input value={l.value} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className="flex-1 bg-transparent text-[14px] outline-none" />
              {i >= E.linkRows.length && <button onClick={() => setLinks(links.filter((_, j) => j !== i))} aria-label="Remove link"><X size={16} className="text-muted" /></button>}
            </motion.div>
          ))}
        </AnimatePresence>
        <button onClick={() => { setLinks([...links, E.newLink]); notify('Link added', 'cool'); }} className="flex h-[44px] w-full items-center justify-center gap-1.5 font-display text-[13px] font-bold text-cool-300"><Plus size={17} />{E.addLink}</button>
      </div>

      <Label>{E.publicLink}</Label>
      <div className="mx-[18px] flex h-[48px] items-center justify-between rounded-[14px] border border-line bg-panel pl-3.5 pr-1.5">
        <span className="truncate text-[14px]">{url}</span>
        <motion.button whileTap={{ scale: 0.92 }} onClick={copy} className="flex h-[36px] items-center gap-1.5 rounded-[10px] border border-line-strong bg-ink px-3 font-display text-[13px] font-bold">
          {copied ? <Check size={15} className="text-green" /> : <Copy size={15} />}{copied ? 'Copied' : E.copy}
        </motion.button>
      </div>
      <p className="mt-2 px-[18px] text-[11px] text-muted">{E.linkHelp}</p>

      <Label>{E.qr}</Label>
      <div className="mx-[18px] flex flex-col items-center rounded-[18px] border border-line bg-panel py-5">
        <motion.div initial={{ rotate: -4, scale: 0.92, opacity: 0 }} whileInView={{ rotate: 0, scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="h-[146px] w-[146px] rounded-[16px] bg-white p-2.5 shadow-[0_10px_40px_-10px_rgba(123,92,255,.6)]"><FakeQR seed={user} /></motion.div>
        <p className="mt-3 text-[12px] text-muted">{E.scan} <b className="font-semibold text-txt">{url}</b></p>
      </div>
      <div className="mt-3 flex gap-2.5 px-[18px]">
        <Button color="ghost" icon={<Download size={16} />} onClick={() => notify(E.downloaded, 'cool')}>{E.download}</Button>
        <Button color="cool" icon={<Share2 size={16} />} onClick={() => { if (navigator.share) navigator.share({ url: `https://${url}` }).catch(() => {}); else notify(E.shared, 'cool'); }}>{E.share}</Button>
      </div>
    </div>
  );
}
