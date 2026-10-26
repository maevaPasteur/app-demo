import { IdentityFlow } from '../Identity';

// Étape vérification d'identité du parcours créateur : réutilise le flux de l'écran Identity (Figma 154:1016).
export function IdentityStep({ onDone, onLater }: { onDone: () => void; onLater: () => void }) {
  return <IdentityFlow embedded onDone={onDone} onLater={onLater} />;
}
