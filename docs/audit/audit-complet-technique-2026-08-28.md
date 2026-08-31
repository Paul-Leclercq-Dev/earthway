# Audit complet plateforme Earthway

Date: 2026-08-28  
Mode: READ-ONLY (aucune modification de code pendant cet audit)  
Périmètre: backend, frontend, infra Docker, CI/CD, sécurité, observabilité, paiements Stripe, sauvegarde/restauration

## 0. Méthodologie et limites

- Analyse statique des fichiers du dépôt et des configurations d’exécution.
- Vérification des flux critiques (authentification, paiements, webhooks, persistance, observabilité).
- Contrôle de cohérence entre objectifs déclarés et implémentation réelle.
- Exécution ciblée de commandes de vérification non destructives (inventaire tests, audit dépendances).

Limites:
- Les éléments nécessitant une exécution en environnement réel (alerting Sentry effectif, restauration testée récemment, renouvellement certbot en prod) ne peuvent pas être prouvés par lecture seule.

## 1. Contexte technique consolidé

### Backend
- NestJS 10, Prisma, PostgreSQL, Bull/Redis, Stripe.
- Logging structuré via nestjs-pino.
- Gestion d’erreurs globale avec filtre HTTP et capture Sentry conditionnelle.

### Frontend
- React 18 + Vite + Tailwind.
- Intercepteur API Axios avec refresh token.
- Sentry frontend conditionnel via variable d’environnement.
- PWA activée (manifest, runtime caching, page offline).

### Infrastructure
- Deux compositions:
  - docker-compose.yml: mode local/dev, ports exposés.
  - docker-compose.prod.yml: reverse proxy Nginx + certbot, DB/Redis privés.
- CI/CD via GitHub Actions: pipeline qualité + déploiement production.

## 2. État des zones critiques (Z1 à Z9)

| Zone | Sujet | Verdict | Niveau de confiance | Détail synthétique |
|---|---|---|---|---|
| Z1 | Classement RSS par thème + reclassification historique | Partiellement conforme | Élevé | La logique existe et reclassifie, mais endpoint trigger ouvert |
| Z2 | Logs JSON prod + requestId + LOG_LEVEL | Conforme | Élevé | pino + requestId + enrichissement contexte route |
| Z3 | Alerting back/front via Sentry sans fuite sensible | Partiellement conforme | Élevé | Intégration et sanitization en place; preuve d’alerting runtime absente |
| Z4 | Rate limit renforcé zones sensibles, assoupli lecture publique | Partiellement conforme | Élevé | Règles présentes, mais donation create reste non authentifié |
| Z5 | Entrée publique unique HTTPS et services privés | Conforme en prod / Non conforme en dev | Élevé | Prod cloisonnée, dev expose API/DB/Redis |
| Z6 | Protection données abonnés (backup + restore + tunnel) | Partiellement conforme | Moyen | Scripts et doc présents; exécution restore récente non prouvée |
| Z7 | Automatisation lint/test/build/prisma/deploy | Conforme | Élevé | Workflows CI/CD couvrent les étapes demandées |
| Z8 | Robustesse Stripe/webhooks (signature/idempotence/retry) | Conforme avec réserves | Élevé | Signature + idempotence + queue retries ok |
| Z9 | Hygiène sécurité transverse (auth/secrets/tokens) | Non conforme critique | Élevé | Fallback secrets hardcodés, tokens URL OAuth, localStorage |

## 3. Preuves détaillées par domaine

## 3.1 Authentification et gestion des tokens

Constats:
- Throttle strict sur register/login: 5 requêtes/minute.
- Vérification email implémentée de façon non corrélée au token utilisateur.
- Fallback secrets JWT codés en dur si variables absentes.
- Callback OAuth renvoie access/refresh token dans l’URL.
- Frontend stocke accessToken/refreshToken en localStorage.

Preuves:
- EarthwayBack/src/auth/auth.controller.ts:51
- EarthwayBack/src/auth/auth.controller.ts:60
- EarthwayBack/src/auth/auth.service.ts:173
- EarthwayBack/src/auth/auth.service.ts:176
- EarthwayBack/src/auth/auth.module.ts:22
- EarthwayBack/src/auth/auth.service.ts:282
- EarthwayBack/src/auth/auth.controller.ts:124
- EarthwayFront/src/context/AuthContext.tsx:37
- EarthwayFront/src/context/AuthContext.tsx:40
- EarthwayFront/src/services/api.ts:17

Risque:
- Critique sur confidentialité et compromission de session en cas de XSS/log/referrer.

## 3.2 Paiements Stripe et webhooks

Constats:
- Raw body activé pour vérification de signature Stripe.
- Signature vérifiée et secret requis.
- Idempotence assurée par WebhookLog.eventId unique + gestion duplicat/P2002.
- Traitement asynchrone via queue stripe-events avec retries exponentiels.
- Throttle spécifique webhook.

Preuves:
- EarthwayBack/src/main.ts:154
- EarthwayBack/src/main.ts:157
- EarthwayBack/src/webhooks/webhooks.controller.ts:19
- EarthwayBack/src/webhooks/webhooks.controller.ts:20
- EarthwayBack/src/webhooks/webhooks.service.ts:33
- EarthwayBack/src/webhooks/webhooks.service.ts:38
- EarthwayBack/src/webhooks/webhooks.service.ts:51
- EarthwayBack/src/webhooks/webhooks.service.ts:72
- EarthwayBack/src/webhooks/webhooks.module.ts:21
- EarthwayBack/src/webhooks/webhooks.module.ts:23
- EarthwayBack/prisma/schema.prisma:297
- EarthwayBack/prisma/schema.prisma:299

Risque résiduel:
- Bon niveau de robustesse, mais dépend de configuration Stripe correcte en environnement.

## 3.3 Logging et observabilité

Constats:
- Logger JSON via pinoHttp avec requestId injecté/réutilisé.
- Niveaux de log adaptatifs (error/warn/info selon status/erreur).
- Enrichissement des logs pour routes Stripe/paiement.
- LOG_LEVEL configurable en environnement prod.

Preuves:
- EarthwayBack/src/app.module.ts:35
- EarthwayBack/src/app.module.ts:38
- EarthwayBack/src/app.module.ts:43
- EarthwayBack/src/app.module.ts:46
- EarthwayBack/src/app.module.ts:55
- EarthwayBack/src/app.module.ts:92
- docker-compose.prod.yml:72
- .env.production.example:31

Risque résiduel:
- Vérifier la rétention, centralisation et corrélation inter-services côté plateforme de logs.

## 3.4 Sentry backend et frontend

Constats:
- Backend: Sentry activé uniquement si DSN présent, PII désactivée, sanitization en profondeur.
- Frontend: Sentry conditionnel, sanitization headers/data, ErrorBoundary locale.
- Capture unhandledRejection/uncaughtException backend avec flush.

Preuves:
- EarthwayBack/src/main.ts:11
- EarthwayBack/src/main.ts:100
- EarthwayBack/src/main.ts:104
- EarthwayBack/src/main.ts:105
- EarthwayBack/src/main.ts:123
- EarthwayBack/src/main.ts:138
- EarthwayFront/src/main.tsx:8
- EarthwayFront/src/main.tsx:30
- EarthwayFront/src/main.tsx:35
- EarthwayFront/src/main.tsx:62
- .env.production.example:32

Non vérifié:
- Routage effectif des alertes Sentry vers canaux d’astreinte (je ne sais pas - non vérifié).

## 3.5 Rate limiting et contrôle d’accès

Constats:
- Garde throttler globale active avec base permissive 180/min.
- Endpoints sensibles durcis: auth login/register, subscriptions, donations create, webhooks stripe.
- Endpoints publics de lecture news/ads exemptés explicitement de throttle strict.
- Contrôle entitlement premium en place sur endpoint dédié.

Preuves:
- EarthwayBack/src/app.module.ts:92
- EarthwayBack/src/auth/auth.controller.ts:52
- EarthwayBack/src/auth/auth.controller.ts:61
- EarthwayBack/src/subscriptions/subscriptions.controller.ts:40
- EarthwayBack/src/subscriptions/subscriptions.controller.ts:50
- EarthwayBack/src/subscriptions/subscriptions.controller.ts:59
- EarthwayBack/src/subscriptions/subscriptions.controller.ts:68
- EarthwayBack/src/donations/donations.controller.ts:23
- EarthwayBack/src/webhooks/webhooks.controller.ts:20
- EarthwayBack/src/news/news.controller.ts:27
- EarthwayBack/src/ads/ads.controller.ts:34
- EarthwayBack/src/news/news.controller.ts:52
- EarthwayBack/src/news/news.controller.ts:53

Écart:
- Endpoint trigger RSS restant non protégé.
- Preuve: EarthwayBack/src/news/news.controller.ts:62

## 3.6 RSS, thèmes et contenus

Constats:
- Classification thème par heuristique mots-clés et sujets RSS (dc:subject/category).
- Reclassification des articles existants en thème general.
- Trigger RSS retourne nouveaux articles + reclassifiés.

Preuves:
- EarthwayBack/src/news/news.service.ts:80
- EarthwayBack/src/news/news.service.ts:164
- EarthwayBack/src/news/news.service.ts:186
- EarthwayBack/src/news/news.service.ts:202
- EarthwayBack/src/news/news.service.ts:375
- EarthwayBack/src/news/news.service.ts:401
- EarthwayBack/src/news/news.service.ts:407

Risque:
- Le trigger RSS non protégé peut entraîner abus/charge/altération du rythme d’ingestion.

## 3.7 Infrastructure, réseau et exposition

Constats prod:
- Nginx exposé 80/443 uniquement.
- DB/Redis sur réseau interne private_network, aucun port public.
- Reverse proxy: /api vers backend, / vers frontend.
- Renouvellement certbot en boucle.

Preuves:
- docker-compose.prod.yml:2
- docker-compose.prod.yml:10
- docker-compose.prod.yml:91
- docker-compose.prod.yml:109
- docker-compose.prod.yml:124
- infra/nginx/default.conf.template:31
- infra/nginx/default.conf.template:42
- docker-compose.prod.yml:27

Constats dev:
- API, PostgreSQL, Redis exposés en ports hôte.

Preuves:
- docker-compose.yml:23
- docker-compose.yml:65
- docker-compose.yml:81

Risque:
- Faible en local fermé, élevé si compose dev utilisé sur machine exposée.

## 3.8 Sauvegarde et restauration des données

Constats:
- Script backup: pg_dump custom, checksum sha256, purge rétention.
- Script restore: validation checksum, recréation DB cible, restauration, comptage tables.
- Documentation opérationnelle inclut tunnel SSH et planification cron.

Preuves:
- scripts/backup_postgres.sh:62
- scripts/backup_postgres.sh:69
- scripts/backup_postgres.sh:71
- scripts/restore_postgres.sh:76
- scripts/restore_postgres.sh:83
- scripts/restore_postgres.sh:93
- scripts/restore_postgres.sh:101
- docs/backup-restore-postgres-prod.md:40
- docs/backup-restore-postgres-prod.md:74

Non vérifié:
- Dernier test de restauration réussi avec preuve horodatée (je ne sais pas - non vérifié).

## 3.9 CI/CD et gouvernance de déploiement

Constats:
- CI backend: install, prisma generate, lint, test, build.
- CI frontend: install, lint, test if-present, build.
- Déploiement prod: build+push GHCR puis SSH et docker compose prod.

Preuves:
- .github/workflows/ci.yml:13
- .github/workflows/ci.yml:74
- .github/workflows/ci.yml:77
- .github/workflows/ci.yml:80
- .github/workflows/ci.yml:83
- .github/workflows/ci.yml:86
- .github/workflows/ci.yml:90
- .github/workflows/ci.yml:110
- .github/workflows/ci.yml:113
- .github/workflows/ci.yml:116
- .github/workflows/ci.yml:119
- .github/workflows/deploy.yml:15
- .github/workflows/deploy.yml:46
- .github/workflows/deploy.yml:65
- .github/workflows/deploy.yml:81

## 3.10 Qualité code et dépendances

Constats:
- TypeScript strict désactivé backend et frontend.
- Backend dispose de tests unitaires ciblés sur domaines critiques.
- Aucun test front applicatif détecté dans src.
- Audit dépendances:
  - Backend: total 67 vulnérabilités (46 high).
  - Frontend: total 3 vulnérabilités (1 high).

Preuves:
- EarthwayBack/tsconfig.json:15
- EarthwayBack/tsconfig.json:16
- EarthwayFront/tsconfig.app.json:16
- EarthwayBack/src/auth/auth.service.spec.ts:1
- EarthwayBack/src/webhooks/webhooks.service.spec.ts:1
- EarthwayBack/src/subscriptions/subscriptions.service.spec.ts:1

Note:
- Le détail package par package de l’audit npm n’est pas inclus dans ce document.

## 4. Registre complet des écarts et risques

| ID | Écart | Impact | Probabilité | Gravité |
|---|---|---|---|---|
| R1 | Secrets JWT fallback hardcodés | Prise de contrôle session si mauvaise config | Moyen | Critique |
| R2 | Tokens OAuth en query string | Fuite dans logs, historiques, referer | Élevé | Critique |
| R3 | Tokens en localStorage | Vol de session via XSS | Moyen/Élevé | Élevée |
| R4 | verifyEmail non corrélé token->user | Vérification email non fiable | Moyen | Élevée |
| R5 | Trigger RSS non protégé | Abus/DoS logique ingestion | Moyen | Élevée |
| R6 | Vulnérabilités npm high | Surface d’attaque dépendances | Moyen | Élevée |
| R7 | Donation create sans auth | Abus automatisé, pollution data | Moyen | Moyenne |
| R8 | TS strict désactivé | Défauts type/runtime non détectés | Élevé | Moyenne |
| R9 | Runtime cache API ciblé localhost | Comportement offline/prod incohérent | Moyen | Moyenne |
| R10 | Restore non prouvé récemment | Risque DR non maîtrisé | Moyen | Moyenne |

## 5. Recommandations prioritaires (plan concret)

## 5.1 Priorité P0 (immédiat, sécurité critique)

1) Supprimer les fallback secrets en dur et forcer échec de boot sans secrets valides.
- Cibles: AuthModule/AuthService.
- Effet: supprime une classe de compromission liée à erreur d’environnement.

2) Stopper le transport de tokens en URL OAuth callback.
- Remplacer par code court + échange serveur, puis cookie HttpOnly Secure SameSite.

3) Migrer stockage token frontend de localStorage vers cookies HttpOnly.
- Coupler avec rotation refresh token et invalidation serveur stricte.

4) Corriger verifyEmail avec table dédiée.
- Schéma recommandé: verification_tokens(userId, tokenHash, expiresAt, usedAt).

5) Protéger endpoint trigger RSS.
- Ajouter guard + entitlement/admin role + throttle dédié faible.

## 5.2 Priorité P1 (stabilité opérationnelle)

6) Corriger la règle runtime cache API PWA pour matcher /api en prod.
7) Ajouter endpoint health dédié (/api/health) pour checks de conteneur.
8) Renforcer en-têtes au niveau Nginx (HSTS, CSP adaptée, referrer-policy).
9) Documenter et tester un runbook incident Stripe/webhook (replay, dead-letter, métriques).
10) Mettre en place preuve mensuelle de restauration (rapport horodaté archivé).

## 5.3 Priorité P2 (qualité, dette technique)

11) Activer TypeScript strict par paliers (strictNullChecks puis noImplicitAny).
12) Ajouter tests front (auth, erreurs API, paiements).
13) Traiter les vulnérabilités npm par lot, avec SLA selon criticité.
14) Ajouter scans SCA/SAST dans CI (ex: npm audit gate partiel, semgrep/codeql).
15) Ajouter tableau de bord SLO/SLI (latence API, échecs webhook, erreurs front).

## 6. Recommandations d’architecture cible

- Auth web moderne:
  - Access token court en mémoire.
  - Refresh token en cookie HttpOnly rotating.
  - Endpoint refresh avec détection de réutilisation token.

- Gestion secrets:
  - Aucun secret dans compose ou code; usage secret manager + injection runtime.
  - Validation stricte des variables requises au démarrage (fail fast).

- Résilience paiements:
  - Conserver idempotence actuelle.
  - Ajouter dead-letter queue pour événements échoués après retries.
  - Ajouter outil de replay manuel sécurisé par eventId.

- Continuité données:
  - Backup chiffré hors hôte + politique immuable (WORM ou lock object store).
  - Drill trimestriel de restauration et mesure RTO/RPO.

## 7. Indicateurs de pilotage recommandés

- Sécurité:
  - Nombre de vulnérabilités high/critical ouvertes.
  - Couverture des secrets obligatoires au boot.
  - Taux endpoints protégés par guard/throttle.

- Opérations:
  - Taux succès webhooks Stripe.
  - Temps moyen de traitement webhook.
  - Taux erreurs 5xx backend par route category.

- Qualité:
  - Couverture tests backend/front.
  - Dette TypeScript stricte restante.
  - Régressions post-déploiement.

## 8. Liste des éléments non vérifiables en READ-ONLY

- Alertes Sentry effectivement reçues par les équipes.
- Renouvellement certbot validé sur serveur cible.
- Dernier exercice de restauration validé de bout en bout.
- Robustesse des sauvegardes hors site/chiffrées (preuve externe au repo).

## 9. Conclusion exécutive

Le projet a franchi une étape solide sur l’observabilité, la structuration des logs, la robustesse Stripe/webhooks et l’isolation réseau en production. Les principaux risques restants sont concentrés sur la sécurité des tokens et secrets, ainsi que sur certaines protections d’accès encore incomplètes.

En priorisant les actions P0 (secrets/tokens/verifyEmail/protection trigger RSS), le niveau de risque global peut être réduit de manière significative en peu d’itérations. Les actions P1/P2 consolideront durablement la résilience et la qualité d’exploitation.
