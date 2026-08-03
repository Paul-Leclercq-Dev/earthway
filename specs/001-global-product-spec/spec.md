# Feature Specification: Earthway Global Product

**Feature Branch**: `001-global-product-spec`  
**Created**: 2025-12-05  
**Status**: Draft  
**Input**: User description: "Earthway Global Product Specification - Plateforme de sensibilisation environnementale avec abonnements, dons, marketplace et dashboard d'impact"

## Overview

Earthway est une application de sensibilisation environnementale conçue pour informer, engager et permettre aux utilisateurs de contribuer concrètement à la protection de la biodiversité.

**Problèmes résolus**:
1. Manque d'informations environnementales fiables et accessibles
2. Difficulté pour les individus de comprendre comment agir concrètement
3. Absence de plateforme centralisée permettant de mesurer son impact écologique personnel
4. Manque d'outils numériques modernes et attractifs pour sensibiliser à l'écologie

**Solution**: Plateforme mobile-first (PWA) structurée autour de quatre piliers : Information, Engagement, Impact Personnel, et Expérience Utilisateur Moderne.

## User Scenarios & Testing

### User Story 1 - Découverte et Compréhension (Priority: P1) 🎯 MVP

L'utilisateur visite Earthway pour la première fois et doit comprendre immédiatement la proposition de valeur et les actions possibles.

**Why this priority**: Sans compréhension rapide du produit, aucune conversion n'est possible. C'est le point d'entrée critique.

**Independent Test**: Un nouvel utilisateur peut naviguer sur la page d'accueil et identifier en moins de 10 secondes : (1) ce qu'est Earthway, (2) les thématiques environnementales couvertes, (3) comment il peut agir.

**Acceptance Scenarios**:

1. **Given** je suis un visiteur non connecté, **When** j'accède à la page d'accueil, **Then** je vois une présentation claire d'Earthway avec les 4 thématiques (reforestation, océans/coraux, pollinisateurs, innovations)
2. **Given** je suis sur la page d'accueil, **When** je parcours les sections, **Then** je vois des CTA (Call-to-Action) clairs pour m'inscrire, m'abonner ou en savoir plus
3. **Given** je découvre Earthway, **When** je clique sur une thématique, **Then** j'accède à une page pédagogique expliquant les enjeux sans jargon technique

---

### User Story 2 - Sensibilisation et Information (Priority: P1) 🎯 MVP

L'utilisateur souhaite s'informer sur les enjeux environnementaux via des actualités fiables et des contenus pédagogiques.

**Why this priority**: L'information est le premier levier d'engagement. Sans contenus de qualité, l'utilisateur ne reste pas.

**Independent Test**: Un utilisateur peut consulter les actualités environnementales filtrées et accéder aux pages éducatives sur les thématiques clés (pollinisateurs, océans, reforestation) sans créer de compte.

**Acceptance Scenarios**:

1. **Given** je suis sur la page Actualités, **When** je consulte la liste, **Then** je vois des articles récents, filtrés, avec titre, résumé et source
2. **Given** je clique sur un article, **When** la page se charge, **Then** je peux lire le contenu complet ou être redirigé vers la source
3. **Given** je veux approfondir un sujet, **When** je navigue vers une page éducative (ex: Pollinisateurs), **Then** je trouve des explications claires, visuelles et accessibles
4. **Given** aucune actualité n'est disponible temporairement, **When** j'accède à la page Actualités, **Then** je vois un message clair indiquant le problème temporaire

---

### User Story 3 - Inscription et Authentification (Priority: P1) 🎯 MVP

L'utilisateur souhaite créer un compte pour accéder aux fonctionnalités d'engagement et de suivi d'impact.

**Why this priority**: L'authentification est un prérequis pour les abonnements, dons et dashboard d'impact. Sans compte, pas de monétisation ni d'engagement profond.

**Independent Test**: Un utilisateur peut s'inscrire via email ou Google OAuth en moins de 2 minutes et se connecter à son compte de manière fluide.

**Acceptance Scenarios**:

1. **Given** je suis un nouveau visiteur, **When** je clique sur "S'inscrire", **Then** je peux créer un compte avec mon email et un mot de passe
2. **Given** je suis sur la page d'inscription, **When** je clique sur "Continuer avec Google", **Then** je suis authentifié via Google OAuth
3. **Given** je me suis inscrit, **When** je valide mon email, **Then** je reçois un email de bienvenue et peux me connecter
4. **Given** je suis déjà inscrit, **When** je clique sur "Se connecter", **Then** je saisis mes identifiants et accède à mon compte
5. **Given** j'ai oublié mon mot de passe, **When** je clique sur "Mot de passe oublié", **Then** je reçois un email pour le réinitialiser

---

### User Story 4 - Abonnement et Soutien Récurrent (Priority: P2)

L'utilisateur souhaite soutenir Earthway et les initiatives environnementales via un abonnement mensuel ou annuel.

**Why this priority**: L'abonnement est le principal levier de revenus récurrents. Critique pour la viabilité business mais nécessite d'abord une base d'utilisateurs engagés (P1).

**Independent Test**: Un utilisateur connecté peut choisir un niveau d'abonnement, procéder au paiement via Stripe, et recevoir une confirmation par email.

**Acceptance Scenarios**:

1. **Given** je suis connecté, **When** j'accède à la page Abonnements, **Then** je vois plusieurs niveaux d'abonnement avec leurs bénéfices clairement expliqués
2. **Given** je choisis un abonnement, **When** je clique sur "S'abonner", **Then** je suis redirigé vers le formulaire de paiement Stripe
3. **Given** j'ai saisi mes informations de paiement, **When** je valide, **Then** mon abonnement est activé et je reçois un email de confirmation
4. **Given** je suis abonné, **When** je vais sur mon profil, **Then** je vois le statut de mon abonnement et la date de renouvellement
5. **Given** je souhaite me désabonner, **When** je clique sur "Annuler l'abonnement", **Then** je reçois une confirmation et mon abonnement est arrêté à la fin de la période en cours

---

### User Story 5 - Dons Ponctuels (Priority: P2)

L'utilisateur souhaite faire un don unique pour soutenir une cause environnementale spécifique.

**Why this priority**: Complémentaire aux abonnements, les dons ponctuels permettent un engagement flexible. Même priorité que les abonnements car les deux sont des leviers de monétisation.

**Independent Test**: Un utilisateur (connecté ou non) peut effectuer un don ponctuel via Stripe et recevoir une confirmation.

**Acceptance Scenarios**:

1. **Given** je suis sur la page Dons, **When** je choisis un montant ou saisis un montant personnalisé, **Then** je peux sélectionner une cause (arbres, coraux, pollinisateurs, général)
2. **Given** j'ai choisi mon don, **When** je clique sur "Faire un don", **Then** je suis redirigé vers le formulaire de paiement Stripe
3. **Given** j'ai effectué un don, **When** le paiement est validé, **Then** je reçois un email de remerciement avec le détail du don
4. **Given** je suis connecté et j'ai fait un don, **When** je consulte mon profil, **Then** je vois l'historique de mes dons

---

### User Story 6 - Marketplace et Affiliation (Priority: P3)

L'utilisateur souhaite découvrir et acheter des produits responsables via une marketplace affiliée.

**Why this priority**: Revenus complémentaires mais moins critiques que les abonnements/dons. Nécessite d'abord une audience engagée.

**Independent Test**: Un utilisateur peut parcourir la marketplace, voir des produits responsables avec liens d'affiliation, et être redirigé vers le site marchand.

**Acceptance Scenarios**:

1. **Given** je suis sur la page Marketplace, **When** je parcours les produits, **Then** je vois des produits éthiques/responsables avec descriptions et images
2. **Given** je clique sur un produit, **When** la page se charge, **Then** je vois les détails et un lien "Acheter" clairement identifié
3. **Given** je clique sur "Acheter", **When** le lien s'ouvre, **Then** je suis redirigé vers le site marchand (lien affilié)
4. **Given** je ne veux pas d'impression publicitaire agressive, **When** je navigue sur la marketplace, **Then** les produits sont présentés de manière sobre et cohérente avec l'identité Earthway

---

### User Story 7 - Dashboard d'Impact Personnel (Priority: P2)

L'utilisateur abonné souhaite visualiser l'impact concret de ses contributions (arbres, coraux, pollinisateurs, montant total).

**Why this priority**: Le dashboard est un levier de rétention et d'engagement fort. Nécessite des abonnements actifs (P2).

**Independent Test**: Un utilisateur abonné peut accéder à son profil et voir un dashboard affichant son impact cumulé de manière claire et compréhensible.

**Acceptance Scenarios**:

1. **Given** je suis un utilisateur abonné, **When** j'accède à mon profil, **Then** je vois un dashboard avec : arbres financés, coraux restaurés, pollinisateurs protégés, contribution totale en €
2. **Given** je consulte mon dashboard, **When** je survole ou clique sur un chiffre, **Then** je vois une explication claire de comment cet impact est calculé
3. **Given** je suis abonné depuis plusieurs mois, **When** je consulte mon historique, **Then** je vois l'évolution de mon impact dans le temps
4. **Given** je viens de m'abonner, **When** je consulte mon dashboard, **Then** je vois un message d'accueil expliquant que mon impact sera visible dès le premier mois

---

### User Story 8 - Progression et Gamification (Priority: P3)

L'utilisateur souhaite visualiser son niveau d'engagement via une barre de progression ou un système de niveaux.

**Why this priority**: Améliore la rétention mais non critique pour le MVP. Peut être ajouté après validation du modèle principal.

**Independent Test**: Un utilisateur actif voit sa barre de progression évoluer en fonction de ses actions (abonnement, dons, visites).

**Acceptance Scenarios**:

1. **Given** je suis un utilisateur actif, **When** je consulte mon profil, **Then** je vois une barre de progression ou un niveau d'engagement
2. **Given** j'effectue des actions (don, abonnement, visite), **When** je reviens sur mon profil, **Then** ma progression a augmenté
3. **Given** j'atteins un nouveau niveau, **When** cela se produit, **Then** je reçois une notification ou un email de félicitations

---

### User Story 9 - Installation PWA (Priority: P2)

L'utilisateur mobile souhaite installer Earthway comme une application sur son téléphone pour un accès rapide.

**Why this priority**: L'expérience mobile est critique (mobile-first), et la PWA améliore considérablement la rétention. Priorité P2 car nécessite d'abord du contenu et des fonctionnalités (P1).

**Independent Test**: Un utilisateur sur mobile peut installer Earthway via le navigateur et la lancer comme une app native.

**Acceptance Scenarios**:

1. **Given** je suis sur mobile (Chrome/Safari), **When** je visite Earthway, **Then** je vois une invitation à installer l'application
2. **Given** j'accepte l'installation, **When** je clique sur "Installer", **Then** Earthway s'ajoute à mon écran d'accueil
3. **Given** j'ai installé Earthway, **When** je lance l'app, **Then** elle s'ouvre en plein écran sans barre de navigateur
4. **Given** je perds la connexion internet, **When** j'ouvre Earthway, **Then** je vois un message clair indiquant la perte de connexion (service worker)

---

### User Story 10 - Emails Automatisés (Priority: P3)

L'utilisateur souhaite recevoir des emails pertinents (bienvenue, impact mensuel, confirmations) pour rester engagé.

**Why this priority**: Les emails améliorent la rétention et la conversion mais ne sont pas bloquants pour le MVP. Peuvent être ajoutés progressivement.

**Independent Test**: Un utilisateur inscrit reçoit des emails automatiques aux moments clés (inscription, abonnement, impact mensuel).

**Acceptance Scenarios**:

1. **Given** je viens de m'inscrire, **When** mon compte est créé, **Then** je reçois un email de bienvenue avec un lien vers les pages clés
2. **Given** je viens de m'abonner, **When** l'abonnement est confirmé, **Then** je reçois un email de remerciement avec les détails
3. **Given** je suis abonné depuis un mois, **When** le mois se termine, **Then** je reçois un email récapitulant mon impact
4. **Given** je fais un don, **When** le paiement est validé, **Then** je reçois un email de confirmation avec reçu fiscal (si applicable)

---

### Edge Cases

- **Utilisateur non connecté tente d'accéder au dashboard**: Redirection vers la page de connexion avec message clair "Connectez-vous pour voir votre impact"
- **Utilisateur se désabonne immédiatement après abonnement**: L'abonnement reste actif jusqu'à la fin de la période payée, avec message de confirmation
- **Absence temporaire de données d'actualités**: Affichage d'un message clair "Actualités temporairement indisponibles, revenez bientôt" au lieu d'une page vide
- **Mauvaise compréhension des chiffres d'impact**: Chaque métrique (arbres, coraux, etc.) dispose d'une info-bulle ou page explicative détaillant le calcul
- **Paiement Stripe échoue**: Message d'erreur clair + email de notification + possibilité de réessayer immédiatement
- **Utilisateur installe la PWA mais l'ouvre hors ligne**: Service worker affiche une page d'erreur élégante avec message "Vous êtes hors ligne"
- **Utilisateur clique sur un lien marketplace affilié puis ferme la page**: Aucun impact sur Earthway, le tracking d'affiliation est géré côté marchand

---

### User Story 11 - Affiliation & Deep Linking (Priority: P3)

L'utilisateur souhaite être redirigé vers des partenaires/marketplaces externes via des liens affiliés trackés, permettant à Earthway de générer des revenus de commission.

**Why this priority**: Revenus complémentaires non-bloquants. Nécessite une audience engagée et une marketplace fonctionnelle (US6). La gestion centralisée des liens permet de changer de réseau d'affiliation sans refonte.

**Choix technique**: **Deep Linking** — redirection server-side ou client-side vers l'URL affiliée finale. Les paramètres de tracking sont injectés dynamiquement côté serveur pour permettre une rotation des réseaux sans déploiement frontend.

**Réseaux d'affiliation ciblés**: ShareASale, Awin, Affilizz, Amazon Associates.

**Independent Test**: Un utilisateur clique sur "Acheter" sur un produit marketplace, est redirigé vers le site marchand avec les bons paramètres d'affiliation, et le clic est loggué côté Earthway.

**Acceptance Scenarios**:

1. **Given** je suis sur la page Marketplace, **When** je clique sur "Acheter" sur un produit, **Then** je suis redirigé vers le site marchand avec le lien affilié correct (paramètres ShareASale/Awin/Affilizz/Amazon injectés)
2. **Given** je clique sur un lien affilié, **When** la redirection se produit, **Then** Earthway logue le clic (timestamp, produit, réseau) en base sans bloquer la navigation
3. **Given** Earthway change de réseau d'affiliation pour un partenaire, **When** l'administrateur met à jour le lien en base, **Then** tous les clics futurs utilisent le nouveau réseau sans redéploiement
4. **Given** je navigue sur la marketplace, **When** je vois les produits, **Then** les liens "Acheter" s'ouvrent dans un nouvel onglet avec `rel="noopener noreferrer"` (sécurité)
5. **Given** je clique sur un lien affilié expiré ou invalide, **When** la redirection échoue, **Then** je vois un message clair et reste sur la marketplace

---

### User Story 12 - Publicité & Monétisation (Priority: P3)

L'utilisateur voit des publicités natives ou display non-intrusives dans l'application, permettant à Earthway de générer des revenus publicitaires complémentaires.

**Why this priority**: Revenu passif complémentaire aux abonnements/dons/affiliation. Non-bloquant mais contribue à la viabilité financière. Requiert masse critique d'utilisateurs actifs.

**Solutions envisagées**: Google AdSense (priorité V1), Media.net ou Ezoic comme alternatives.

**Independent Test**: Un utilisateur non-abonné voit des emplacements publicitaires dans la page Actualités et/ou Marketplace, avec consentement RGPD préalable.

**Acceptance Scenarios**:

1. **Given** je suis un utilisateur non-abonné, **When** je consulte la page Actualités, **Then** je vois des publicités natives non-intrusives entre les articles
2. **Given** je suis un utilisateur abonné (payant), **When** je navigue sur l'application, **Then** je ne vois pas de publicités (avantage exclusif abonné)
3. **Given** je visite Earthway pour la première fois, **When** la page se charge, **Then** je vois une bannière de consentement RGPD avant l'affichage des publicités
4. **Given** je refuse les publicités personnalisées, **When** je navigue, **Then** aucune pub personnalisée ne s'affiche (respect du consentement)
5. **Given** les publicités sont activées, **When** elles s'affichent, **Then** leur format respecte l'identité visuelle d'Earthway (native/display sobres, pas de formats intrusifs)
6. **Given** je suis un administrateur, **When** je souhaite changer de provider publicitaire (AdSense → Media.net), **Then** seule la configuration change, pas le composant UI

---
- **Utilisateur reçoit trop d'emails**: Prévoir une page de préférences email pour contrôler la fréquence/types d'emails

## Requirements

### Functional Requirements

**Information & Sensibilisation**

- **FR-001**: Le système DOIT afficher une page d'accueil présentant les 4 thématiques principales (reforestation, océans/coraux, pollinisateurs, innovations)
- **FR-002**: Le système DOIT agréger et afficher des actualités environnementales issues de sources fiables
- **FR-003**: Le système DOIT filtrer les actualités pour éliminer le contenu hors sujet ou non fiable
- **FR-004**: Le système DOIT fournir des pages pédagogiques pour chaque thématique environnementale clé
- **FR-005**: Les pages éducatives DOIVENT être accessibles sans authentification

**Authentification & Comptes**

- **FR-006**: Le système DOIT permettre l'inscription via email et mot de passe
- **FR-007**: Le système DOIT permettre l'authentification via Google OAuth
- **FR-008**: Le système DOIT envoyer un email de validation lors de l'inscription
- **FR-009**: Le système DOIT permettre la réinitialisation du mot de passe via email
- **FR-010**: Le système DOIT utiliser JWT pour l'authentification (access + refresh tokens)

**Abonnements**

- **FR-011**: Le système DOIT proposer plusieurs niveaux d'abonnement (mensuel et/ou annuel)
- **FR-012**: Le système DOIT intégrer Stripe pour le traitement des paiements récurrents
- **FR-013**: Le système DOIT envoyer un email de confirmation après souscription d'abonnement
- **FR-014**: Le système DOIT permettre à l'utilisateur de consulter le statut de son abonnement
- **FR-015**: Le système DOIT permettre l'annulation d'abonnement avec effet à la fin de la période payée
- **FR-016**: Le système DOIT gérer les webhooks Stripe pour synchroniser les états d'abonnement

**Dons**

- **FR-017**: Le système DOIT permettre les dons ponctuels via Stripe
- **FR-018**: L'utilisateur DOIT pouvoir choisir un montant prédéfini ou personnalisé
- **FR-019**: L'utilisateur DOIT pouvoir sélectionner une cause spécifique (arbres, coraux, pollinisateurs, général)
- **FR-020**: Le système DOIT envoyer un email de remerciement après un don
- **FR-021**: Le système DOIT enregistrer l'historique des dons pour les utilisateurs connectés

**Marketplace**

- **FR-022**: Le système DOIT afficher une sélection de produits responsables/éthiques
- **FR-023**: Chaque produit DOIT avoir une description, une image et un lien d'affiliation
- **FR-024**: Le système DOIT rediriger vers le site marchand via un lien affilié lors du clic sur "Acheter"
- **FR-025**: La marketplace DOIT être conçue de manière sobre, sans impression publicitaire agressive

**Dashboard d'Impact**

- **FR-026**: Le système DOIT calculer et afficher l'impact cumulé de l'utilisateur (arbres, coraux, pollinisateurs, contribution totale)
- **FR-027**: Chaque métrique d'impact DOIT être accompagnée d'une explication claire du mode de calcul
- **FR-028**: Le système DOIT afficher l'historique d'impact dans le temps pour les utilisateurs abonnés
- **FR-029**: Le système DOIT afficher une barre de progression ou un niveau d'engagement

**PWA (Progressive Web App)**

- **FR-030**: Le système DOIT être installable comme PWA sur mobile (manifest.json)
- **FR-031**: Le système DOIT fonctionner en mode hors ligne avec un service worker
- **FR-032**: Le système DOIT afficher une page d'erreur claire en cas de perte de connexion
- **FR-033**: Le système DOIT avoir un design responsive et mobile-first

**Emails Automatisés**

- **FR-034**: Le système DOIT envoyer un email de bienvenue après inscription
- **FR-035**: Le système DOIT envoyer un email de confirmation après abonnement
- **FR-036**: Le système DOIT envoyer un email de confirmation après don
- **FR-037**: Le système DOIT envoyer un email mensuel récapitulant l'impact pour les abonnés
- **FR-038**: Les utilisateurs DOIVENT pouvoir gérer leurs préférences email (fréquence, types)

**Sécurité & Performance**

- **FR-039**: Toutes les données sensibles DOIVENT être chiffrées en transit (HTTPS obligatoire)
- **FR-040**: Les mots de passe DOIVENT être hashés avec un algorithme sécurisé (bcrypt/argon2)
- **FR-041**: Les webhooks Stripe DOIVENT être validés par signature
- **FR-042**: Le système DOIT valider toutes les entrées utilisateur côté serveur
- **FR-043**: Le temps de chargement de la page d'accueil DOIT être < 1.5s (LCP)

### Non-Functional Requirements

**Performance**

- **NFR-001**: Le système DOIT supporter 1000 utilisateurs simultanés sans dégradation
- **NFR-002**: Les endpoints API DOIVENT répondre en moins de 500ms (95e percentile)
- **NFR-003**: Les actualités DOIVENT être mises en cache pour optimiser les performances

**Scalabilité**

- **NFR-004**: L'architecture backend DOIT être modulaire pour faciliter les évolutions
- **NFR-005**: Le système DOIT pouvoir évoluer horizontalement (ajout de serveurs)

**Accessibilité**

- **NFR-006**: Le site DOIT respecter les standards WCAG 2.1 niveau AA
- **NFR-007**: Le contenu DOIT être lisible et compréhensible par un public non technique

**Conformité**

- **NFR-008**: Le système DOIT être conforme au RGPD
- **NFR-009**: Le consentement pour la newsletter DOIT être explicite et opt-in
- **NFR-010**: Les données personnelles DOIVENT être minimisées (principe de minimisation)

**Fiabilité**

- **NFR-011**: Le système DOIT avoir une disponibilité de 99% (hors maintenance planifiée)
- **NFR-012**: Les logs DOIVENT être structurés et conservés pour diagnostic

### Key Entities

**User (Utilisateur)**
- Identité : email, mot de passe hashé, fournisseur OAuth (optionnel)
- Profil : nom, prénom, photo (optionnel)
- Abonnement : statut actif/inactif, niveau, date de renouvellement
- Impact : arbres, coraux, pollinisateurs, total contributions
- Historique : dons, achats marketplace (affiliation), progression

**Subscription (Abonnement)**
- Niveau : nom, prix, bénéfices
- Période : mensuelle, annuelle
- Statut : actif, annulé, expiré
- Stripe : customer_id, subscription_id
- Dates : création, renouvellement, annulation

**Donation (Don)**
- Montant : valeur en €
- Cause : reforestation, océans, pollinisateurs, général
- Paiement : Stripe payment_intent_id, statut
- Date : timestamp de création

**NewsArticle (Article d'actualité)**
- Contenu : titre, résumé, URL source, image
- Métadonnées : date de publication, source, thématique
- Statut : validé, filtré (fiabilité)

**Product (Produit Marketplace)**
- Informations : nom, description, image, prix
- Affiliation : lien affilié, partenaire
- Thématique : reforestation, océans, zéro déchet, etc.

**Impact (Métrique d'Impact)**
- Utilisateur : référence User
- Métriques : arbres_financés, coraux_restaurés, pollinisateurs_protégés, contribution_totale_euros
- Historique : évolution mensuelle

**EmailPreference (Préférence Email)**
- Utilisateur : référence User
- Types : newsletter, impact, confirmations, marketing
- Fréquence : immédiat, hebdomadaire, mensuel, jamais

## Success Criteria

### Measurable Outcomes

**Compréhension & Onboarding**

- **SC-001**: 80% des nouveaux visiteurs comprennent la proposition de valeur en moins de 10 secondes (mesure : sondage post-visite ou heatmap)
- **SC-002**: Le taux de rebond sur la page d'accueil est inférieur à 60%
- **SC-003**: 50% des visiteurs consultent au moins une page éducative ou actualité lors de leur première visite

**Engagement & Conversion**

- **SC-004**: Le taux de conversion visiteur → inscrit est supérieur à 5%
- **SC-005**: Le taux de conversion inscrit → abonné est supérieur à 10%
- **SC-006**: 30% des utilisateurs inscrits effectuent au moins un don dans les 3 premiers mois
- **SC-007**: Le temps moyen de navigation par session est supérieur à 3 minutes

**Rétention**

- **SC-008**: 60% des abonnés restent actifs après 3 mois
- **SC-009**: 40% des utilisateurs inscrits reviennent au moins une fois par mois pour consulter leur impact ou les actualités
- **SC-010**: Le taux d'ouverture des emails d'impact mensuel est supérieur à 40%

**Mobile & PWA**

- **SC-011**: Plus de 50% des visites proviennent de mobile
- **SC-012**: 20% des utilisateurs mobiles installent la PWA dans les 30 jours suivant l'inscription
- **SC-013**: Le temps de chargement initial (LCP) sur mobile est inférieur à 1.5 secondes

**Business**

- **SC-014**: Le revenu mensuel récurrent (MRR) via abonnements augmente de 10% chaque mois
- **SC-015**: Le montant moyen des dons ponctuels est supérieur à 15€
- **SC-016**: La marketplace génère au moins 5% du revenu total via commissions d'affiliation

**UX & Satisfaction**

- **SC-017**: Le Net Promoter Score (NPS) est supérieur à 40
- **SC-018**: Les utilisateurs trouvent n'importe quelle fonctionnalité en moins de 3 clics
- **SC-019**: Le taux de complétion du parcours d'abonnement (choix → paiement → confirmation) est supérieur à 70%

**Impact & Transparence**

- **SC-020**: 90% des utilisateurs abonnés comprennent comment leur impact est calculé (mesure : sondage ou test utilisateur)
- **SC-021**: Zéro réclamation concernant la transparence des calculs d'impact sur une période de 3 mois

## Assumptions

- Les utilisateurs ont accès à un smartphone ou ordinateur avec navigateur moderne (Chrome, Safari, Firefox)
- Les utilisateurs sont prêts à partager leur email pour créer un compte
- Les sources d'actualités environnementales sont accessibles via API ou scraping légal
- Stripe est le partenaire de paiement unique (pas de PayPal en V1)
- Les calculs d'impact sont basés sur des données fournies par des partenaires écologiques vérifiables
- Les produits de la marketplace sont présélectionnés manuellement (pas de marketplace ouverte en V1)
- L'utilisateur moyen a une connexion internet stable (3G minimum)
- Le budget marketing initial permet d'atteindre 1000 visiteurs mensuels

## Out of Scope (Version 1)

Les éléments suivants ne sont **pas** inclus dans la version initiale :

- Application mobile native (iOS/Android)
- Programme entreprise / sponsoring corporate
- Système de parrainage
- Gamification avancée (badges visuels, classements)
- Back-office d'administration complet
- Authentification Apple (prévu V2)
- Paiements via PayPal ou autres processeurs
- Marketplace ouverte (vendeurs tiers)
- Localisation multilingue (FR uniquement en V1)
- API publique pour développeurs tiers
- Intégration réseaux sociaux (partage, connexion Facebook, Twitter)
- Programme de compensation carbone personnelle
