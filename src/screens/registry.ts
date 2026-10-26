// Source de vérité des écrans de la démo. figma = node id dans le fichier ZrX34oJ2Sy2wJSELqhHJyg, page Screens (88:2).
// nav = la BottomNav flottante est affichée.
export type ScreenDef = {
  path: string;
  name: string;
  figma: string;
  group: 'Onboarding' | 'Feed' | 'Worlds' | 'Ranking' | 'Profile' | 'Create' | 'Joker' | 'Messages' | 'Settings';
  nav: boolean;
};

export const FIGMA_FILE = 'ZrX34oJ2Sy2wJSELqhHJyg';
export const figmaUrl = (node: string) => `https://www.figma.com/design/${FIGMA_FILE}/DaresOnly?node-id=${node.replace(':', '-')}`;

export const screens: ScreenDef[] = [
  { path: '/welcome', name: 'Onboarding (sign up, role, worlds, follow, identity)', figma: '', group: 'Onboarding', nav: false },

  { path: '/', name: 'Feed (Discover)', figma: '210:182', group: 'Feed', nav: true },
  { path: '/watch/:id', name: 'Immersive player (swipe)', figma: '662:13148', group: 'Feed', nav: false },
  { path: '/stories/:id', name: 'Stories (Your circle)', figma: '210:205', group: 'Feed', nav: false },
  { path: '/video/:id', name: 'Feed (Open video)', figma: '662:13148', group: 'Feed', nav: false },

  { path: '/worlds', name: 'Worlds', figma: '88:3', group: 'Worlds', nav: true },
  { path: '/world/:id', name: 'World (Content)', figma: '92:218', group: 'Worlds', nav: true },

  { path: '/podium', name: 'Podium', figma: '803:6618', group: 'Ranking', nav: true },
  { path: '/awards', name: 'Awards', figma: '119:589', group: 'Ranking', nav: true },
  { path: '/awards/all-time', name: 'Awards (All-time)', figma: '130:663', group: 'Ranking', nav: true },

  { path: '/me/creator', name: 'Profile · Creator (earnings + awards)', figma: '136:754', group: 'Profile', nav: true },
  { path: '/me/creator/payout', name: 'Profile · Creator (payout not set up)', figma: '143:1054', group: 'Profile', nav: true },
  { path: '/me/payout', name: 'Payout setup (flow)', figma: '143:1054', group: 'Profile', nav: false },
  { path: '/me/fan', name: 'Profile · Fan', figma: '143:1267', group: 'Profile', nav: true },
  { path: '/creator/:handle', name: 'Creator profile (public)', figma: '487:7369', group: 'Profile', nav: false },
  { path: '/fan/:handle', name: 'Fan profile (public)', figma: '778:7240', group: 'Profile', nav: false },

  { path: '/create/dare', name: 'Create dare', figma: '487:7231', group: 'Create', nav: false },
  { path: '/create/duel', name: 'Create duel', figma: '742:6775', group: 'Create', nav: false },
  { path: '/create/drop', name: 'Create drop', figma: '754:6929', group: 'Create', nav: false },

  { path: '/joker', name: 'Joker · Fan (progress)', figma: '492:7750', group: 'Joker', nav: true },
  { path: '/joker/finished', name: 'Joker · Fan (finished)', figma: '583:9148', group: 'Joker', nav: true },
  { path: '/joker/creator', name: 'Joker · Creator', figma: '488:7332', group: 'Joker', nav: true },
  { path: '/joker/invitations', name: 'Joker · All invitations', figma: '491:7671', group: 'Joker', nav: true },

  { path: '/messages', name: 'Messages', figma: '811:6828', group: 'Messages', nav: true },
  { path: '/messages/requests', name: 'Messages · Requests', figma: '818:7033', group: 'Messages', nav: true },
  { path: '/messages/:id', name: 'Message', figma: '815:6846', group: 'Messages', nav: false },
  { path: '/messages/:id/respond', name: 'Message · Respond', figma: '816:6893', group: 'Messages', nav: false },

  { path: '/settings/profile/:state', name: 'Edit profile (verified / pending / unverified)', figma: '149:987', group: 'Settings', nav: false },
  { path: '/settings/identity', name: 'Identity verification', figma: '154:1016', group: 'Settings', nav: false },
];
