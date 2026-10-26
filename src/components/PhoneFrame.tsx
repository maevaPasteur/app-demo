import { useEffect, useRef, type ReactNode } from 'react';

// Desktop : téléphone 392x844 centré (réduit si la fenêtre est basse). Mobile (<640px) : plein écran, safe areas respectées.
// bottom = barre de navigation dans le flux (le contenu scrolle au-dessus, les éléments sticky bottom restent visibles).
// overlay = éléments flottants (sheets, toasts) rendus hors du conteneur scrollable.
// --app-h = hauteur visible de la zone de contenu, pour les écrans plein cadre (player, stories, chat).
export function PhoneFrame({ children, overlay, bottom }: { children: ReactNode; overlay?: ReactNode; bottom?: ReactNode }) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--app-h', `${el.clientHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="min-h-full w-full bg-[radial-gradient(ellipse_at_top,#1d1230_0%,#000_70%)] sm:flex sm:h-[100dvh] sm:items-center sm:justify-center sm:overflow-hidden sm:py-3">
      <div className="relative mx-auto flex h-[100dvh] w-full flex-col overflow-hidden bg-bg sm:h-[min(844px,calc(100dvh-24px))] sm:w-[392px] sm:rounded-[48px] sm:shadow-[0_0_0_10px_#111,0_0_0_12px_#2a2a2a,0_40px_120px_rgba(123,92,255,.25)]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-[100] hidden h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black sm:block" />
        <div className="relative z-[99] hidden h-[40px] shrink-0 items-center justify-between bg-bg px-8 pt-1 font-body text-[14px] font-semibold text-txt sm:flex">
          <span>9:41</span>
          <span className="flex items-center gap-1.5">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 2.2c2 0 3.8.8 5.1 2.1l1.1-1.1A8.7 8.7 0 0 0 7.5.6 8.7 8.7 0 0 0 1.3 3.2l1.1 1.1a7.2 7.2 0 0 1 5.1-2.1zm0 3.2c1.1 0 2.1.4 2.8 1.2l1.1-1.1a5.6 5.6 0 0 0-7.8 0l1.1 1.1c.7-.8 1.7-1.2 2.8-1.2zm0 3.2-1.6 1.6L7.5 11l1.6-1.8z" /></svg>
            <svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><rect x="23" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" /></svg>
          </span>
        </div>
        <div ref={scroll} id="app-scroll" className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[env(safe-area-inset-top)] sm:pt-0">
          {children}
        </div>
        {bottom}
        {overlay}
      </div>
    </div>
  );
}
