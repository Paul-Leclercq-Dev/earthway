# Tâches : Earthway Global Product

**Entrée** : Documents de conception depuis `/specs/001-global-product-spec/`  
**Prérequis** : plan.md ✅, spec.md ✅, research.md ✅, schema.prisma (existant) ✅

**Organisation** : Tâches groupées par user story (US1-US10) pour implémentation et tests indépendants.

**Tests** : Non explicitement demandés dans la spec - focus sur les tâches d'implémentation.

## Format : `- [ ] [ID] [P?] [Story?] Description avec chemin de fichier`

- **[P]** : Parallélisable (fichiers différents, pas de dépendances bloquantes)
- **[Story]** : Libellé user story (US1, US2, etc.) - uniquement pour tâches spécifiques à une story
- **Pas de libellé Story** : Tâches Configurer, Foundational ou Polish

---

## Phase 1 : Configurer (Initialisation du Projet)

**Objectif** : Initialiser l'infrastructure et la configuration manquantes

**Analyse** : Le code existant a un backend NestJS de base (module `mail/`, schéma Prisma) et un frontend React (`pages/home.tsx`, `pages/pollinisateur.tsx`, `components/nav.tsx`, `components/modalAbo.tsx`). Manquants : modules auth, subscriptions, donations, news, marketplace, impact, webhooks, setup PWA.

- [X] T001 Mettre à jour le schéma Prisma avec les modèles manquants (NewsArticle, Product, Impact, EmailPreference) dans EarthwayBack/prisma/schema.prisma
- [X] T002 [P] Créer les fichiers .env.example pour backend et frontend avec toutes les variables requises (clés Stripe, Google OAuth, URLs database, URL Redis)
- [X] T003 [P] Installer les dépendances backend manquantes : @nestjs/passport, passport, passport-google-oauth20, passport-jwt, stripe, rss-parser, @nestjs/bull, bull, ioredis, bcrypt
- [X] T004 [P] Installer les dépendances frontend manquantes : react-router-dom, axios, vite-plugin-pwa
- [X] T005 Configurer vite-plugin-pwa dans EarthwayFront/vite.config.ts selon décision research.md (Network First API, Cache First assets)
- [X] T006 [P] Créer EarthwayFront/public/manifest.json avec métadonnées PWA (name, icons, theme_color, start_url)
- [X] T007 [P] Générer les icônes PWA (192x192, 512x512, maskable) et les placer dans EarthwayFront/public/icons/

---

## Phase 2 : Fondations (Prérequis Bloquants)

**Objectif** : Infrastructure de base qui DOIT être complétée avant les user stories

**⚠️ CRITIQUE** : Aucun travail sur les user stories ne peut commencer avant la fin de cette phase

### Base de Données & Infrastructure

- [X] T008 Migrer le schéma Prisma de MySQL vers PostgreSQL dans schema.prisma (aligner avec plan.md)
- [X] T009 Générer la migration Prisma pour les nouveaux modèles (NewsArticle, Product, Impact, EmailPreference)
- [X] T010 Créer le script seed EarthwayBack/prisma/seed.ts avec données de test (users, subscriptions, articles actualités, produits)
- [X] T011 [P] Configurer la connexion Redis dans EarthwayBack/src/config/redis.config.ts
- [X] T012 [P] Configurer le module Bull queues dans EarthwayBack/src/app.module.ts

### Infrastructure d'Authentification

- [X] T013 Créer la structure du module auth : EarthwayBack/src/auth/auth.module.ts
- [X] T014 [P] Implémenter JwtStrategy dans EarthwayBack/src/auth/strategies/jwt.strategy.ts
- [X] T015 [P] Implémenter GoogleStrategy dans EarthwayBack/src/auth/strategies/google.strategy.ts
- [X] T016 [P] Créer JwtAuthGuard dans EarthwayBack/src/auth/guards/jwt-auth.guard.ts
- [X] T017 [P] Créer les DTOs : LoginDto, RegisterDto, TokensDto dans EarthwayBack/src/auth/dto/

### Infrastructure Frontend

- [X] T018 Créer l'instance Axios avec intercepteurs dans EarthwayFront/src/services/api.ts (base URL, en-têtes auth, gestion erreurs)
- [X] T019 Créer AuthContext dans EarthwayFront/src/context/AuthContext.tsx (stockage JWT, logique refresh, état utilisateur)
- [X] T020 [P] Créer les types TypeScript dans EarthwayFront/src/types/ (user.ts, subscription.ts, donation.ts, news.ts, product.ts, impact.ts)
- [X] T021 Configurer React Router dans EarthwayFront/src/App.tsx avec toutes les routes (/, /news, /marketplace, /subscriptions, /donations, /profile, /login, /register, /pollinisateurs, /oceans, /reforestation, /innovations)

**Checkpoint** : ✅ Fondations prêtes - l'implémentation des user stories peut commencer en parallèle

---

## Phase 3 : User Story 1 - Découverte et Compréhension (Priorité : P1) 🎯 MVP

**Objectif** : Le visiteur comprend immédiatement Earthway et les actions possibles via une page d'accueil claire

**Tester Indépendant** : Un nouveau visiteur identifie en < 10s : (1) ce qu'est Earthway, (2) les 4 thématiques, (3) comment agir

**Analyse** : La page home.tsx existe déjà avec 4 thématiques (reforestation, coraux, pollinisateurs, innovations). Améliorer avec CTA et navigation.

### Implémentation pour User Story 1

- [X] T022 [P] [US1] Améliorer EarthwayFront/src/pages/Home.tsx avec section value proposition claire (headline, description, CTA)
- [X] T023 [P] [US1] Ajouter liens de navigation vers pages éducatives dans grille Home.tsx (lier coraux, pollinisateurs, innovations aux bonnes routes)
- [X] T024 [P] [US1] Créer composant Layout dans EarthwayFront/src/components/Layout.tsx (header, footer, wrapper principal)
- [X] T025 [P] [US1] Créer composant Footer dans EarthwayFront/src/components/Footer.tsx avec liens (À propos, Contact, Confidentialité)
- [X] T026 [US1] Mettre à jour composant Nav dans EarthwayFront/src/components/nav.tsx pour inclure toutes les routes principales (Accueil, Actualités, Marketplace, Abonnements, Dons, Profil, Connexion)

**Checkpoint** : Page d'accueil claire, 4 thématiques visibles, CTAs présents

---

## Phase 4 : User Story 2 - Sensibilisation et Information (Priorité : P1) 🎯 MVP

**Objectif** : L'utilisateur s'informe via actualités filtrées et pages éducatives sans créer de compte

**Tester Indépendant** : Un utilisateur consulte les actualités environnementales filtrées et accède aux pages éducatives (pollinisateurs, océans, reforestation) sans authentification

**Analyse** : La page pollinisateur.tsx existe. Créer module news backend + pages News, Oceans, Reforestation, Innovations frontend.

### Backend : Module News

- [X] T027 [P] [US2] Créer la structure du module news : EarthwayBack/src/news/news.module.ts
- [X] T028 [P] [US2] Créer NewsService dans EarthwayBack/src/news/news.service.ts (parsing RSS via rss-parser, cache Redis, stockage DB selon research.md)
- [X] T029 [P] [US2] Créer NewsController dans EarthwayBack/src/news/news.controller.ts avec endpoints : GET /news (paginé, filtres thème/date), GET /news/:id
- [X] T030 [P] [US2] Créer NewsArticleDto dans EarthwayBack/src/news/dto/news-article.dto.ts
- [X] T031 [US2] Implémenter job cron Bull dans NewsService pour récupérer flux RSS quotidiens (Guardian, BBC, WWF selon sources research.md)
- [X] T032 [US2] Ajouter couche cache Redis dans NewsService (TTL 24h selon research.md)

### Frontend : Pages Actualités & Éducatives

- [X] T033 [P] [US2] Créer page News dans EarthwayFront/src/pages/News.tsx (vue liste avec filtres : thème, date)
- [X] T034 [P] [US2] Créer composant NewsCard dans EarthwayFront/src/components/NewsCard.tsx (titre, résumé, image, source, date)
- [X] T035 [P] [US2] Créer newsService.ts dans EarthwayFront/src/services/newsService.ts (fetchNews, fetchNewsById)
- [X] T036 [P] [US2] Créer page Oceans dans EarthwayFront/src/pages/Educational/Oceans.tsx (pédagogique, enjeux coraux)
- [X] T037 [P] [US2] Créer page Reforestation dans EarthwayFront/src/pages/Educational/Reforestation.tsx (pédagogique, enjeux arbres)
- [X] T038 [P] [US2] Créer page Innovations dans EarthwayFront/src/pages/Educational/Innovations.tsx (pédagogique, solutions innovantes)
- [X] T039 [US2] Améliorer page Pollinators dans EarthwayFront/src/pages/pollinisateur.tsx avec contenu éducatif complet (fichier existant à enrichir)

**Checkpoint** : Actualités accessibles, 4 pages éducatives complètes, aucune auth requise

---

## Phase 5 : User Story 3 - Inscription et Authentification (Priorité : P1) 🎯 MVP

**Objectif** : L'utilisateur crée un compte (email/password ou Google OAuth) et se connecte de manière fluide

**Tester Indépendant** : Un utilisateur s'inscrit via email ou Google OAuth en < 2min et se connecte ensuite

**Analyse** : Aucun module auth backend existant. Le modèle User Prisma existe mais nécessite adaptation (ajouter oauthProvider, oauthId, emailVerified).

### Backend : Module Auth

- [X] T040 [US3] Mettre à jour modèle User dans schema.prisma : ajouter oauthProvider, oauthId, emailVerified, photoUrl, supprimer phoneNumber/birthday si non nécessaire
- [X] T041 [US3] Créer AuthService dans EarthwayBack/src/auth/auth.service.ts (register, login, validateUser, generateTokens, refreshTokens, validateGoogleUser selon research.md)
- [X] T042 [US3] Créer AuthController dans EarthwayBack/src/auth/auth.controller.ts avec endpoints : POST /auth/register, POST /auth/login, POST /auth/refresh, GET /auth/google, GET /auth/google/callback
- [X] T043 [US3] Implémenter hachage mot de passe bcrypt dans AuthService (register + validation login)
- [X] T044 [US3] Implémenter génération tokens JWT access + refresh dans AuthService (15min access, 7j refresh selon best practices sécurité)
- [X] T045 [US3] Implémenter flow OAuth Google dans AuthController et GoogleStrategy (redirection callback avec tokens)
- [X] T046 [US3] Ajouter logique vérification email : envoyer email vérification via MailService, créer token vérification, endpoint validation
- [X] T047 [US3] Implémenter flow réinitialisation mot de passe : POST /auth/forgot-password, POST /auth/reset-password avec token email

### Frontend : Pages Auth & Services

- [X] T048 [P] [US3] Créer page Login dans EarthwayFront/src/pages/Login.tsx (formulaire email/password + bouton OAuth Google)
- [X] T049 [P] [US3] Créer page Register dans EarthwayFront/src/pages/Register.tsx (formulaire email/password + bouton OAuth Google)
- [X] T050 [P] [US3] Créer authService.ts dans EarthwayFront/src/services/authService.ts (login, register, refresh, googleAuth)
- [X] T051 [P] [US3] Créer hook useAuth dans EarthwayFront/src/hooks/useAuth.tsx (wrapper pour AuthContext, méthodes login/logout/register)
- [X] T052 [US3] Implémenter gestion état AuthContext (user, tokens, isAuthenticated, loading)
- [X] T053 [US3] Ajouter intercepteur refresh token dans EarthwayFront/src/services/api.ts (auto-refresh sur 401)
- [X] T054 [US3] Ajouter composant wrapper route protégée dans EarthwayFront/src/components/ProtectedRoute.tsx (redirection vers /login si non authentifié)

### Templates Email

- [X] T055 [P] [US3] Créer template email bienvenue dans EarthwayBack/src/mail/templates/welcome.hbs (template Maizzle)
- [X] T056 [P] [US3] Créer template vérification email dans EarthwayBack/src/mail/templates/vérifier-email.hbs
- [X] T057 [P] [US3] Créer template réinitialisation mot de passe dans EarthwayBack/src/mail/templates/reset-password.hbs
- [X] T058 [US3] Mettre à jour MailService.sendUserConfirmation() pour utiliser template bienvenue

**Checkpoint** : Les utilisateurs peuvent s'inscrire, se connecter, réinitialiser mot de passe

---

## Phase 6 : User Story 4 - Abonnement et Soutien Récurrent (Priorité : P2)

**Objectif** : L'utilisateur choisit un abonnement, paie via Stripe, reçoit email de confirmation

**Tester Indépendant** : Un utilisateur connecté choisit un abonnement, paie via Stripe, reçoit email de confirmation

**Analyse** : Le modèle Subscription Prisma existe mais nécessite adaptation (ajouter stripeCustomerId, stripeSubscriptionId, tier, status, dates).

### Backend : Module Subscriptions

- [X] T059 [US4] Mettre à jour modèle Subscription dans schema.prisma
- [X] T060 [US4] Créer la structure du module subscriptions : EarthwayBack/src/subscriptions/subscriptions.module.ts
- [X] T061 [P] [US4] Créer SubscriptionsService dans EarthwayBack/src/subscriptions/subscriptions.service.ts
- [X] T062 [P] [US4] Créer SubscriptionsController dans EarthwayBack/src/subscriptions/subscriptions.controller.ts
- [X] T063 [P] [US4] Créer CreateSubscriptionDto dans EarthwayBack/src/subscriptions/dto/create-subscription.dto.ts
- [X] T064 [US4] Configurer Stripe SDK dans EarthwayBack/src/config/stripe.config.ts (clés API depuis env)
- [X] T065 [US4] Implémenter création customer Stripe dans SubscriptionsService
- [X] T066 [US4] Implémenter création abonnement Stripe avec price_id dans SubscriptionsService
- [X] T067 [US4] Ajouter email confirmation abonnement dans MailService (template subscription-confirmation.hbs)

### Frontend : Pages Subscriptions & Services

- [X] T068 [P] [US4] Créer page Subscriptions dans EarthwayFront/src/pages/Subscriptions.tsx
- [X] T069 [P] [US4] Créer subscriptionService.ts dans EarthwayFront/src/services/subscriptionService.ts
- [X] T070 [US4] Intégrer Stripe Checkout dans Subscriptions.tsx (redirection vers page hébergée Stripe)
- [X] T071 [US4] Ajouter affichage statut abonnement dans page Profile (actif, annulé, date expiration)
- [X] T072 [US4] Ajouter bouton annulation abonnement dans page Profile avec modal confirmation

### Templates Email

- [X] T073 [P] [US4] Créer template email confirmation abonnement dans EarthwayBack/src/mail/templates/subscription-confirmation.hbs
- [X] T074 [P] [US4] Créer template email annulation abonnement dans EarthwayBack/src/mail/templates/subscription-cancellation.hbs

**Checkpoint** : Abonnements fonctionnels via Stripe, emails confirmations envoyés

---

## Phase 7 : User Story 5 - Dons Ponctuels (Priorité : P2)

**Objectif** : Utilisateur (connecté ou non) fait don ponctuel via Stripe et reçoit confirmation

**Tester Indépendant** : Utilisateur effectue don ponctuel via Stripe et reçoit email de remerciement

**Analyse** : Donation model Prisma existe mais relation avec User est simple. Ajouter stripePaymentIntentId, cause, status.

### Backend : Module Donations

- [X] T075 [US5] Mettre à jour Donation modèle dans schema.prisma: ajouter stripePaymentIntentId (String @unique), cause (enum: trees, corals, pollinators, general), status (enum: succeeded, pending, failed)
- [X] T076 [US5] Créer donations structure du module: EarthwayBack/src/donations/donations.module.ts
- [X] T077 [P] [US5] Créer DonationsService dans EarthwayBack/src/donations/donations.service.ts (Stripe Payment Intents: createDonation, getDonations)
- [X] T078 [P] [US5] Créer DonationsController dans EarthwayBack/src/donations/donations.controller.ts avec endpoints: POST /donations, GET /donations/me
- [X] T079 [P] [US5] Créer CreateDonationDto dans EarthwayBack/src/donations/dto/create-donation.dto.ts
- [X] T080 [US5] Implémenter Stripe Payment Intent création dans DonationsService (montant, devise EUR, métadonnées avec cause)
- [X] T081 [US5] Ajouter donation email de confirmation dans MailService (template donation-confirmation.hbs)

### Frontend : Page Donations & Services

- [X] T082 [P] [US5] Créer Donations page dans EarthwayFront/src/pages/Donations.tsx (choisir montant, sélectionner cause, Stripe Elements formulaire de paiement)
- [X] T083 [P] [US5] Créer donationService.ts dans EarthwayFront/src/services/donationService.ts (createDonation, getMyDonations)
- [X] T084 [US5] Intégrer Stripe Payment Element dans Donations.tsx (flux client secret)
- [X] T085 [US5] Ajouter donations historique dans Profile page (liste des donations with amount, cause, date)

### Templates Email

- [X] T086 [P] [US5] Créer donation confirmation template email dans EarthwayBack/src/mail/templates/donation-confirmation.hbs

**Checkpoint** : Dons ponctuels fonctionnels via Stripe, historique visible

---

## Phase 8 : User Story 7 - tableau de bord d'Impact Personnel (Priorité : P2)

**Objectif** : Utilisateur abonné visualise impact cumulé (arbres, coraux, pollinisateurs, €)

**Tester Indépendant** : Utilisateur abonné voit tableau de bord impact avec métriques claires et explications calcul

**Analyse** : Impact modèle manquant dans Prisma. Créer entité + service de calcul basé sur formules de research.md.

**Note** : US7 avant US6 (marketplace) car impact est plus critique pour rétention.

### Backend : Module Impact

- [X] T087 [US7] Créer Impact modèle dans schema.prisma (userId @unique, treesFinanced Int, coralsRestored Int, pollinatorsProtected Int, totalContributionEur Float, updatedAt)
- [X] T088 [US7] Créer impact structure du module: EarthwayBack/src/impact/impact.module.ts
- [X] T089 [P] [US7] Créer ImpactService dans EarthwayBack/src/impact/impact.service.ts (calculateImpact based on subscriptions + donations, formules depuis research.md)
- [X] T090 [P] [US7] Créer ImpactController dans EarthwayBack/src/impact/impact.controller.ts with endpoint: GET /impact/me
- [X] T091 [P] [US7] Créer ImpactDto dans EarthwayBack/src/impact/dto/impact.dto.ts
- [X] T092 [P] [US7] Créer impact.constants.ts dans EarthwayBack/src/impact/ avec constantes de coût (5€/arbre, 15€/corail, 10€/pollinisateur selon research.md)
- [X] T093 [US7] Implémenter calculateImpact() method: somme utilisateur subscriptions + donations, diviser par coûts
- [X] T094 [US7] Ajouter impact recalcul déclencher: call depuis webhooks quand subscription/donation réussit

### Frontend : Impact tableau de bord

- [X] T095 [P] [US7] Créer ImpactDashboard composant dans EarthwayFront/src/components/ImpactDashboard.tsx (afficher trees, corals, pollinators, total € with icons)
- [X] T096 [P] [US7] Créer ProgressBar composant dans EarthwayFront/src/components/ProgressBar.tsx (représentation visuelle of impact)
- [X] T097 [P] [US7] Créer impactService.ts dans EarthwayFront/src/services/impactService.ts (fetchMyImpact)
- [X] T098 [P] [US7] Créer useImpact hook dans EarthwayFront/src/hooks/useImpact.tsx (récupérer et mettre en cache impact data)
- [X] T099 [US7] Intégrer ImpactDashboard dans Profile page
- [X] T100 [US7] Ajouter tooltips/info-bulles expliquant impact calculs (formules depuis research.md with ONG sources)

**Checkpoint** : tableau de bord impact fonctionnel, métriques claires, formules transparentes

---

## Phase 9 : Webhooks Stripe (Critical for Subscriptions/Donations sync)

**Objectif** : Synchroniser états abonnements/dons via webhooks Stripe sécurisés

**Tester Indépendant** : Webhook Stripe reçu, signature validée, abonnement/don synchronisé en DB

**Analyse** : Module webhooks manquant. Critique pour synchronisation Stripe.

### Backend : Module Webhooks

- [X] T101 [US4+US5] Créer webhooks structure du module: EarthwayBack/src/webhooks/webhooks.module.ts
- [X] T102 [P] [US4+US5] Créer WebhooksService dans EarthwayBack/src/webhooks/webhooks.service.ts (valider signature, gérer événements selon research.md)
- [X] T103 [P] [US4+US5] Créer WebhooksController dans EarthwayBack/src/webhooks/webhooks.controller.ts with endpoint: POST /webhooks/stripe (parser body brut)
- [X] T104 [US4+US5] Implémenter signature validation utilisant stripe.webhooks.constructEvent() selon research.md
- [X] T105 [US4+US5] Gérer événements abonnement: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
- [X] T106 [US4+US5] Gérer événements don: checkout.session.complété (pour dons), payment_intent.succeeded
- [X] T107 [US4+US5] Ajouter idempotence checks: vérifier stripeSubscriptionId or stripePaymentIntentId pas déjà en DB
- [X] T108 [US4+US5] Queue Bull job for async webhook processing (mettre événement en file, retourner 200 OK immédiatement selon research.md)
- [X] T109 [US4+US5] déclencher impact recalcul depuis webhook lors paiement réussi
- [X] T110 [US4+US5] Ajouter WebhookLog modèle dans schema.prisma for piste d'audit (eventType, stripeEventId, status, processedAt)

**Checkpoint** : Webhooks Stripe sécurisés, abonnements/dons synchronisés automatiquement

---

## Phase 10 : User Story 6 - Marketplace et Affiliation (Priorité : P3)

**Objectif** : Utilisateur parcourt marketplace, voit produits responsables, redirigé vers site marchand via lien affilié

**Tester Indépendant** : Utilisateur parcourt marketplace, clique produit, redirigé vers site marchand

**Analyse** : Product modèle existe dans Prisma, ArticleMarket aussi. Créer module marketplace backend + page frontend.

### Backend : Module Marketplace

- [X] T111 [US6] Créer marketplace structure du module: EarthwayBack/src/marketplace/marketplace.module.ts
- [X] T112 [P] [US6] Créer MarketplaceService dans EarthwayBack/src/marketplace/marketplace.service.ts (getProducts avec filtres: thématique)
- [X] T113 [P] [US6] Créer MarketplaceController dans EarthwayBack/src/marketplace/marketplace.controller.ts with endpoint: GET /marketplace/products
- [X] T114 [P] [US6] Créer ProductDto dans EarthwayBack/src/marketplace/dto/product.dto.ts
- [X] T115 [US6] Seed products dans seed.ts (10-20 produits exemples with themes: reforestation, oceans, zero-waste)

### Frontend : Page Marketplace

- [X] T116 [P] [US6] Créer Marketplace page dans EarthwayFront/src/pages/Marketplace.tsx (vue grille avec filtres: thématique)
- [X] T117 [P] [US6] Créer ProductCard composant dans EarthwayFront/src/components/ProductCard.tsx (image, nom, description, prix, "Acheter" bouton)
- [X] T118 [P] [US6] Créer marketplaceService.ts dans EarthwayFront/src/services/marketplaceService.ts (fetchProducts)
- [X] T119 [US6] Ajouter affiliate link tracking dans ProductCard (ouvrir dans nouvel onglet, rel="noopener noreferrer")

**Checkpoint** : Marketplace fonctionnelle, produits affichés, liens affiliés actifs

---

## Phase 11 : User Story 9 - Installation PWA (Priorité : P2)

**Objectif** : Utilisateur mobile installe Earthway comme app via navigateur

**Tester Indépendant** : Utilisateur mobile voit invite installation, installe PWA, lance app en plein écran

**Analyse** : PWA setup partiel fait en Phase 1 (manifest, vite-plugin-pwa). Finaliser service worker et prompt.

### Finalisation PWA

- [X] T120 [US9] Tester PWA installation sur Chrome/Safari mobile (vérifier manifest, icônes, enregistrement service worker)
- [X] T121 [US9] Ajouter install composant invite dans EarthwayFront/src/components/InstallPrompt.tsx (beforeinstallprompt gestion événements)
- [X] T122 [US9] Configurer offline page de secours dans service worker (afficher message si hors ligne)
- [X] T123 [US9] Tester comportement hors ligne: mettre assets en cache, show message hors ligne pour appels API
- [ ] T124 [US9] Exécuter Lighthouse PWA audit, corriger problèmes pour atteindre score > 90 (À faire manuellement avec Chrome DevTools)

**Checkpoint** : PWA installable, fonctionne offline (mode dégradé), Lighthouse score > 90

---

## Phase 12 : User Story 8 - Progression et Gamification (Priorité : P3)

**Objectif** : Utilisateur voit progression/niveau d'engagement basé sur actions

**Tester Indépendant** : Utilisateur actif voit barre progression évoluer selon actions (abonnement, dons, visites)

**Analyse** : User model Prisma a déjà xp et level. Créer logique calcul progression.

### Backend : Logique Progression

- [X] T125 [US8] Créer progression logique de calcul dans ImpactService or dedicated ProgressionService (xp = donations + subscriptions + visits)
- [X] T126 [US8] Ajouter endpoint GET /users/me/progression dans UsersController (return xp, level, nextLevelThreshold)
- [X] T127 [US8] Implémenter level-up email notification dans MailService (template level-up.hbs)

### Frontend : Progression afficher

- [X] T128 [P] [US8] Ajouter progression afficher dans Profile page (level, barre xp, niveau suivant)
- [X] T129 [US8] Créer ProgressionBar composant dans EarthwayFront/src/components/ProgressionBar.tsx (visual barre xp with level)

**Checkpoint** : Progression visible, utilisateurs peuvent voir leur niveau évoluer

---

## Phase 13 : User Story 10 - Emails Automatisés (Priorité : P3)

**Objectif** : Utilisateur reçoit emails pertinents (bienvenue, impact mensuel, confirmations)

**Tester Indépendant** : Utilisateur inscrit reçoit emails aux moments clés (inscription, abonnement, impact mensuel)

**Analyse** : MailService et templates Handlebars existent. Ajouter templates manquants + tâche planifiée impact mensuel.

### Templates Email & Automation

- [X] T130 [P] [US10] Créer monthly impact template email dans EarthwayBack/src/mail/templates/monthly-impact.hbs (récap impact, motivation)
- [X] T131 [US10] Implémenter Bull tâche planifiée dans MailService pour envoyer emails impact mensuel (chaque 1er du mois aux abonnés actifs)
- [X] T132 [US10] Créer EmailPreference modèle dans schema.prisma (userId, newsletter, impact, confirmations, marketing)
- [X] T133 [US10] Créer email preferences endpoint de gestion: PUT /users/me/email-preferences dans UsersController
- [X] T134 [US10] Ajouter email preferences page dans Profile (checkboxes: newsletter, impact récap, confirmations, marketing)
- [X] T135 [US10] Mettre à jour MailService pour respecter email preferences avant envoi

**Checkpoint** : Emails automatisés envoyés, utilisateurs peuvent gérer préférences

---

## Phase 14 : Users Module (Profile Management)

**Objectif** : Utilisateur consulte et modifie son profil

**Tester Indépendant** : Utilisateur connecté voit profil, modifie infos, sauvegarde

**Analyse** : User modèle existe. Créer module users backend + page Profile frontend.

### Backend : Module Users

- [X] T136 Créer users structure du module: EarthwayBack/src/users/users.module.ts
- [X] T137 [P] Créer UsersService dans EarthwayBack/src/users/users.service.ts (getMe, updateMe)
- [X] T138 [P] Créer UsersController dans EarthwayBack/src/users/users.controller.ts avec endpoints: GET /users/me, PUT /users/me
- [X] T139 [P] Créer UpdateUserDto dans EarthwayBack/src/users/dto/update-user.dto.ts

### Frontend : Page Profil

- [X] T140 [P] Créer Profile page dans EarthwayFront/src/pages/Profile.tsx (afficher user info, subscription status, impact tableau de bord, donations historique)
- [X] T141 [P] Créer userService.ts dans EarthwayFront/src/services/userService.ts (getMe, updateMe)
- [X] T142 Ajouter profile formulaire édition dans Profile page (firstName, lastName, email - lecture seule, photoUrl)

**Checkpoint** : Utilisateurs peuvent consulter et modifier leur profil

---

## Phase 15 : Polish & Cross-Cutting Concerns

**Objectif** : Finalize UX, security, performance, and deployment

### Sécurité & Validation

- [X] T143 [P] Ajouter class-validator DTOs validation dans tous les backend controllers (auth, subscriptions, donations, users)
- [X] T144 [P] Implémenter rate middleware de limitation dans EarthwayBack/src/common/guards/throttler.guard.ts (@nestjs/throttler)
- [X] T145 [P] Ajouter CORS configuration dans EarthwayBack/src/main.ts (restreindre origines à domaine frontend)
- [ ] T146 Ajouter HTTPS application dans Traefik configuration (rediriger HTTP vers HTTPS)
- [X] T147 Ajouter Helmet.js en-têtes sécurité dans EarthwayBack/src/main.ts

### Gestion Erreurs & Logging

- [X] T148 [P] Créer filtre d'exceptions global dans EarthwayBack/src/common/filters/http-exception.filter.ts
- [ ] T149 [P] Ajouter logging structuré avec Winston or Pino dans EarthwayBack
- [X] T150 Ajouter limites d'erreur dans React frontend (ErrorBoundary composant)

### Optimisation Performance

- [X] T151 [P] Ajouter index de base de données dans schema.prisma (User.email, Subscription.stripeSubscriptionId, Donation.stripePaymentIntentId)
- [X] T152 [P] Optimize frontend bundle size: découpage code, chargement lazy des routes dans App.tsx
- [ ] T153 Exécuter Lighthouse audit performance sur frontend, corriger problèmes (LCP < 1.5s cible)
- [ ] T154 Ajouter Redis mise en cache pour news articles (GET /news endpoint, 24h TTL)

### Tests

- [ ] T155 [P] Écrire E2E tests for flux auth dans EarthwayBack/test/auth.e2e-spec.ts (register, login, refresh)
- [ ] T156 [P] Écrire E2E tests for subscriptions flow dans EarthwayBack/test/subscriptions.e2e-spec.ts
- [ ] T157 [P] Écrire E2E tests for donations flow dans EarthwayBack/test/donations.e2e-spec.ts
- [ ] T158 [P] Écrire E2E tests for webhooks dans EarthwayBack/test/webhooks.e2e-spec.ts (signature validation)
- [ ] T159 [P] Écrire frontend tests pour chemins critiques avec React Testing Library (Login, Register, Subscriptions)

### Déploiement & DevOps

- [ ] T160 Créer production docker-compose.yml with Traefik reverse proxy
- [ ] T161 [P] Créer .env.production.example avec toutes les variables de production
- [ ] T162 [P] Configurer PostgreSQL base de données de production sur Scaleway
- [ ] T163 [P] Configurer Redis instance de production sur Scaleway
- [ ] T164 Configurer Stripe endpoint webhooks de production (configurer URL dans Stripe tableau de bord)
- [ ] T165 Configurer SSL certificats via Traefik Let's Encrypt
- [ ] T166 Créer documentation de déploiement dans specs/001-global-product-spec/quickstart.md (configuration locale + déploiement production)

### Validation Finale

- [ ] T167 Exécuter full suite de tests de régression (backend E2E + frontend E2E)
- [ ] T168 Valider all 10 user stories work de bout en bout
- [ ] T169 Vérifier constitution principes respectés (check plan.md constitution check)
- [ ] T170 Exécuter audit de sécurité (npm audit, vérification des dépendances)

**Checkpoint** : Production-ready, all tests pass, deployment documented

---

## Phase 16 : User Story 11 - Affiliation & Deep Linking (Priorité : P3)

**Objectif** : Utilisateur cliqué sur "Acheter" est redirigé via lien affilié tracké, Earthway logue le clic et peut changer de réseau sans refonte

**Tester Indépendant** : Clic sur produit marketplace → redirection vers marchand avec paramètres du bon réseau (ShareASale/Awin/Affilizz/Amazon) + log en base

**Analyse** : La marketplace (Phase 10) existe avec `Product` model et liens statiques. Ajouter `AffiliateLink` et `AffiliateClickLog` models, endpoint de redirection server-side, mise à jour ProductCard.

### Backend : Module Affiliate

- [X] T171 [US11] Ajouter modèles `AffiliateLink` et `AffiliateClickLog` dans `EarthwayBack/prisma/schema.prisma` (slug unique, network enum, baseUrl, trackingParams JSON, isActive, userId? nullable pour RGPD, ipHash SHA256)
- [X] T172 [US11] Générer migration Prisma pour les nouveaux modèles affiliation (`npx prisma migrate dev --name add_affiliate_models`)
- [X] T173 [P] [US11] Créer `AffiliateModule` dans `EarthwayBack/src/affiliate/affiliate.module.ts`
- [X] T174 [P] [US11] Créer `AffiliateService` dans `EarthwayBack/src/affiliate/affiliate.service.ts` (méthodes: `buildAffiliateUrl(link)`, `logClick(slug, userId?, ip, userAgent, referrer)`, `getLinkBySlug(slug)`)
- [X] T175 [P] [US11] Créer `AffiliateController` dans `EarthwayBack/src/affiliate/affiliate.controller.ts` avec endpoint `GET /affiliate/redirect/:slug` → HTTP 302 vers URL finale ; log clic en async (ne pas bloquer la redirection)
- [X] T176 [US11] Implémenter construction URL affiliée selon réseau dans `AffiliateService` (`shareasale`, `awin`, `affilizz`, `amazon`, `direct` — JSON `trackingParams` injecté dans query string)
- [X] T177 [US11] Mettre à jour `MarketplaceService` pour inclure le slug `AffiliateLink` dans la réponse `GET /marketplace/products` (join `Product → AffiliateLink`)
- [X] T178 [US11] Mettre à jour `seed.ts` pour insérer 5-10 `AffiliateLink` exemples couvrant les 4 réseaux (ShareASale, Awin, Affilizz, Amazon Associates)

### Frontend : Composant AffiliateLink & ProductCard

- [X] T179 [P] [US11] Créer composant `AffiliateLinkButton` dans `EarthwayFront/src/components/AffiliateLinkButton.tsx` — bouton "Acheter →" qui ouvre `/api/affiliate/redirect/${slug}` dans nouvel onglet avec `rel="noopener noreferrer"` ; affiche réseau en badge discret (Amazon/Awin/etc.)
- [X] T180 [US11] Mettre à jour `ProductCard.tsx` pour utiliser `AffiliateLinkButton` si `affiliateSlug` est disponible, sinon fallback lien direct
- [X] T181 [P] [US11] Créer `affiliateService.ts` dans `EarthwayFront/src/services/affiliateService.ts` (fonction utilitaire `getAffiliateRedirectUrl(slug)`)
- [X] T182 [US11] Mettre à jour type `Product` dans `EarthwayFront/src/types/product.ts` pour ajouter `affiliateSlug?: string` et `affiliateNetwork?: string`
- [ ] T183 [US11] Ajouter filtre/badge "Réseau d'affiliation" dans `Marketplace.tsx` (filtre optionnel par réseau pour transparence utilisateur)

**Checkpoint** : Liens affiliés trackés fonctionnels, rotation réseau sans redéploiement, logs en base

---

## Phase 17 : User Story 12 - Publicité & Monétisation (Priorité : P3)

**Objectif** : Afficher des publicités natives/display non-intrusives aux utilisateurs non-abonnés après consentement RGPD, avec architecture permettant de changer facilement de provider

**Tester Indépendant** : Utilisateur non-abonné sans consentement → voit bannière RGPD → accepte → voit des pubs dans Actualités/Marketplace. Abonné → aucune pub.

**Analyse** : Aucune infrastructure publicitaire dans l'app. Créer composants `AdSlot`, `ConsentBanner`, hook `useConsent`. Configuration par variables d'environnement Vite.

### Frontend : Infrastructure Publicitaire

- [X] T184 [P] [US12] Créer hook `useConsent` dans `EarthwayFront/src/Hooks/useConsent.ts` — lit/écrit consentement dans `localStorage` (`"granted"` | `"denied"` | `null`) ; expose `{ consent, grantConsent, denyConsent }`
- [X] T185 [P] [US12] Créer composant `ConsentBanner` dans `EarthwayFront/src/components/ConsentBanner.tsx` — bannière non-intrusive en bas de page (position fixed), visible tant que `consent === null` ; boutons "Accepter" / "Refuser" ; lien "En savoir plus" (RGPD) ; WCAG accessible (`role="dialog"`, `aria-label`)
- [X] T186 [P] [US12] Créer composant `AdSlot` dans `EarthwayFront/src/components/AdSlot.tsx` — rendu conditionnel selon `consent` et statut abonné ; props: `format: 'in-feed' | 'display' | 'native'`, `slotKey: string`, `className?: string` ; délègue au renderer selon `VITE_AD_PROVIDER` (AdSense par défaut)
- [X] T187 [US12] Implémenter renderer AdSense dans `AdSlot.tsx` — charge le script `//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js` une seule fois (via `useEffect` + ref guard) ; rend `<ins class="adsbygoogle">` avec `data-ad-client` et `data-ad-slot` depuis `import.meta.env`
- [X] T188 [US12] Ajouter configuration env frontend dans `.env.example` : `VITE_AD_PROVIDER=adsense`, `VITE_ADSENSE_CLIENT=ca-pub-XXXX`, `VITE_ADSENSE_SLOT_FEED=`, `VITE_ADSENSE_SLOT_DISPLAY=` — valeurs vides en dev (pas de pubs en dev)
- [X] T189 [P] [US12] Intégrer `ConsentBanner` dans `App.tsx` (rendu global, visible sur toutes les pages)
- [X] T190 [US12] Ajouter emplacements `AdSlot` dans `News.tsx` — 1 unité `in-feed` entre article 3 et 4 (si liste > 3 articles), 1 unité `display` en bas de liste
- [X] T191 [US12] Ajouter emplacements `AdSlot` dans `Marketplace.tsx` — 1 unité `display` après la grille de produits (mobile : entre produits, desktop : colonne latérale si layout > 3 colonnes)
- [X] T192 [US12] Implémenter logique "zéro pub pour les abonnés" dans `AdSlot.tsx` — utiliser `useAuth()` pour vérifier `user?.subscription?.status === 'active'` ; si abonné → `return null`
- [X] T193 [P] [US12] Ajouter renderer stub `renderMediaNet` dans `AdSlot.tsx` (commenté, prêt pour activation) comme alternative à AdSense — activable en changeant `VITE_AD_PROVIDER=medianet`

**Checkpoint** : Publicités visibles pour utilisateurs non-abonnés avec consentement RGPD, abonnés sans pub, changement provider = changement `.env`

---

## Dépendances

### Ordre de Complétion des User Stories

**Chemin Critique MVP** (doit être complété dans cet ordre):
1. **Phase 1-2**: Configuration + Fondations (bloque toutes les stories)
2. **Phase 3**: US1 (Découverte) → permet acquisition utilisateurs
3. **Phase 4**: US2 (Information) → permet engagement contenu
4. **Phase 5**: US3 (Authentification) → permet comptes utilisateurs (bloque US4, US5, US7)
5. **Phase 6**: US4 (Abonnements) + **Phase 7**: US5 (Dons) → peuvent être parallèles, les deux permettent monétisation
6. **Phase 9**: Webhooks (bloque US4, US5 production)
7. **Phase 8**: US7 (tableau de bord Impact) → requiert données US4, US5

**Post-MVP** (peuvent être parallèles ou séquentiels):
- **Phase 10**: US6 (Marketplace) → indépendant
- **Phase 11**: US9 (PWA) → améliore UX mobile
- **Phase 12**: US8 (Gamification) → optionnel
- **Phase 13**: US10 (Emails) → optionnel
- **Phase 14**: Module Users → améliore gestion profil
- **Phase 15**: Finitions → préparation finale production

### Exemples d'Exécution Parallèle

**Après Phase Fondations Complète** (T001-T021):
- Tâches US1 (T022-T026) peuvent s'exécuter en parallèle avec tâches backend US2 (T027-T032)
- Tâches frontend US2 (T033-T039) dépendent de la complétion backend T027-T032
- Tâches backend US3 (T040-T047) peuvent démarrer en parallèle avec US1, US2

**Après US3 Complète**:
- Backend US4 (T059-T067) et backend US5 (T075-T081) peuvent s'exécuter entièrement en parallèle
- Frontend US4 (T068-T072) et frontend US5 (T082-T085) peuvent s'exécuter en parallèle (après leurs backends respectifs)

**Parallélisation Post-MVP**:
- US6, US8, US9, US10 peuvent toutes s'exécuter en parallèle (indépendantes)
- Tâches finitions Phase 15 (T143-T170) peuvent être distribuées dans l'équipe

---

## Stratégie d'Implémentation

### MVP en Premier (Semaines 1-6)
**Objectif** : Livrer plateforme fonctionnelle avec proposition de valeur core

**Périmètre**: Phases 1-9 (Configuration → Webhooks)
- Semaine 1-2: Configuration, Fondations, US1, US2 (plateforme information fonctionnelle)
- Semaine 3-4: US3 (Auth), US4 (Abonnements), US5 (Dons)
- Semaine 5: Webhooks + US7 (tableau de bord Impact)
- Semaine 6: Tests, corrections bugs, préparation déploiement

**Livrable**: Les utilisateurs peuvent découvrir, lire actualités, créer compte, s'abonner/donner, voir impact

### Post-MVP Incrémental (Semaines 7-10)
**Objectif** : Améliorer engagement et rétention

**Périmètre**: Phases 10-15
- Semaine 7: US6 (Marketplace) + US9 (PWA)
- Semaine 8: US8 (Gamification) + US10 (Emails)
- Semaine 9: Module Users + Finitions (sécurité, performance)
- Semaine 10: Tests complets, déploiement production, monitoring

**Livrable**: Plateforme complète avec marketplace, PWA, gamification, emails

---

## Notes

### Analyse du Code Existant

**Backend (EarthwayBack)**:
- ✅ Structure NestJS de base (app.module, main.ts)
- ✅ Module mail (mail.service, mail.processor, templates/confirmation.hbs)
- ✅ Schéma Prisma (modèles User, Subscription, Support, Donation, ONG, Category, Article, Media, Marketplace, ArticleMarket)
- ❌ Manquants: modules auth, subscriptions, donations, news, marketplace, impact, webhooks, users
- ⚠️ Schéma nécessite migration: MySQL → PostgreSQL, ajouter modèles manquants (NewsArticle, Product, Impact, EmailPreference)

**Frontend (EarthwayFront)**:
- ✅ Structure React de base (App.tsx, main.tsx)
- ✅ Pages: home.tsx (4 thématiques), pollinisateur.tsx
- ✅ Composants: nav.tsx, modalAbo.tsx
- ✅ Hook: UseApi.tsx
- ❌ Manquants: pages auth (Login, Register), page actualités, page marketplace, page abonnements, page dons, page profil, pages éducatives (Océans, Reforestation, Innovations)
- ❌ Manquants: services (api.ts, authService, subscriptionService, donationService, newsService, marketplaceService, impactService)
- ❌ Manquants: context (AuthContext)
- ❌ Manquants: types, hooks (useAuth, useImpact)

**Recommandations**:
1. Commencer par la migration du schéma Prisma (T001, T008-T009) pour aligner avec plan.md
2. Exploiter la structure MailService existante pour nouveaux templates
3. Améliorer home.tsx et pollinisateur.tsx existants plutôt que recréer
4. Réutiliser modalAbo.tsx existant pour flux abonnement
5. Compléter l'infrastructure fondamentale manquante (auth, routing) avant les user stories

---

**Total Tâches**: 170  
**Tâches MVP Estimées**: ~110 (Phases 1-9)  
**Tâches Post-MVP Estimées**: ~60 (Phases 10-15)

**Statut**: ✅ Tâches générées, prêtes pour implémentation via `/speckit.implement`


---

## Phase 16 : Skills Integration & Quality Assurance

**Objectif** : Améliorer qualité du code avec tests complets, optimisations Stripe, visualisations impact

**Contexte** : 3 skills installés : nestjs-testing-expert, stripe-integration, data-visualization

### Tests Backend (CRITICAL)

- [X] T-SKILL-001 Créer StripeProvider injectable (résout problème mock)
- [X] T-SKILL-002 Créer auth.service.spec.ts (21 tests)
- [X] T-SKILL-003 Créer subscriptions.service.spec.ts (19 tests)
- [X] T-SKILL-004 Créer impact.service.spec.ts (18 tests)
- [ ] T-SKILL-005 Créer donations.service.spec.ts (tester cause distribution, anonymous)
- [ ] T-SKILL-006 Créer webhooks.service.spec.ts (validation signature, idempotency)
- [ ] T-SKILL-007 Créer tests e2e auth.e2e-spec.ts
- [ ] T-SKILL-008 Créer tests e2e donations.e2e-spec.ts
- [ ] T-SKILL-009 Ajouter coverage report (jest --coverage)

### Stripe Optimizations (HIGH)

- [ ] T-SKILL-010 [P] Implémenter retry logic webhooks avec exponential backoff
- [ ] T-SKILL-011 [P] Ajouter flow upgrade subscription (proration automatique)
- [ ] T-SKILL-012 [P] Ajouter flow downgrade subscription (effective next period)
- [ ] T-SKILL-013 [P] Améliorer gestion erreurs paiements (card_declined, insufficient_funds)
- [ ] T-SKILL-014 Ajouter support 3D Secure/SCA pour paiements UE

### Data Visualizations (MEDIUM)

- [ ] T-SKILL-015 [P] Créer composant TrendChart.tsx (React + Chart.js/D3)
- [ ] T-SKILL-016 [P] Ajouter graphique tendance mensuelle dons dans Profile.tsx
- [ ] T-SKILL-017 [P] Améliorer ImpactDashboard avec chart stacked area (répartition causes)
- [ ] T-SKILL-018 [P] Créer chart évolution CO2 compensé dans le temps
- [ ] T-SKILL-019 [P] Appliquer palettes colorblind-friendly (selon skill data-visualization)
- [ ] T-SKILL-020 [P] Ajouter tooltips interactifs sur progress bars
- [ ] T-SKILL-021 Améliorer ProgressBar.tsx avec animations smooth (CSS transitions)

**Checkpoint** : > 80% test coverage, paiements optimisés, visualisations engageantes

---

**Total Tâches avec Skills** : 191 (170 + 21)
**Tâches Complétées** : 146 (142 initiales + 4 skills)
