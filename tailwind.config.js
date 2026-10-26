/** @type {import('tailwindcss').Config} */
// color-mix pour que les modificateurs d'opacité (bg-bg/85) fonctionnent avec des variables CSS.
const v = (n) => `color-mix(in srgb, var(--${n}) calc(<alpha-value> * 100%), transparent)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), 'bg-2': v('bg-2'), panel: v('panel'), 'panel-hi': v('panel-hi'), ink: v('ink-700'),
        line: v('line'), 'line-strong': v('line-strong'),
        txt: v('txt'), 'txt-90': v('txt-90'), silver: v('silver'), bronze: v('bronze'), muted: v('muted'), 'muted-2': v('muted-2'), inverse: v('txt-inverse'),
        gold: v('gold'), 'gold-soft': v('gold-soft'), 'gold-pale': v('gold-pale'), 'on-gold': v('on-gold'),
        hot: v('hot'), 'hot-soft': v('hot-soft'),
        cool: v('cool'), 'cool-300': v('violet-300'),
        cyan: v('cyan'), 'cyan-300': v('cyan-300'), 'cyan-600': v('cyan-600'), 'on-cyan': v('on-cyan'),
        green: v('green'), 'green-soft': v('green-soft'), 'on-green': v('on-green'),
        danger: v('danger'),
        media: v('media-placeholder'),
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { lg: '16px', xl: '20px' },
    },
  },
  plugins: [],
};
