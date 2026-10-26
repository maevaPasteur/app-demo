import { Bolt, Clapperboard, Dumbbell, Footprints, Gamepad2, Heart, Music, Palette, Sparkles, Sun, WandSparkles } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const map: Record<string, React.ComponentType<LucideProps>> = {
  sparkles: Sparkles, palette: Palette, music: Music, dance: Clapperboard, bolt: Bolt, gamepad: Gamepad2,
  sun: Sun, wand: WandSparkles, footprints: Footprints, dumbbell: Dumbbell, heart: Heart,
};
// Icône par monde (le JSON donne un nom générique).
export function WorldIcon({ name, ...p }: { name: string } & LucideProps) {
  const I = name === 'dance' ? DanceIcon : map[name] ?? Sparkles;
  return <I {...p} />;
}
function DanceIcon(p: LucideProps) {
  // silhouette simple de danseur
  const s = (p.size as number) ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <circle cx="13" cy="4" r="2" /><path d="M4 9l5-1 4 2 4-3 3 1" /><path d="M13 10l-2 5 3 3v4" /><path d="M11 15l-4 3-2 4" />
    </svg>
  );
}
