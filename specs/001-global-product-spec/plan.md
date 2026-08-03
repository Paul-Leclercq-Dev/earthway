# Implementation Plan: Earthway Global Product

**Branch**: `001-global-product-spec` | **Date**: 2025-12-05 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-global-product-spec/spec.md`

## Summary

Earthway est une plateforme de sensibilisation environnementale mobile-first (PWA) permettant aux utilisateurs de :
- S'informer via des actualités filtrées et des pages pédagogiques
- Soutenir via des abonnements récurrents et dons ponctuels
- Mesurer leur impact environnemental (arbres, coraux, pollinisateurs)
- Découvrir des produits responsables via une marketplace affiliée

**Approche technique** : Architecture découplée frontend (React/Vite PWA) + backend (NestJS/Prisma) avec paiements Stripe, jobs asynchrones (Bull/Redis), emails automatisés (Maizzle), conteneurisation Docker, et déploiement Scaleway.

## Technical Context

**Language/Version**:  
- **Backend**: TypeScript 5.x + Node.js 20 LTS  
- **Frontend**: TypeScript 5.x + React 18  
- **Database**: PostgreSQL 15 (prod), SQLite 3 (dev)

**Primary Dependencies**:  
- **Backend**: NestJS 10, Prisma 6, Bull (Redis jobs), Stripe SDK, Nodemailer, Handlebars  
- **Frontend**: React 18, Vite 5, TailwindCSS 3, React Router, Axios  
- **Infrastructure**: Docker, Traefik (reverse proxy), Redis 7  
- **Email**: Maizzle (templates)

**Storage**:  
- PostgreSQL (production) : utilisateurs, abonnements, dons, impact, actualités, produits marketplace  
- SQLite (développement local)  
- Redis : cache (actualités), files Bull (emails, jobs asynchrones)

**Testing**:  
- **Backend**: Jest (unit + integration), Supertest (E2E API)  
- **Frontend**: Vitest, React Testing Library  
- **Critical paths**: Auth (JWT), Paiements Stripe, Webhooks, Calcul d'impact

**Target Platform**:  
- **Frontend**: Navigateurs modernes (Chrome, Safari, Firefox), PWA installable (iOS/Android)  
- **Backend**: Linux server (conteneur Docker)  
- **Deployment**: Scaleway (Docker Compose + Traefik)

**Project Type**: Web application (frontend + backend séparés)

**Performance Goals**:  
- Frontend: LCP < 1.5s sur mobile 3G  
- Backend API: p95 < 500ms  
- Capacité: 1000 utilisateurs simultanés  
- PWA: Score Lighthouse > 90 (Performance, PWA, Accessibility)

**Constraints**:  
- Mobile-first obligatoire (principe II constitution)  
- HTTPS obligatoire (principe V constitution)  
- JWT avec rotation access/refresh (principe V constitution)  
- Webhooks Stripe validés par signature (principe V constitution)  
- RGPD friendly, minimisation données (conformité constitution)  
- Pas de frameworks lourds côté frontend (bundle léger)

**Scale/Scope**:  
- Phase MVP : ~5000 lignes backend, ~3000 lignes frontend  
- 10 user stories, 43 functional requirements  
- ~15 endpoints API backend  
- ~10 pages frontend + ~20 composants  
- Utilisateurs cible initial : 1000-5000/mois

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Validation Against Earthway Constitution

#### ✅ Principe I: Impact & Transparence
- **Respect**: Dashboard d'impact avec métriques claires (arbres, coraux, pollinisateurs, €)  
- **Respect**: Explications transparentes du calcul d'impact (info-bulles, pages dédiées)  
- **Respect**: Pages pédagogiques scientifiquement crédibles

#### ✅ Principe II: Accessibilité & Mobile-First (PWA Obligatoire)
- **Respect**: Architecture mobile-first (Tailwind)  
- **Respect**: PWA complète (manifest, service worker, icônes)  
- **Respect**: Design responsive natif

#### ✅ Principe III: Modèle Économique Durable
- **Respect**: Abonnements récurrents Stripe  
- **Respect**: Dons ponctuels Stripe  
- **Respect**: Marketplace affiliée  
- **Respect**: Emails automatisés (conversion, rétention)

#### ✅ Principe IV: Architecture Modulaire & Scalable
- **Respect**: Backend NestJS organisé en modules (auth, users, news, marketplace, payments, impact)  
- **Respect**: Frontend React avec composants isolés  
- **Respect**: Modules indépendants (ajout/suppression sans refonte globale)

#### ✅ Principe V: Sécurité & Confiance Totale
- **Respect**: JWT access + refresh rotation  
- **Respect**: Validation stricte des entrées (DTOs NestJS, class-validator)  
- **Respect**: HTTPS obligatoire (Traefik SSL auto)  
- **Respect**: Webhooks Stripe validés par signature  
- **Respect**: Mots de passe hashés (bcrypt)  
- **Respect**: Données sensibles jamais exposées au frontend

#### ✅ Standards Techniques & Exigences
- **Stack Technique**: Conforme (NestJS, Prisma, PostgreSQL, React, Vite, Tailwind, Docker, Traefik, Bull, Redis, Stripe, Maizzle)  
- **Performance**: LCP < 1.5s ciblé  
- **Conformité RGPD**: Oui (consentement explicite, minimisation données)

#### ✅ Processus de Développement
- **TypeScript strict**: Oui (tsconfig strict mode)  
- **ESLint + Prettier**: Oui (configurés)  
- **Architecture modulaire**: Oui (NestJS modules + React components)  
- **Tests critiques**: Oui (Auth, Paiements, Webhooks, Impact)

**GATE RESULT: ✅ PASS** — Aucune violation des principes de la constitution. Procéder à Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-global-product-spec/
├── spec.md              # User stories, requirements, success criteria
├── plan.md              # This file (architecture, tech stack, phases)
├── research.md          # Phase 0 (API externe news, best practices Stripe/PWA, calcul impact)
├── data-model.md        # Phase 1 (entités Prisma: User, Subscription, Donation, Impact, etc.)
├── quickstart.md        # Phase 1 (guide dev local + déploiement)
├── contracts/           # Phase 1 (OpenAPI spec des endpoints backend)
│   └── api-spec.yaml
├── checklists/          # Checklists de validation qualité
│   └── requirements.md
└── tasks.md             # Phase 2 (généré par /speckit.tasks)
```

### Source Code (repository root)

```text
Earthway/
├── EarthwayBack/                    # Backend NestJS
│   ├── src/
│   │   ├── main.ts                  # Point d'entrée (bootstrap NestJS)
│   │   ├── app.module.ts            # Module racine
│   │   ├── app.controller.ts        # Healthcheck
│   │   ├── app.service.ts
│   │   ├── auth/                    # Module authentification
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts   # POST /auth/login, /auth/refresh, /auth/register
│   │   │   ├── auth.service.ts      # Logique JWT, bcrypt, OAuth Google
│   │   │   ├── strategies/          # JwtStrategy, GoogleStrategy
│   │   │   ├── guards/              # JwtAuthGuard
│   │   │   └── dto/                 # LoginDto, RegisterDto, TokensDto
│   │   ├── users/                   # Module utilisateurs
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts  # GET /users/me, PUT /users/me
│   │   │   ├── users.service.ts
│   │   │   └── dto/                 # UpdateUserDto
│   │   ├── subscriptions/           # Module abonnements
│   │   │   ├── subscriptions.module.ts
│   │   │   ├── subscriptions.controller.ts  # POST /subscriptions, GET /subscriptions, DELETE /subscriptions/:id
│   │   │   ├── subscriptions.service.ts     # Logique Stripe subscriptions
│   │   │   └── dto/                 # CreateSubscriptionDto
│   │   ├── donations/               # Module dons
│   │   │   ├── donations.module.ts
│   │   │   ├── donations.controller.ts      # POST /donations, GET /donations
│   │   │   ├── donations.service.ts         # Logique Stripe payment intents
│   │   │   └── dto/                 # CreateDonationDto
│   │   ├── news/                    # Module actualités
│   │   │   ├── news.module.ts
│   │   │   ├── news.controller.ts   # GET /news, GET /news/:id
│   │   │   ├── news.service.ts      # Fetch API externe, filtre, cache Redis
│   │   │   └── dto/                 # NewsArticleDto
│   │   ├── marketplace/             # Module marketplace
│   │   │   ├── marketplace.module.ts
│   │   │   ├── marketplace.controller.ts    # GET /marketplace/products
│   │   │   ├── marketplace.service.ts
│   │   │   └── dto/                 # ProductDto
│   │   ├── impact/                  # Module calcul d'impact
│   │   │   ├── impact.module.ts
│   │   │   ├── impact.controller.ts # GET /impact/me
│   │   │   ├── impact.service.ts    # Calcule arbres, coraux, pollinisateurs
│   │   │   └── dto/                 # ImpactDto
│   │   ├── webhooks/                # Module webhooks Stripe
│   │   │   ├── webhooks.module.ts
│   │   │   ├── webhooks.controller.ts       # POST /webhooks/stripe
│   │   │   └── webhooks.service.ts          # Validation signature, sync abonnements
│   │   ├── mail/                    # Module emails (déjà existant)
│   │   │   ├── mail.module.ts
│   │   │   ├── mail.service.ts
│   │   │   ├── mail.processor.ts    # Bull processor
│   │   │   └── templates/           # Templates Handlebars
│   │   │       └── *.hbs
│   │   ├── common/                  # Utilitaires partagés
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   └── config/                  # Configuration (env, database, redis, stripe)
│   │       ├── database.config.ts
│   │       ├── redis.config.ts
│   │       └── stripe.config.ts
│   ├── prisma/
│   │   ├── schema.prisma            # Modèle de données Prisma
│   │   ├── migrations/              # Migrations auto-générées
│   │   └── seed.ts                  # Script de seed (données test)
│   ├── test/                        # Tests E2E
│   │   ├── auth.e2e-spec.ts
│   │   ├── subscriptions.e2e-spec.ts
│   │   ├── donations.e2e-spec.ts
│   │   └── webhooks.e2e-spec.ts
│   ├── .env                         # Variables d'environnement (local, non commité)
│   ├── .env.example                 # Template env
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── dockerfile
│
├── EarthwayFront/                   # Frontend React + Vite PWA
│   ├── public/
│   │   ├── manifest.json            # Manifest PWA
│   │   ├── sw.js                    # Service worker (généré ou custom)
│   │   ├── icons/                   # Icônes PWA (192, 512, maskable)
│   │   └── images/                  # Assets statiques
│   ├── src/
│   │   ├── main.tsx                 # Point d'entrée React
│   │   ├── App.tsx                  # Composant racine (Router)
│   │   ├── index.css                # Styles Tailwind globaux
│   │   ├── vite-env.d.ts
│   │   ├── pages/                   # Pages principales
│   │   │   ├── Home.tsx             # Page d'accueil (4 thématiques)
│   │   │   ├── News.tsx             # Actualités
│   │   │   ├── Marketplace.tsx      # Marketplace
│   │   │   ├── Subscriptions.tsx    # Abonnements
│   │   │   ├── Donations.tsx        # Dons
│   │   │   ├── Profile.tsx          # Profil + Dashboard impact
│   │   │   ├── Login.tsx            # Connexion
│   │   │   ├── Register.tsx         # Inscription
│   │   │   ├── Educational/         # Pages éducatives
│   │   │   │   ├── Pollinators.tsx
│   │   │   │   ├── Oceans.tsx
│   │   │   │   ├── Reforestation.tsx
│   │   │   │   └── Innovations.tsx
│   │   │   └── NotFound.tsx
│   │   ├── components/              # Composants réutilisables
│   │   │   ├── Nav.tsx              # Navigation (existant)
│   │   │   ├── Footer.tsx
│   │   │   ├── ModalAbo.tsx         # Modal abonnement (existant)
│   │   │   ├── NewsCard.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ImpactDashboard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Button.tsx
│   │   │   └── Layout.tsx           # Layout wrapper
│   │   ├── hooks/                   # Hooks custom
│   │   │   ├── UseApi.tsx           # Hook API (existant)
│   │   │   ├── useAuth.tsx          # Hook authentification
│   │   │   └── useImpact.tsx        # Hook impact utilisateur
│   │   ├── services/                # Services API
│   │   │   ├── api.ts               # Axios instance configurée
│   │   │   ├── authService.ts       # Appels auth (login, register, refresh)
│   │   │   ├── subscriptionService.ts
│   │   │   ├── donationService.ts
│   │   │   ├── newsService.ts
│   │   │   ├── marketplaceService.ts
│   │   │   └── impactService.ts
│   │   ├── context/                 # Context API React
│   │   │   └── AuthContext.tsx      # Context authentification global
│   │   ├── utils/                   # Utilitaires
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   └── types/                   # Types TypeScript
│   │       ├── user.ts
│   │       ├── subscription.ts
│   │       ├── donation.ts
│   │       ├── news.ts
│   │       ├── product.ts
│   │       └── impact.ts
│   ├── .env                         # Variables d'environnement (local)
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── nginx.conf                   # Config Nginx pour prod (existant)
│   └── dockerfile
│
├── docker-compose.yml               # Orchestration locale (existant)
├── .gitignore
└── README.md
```

**Structure Decision**: **Web application** (frontend + backend séparés). Les dossiers `EarthwayBack/` et `EarthwayFront/` existent déjà. Cette structure permet :
- Développement parallèle frontend/backend
- Déploiement indépendant (conteneurs Docker séparés)
- Scalabilité horizontale (plusieurs instances backend)
- Réutilisation du backend pour futures apps mobiles natives

---

## Complexity Tracking

**No violations detected** — Aucune justification de complexité nécessaire. L'architecture respecte tous les principes de la constitution.

---

## Phase 0: Research & Technical Decisions

**Objective**: Résoudre tous les points "NEEDS CLARIFICATION" et valider les choix techniques.

### Research Topics

#### 1. API Externe pour Actualités Environnementales
**Question**: Quelle API fiable et gratuite/accessible pour les actualités environnementales ?

**Options**:
- NewsAPI.org (gratuit tier limité, filtres par keyword)
- GNews API (gratuit tier limité)
- Scraping RSS de sources fiables (The Guardian Environment, BBC Earth)
- API custom agrégée (serveur dédié)

**Critères de décision**:
- Fiabilité des sources
- Coût (gratuit ou < 50€/mois)
- Facilité d'intégration
- Filtrage par thématique (climat, biodiversité, océans, etc.)

**Recommandation à valider**: NewsAPI.org tier gratuit (100 req/jour) + cache Redis 24h → suffisant pour MVP. Alternative: RSS parser custom.

---

#### 2. Calcul d'Impact Environnemental
**Question**: Comment calculer de manière transparente et crédible l'impact (arbres, coraux, pollinisateurs) ?

**Options**:
- Partenariat avec ONG (données fournies par partenaire)
- Formules basées sur études scientifiques publiques
- Estimation proportionnelle (% abonnement → X arbres/an)

**Critères de décision**:
- Crédibilité scientifique (principe I constitution)
- Transparence du calcul
- Facilité de mise à jour

**Recommandation à valider**: 
- Formule initiale : `arbres = montant_total_contributions / coût_moyen_arbre` (ex: 5€/arbre)
- Sources : partenariats ONG vérifiables (Reforest'Action, Coral Gardeners, etc.)
- Affichage clair de la source de calcul dans l'UI

---

#### 3. Best Practices Stripe (Webhooks + Abonnements)
**Question**: Comment gérer de manière sécurisée et fiable les webhooks Stripe et la synchronisation des abonnements ?

**Recherche nécessaire**:
- Validation signature Stripe (HMAC)
- Gestion idempotence (éviter double traitement)
- Événements critiques à écouter (`customer.subscription.created`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`)
- Retry logic en cas d'échec

**Recommandation à valider**:
- Endpoint `/webhooks/stripe` dédié
- Validation signature via `stripe.webhooks.constructEvent()`
- Log structuré de tous les événements
- Queue Bull pour traitement asynchrone si nécessaire

---

#### 4. PWA Best Practices (Service Worker + Offline)
**Question**: Comment implémenter un service worker performant sans complexifier le build ?

**Options**:
- Vite Plugin PWA (vite-plugin-pwa) → génération automatique
- Service worker custom (contrôle total)

**Critères de décision**:
- Facilité d'intégration
- Performances (score Lighthouse PWA > 90)
- Stratégie de cache (Network First pour API, Cache First pour assets)

**Recommandation à valider**: `vite-plugin-pwa` avec stratégie Network First pour `/api/*`, Cache First pour assets statiques.

---

#### 5. Authentification Google OAuth (Passport NestJS)
**Question**: Configuration Passport Google OAuth avec NestJS + gestion tokens JWT.

**Recherche nécessaire**:
- Setup `@nestjs/passport` + `passport-google-oauth20`
- Flow OAuth (redirect, callback, token exchange)
- Création/linkage utilisateur existant
- Gestion refresh token Google (optionnel)

**Recommandation à valider**: Guide officiel NestJS + Passport Google, callback `/auth/google/callback`, création automatique user si inexistant.

---

### Output: research.md

**Contenu attendu**:
- Décisions finales pour chaque topic
- Rationale de chaque choix
- Alternatives considérées et rejetées
- Liens vers documentation/sources
- Formules/calculs validés pour l'impact

---

## Phase 1: Design & Contracts

**Objective**: Modèle de données, API contracts, quickstart.

### 1. Data Model (data-model.md)

**Entités Prisma** (basées sur spec.md + requirements):

#### User
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String?  // null si OAuth uniquement
  firstName     String?
  lastName      String?
  photoUrl      String?
  oauthProvider String?  // "google", null si email
  oauthId       String?
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  subscriptions   Subscription[]
  donations       Donation[]
  impact          Impact?
  emailPreferences EmailPreference?
}
```

#### Subscription
```prisma
model Subscription {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  stripeCustomerId    String
  stripeSubscriptionId String  @unique
  tier            String   // "basic", "premium", "vip"
  status          String   // "active", "canceled", "expired"
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  canceledAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Donation
```prisma
model Donation {
  id                String   @id @default(uuid())
  userId            String?
  user              User?    @relation(fields: [userId], references: [id])
  amount            Float
  cause             String   // "trees", "corals", "pollinators", "general"
  stripePaymentIntentId String @unique
  status            String   // "succeeded", "pending", "failed"
  createdAt         DateTime @default(now())
}
```

#### NewsArticle
```prisma
model NewsArticle {
  id          String   @id @default(uuid())
  title       String
  summary     String?
  content     String?  @db.Text
  sourceUrl   String
  imageUrl    String?
  source      String
  theme       String   // "climate", "oceans", "biodiversity", "innovations"
  publishedAt DateTime
  createdAt   DateTime @default(now())
}
```

#### Product (Marketplace)
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String   @db.Text
  imageUrl    String
  price       Float?
  affiliateLink String
  partner     String
  theme       String   // "reforestation", "oceans", "zero-waste"
  createdAt   DateTime @default(now())
}
```

#### Impact
```prisma
model Impact {
  id                  String   @id @default(uuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])
  treesFinanced       Int      @default(0)
  coralsRestored      Int      @default(0)
  pollinatorsProtected Int     @default(0)
  totalContributionEur Float   @default(0)
  updatedAt           DateTime @updatedAt
}
```

#### EmailPreference
```prisma
model EmailPreference {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  newsletter  Boolean  @default(true)
  impact      Boolean  @default(true)
  confirmations Boolean @default(true)
  marketing   Boolean  @default(false)
  updatedAt   DateTime @updatedAt
}
```

---

### 2. API Contracts (contracts/api-spec.yaml)

**Endpoints Backend** (OpenAPI 3.0):

#### Auth
- `POST /auth/register` - Inscription email/password
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Refresh access token
- `GET /auth/google` - Initier OAuth Google
- `GET /auth/google/callback` - Callback OAuth Google

#### Users
- `GET /users/me` - Profil utilisateur connecté
- `PUT /users/me` - Mettre à jour profil

#### Subscriptions
- `GET /subscriptions` - Liste abonnements disponibles (tiers)
- `POST /subscriptions` - Créer abonnement Stripe
- `GET /subscriptions/me` - Abonnement actif de l'utilisateur
- `DELETE /subscriptions/:id` - Annuler abonnement

#### Donations
- `POST /donations` - Créer don Stripe
- `GET /donations/me` - Historique dons utilisateur

#### News
- `GET /news` - Liste actualités (paginated, filtres: theme, date)
- `GET /news/:id` - Détail article

#### Marketplace
- `GET /marketplace/products` - Liste produits (filtres: theme)
- `GET /affiliate/redirect/:slug` - Redirection affiliée trackée (Deep Linking)
- `POST /affiliate/track` - Log clic affilié (optionnel, client-side)

#### Impact
- `GET /impact/me` - Dashboard impact utilisateur connecté

#### Webhooks
- `POST /webhooks/stripe` - Webhooks Stripe (validés par signature)

---

### 3. Quickstart (quickstart.md)

**Contenu**:
- **Prérequis**: Node 20, Docker, npm/yarn
- **Setup local**:
  - Clone repo
  - `cp .env.example .env` (backend + frontend)
  - `docker compose up -d` (PostgreSQL, Redis, phpMyAdmin)
  - Backend: `cd EarthwayBack && npm install && npx prisma migrate dev && npm run start:dev`
  - Frontend: `cd EarthwayFront && npm install && npm run dev`
- **Tests**:
  - Backend: `npm run test`, `npm run test:e2e`
  - Frontend: `npm run test`
- **Build production**:
  - `docker compose --profile prod up -d`
- **Déploiement Scaleway**: (à détailler dans quickstart.md)

---

### 4. Update Agent Context

Exécuter `.specify/scripts/bash/update-agent-context.sh copilot` pour ajouter la nouvelle stack au contexte agent.

---

## Phase 2: Tasks (NOT created here - see /speckit.tasks)

Les tâches détaillées seront générées par la commande `/speckit.tasks` après validation de ce plan. Elles seront organisées par user story (P1, P2, P3) et phase (Setup, Foundational, Implémentation par story, Polish).

---

## Next Steps

1. ✅ **Valider ce plan** avec l'équipe/stakeholders
2. **Exécuter Phase 0**: Recherche et validation des décisions techniques → `research.md`
3. **Exécuter Phase 1**: Finaliser data model, contracts, quickstart → fichiers dans `/specs/001-global-product-spec/`
4. **Lancer `/speckit.tasks`**: Générer les tâches d'implémentation ordonnées
5. **Lancer `/speckit.implement`**: Démarrer l'implémentation guidée

---

## Notes

- **Architecture existante**: Les dossiers `EarthwayBack/` et `EarthwayFront/` contiennent déjà une base (NestJS + React). Le plan s'appuie dessus et définit les modules/composants à ajouter.
- **Prisma**: Le schema existe déjà (`EarthwayBack/prisma/schema.prisma`). Il faudra le compléter avec les modèles ci-dessus.
- **Docker Compose**: Fichier existant à la racine. À adapter pour Traefik si besoin.
- **PWA**: Manifest et service worker à ajouter dans `EarthwayFront/public/`.
- **Stripe**: Nécessite clés API (test + prod) dans `.env`.
- **Google OAuth**: Nécessite credentials Google Cloud Console.

---

**Status**: ✅ Plan complet prêt pour Phase 0 (Research)

---

## Phase 16 : Affiliation & Deep Linking (US11)

### Décision Technique : Deep Linking Server-Side

Le lien affilié final est résolu côté serveur (endpoint `/affiliate/redirect/:slug`). Le frontend envoie uniquement un `slug` opaque ; Earthway injecte les paramètres de tracking réseau au moment de la redirection. Cela permet :
- **Rotation de réseau sans déploiement** : changer ShareASale → Awin en mettant à jour l'entrée DB
- **Tracking centralisé** : tous les clics loggués en `AffiliateClickLog` avant redirection
- **Obfuscation des URLs** : les paramètres affiliés ne sont pas visibles dans le code frontend

### Modèle de Données

```prisma
model AffiliateLink {
  id            Int      @id @default(autoincrement())
  slug          String   @unique  // ex: "graine-republic-sachet"
  productId     Int?
  product       Product? @relation(fields: [productId], references: [id])
  network       String   // "shareasale" | "awin" | "affilizz" | "amazon" | "direct"
  baseUrl       String   // URL du marchand sans paramètres
  trackingParams String  // JSON: {"tag":"earthway-21","ref":"..."} selon réseau
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  clicks        AffiliateClickLog[]
  @@map("affiliate_link")
}

model AffiliateClickLog {
  id              Int           @id @default(autoincrement())
  affiliateLinkId Int
  affiliateLink   AffiliateLink @relation(fields: [affiliateLinkId], references: [id])
  userId          Int?          // null si non connecté
  ipHash          String?       // hash SHA256 de l'IP pour RGPD + analytics
  referrer        String?
  userAgent       String?
  createdAt       DateTime      @default(now())
  @@map("affiliate_click_log")
}
```

### Architecture de Redirection

```
Frontend ProductCard
  → clic "Acheter"
  → window.open(`/api/affiliate/redirect/${slug}`, '_blank')
  
Backend GET /affiliate/redirect/:slug
  → Cherche AffiliateLink par slug
  → Si non trouvé ou inactif → 404
  → Construit URL finale : baseUrl + trackingParams (selon network)
  → Insère AffiliateClickLog (async, non bloquant)
  → HTTP 302 redirect vers URL finale
```

### Construction URL par réseau

| Réseau | Format paramètres |
|--------|------------------|
| ShareASale | `?afftrack=earthway&siteID={ID}` |
| Awin | `?awinmid={ID}&awinaffid={ID}&clickref=earthway` |
| Affilizz | `?utm_source=earthway&utm_medium=affiliate` |
| Amazon | `?tag={tag}&linkCode=as2` |
| Direct | pas de paramètre (fallback) |

---

## Phase 17 : Publicité & Monétisation (US12)

### Décision Technique : Composant AdSlot configurable

Un composant `<AdSlot />` encapsule la logique d'affichage publicitaire. Le provider (AdSense / Media.net / Ezoic) est configuré via des variables d'environnement frontend. Le composant se rend à vide si l'utilisateur est abonné ou n'a pas consenti.

### Règles Métier

1. **Abonnés = sans publicité** : `if (user?.subscription?.status === 'active') return null`
2. **Consentement RGPD obligatoire** : bannière de consentement au premier visit, stockage dans `localStorage`
3. **Formats acceptés V1** : native in-feed (entre articles), leaderboard (728×90), carré (300×250)
4. **Emplacements V1** :
   - Page Actualités : 1 bannière entre article 3 et 4, 1 unité native en bas de liste
   - Page Marketplace : 1 unité display côté droit (desktop) / entre produits (mobile)
   - Page d'accueil : 0 pub (préserver l'image de marque)

### Architecture Composant

```tsx
// Configuration via VITE_ env vars
VITE_AD_PROVIDER=adsense          // "adsense" | "medianet" | "none"
VITE_ADSENSE_CLIENT=ca-pub-XXXX
VITE_ADSENSE_SLOT_FEED=1234567890
VITE_ADSENSE_SLOT_DISPLAY=0987654321

// Composant
<AdSlot
  format="in-feed"    // "in-feed" | "display" | "native"
  slotId="feed"       // clé dans la config provider
  className="my-4"
/>
```

### Stack Consentement (RGPD)

- `ConsentBanner` : bannière non-intrusive avec "Accepter" / "Refuser"
- `useConsent` hook : lit/écrit `localStorage.getItem('ad_consent')`
- Valeurs : `"granted"` | `"denied"` | `null` (pas encore décidé)
- Pas de cookies tiers sans consentement (conformité CNIL)

### Extensibilité

Changer de provider = modifier `VITE_AD_PROVIDER` + les `slotId` dans `.env`. Le composant `AdSlot` délègue le rendu à un renderer interne (`renderAdSense`, `renderMediaNet`) sélectionné par la config.

