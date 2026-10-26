import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Démo privée : jamais indexée. Header X-Robots-Tag aussi en dev et en preview.
const noIndex = { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex' };

// base './' : le dist/ marche depuis n'importe quel hébergement statique ou sous-dossier.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { headers: noIndex },
  preview: { headers: noIndex },
});
