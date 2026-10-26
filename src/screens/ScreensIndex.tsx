import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { messages } from '../data';
import { useDemo } from '../lib/store';
import { screens } from './registry';

// Index caché (#/__screens) pour naviguer pendant la démo. Ouvrir cet index saute l'inscription.
function resolve(path: string) {
  return path
    .replace('/video/:id', '/video/v01')
    .replace('/world/:id', '/world/content')
    .replace('/creator/:handle', '/creator/nova.rey')
    .replace('/fan/:handle', '/fan/lena_k')
    .replace('/messages/:id', `/messages/${messages.threads[0].id}`)
    .replace(':state', 'verified');
}

export default function ScreensIndex() {
  useEffect(() => { useDemo.setState({ onboarded: true }); }, []);
  const groups = [...new Set(screens.map((s) => s.group))];
  return (
    <div className="px-4 pb-10 pt-6">
      <h1 className="font-display text-[26px] font-bold">Demo screens</h1>
      <p className="mb-6 text-[13px] text-muted">{screens.length} screens</p>
      {groups.map((g) => (
        <section key={g} className="mb-6">
          <h2 className="eyebrow mb-2 text-muted">{g}</h2>
          <ul className="divide-y divide-line rounded-[16px] border border-line bg-panel">
            {screens.filter((s) => s.group === g).map((s) => (
              <li key={s.path}><Link to={resolve(s.path)} className="flex items-center justify-between px-4 py-3 text-[14px]"><span>{s.name}</span><span className="text-[11px] text-muted-2">{s.figma}</span></Link></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
