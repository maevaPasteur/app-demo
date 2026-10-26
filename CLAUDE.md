# CLAUDE.md · DaresOnly demo investisseur

Site **statique, front only, jetable** : la démo mobile complète de DaresOnly pour les investisseurs. Ce code ne sera **pas** réutilisé pour le vrai produit (le monorepo `~/Documents/daresonly-design` et son `ARCHITECTURE.md` ne s'appliquent pas ici). Objectif : fidélité au Figma, fluidité, effet « wow ». Rapidité > propreté.

## Lancer

```bash
npm i
npm run dev        # http://localhost:5173 (ouvrir en vue mobile, ou sur téléphone via l'IP locale avec --host)
npm run build      # dist/ statique, base './'
npm run preview    # sert dist/
npm run phone      # même chose que dev, accessible depuis un téléphone sur le même wifi (URL Network affichée)
npm run check      # typecheck + règle « aucun tiret long »
```

La démo démarre **toujours sur l'inscription** (`#/welcome`) : l'état est en mémoire, un rechargement repart de zéro. Pour sauter l'inscription pendant le dev : ouvrir `#/__screens` (index de tous les écrans).

## Non référencé

La démo ne doit **jamais** être indexée : meta `robots` / `googlebot` en `noindex, nofollow…` dans `index.html`, `public/robots.txt` qui bloque tout (y compris les crawlers IA), header `X-Robots-Tag` servi en dev/preview (`vite.config.ts`), sur Vercel (`vercel.json`), Netlify / Cloudflare Pages (`public/_headers`) et Apache (`public/.htaccess`). Aucun appel réseau externe (polices et icônes embarquées). Ne pas retirer ces fichiers.

## Stack

Vite 6 · React 19 · TypeScript · Tailwind 3 · react-router 6 (`HashRouter`) · zustand · framer-motion 11 · lucide-react · polices embarquées (@fontsource, la démo marche hors ligne). Pas de back.

## Où est quoi

| Chemin | Rôle |
|---|---|
| `src/screens/registry.ts` | Les 26 routes : nom, node id Figma, BottomNav ou non |
| `src/screens/routes.tsx` | Route → composant (imports statiques : navigation instantanée) |
| `src/screens/*.tsx` | Un fichier par écran. `parts/` = morceaux propres à un écran |
| `src/screens/Onboarding.tsx` | Inscription : splash, slides, sign up, rôle Fan/Creator, mondes, follow (fan) ou profil + vérif d'identité (creator), écran final |
| `src/cards/` | Cartes du feed : `DuelCard`, `DareCard`, `DropCard`, `WinnerCard`, `FreeMediaCard`, `RisersBlock`, `VideoThumb`, dispatcher `ChallengeCard` / `FeedItemView` |
| `src/ui/` | Kit DS : `Button`, `Tag`, `Chip`, `Avatar` (anneaux), `Medal`, `ProgressBar`, `TugBar`, `Counter`, `NavHeader`, `Card`, `Reveal`, `Rail`, `Timer`… et `Icon.tsx` (lucide) |
| `src/components/` | `PhoneFrame`, `TopBar`, `BottomNav`, `PaySheet` (faux Apple Pay), `Sheet`, `GlobalSheets` (création, notifications, recherche, filtres), `Toast`, `Burst` (confettis), `Media` (vidéo) |
| `src/lib/store.ts` | État de démo : rôle, inscription, unlock, votes, follow, subscribe, like, sheets, toasts |
| `src/data/demo.json` | **Contenu de la démo** : créateurs, fans, mondes, vidéos, challenges, feed, classements, awards, earnings, joker, messages, inscription |
| `src/data/screens/*.json` | Textes d'interface propres à certains écrans |
| `src/data/index.ts` | Types + accesseurs (`creator(id)`, `video(id)`, `challenge(id)`, `fmtPrice`…) |
| `public/media/` | `videos/` (exemples par monde), `posters/`, `avatars/` |
| `scripts/assign-videos.mjs` | Remplace les vidéos d'exemple par les vraies |

## Vidéos

Les vidéos sont les vrais clips de démo : `public/media/videos/clip-01.mp4` à `clip-13.mp4` (720x1280 H.264, AAC, `faststart`), avec leurs posters dans `public/media/posters/clip-XX.jpg`. Chaque vidéo de `demo.json` pointe vers un clip via `src`, `poster` et `clip` (les clips sont répartis par monde et ne se suivent jamais deux fois d'affilée). Pour changer un clip : modifier `src` / `poster` de l'entrée, ou relancer `node scripts/assign-videos.mjs <dossier>`.

## Interactions

Aucun cul-de-sac : chaque bouton fait quelque chose.
- Unlock, vote, subscribe, drop, tip, request : `useDemo().ask({...})` ouvre `PaySheet` (choix du créateur pour un duel, montants pour un tip), puis l'état passe à payé + toast
- Follow, like, save : toggles dans le store
- FAB central : feuille Create (dare pour tous, duel et drop pour les créateurs)
- Profil : « View as creator / View as fan » bascule le rôle ; « Restart demo » relance l'inscription
- Vidéos : poster immédiat, lecture muette uniquement quand visible, chargement N+1 max

## Règles maison (non négociables)

- **Jamais d'em dash (U+2014) ni d'en dash (U+2013)**, nulle part. Vérifier : `node scripts/check-dashes.mjs` (0 résultat attendu).
- **Une couleur = une fonction** : OR = marque, argent, prestige, médailles · ROSE (`hot`) = Follow, live, timers · VIOLET (`cool`) = Subscribe · CYAN = vote, unlock, compétition · VERT = free · ROUGE = danger. Titres de cartes neutres.
- **Concept v2** : paiement immédiat au créateur. **Aucun wallet, solde ou escrow.** Saison = 2 semaines.
- **Aucun contenu adulte** : mondes génériques Content, Art, Music, Dance, Action, Gaming.
- **Classements** : global, par monde, par sous-monde, en « This season » et « All-time ». Récompenses = **uniquement médailles or, argent, bronze**. **Jamais** de ceinture, palier, division ou promotion.

## Modifier un écran

1. `get_screenshot` Figma (fichier `ZrX34oJ2Sy2wJSELqhHJyg`, page Screens `88:2`, node id dans `registry.ts`)
2. Éditer `src/screens/<Écran>.tsx`, textes dans `demo.json` ou `src/data/screens/<Écran>.json`
3. Vérifier en 392 px de large
