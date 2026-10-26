import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Bottom sheet glissable, utilisé pour paiement, création, notifications, filtres. */
export function Sheet({ open, onClose, children, full }: { open: boolean; onClose: () => void; children: ReactNode; full?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="scrim" className="absolute inset-0 z-[70] flex items-end bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className={`w-full overflow-hidden rounded-t-[28px] border-t border-line-strong bg-panel ${full ? 'h-[88%]' : 'max-h-[88%]'} flex flex-col`}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose(); }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 mt-3 h-1.5 w-10 shrink-0 rounded-full bg-line-strong" />
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
