import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useDemo } from '../lib/store';
import { CircleCheck } from '../ui/Icon';

export function Toast() {
  const toast = useDemo((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => useDemo.setState({ toast: null }), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  const c = toast ? `var(--${toast.tone === 'cool' ? 'cool' : toast.tone ?? 'gold'})` : '';
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+14px)] z-[90] flex justify-center px-6 sm:top-[54px]">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} initial={{ y: -40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex items-center gap-2 rounded-full border bg-[#150e1f]/95 px-4 py-2.5 text-[13px] font-semibold shadow-[0_12px_30px_rgba(0,0,0,.5)] backdrop-blur-xl" style={{ borderColor: `color-mix(in srgb, ${c} 45%, transparent)` }}>
            <CircleCheck size={17} style={{ color: c }} />{toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
