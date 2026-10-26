import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { person, subWorldName, videos, world as getWorld } from '../../data';
import { Avatar, Eyebrow, Tag, Timer, alpha, toneColor } from '../../ui';
import { Users } from '../../ui/Icon';

/** Dare ouvert sans encore aucune entrée (posté par un fan, ou en attente des premiers créateurs). */
export function OpenDarePreview({ title, world, sub, invited, daredBy = 'me', live }: { title: string; world: string; sub: string; invited: string[]; daredBy?: string; live?: string }) {
  const w = getWorld(world);
  const c = toneColor(w.tone);
  return (
    <section>
      <div className="flex items-center justify-between px-[18px]">
        <Eyebrow>DARE · OPEN</Eyebrow>
        <Timer label={live ?? 'Starts now'} />
      </div>
      <p className="mt-2 px-[18px] text-[14px] leading-5 text-txt-90">{title}</p>
      <p className="mt-1 px-[18px] text-[11px] text-muted">Dared by {person(daredBy).handle} · {w.name} · {subWorldName(world, sub)}</p>
      <div className="mx-[18px] mt-3 overflow-hidden rounded-[18px] border border-dashed p-4" style={{ borderColor: alpha(c, 0.5), background: `linear-gradient(160deg, ${alpha(c, 0.14)}, var(--panel) 70%)` }}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[12px]" style={{ background: alpha('var(--cyan)', 0.14), color: 'var(--cyan)' }}><Users size={20} /></span>
          <div className="flex-1">
            <p className="font-display text-[15px] font-bold">Waiting for the first creators</p>
            <p className="text-[12px] text-muted">Up to 10 can enter · fans unlock and vote</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {invited.length ? invited.map((i) => <Avatar key={i} id={i} size={28} to={false} />) : <Tag accent="cyan">Open to all</Tag>}
          <span className="ml-auto flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-cyan" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />)}</span>
        </div>
      </div>
    </section>
  );
}

/** Un fan ne poste pas de vidéo : on prend un visuel du monde pour l'aperçu. */
export function FanEntryNote({ world, onReady }: { world: string; onReady: (id: string) => void }) {
  const v = videos.find((x) => x.world === world) ?? videos[0];
  useEffect(() => { onReady(v.id); }, [v.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="mt-6 px-[18px]">
      <div className="flex items-center gap-3 rounded-[16px] border px-3.5 py-3" style={{ borderColor: alpha('var(--cyan)', 0.35), background: alpha('var(--cyan)', 0.06) }}>
        <Users size={18} className="text-cyan" />
        <p className="text-[12px] leading-[17px] text-txt-90">As a fan you set the dare, creators bring the videos, and you vote for the best one.</p>
      </div>
    </section>
  );
}
