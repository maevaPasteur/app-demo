import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Monte une feuille au niveau du téléphone (au-dessus du scroll), même si la page est en position relative.
 * z-[65] : sous la feuille de paiement globale (z-70), pour que le paiement passe toujours au premier plan.
 */
export function PhonePortal({ children }: { children: ReactNode }) {
  const host = typeof document !== 'undefined' ? document.getElementById('app-scroll')?.parentElement : null;
  const layer = <div className="pointer-events-none absolute inset-0 z-[65] [&>*]:pointer-events-auto">{children}</div>;
  return host ? createPortal(layer, host) : layer;
}
