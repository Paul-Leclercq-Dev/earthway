# Earthway Constitution

**Version**: 1.0.0 | **Ratified**: 2025-12-04 | **Last Amended**: 2025-12-04

---

## Core Principles

### I. Impact & Transparence

Earthway doit créer un impact environnemental réel tout en restant transparent sur ses mécanismes : abonnements, dons, affiliation, et actions financées.

- Toutes les fonctionnalités doivent renforcer la compréhension, l'engagement, ou la contribution de l'utilisateur à l'écologie.
- La crédibilité scientifique et la clarté pédagogique sont **non-négociables**.

### II. Accessibilité & Mobile-First (PWA Obligatoire)

Earthway doit fonctionner parfaitement sur mobile et être installable comme une application.

- Le frontend est pensé **mobile-first**, rapide, léger et accessible.
- **PWA** : manifest, service worker, icônes, et performances optimisées.

### III. Modèle Économique Durable

Earthway est conçu dès le départ comme une plateforme rentable :

- Abonnements récurrents (tiers multiples)
- Dons Stripe
- Marketplace à affiliation
- Emails automatisés favorisant la conversion

**Toute nouvelle fonctionnalité doit pouvoir apporter soit plus d'engagement, soit un levier de monétisation.**

### IV. Architecture Modulaire & Scalable

- Le backend NestJS doit être organisé en **modules isolés et testables** (auth, users, news, marketplace, payments, impact…).
- Le frontend React doit maintenir une architecture composants claire.
- Chaque module doit pouvoir évoluer indépendamment sans casser l'ensemble.

### V. Sécurité & Confiance Totale

Earthway manipule des données personnelles et financières. Les exigences **non-négociables** :

- JWT access + refresh rotation
- Validation stricte de toutes les entrées
- HTTPS obligatoire
- Webhooks Stripe sécurisés
- Données sensibles jamais exposées au frontend

**La confiance utilisateur est au cœur du produit.**

---

## Standards Techniques & Exigences du Projet

### Stack Technique Officielle

- **Frontend** : React + Vite + Tailwind (mobile-first)
- **Backend** : NestJS, Prisma ORM, PostgreSQL (prod), SQLite (dev)
- **Infrastructure** : Docker + Traefik/Nginx + Scaleway
- **Asynchrone** : Bull + Redis
- **Emails** : Maizzle templates automatisés
- **Paiements** : Stripe (abonnements, dons, webhooks)
- **Authentification** : Email, Google OAuth (Apple plus tard)
- **PWA** : manifest, service worker custom, assets spécifiques

### Fonctionnalités couvertes par cette constitution

- Actualités filtrées (API externes)
- Pages éducatives
- Marketplace affiliée
- Paiements récurrents + dons
- Profil utilisateur + progression + impact
- Système email marketing intelligent
- Dashboard d'impact (arbres, coraux, pollinisateurs, € soutenus)

### Performance & Qualité

- Frontend < 1.5 s LCP
- API réactive, endpoints versionnés
- Mise en cache des news
- Optimisation des images et médias

### Conformité & Données

- RGPD friendly
- Minimisation des données
- Consentement explicite pour newsletter

---

## Processus de Développement & Qualité

### Code & Revue

- TypeScript strict partout
- ESLint + Prettier obligatoires
- Architecture modulaire (Domain-Driven)
- Documentation requise pour chaque module majeur
- Revue de code obligatoire pour les features sensibles (paiements, auth, impact)

### Tests

- Tests unitaires pour logique critique
- Tests d'intégration sur :
  - Auth
  - Paiements Stripe
  - Webhooks
  - Génération d'impact
  - PWA behavior (V2)
- Red-Green-Refactor encouragé

### Déploiement

- Docker Compose pour dev
- Images allégées en production
- Déploiement externe sur Scaleway
- Certificats SSL gérés par Traefik
- Logs structurés + rotation

### Qualité Produit

Avant validation d'une feature, elle doit respecter :

- Une **valeur ajoutée** pour l'utilisateur
- Une **cohérence business** (potentiel de revenu ou d'impact)
- Un **design fluide** (UX mobile prioritaire)
- La conformité aux principes du projet

---

## Governance

La présente Constitution **prime sur toute autre pratique de développement Earthway**.

Toute nouvelle fonctionnalité doit être validée selon :

- les principes fondamentaux,
- le modèle économique,
- la stratégie d'impact.

Toute modification majeure de l'architecture, du modèle économique, ou des modules doit être :

- documentée dans `/docs/CHANGES.md`,
- justifiée techniquement,
- cohérente avec la vision business et produit,
- approuvée selon les règles de gouvernance.

**Earthway doit rester :** modulaire, rapide, sécurisé, mobile-first, éthique… et rentable.
