import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useDemo } from '../lib/store';
import { LayoutGrid, Sparkle, Trophy, User } from '../ui/Icon';

/** Figma BottomNav 33:30 : pilule flottante, FAB or au centre. */
export function BottomNav() {
  const role = useDemo((s) => s.role);
  const open = useDemo((s) => s.openSheet);
  const { pathname } = useLocation();
  const items = [
    { to: '/', label: 'DISCOVER', icon: Sparkle, match: (p: string) => p === '/' || p.startsWith('/video') },
    { to: '/worlds', label: 'WORLDS', icon: LayoutGrid, match: (p: string) => p.startsWith('/world') },
    null,
    { to: '/podium', label: 'PODIUM', icon: Trophy, match: (p: string) => p.startsWith('/podium') || p.startsWith('/awards') },
    { to: role === 'creator' ? '/me/creator' : '/me/fan', label: 'PROFILE', icon: User, match: (p: string) => p.startsWith('/me/') || p.startsWith('/joker') },
  ];
  return (
    <div className="shrink-0">
      <nav className="flex h-[calc(68px+env(safe-area-inset-bottom))] items-center justify-around rounded-t-[22px] border-t border-line bg-[#120c1c] px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,.45)]">
        {items.map((it, i) => {
          if (!it) {
            return (
              <motion.button key="fab" whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.04 }} onClick={() => open('create')} aria-label="Create"
                className="grid h-[52px] w-[52px] place-items-center rounded-[16px] text-on-gold shadow-[0_8px_24px_-6px_rgba(255,182,39,.7),inset_0_1px_0_rgba(255,255,255,.5)]" style={{ background: 'var(--grad-gold-cta)' }}>
                <Sparkle size={24} fill="currentColor" />
              </motion.button>
            );
          }
          const active = it.match(pathname);
          const I = it.icon;
          return (
            <NavLink key={i} to={it.to} className="relative flex w-[64px] flex-col items-center gap-1 py-1">
              {active && <motion.span layoutId="navglow" className="absolute -top-1 h-1 w-6 rounded-full bg-gold" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <I size={20} className={active ? 'text-gold' : 'text-muted'} fill={active && it.label === 'DISCOVER' ? 'currentColor' : 'none'} />
              <span className={`font-display text-[10px] font-bold tracking-[.6px] ${active ? 'text-gold' : 'text-muted'}`}>{it.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
