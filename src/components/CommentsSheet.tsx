import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { comments as allComments, fmtCount, person, type Comment } from '../data';
import { useDemo } from '../lib/store';
import { Avatar } from '../ui';
import { Heart, Send } from '../ui/Icon';
import { Sheet } from './Sheet';

/** Feuille de commentaires avec saisie fonctionnelle (local à la démo). */
export function CommentsSheet({ videoId, open, onClose, total }: { videoId: string; open: boolean; onClose: () => void; total: number }) {
  const notify = useDemo((s) => s.notify);
  const [list, setList] = useState<(Comment & { mine?: boolean })[]>([]);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState('');
  useEffect(() => { setList(allComments[videoId] ?? []); setLiked(new Set()); }, [videoId]);
  const post = () => {
    const t = draft.trim();
    if (!t) return;
    setList((l) => [{ author: 'me', ago: 'now', text: t, likes: 0, mine: true }, ...l]);
    setDraft('');
    notify('Comment posted', 'gold');
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex min-h-[420px] flex-col">
        <p className="px-5 text-center font-display text-[15px] font-bold">{fmtCount(total + list.filter((c) => c.mine).length)} comments</p>
        <div className="mt-3 flex-1 space-y-4 px-5 pb-4">
          <AnimatePresence initial={false}>
            {list.map((c, i) => (
              <motion.div key={`${c.author}-${c.text}-${i}`} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Avatar id={c.author} size={34} to={false} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-muted"><b className="font-semibold text-txt">{person(c.author)?.handle}</b> · {c.ago}</p>
                  <p className="mt-0.5 text-[14px] leading-5 text-txt-90">{c.text}</p>
                </div>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => setLiked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className="flex flex-col items-center text-[11px] text-muted">
                  <Heart size={16} className={liked.has(i) ? 'fill-hot text-hot' : ''} />{c.likes + (liked.has(i) ? 1 : 0)}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-panel px-4 py-3">
          <Avatar id="me" size={32} to={false} />
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && post()} placeholder="Add a comment…"
            className="h-10 flex-1 rounded-full border border-line bg-ink px-4 text-[14px] outline-none placeholder:text-muted-2" />
          <motion.button whileTap={{ scale: 0.88 }} onClick={post} className="grid h-10 w-10 place-items-center rounded-full text-on-gold" style={{ background: draft ? 'var(--grad-gold-cta)' : 'var(--panel-hi)' }} aria-label="Send"><Send size={16} /></motion.button>
        </div>
      </div>
    </Sheet>
  );
}
