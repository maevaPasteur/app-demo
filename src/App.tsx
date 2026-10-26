import { motion } from 'framer-motion';
import { useLayoutEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { GlobalSheets } from './components/GlobalSheets';
import { PaySheet } from './components/PaySheet';
import { PhoneFrame } from './components/PhoneFrame';
import { Toast } from './components/Toast';
import { ActivityPill } from './components/ActivityPill';
import { useDemo } from './lib/store';
import { screens } from './screens/registry';
import { routeComponents } from './screens/routes';
import ScreensIndex from './screens/ScreensIndex';

const scrollMemo = new Map<string, number>();

function useScrollRestore(key: string) {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    const el = document.getElementById('app-scroll');
    if (!el) return;
    el.scrollTo(0, navType === 'POP' ? scrollMemo.get(key) ?? 0 : 0);
    const save = () => scrollMemo.set(key, el.scrollTop);
    el.addEventListener('scroll', save, { passive: true });
    return () => el.removeEventListener('scroll', save);
  }, [key, navType]);
}

export default function App() {
  const location = useLocation();
  const onboarded = useDemo((s) => s.onboarded);
  const key = location.pathname;
  useScrollRestore(key);
  // Menu du bas sur toutes les pages (Figma Layout 462:6137), sauf inscription et stories plein écran.
  const showNav = onboarded && !location.pathname.startsWith('/welcome') && !location.pathname.startsWith('/stories');
  const gated = !onboarded && !location.pathname.startsWith('/welcome') && location.pathname !== '/__screens';

  return (
    <PhoneFrame
      bottom={showNav ? <BottomNav /> : null}
      overlay={
        <>
          <GlobalSheets />
          <PaySheet />
          <Toast />
          <ActivityPill />
        </>
      }
    >
      {/* Pas d'AnimatePresence ici : une animation de sortie bloquée laisserait l'ancienne page affichée. Entrée seule, instantanée. */}
      <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="pb-6">
          {/* Tant que l'inscription n'est pas faite, toute URL (y compris la racine sans #) renvoie vers l'inscription. */}
          {gated ? <Navigate to="/welcome" replace /> : (
          <Routes location={location}>
            {screens.map((s) => {
              const C = routeComponents[s.path];
              return <Route key={s.path} path={s.path} element={<C />} />;
            })}
            <Route path="/__screens" element={<ScreensIndex />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          )}
      </motion.div>
    </PhoneFrame>
  );
}
