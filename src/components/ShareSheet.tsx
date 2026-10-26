import { motion } from 'framer-motion';
import { useDemo } from '../lib/store';
import { Copy, Instagram, Link2, Mail, MessageSquare, Send } from '../ui/Icon';
import { Sheet } from './Sheet';

const XLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" /></svg>
);
const TikTokLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2-2.8V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.7z" /></svg>
);

/** Partage : copie de lien + réseaux (toast de confirmation). */
export function ShareSheet({ open, onClose, link, title }: { open: boolean; onClose: () => void; link: string; title: string }) {
  const notify = useDemo((s) => s.notify);
  const targets = [
    { label: 'Copy link', icon: Copy, c: 'var(--gold)', msg: 'Link copied' },
    { label: 'Messages', icon: MessageSquare, c: 'var(--green)', msg: 'Shared in Messages' },
    { label: 'Instagram', icon: Instagram, c: '#ff4fd8', msg: 'Shared to Instagram story' },
    { label: 'TikTok', icon: TikTokLogo, c: '#25e6c4', msg: 'Shared to TikTok' },
    { label: 'X', icon: XLogo, c: '#f4eff8', msg: 'Posted on X' },
    { label: 'Email', icon: Mail, c: 'var(--cool)', msg: 'Email draft ready' },
    { label: 'DM a fan', icon: Send, c: 'var(--hot)', msg: 'Sent to @lena_k' },
    { label: 'Embed', icon: Link2, c: 'var(--cyan)', msg: 'Embed code copied' },
  ];
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pb-8">
        <h3 className="font-display text-[20px] font-bold">Share</h3>
        <p className="mt-1 truncate text-[13px] text-muted">{title}</p>
        <div className="mt-4 flex items-center gap-2 rounded-[14px] border border-line bg-ink px-3.5 py-3">
          <Link2 size={16} className="text-muted" />
          <span className="flex-1 truncate text-[13px] text-txt-90">{link}</span>
          <button onClick={() => { try { navigator.clipboard?.writeText(`https://${link}`); } catch { /* demo */ } notify('Link copied', 'gold'); onClose(); }} className="font-display text-[13px] font-bold text-gold">Copy</button>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-y-4">
          {targets.map((t, i) => (
            <motion.button key={t.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} whileTap={{ scale: 0.88 }}
              onClick={() => { notify(t.msg, 'gold'); onClose(); }} className="flex flex-col items-center gap-1.5">
              <span className="grid h-[52px] w-[52px] place-items-center rounded-full border border-line bg-panel-hi" style={{ color: t.c }}><t.icon size={21} /></span>
              <span className="text-[11px] text-muted">{t.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
