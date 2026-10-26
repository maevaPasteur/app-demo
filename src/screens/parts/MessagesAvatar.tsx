import { Avatar, type Ring } from '../../ui';
import { Sparkles } from '../../ui/Icon';
import { isTeam } from '../../lib/messagesStore';

/** Avatar de contact : gère le compte officiel DaresOnly Team en plus des créateurs et fans. */
export function ContactAvatar({ id, size = 44, ring = 'none', online, to }: { id: string; size?: number; ring?: Ring; online?: boolean; to?: false }) {
  return (
    <span className="relative inline-block shrink-0 self-start" style={{ width: size, height: size }}>
      {isTeam(id) ? (
        <span className="grid place-items-center rounded-full text-on-gold" style={{ width: size, height: size, background: 'var(--grad-gold-cta)' }}>
          <Sparkles size={size * 0.45} fill="currentColor" />
        </span>
      ) : (
        <Avatar id={id} size={size} ring={ring} to={to} />
      )}
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg bg-green" />}
    </span>
  );
}
