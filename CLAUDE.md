# AstroTalk — Audit & Refactor Plan

> Audit complet du projet (backend + frontend + infra) avec une liste priorisée de
> ce qui peut être **corrigé**, **optimisé** ou **ajouté**, suivie d'un plan de
> refactor étape par étape.

---

## Sommaire

1. [Score global](#1-score-global)
2. [Bugs critiques](#2-bugs-critiques-à-corriger-en-premier)
3. [Sécurité](#3-sécurité)
4. [Backend — qualité & architecture](#4-backend--qualité--architecture)
5. [Frontend — qualité & architecture](#5-frontend--qualité--architecture)
6. [Performance](#6-performance)
7. [DX / Outillage / CI-CD](#7-dx--outillage--cicd)
8. [Docker / Infrastructure](#8-docker--infrastructure)
9. [Fonctionnalités à ajouter](#9-fonctionnalités-à-ajouter)
10. [Plan de refactor par étapes](#10-plan-de-refactor-par-étapes)

---

## 1. Score global

| Domaine       | État   | Commentaire                                                                                     |
| ------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Architecture  | Moyen  | MVC simple, pas de couche service, controllers trop chargés                                     |
| Sécurité      | Moyen  | JWT cookie OK, mais validations manquantes, pas de helmet, pas de CSRF strict, salt bcrypt = 10 |
| Performance   | Faible | Aucun index Mongo, pas de pagination, audios chargés eager, pas de code-splitting               |
| Tests         | Aucun  | 0 test, pas de runner configuré                                                                 |
| CI/CD         | Aucun  | Pas de GitHub Actions, pas de pre-commit                                                        |
| Docker        | Faible | Image mono-stage, énorme, pas de `.dockerignore`, pas de Mongo dans compose                     |
| Documentation | Bon    | README clair, mais des écarts avec le code (welcome email jamais envoyé, etc.)                  |

---

## 2. Bugs critiques (à corriger en premier)

### 2.1 React — violations des Rules of Hooks

- `frontend/src/components/ChatContainer.tsx:23` → `if (!selectedUser || !authUser) return null;`
  est placé **avant** les `useEffect` → React lèvera une erreur si l'état devient
  null après un montage.
- `frontend/src/components/ChatHeader.tsx:10` → même problème (`return null` avant `useEffect`).
- **Fix** : déplacer la garde **après** tous les `useEffect`, ou retourner un placeholder.

### 2.2 Welcome email jamais envoyé

- `backend/src/emails/emailHandlers.ts` existe et est documenté dans le README,
  mais `signup` (`auth.controller.ts`) ne l'appelle **jamais**.
- **Fix** : appeler `sendWelcomeEmail(...)` dans `signup` (idéalement non-bloquant).

### 2.3 `__dirname` cassé en production

- `backend/src/server.ts:15` → `// const __dirname = path.resolve();` est commenté
  mais `__dirname` est utilisé lignes 27/30. En CommonJS compilé, ça marche par
  hasard ; en module ESM, ça casse.
- **Fix** : restaurer `path.resolve()` (CommonJS) ou utiliser `fileURLToPath(import.meta.url)` si on passe en ESM.

### 2.4 Stale closure dans `subscribeToMessages`

- `frontend/src/store/useChatStore.ts:99` → capture `selectedUser` et `isSoundEnabled`
  au moment de la souscription. Si l'utilisateur change la sélection, le filtre
  reste basé sur l'ancien `selectedUser`.
- **Fix** : utiliser `useChatStore.getState()` à l'intérieur du callback `socket.on`.

### 2.5 Types socket dupliqués / conflictuels

- `backend/src/types/socket.d.ts` ET `backend/src/types/socket-io.d.ts` augmentent
  `socket.io.Socket` avec des shapes **différents** (le 2ᵉ rend `userId` non-optional
  et redéfinit `user` avec un autre type).
- **Fix** : supprimer `socket-io.d.ts`, garder une seule déclaration cohérente avec `UserDocument`.

### 2.6 `index.html` référence un fichier inexistant

- `frontend/index.html:17` → `<script src="/src/main.jsx">` mais le fichier est `main.tsx`.
  Vite tolère, mais c'est un bug latent.
- **Fix** : remplacer par `/src/main.tsx`.

### 2.7 `getMessagesByUserId` crash sur ID invalide

- `backend/src/controllers/message.controller.ts:94` → si `id` n'est pas un ObjectId
  valide Mongoose lève un CastError → 500 au lieu de 400.
- **Fix** : valider via `mongoose.isValidObjectId(id)` ou middleware Zod.

### 2.8 Search regex ReDoS

- `message.controller.ts:36-39` → `{ $regex: search, $options: "i" }` injecte la
  string brute. Vulnérable à ReDoS (`a+a+a+...`) et permet syntaxe regex hostile.
- **Fix** : échapper les caractères regex (`search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`).

### 2.9 Backend `tsconfig` incohérent

- `module: "CommonJS"` mais imports avec extension `.js` (style ESM).
- `"type": "commonjs"` dans `package.json` mais on importe `auth.route.js` etc.
- Fonctionne grâce à TS, mais déroutant. À aligner sur `NodeNext` + `"type": "module"`.

---

## 3. Sécurité

### 3.1 Express

- ❌ Pas de `helmet()` (headers sécurité).
- ❌ Pas de limite de taille sur `express.json()` → DoS via gros payload (les images
  arrivent en base64 dans le body !). Ajouter `{ limit: "10mb" }`.
- ❌ Pas de middleware d'erreur global.
- ❌ `cors` autorise une seule origin — OK, mais pas de pré-flight strict.

### 3.2 Auth

- 🔸 `bcrypt` salt rounds = **10** → passer à **12** (recommandé OWASP 2024).
- 🔸 Pas de politique de mot de passe (uppercase/lowercase/digit/spécial).
- 🔸 `protectRoute` retourne `404` quand l'utilisateur n'existe plus → fuite d'info.
  Retourner `401`.
- 🔸 Pas de gestion `TokenExpiredError` vs `JsonWebTokenError` → tout est 401 générique.
- 🔸 Pas de **refresh token** → l'utilisateur est délogé après 7 jours.
- 🔸 `logout` ne propage pas `httpOnly/secure/sameSite` au reset du cookie.
- 🔸 Pas de rate-limit **spécifique** au login (Arcjet global = 100/min, trop laxiste).
- 🔸 Email regex énorme inline → préférer `validator.isEmail()` ou `zod.email()`.

### 3.3 Validation des entrées

- ❌ Pas de validator (Zod / Joi / class-validator).
- ❌ Chaque controller fait sa propre validation à la main → bugs et duplication.
- **Fix** : créer `middleware/validate.ts` + schémas Zod par route.

### 3.4 Upload Cloudinary

- ❌ Pas de validation côté serveur du type / taille / dimensions de l'image.
- ❌ Pas de transformations (resize / quality / format auto).
- ❌ Si l'upload réussit puis Mongo échoue → image orpheline.
- **Fix** : valider, transformer (`resource_type: image`, `transformation: [{ quality: "auto" }]`), et idéalement utiliser un signed upload côté client.

### 3.5 CSRF

- `sameSite: "strict"` couvre la majorité. OK pour un MVP. Pour aller plus loin :
  double-submit cookie ou token CSRF dédié.

### 3.6 Secrets / Env

- `.env.example` ne contient **que des noms de variables** sans exemple → peu utile.
- `.env` est dans `.gitignore` ✅. Vérifier qu'il n'a jamais été commité (`git log -- .env`).

---

## 4. Backend — qualité & architecture

### 4.1 Architecture

- Pas de **couche service** : la business logic est dans les controllers.
- Pas de **DTO** ou **mapper** : les `Message` / `User` sont retournés tels quels
  (avec `__v`, parfois `password` si oublié).
- `controllers/` font validation + DB + I/O Cloudinary + emission socket → SRP brisé.
- **Recommandation** :
  ```
  src/
    api/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.schema.ts   ← Zod
        auth.route.ts
    domain/
      user/ message/
    infra/
      db/ socket/ cloudinary/ resend/
    shared/
      errors/ logger/ middleware/
  ```

### 4.2 Mongoose

- ❌ **Aucun index** sur `Message` → `find({$or:[{senderId,receiverId},...]})` est un full scan.
  - Ajouter `messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 })`.
  - Ajouter `messageSchema.index({ receiverId: 1, createdAt: -1 })`.
- `User.email` : ajouter `lowercase: true`, `trim: true`, `index: true` (unique déjà OK).
- `User.fullName` `minlength: 8` → bug : "Bob" ne pourra pas s'inscrire ! Mettre `minlength: 2`.
- Ajouter `toJSON: { transform }` pour retirer `password`, `__v`.

### 4.3 Endpoints

- `GET /messages/:id` retourne **tous** les messages sans pagination → cassera la
  scalabilité. Ajouter `?limit=50&before=<msgId>` (cursor pagination).
- `GET /messages/contacts` retourne **tous** les users → idem, ajouter pagination + search.
- Le search côté serveur est déjà câblé mais le frontend ne l'utilise jamais.
- `GET /messages/chats` fait 2 round-trips (messages → users) ; on peut faire 1
  pipeline d'agrégation qui ramène déjà partenaire + dernier message + count unread.

### 4.4 Sockets

- L'événement `getOnlineUsers` est broadcast à **tout le monde** à chaque
  connect/disconnect → ne scale pas. Émettre seulement aux pairs concernés.
- Pas d'événements `typing`, `messageRead`, `messageDelivered`.
- Pas de namespace ni de room → tous les events globaux.

### 4.5 Logging / Observabilité

- Tout est `console.log` → installer `pino` + `pino-http`.
- Pas de `/health` ni `/ready`.
- Pas de tracking d'erreurs (Sentry).

### 4.6 Routes — incohérences mineures

- `auth.route.ts` : ordre des middlewares varie (`arcjetProtection, protectRoute`
  vs `protectRoute, arcjetProtection`). Standardiser.
- Arcjet sur `/logout` n'a pas de sens (utilisateur déjà déconnecté → peu d'impact).

### 4.7 Fichiers obsolètes / dupliqués

- `backend/src/types/index.d.ts` : **vide**.
- `backend/src/types/socket.ts` (`AuthenticatedSocketData`) : jamais utilisé.
- `backend/src/types/socket-io.d.ts` : redondant avec `socket.d.ts` et conflictuel.
- `backend/dist/` est commité ? Vérifier (`.gitignore` couvre `dist` ✅).

---

## 5. Frontend — qualité & architecture

### 5.1 TypeScript / Lint

- `eslint.config.js` ne couvre que `**/*.{js,jsx}` → **aucun fichier `.ts/.tsx` n'est linté** !
- Pas de `typescript-eslint` configuré.
- `tsconfig.json` n'a pas de `include` ni de `compilerOptions.outDir` → comportement implicite.

### 5.2 Types dupliqués

- `User` défini dans `types/index.d.ts` ET `ChatUser` dans `types/message.d.ts`
  (mêmes champs).
- `Message` défini deux fois (avec et sans `isOptimistic`).
- `AuthStore.socket: Socket | null` mais `Socket` n'est jamais importé → `any` silencieux.

### 5.3 Stores

- `useAuthStore` : duplication massive du try/catch toast pour chaque action.
  Extraire un wrapper `withToast(fn)`.
- `useChatStore.subscribeToMessages` :
  - Stale closure sur `isSoundEnabled` et `selectedUser` (voir §2.4).
  - Ne met pas à jour la liste des chats quand un message arrive d'un **nouvel**
    interlocuteur (le chat n'apparaît qu'après refresh).
  - `unsubscribeFromMessages` fait `socket.off("newMessage")` sans handler de
    référence → vire potentiellement des handlers d'autres composants.

### 5.4 Composants

- `ChatContainer.tsx` & `ChatHeader.tsx` : violations des Rules of Hooks (§2.1).
- `ProfileHeader.tsx` :
  - `authUser` non-null déstructuré → crash si null. Ajouter garde.
  - `playClickSound()` recharge un `Audio` à chaque clic → préférer un singleton.
  - "Online" affiché en dur (pas basé sur la connexion réelle).
- `MessageInput.tsx` :
  - Cleanup `URL.revokeObjectURL` inutile : on utilise `readAsDataURL` (string), pas de blob URL.
  - Le `useEffect` qui écoute Escape duplique du code avec `ChatHeader`.
- `pages/LoginPage.tsx` et `SignUpPage.tsx` importent `react-router` au lieu de
  `react-router-dom` (le reste utilise `react-router-dom`). Mélange dangereux.
- `App.tsx:14` : `useAuthStore.getState().checkAuth()` au lieu de prendre
  `checkAuth` du hook → fonctionne mais incohérent avec le pattern Zustand.

### 5.5 UI/UX

- Pas de **search bar** côté frontend (le backend la supporte déjà).
- Pas de **show password**.
- Pas d'**indicateur de force** de mot de passe.
- Pas de **typing indicator**.
- Pas de **read receipts**.
- Pas de **unread counter** par chat.
- Pas de **notifications** desktop (Notification API) pour messages reçus alors
  que la conversation n'est pas ouverte.
- Pas d'**emoji picker**.
- Pas de **dark/light mode** (DaisyUI le permettrait gratuitement).
- Pas de **mobile responsive** correct : sidebar 320px fixe, écran mobile cassé.
- `react-router-dom v7` : utiliser `<Outlet>` + layout route pour le background animé
  plutôt que le dupliquer dans `App.tsx`.

### 5.6 Accessibilité

- `<img>` sans `alt` significatif partout (e.g. `alt="Shared"`).
- Pas de focus ring sur boutons custom.
- Police chargée en **18 weights × 2 italics** depuis Google Fonts ! Réduire à 3-4 weights.

---

## 6. Performance

### 6.1 Backend

- Indexes Mongo manquants (voir §4.2).
- `getChatPartners` : remplacer par une `aggregate` qui ramène en 1 query.
- Cloudinary upload synchrone côté serveur → migrer vers **signed upload direct
  client→Cloudinary** (épargne la bande passante backend).

### 6.2 Frontend

- `useKeyBoardSound.ts` instancie 4 `Audio` au **chargement du module** même si
  le son est désactivé. Lazy-init dans le hook au premier `play()`.
- Pas de `React.memo` sur `ChatsList`, `ContactList`, items.
- Pas de **code-splitting** : `React.lazy(() => import('./pages/ChatPage'))`.
- Images chargées sans `loading="lazy"`.
- Google Fonts : trop de variantes (`100..900` + italics) → ~200 KB. Limiter à
  `wght@400;500;600;700`.
- Bundle non analysé : ajouter `rollup-plugin-visualizer`.

### 6.3 Socket

- `io.emit("getOnlineUsers", …)` broadcast complet à chaque connect → O(N²).
  Émettre seulement aux contacts concernés ou throttler.

---

## 7. DX / Outillage / CI-CD

### 7.1 Manquants

- ❌ Pas de **tests** (vitest / jest + supertest / playwright).
- ❌ Pas de **Prettier** + `.prettierrc`.
- ❌ Pas de **Husky** + `lint-staged` (pre-commit).
- ❌ Pas de **GitHub Actions** (CI : lint + tests + build).
- ❌ Pas de **Dependabot** / Renovate.
- ❌ Pas de **commitlint** + conventional commits.

### 7.2 ESLint

- Étendre à `.ts/.tsx` avec `typescript-eslint`.
- Activer `react-hooks/exhaustive-deps`.

### 7.3 README vs Code

- README dit "welcome email" → pas câblé.
- README dit `VITE_API_URL` → pas utilisé (logique dans `lib/axios.ts` hardcodée).
- API doc README : `GET /api/v1/messages/contacts` → endpoint existe mais search query non documentée.

### 7.4 Scripts racine

- `package.json` racine : ajouter `dev` (concurrent backend + frontend),
  `lint`, `test`, `format`, `typecheck`.
- Utiliser `concurrently` ou `npm-run-all`.

---

## 8. Docker / Infrastructure

### 8.1 Dockerfile actuel — problèmes

- **Mono-stage** : dev-deps embarqués dans l'image finale.
- Copie le repo entier (pas de `.dockerignore`) → `node_modules`, `.git`, `.env` peuvent atterrir dans l'image.
- Pas de USER non-root.
- Pas de `HEALTHCHECK`.
- Pas de cache layer optimisé (copie package.json séparément avant `COPY .`).

### 8.2 Refactor Dockerfile (multi-stage)

```dockerfile
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix backend && npm ci --prefix frontend

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY backend ./backend
COPY frontend ./frontend
RUN npm run build --prefix backend && npm run build --prefix frontend

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package*.json ./backend/
COPY --from=build /app/frontend/dist ./frontend/dist
RUN npm ci --omit=dev --prefix backend
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "backend/dist/server.js"]
```

### 8.3 `.dockerignore` à créer

```
node_modules
**/node_modules
**/dist
.git
.env
.env.*
*.md
.idea
.vscode
```

### 8.4 docker-compose

- Ajouter un service **MongoDB** (`mongo:7`).
- Ajouter `depends_on` + `healthcheck`.
- Le volume `./data:/app/data` ne sert à rien actuellement (le code ne lit ni
  n'écrit `/app/data`). Le retirer ou pointer vers le volume Mongo.
- Injecter les secrets via `env_file: ./backend/.env` plutôt que les hardcoder.

---

## 9. Fonctionnalités à ajouter

### Haute valeur

1. **Welcome email** réellement envoyé (câblage existant).
2. **Search bar** dans Contacts/Chats (backend prêt).
3. **Typing indicator** (socket event `typing` + debounce 1s).
4. **Read receipts** (`messageRead` event + champ `readAt` sur `Message`).
5. **Unread badge** par conversation.
6. **Pagination** des messages (cursor before/after).
7. **Notifications navigateur** quand fenêtre inactive (`Notification.requestPermission()`).
8. **Mobile responsive** (toggle sidebar/chat).

### Valeur moyenne

9. **Edit / Delete message** + champ `editedAt`, `deletedAt`.
10. **Réponse à un message** (champ `replyTo: ObjectId`).
11. **Réactions emoji**.
12. **Emoji picker** dans MessageInput.
13. **Groupes / conversations à plusieurs** (refactor model : `Conversation` + `Participant`).
14. **Recherche dans les messages** (text index Mongo).
15. **Refresh tokens** + rotation.
16. **2FA** (TOTP) ou login Google OAuth.
17. **Dark/Light theme switcher** (DaisyUI themes).

### Tech / nice-to-have

18. **Service worker** + offline cache (PWA).
19. **i18n** (français en plus de l'anglais — pertinent vu la base utilisateur).
20. **Tests E2E** Playwright sur le golden path (signup → chat → message).
21. **Monitoring** (Sentry + pino → Loki).

---

## 10. Plan de refactor par étapes

> Chaque étape est conçue pour être **mergeable indépendamment** et **non-bloquante**
> pour la suivante. Estimation: 2-4 semaines à temps partiel.

### Étape 1 — Quick wins & bugs critiques (1 jour)

**Objectif** : stabiliser sans changer l'architecture.

1. Corriger les Rules of Hooks dans `ChatContainer` et `ChatHeader`.
2. Corriger `index.html` → `main.tsx`.
3. Restaurer `__dirname` dans `server.ts`.
4. Supprimer `backend/src/types/socket-io.d.ts`, vider/supprimer `types/index.d.ts`, supprimer `types/socket.ts` inutilisé.
5. Corriger `User.fullName.minlength` (8 → 2).
6. Fixer l'imports `react-router` → `react-router-dom` dans Login/SignUp.
7. Câbler `sendWelcomeEmail` dans `signup` (fire & forget avec `.catch(console.error)`).
8. Étendre ESLint aux fichiers `.ts/.tsx`.

### Étape 2 — Validation & sécurité (2-3 jours)

1. Installer `zod`, créer `middleware/validate.ts`.
2. Schémas `signupSchema`, `loginSchema`, `sendMessageSchema`, `updateProfileSchema`.
3. Remplacer toutes les validations inline.
4. Installer `helmet`, l'ajouter dans `server.ts`.
5. `express.json({ limit: '10mb' })`.
6. bcrypt rounds 10 → 12.
7. `protectRoute` : 404 → 401.
8. Gérer `TokenExpiredError` séparément.
9. Échapper le regex de search (`escapeRegex`).
10. Valider `req.params.id` est un ObjectId (`mongoose.isValidObjectId`).
11. `User` schema : `email.lowercase: true, trim: true`, `toJSON.transform` qui supprime `password` et `__v`.

### Étape 3 — Indexes & performance DB (1 jour)

1. Indexes Mongo :
   - `Message`: `{ senderId: 1, receiverId: 1, createdAt: -1 }`
   - `Message`: `{ receiverId: 1, createdAt: -1 }`
2. Réécrire `getChatPartners` en une seule agrégation (lookup + group + sort).
3. Ajouter pagination cursor sur `getMessagesByUserId` (`?before=<msgId>&limit=50`).
4. Ajouter pagination/search sur `/contacts`.

### Étape 4 — Architecture backend (3-5 jours)

1. Introduire la couche **service** :
   ```
   src/api/auth/auth.service.ts
   src/api/message/message.service.ts
   ```
2. Controllers ne font plus que : valider input (déjà via middleware) → appeler service → renvoyer.
3. Centraliser les erreurs : classe `AppError` + `errorHandler` middleware.
4. Logger structuré : `pino` + `pino-http`.
5. Endpoint `/health` (DB ping + return 200).
6. Aligner `tsconfig` + `package.json` : passer en `"type": "module"` + `NodeNext`, ou inversement supprimer les `.js` des imports.
7. Standardiser l'ordre des middlewares routes (toujours `arcjet → protect → handler`).
8. Retirer arcjet de `/logout`.

### Étape 5 — Refactor frontend (3-5 jours)

1. Dédupliquer les types : un seul `User`, un seul `Message` dans `types/`.
2. Wrapper `withToast(fn)` dans `useAuthStore` / `useChatStore`.
3. Corriger les stale closures de `subscribeToMessages` (`getState()` dans le callback).
4. Fixer `unsubscribeFromMessages` (handler référence ou `socket.off("newMessage", handler)`).
5. Mettre à jour la liste `chats` quand un message arrive d'un nouvel interlocuteur.
6. Lazy-load les pages : `React.lazy` + `<Suspense>`.
7. `React.memo` sur items de liste.
8. Lazy-init des `Audio` dans `useKeyboardSound`.
9. Single `Audio` singleton pour le click sound.
10. Couper les fontes Google à 4 weights max.
11. Mobile responsive (`md:` partout, sidebar drawer en mobile).

### Étape 6 — UX & nouvelles fonctionnalités (1-2 semaines)

1. **Search bar** dans Contacts (utiliser `?search=`).
2. **Show password** + force du mot de passe (zxcvbn).
3. **Pagination scroll-infinite** dans les messages.
4. **Typing indicator** (socket `typing` + Map throttle).
5. **Read receipts** (champ `readAt`, event `messageRead`).
6. **Unread badge** par chat (count via aggregation ou champ dénormalisé).
7. **Browser notifications** quand fenêtre inactive.
8. **Dark/Light** DaisyUI themes.

### Étape 7 — Docker, CI/CD, observabilité (2-3 jours)

1. `.dockerignore`.
2. Dockerfile **multi-stage** (cf. §8.2).
3. `docker-compose.yml` complet : app + mongo + (optionnel) mongo-express.
4. **GitHub Actions** :
   - `lint` (eslint + prettier check + tsc --noEmit)
   - `test` (vitest + supertest)
   - `build` (`docker buildx`)
5. Husky + lint-staged.
6. Prettier.
7. Sentry SDK (backend & frontend) si on veut aller jusqu'au monitoring.

### Étape 8 — Tests (2-4 jours en // des autres étapes)

1. Backend :
   - `vitest` + `supertest` + `mongodb-memory-server`.
   - Tests d'intégration des routes auth & message.
2. Frontend :
   - `vitest` + `@testing-library/react`.
   - Tests des stores Zustand.
   - Playwright pour les flows critiques.

---

## Annexe — Fichiers à supprimer / nettoyer

| Fichier                                                       | Raison                               |
| ------------------------------------------------------------- | ------------------------------------ |
| `backend/src/types/index.d.ts`                                | Vide                                 |
| `backend/src/types/socket.ts`                                 | Type jamais importé                  |
| `backend/src/types/socket-io.d.ts`                            | Doublon conflictuel de `socket.d.ts` |
| Commentaire `// const __dirname = ...` dans server.ts         | À restaurer ou à enlever             |
| `data/` (racine, vide, owner root)                            | Volume Docker inutilisé              |
| Loader `LoaderIcon` avec `className="w-full h-5"` (LoginPage) | `w-full` au lieu de `w-5`            |

---

## Annexe — Dépendances à ajouter

### Backend

```
zod                 # validation
helmet              # security headers
pino, pino-http     # logging
mongoose-paginate-v2 (opt) # pagination
validator           # email validation propre
```

### Frontend

```
@hookform/resolvers + react-hook-form + zod   # forms
zxcvbn                                         # password strength
clsx ou cva                                    # classes conditionnelles
date-fns                                       # format dates
typescript-eslint, eslint-plugin-jsx-a11y      # lint TS + a11y
```

### Dev (mono-repo)

```
prettier, husky, lint-staged, concurrently,
vitest, supertest, mongodb-memory-server,
@testing-library/react, @playwright/test
```
