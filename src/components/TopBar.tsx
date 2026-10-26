import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { startAmbient, useUnreadCount } from '../lib/messagesStore';
import { notifications } from '../data';
import { useDemo } from '../lib/store';
import { IconButton } from '../ui';
import { Bell, Mail, Search } from '../ui/Icon';

/** Figma TopBar 33:4 */
export function TopBar() {
  const open = useDemo((s) => s.openSheet);
  const unread = useUnreadCount();
  useEffect(() => startAmbient(), []);
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-bg/95 px-[18px] backdrop-blur-xl">
      <Link to="/" className="font-display text-[15px] font-bold tracking-[2px]"><span className="text-gold">Dares</span><span className="text-txt">Only</span></Link>
      <div className="flex items-center gap-2">
        <IconButton label="Search" onClick={() => open('search')}><Search size={18} /></IconButton>
        <Link to="/messages" className="relative">
          <IconButton label="Messages"><Mail size={18} /></IconButton>
          <AnimatePresence>
            {unread > 0 && (
              <motion.span key={unread} initial={{ scale: 0.3 }} animate={{ scale: [0.3, 1.25, 1] }} exit={{ scale: 0 }}
                className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-bg bg-hot px-1 text-[10px] font-bold text-white">
                {unread > 99 ? '99+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <IconButton label="Notifications" dot={notifications.length > 0} onClick={() => open('notifications')}><Bell size={18} /></IconButton>
      </div>
    </header>
  );
}
