# CHANGES

Ce document trace les changements d’architecture importants, avec un accent sur les décisions à valider avant mise en production.

## Encart publicitaire: nouvelle architecture

### Objectif

Servir un encart actif par emplacement, tout en supprimant totalement l’affichage publicitaire pour les utilisateurs ayant le droit `ads_free`.

### Chaîne de décision

```mermaid
flowchart LR
  A[Frontend AdSlot] --> B[useEntitlements()]
  B --> C{ads_free ?}
  C -->|oui| D[Render null]
  C -->|non| E[GET /ads?placement=...]
  E --> F{204 ou aucun encart ?}
  F -->|oui| D
  F -->|non| G[Affichage sobre + label Sponsorisé]
  G --> H[POST /ads/:id/event impression/click]
```

### Comportement implémenté

- Le frontend n’appelle pas l’API publicitaire si `useEntitlements().has('ads_free')` est vrai.
- Si l’utilisateur n’a pas `ads_free`, `AdSlot` interroge `GET /ads?placement=...`.
- Le backend renvoie au plus un encart actif par emplacement via rotation pondérée.
- Si aucun encart n’est disponible, la réponse est `204 No Content`.
- Le composant affiche un label visible `Sponsorisé` sur chaque encart rendu.
- Le clic ouvre une nouvelle onglet avec des attributs de sécurité et de transparence adaptés.

### Tracking et RGPD

Les règles suivantes sont actives:

- aucun tracking tiers n’est utilisé pour les encarts
- les impressions et clics sont stockés dans des tables internes `ad` et `ad_event`
- l’adresse IP est hashée en SHA256 avant stockage
- `ipHash`, `referrer` et `userAgent` ne sont enregistrés que si le consentement analytics est donné
- sans consentement, ces champs restent nuls

### Sobriété éditoriale

Le dispositif doit rester sobre et cohérent avec la ligne éditoriale Earthway:

- partenaires cohérents avec les thèmes environnementaux
- pas de bannières intrusives
- pas de clignotement ni d’effets visuels agressifs
- intégration discrète dans les cartes et blocs de contenu existants

## Validation client avant mise en prod

Cette liste doit être confirmée avec le client avant d’activer les encarts en production:

1. Le label `Sponsorisé` est visible sur chaque encart.
2. Aucun tracking tiers n’est utilisé.
3. Les impressions et clics sont tracés uniquement en interne.
4. L’IP est hashée en SHA256.
5. Les champs de tracking restent soumis au consentement cookies/analytics.
6. Le ton visuel reste sobre et compatible avec une diffusion FR-025.
7. Les partenaires affichés sont cohérents avec l’image Earthway.

## Impact sur les routes et composants

### Backend

- `GET /ads?placement=...` pour récupérer un encart actif ou renvoyer `204`
- `POST /ads/:id/event` pour journaliser une impression ou un clic

### Frontend

- `EarthwayFront/src/components/AdSlot.tsx`
- `EarthwayFront/src/pages/home.tsx`
- `EarthwayFront/src/pages/News.tsx`
- `EarthwayFront/src/pages/Marketplace.tsx`

### Dépendances fonctionnelles

- `EntitlementsProvider` doit entourer l’application pour que `useEntitlements()` fonctionne.
- `AuthProvider` reste nécessaire pour obtenir les droits effectifs côté backend.

## Décision d’architecture

Le changement de fond consiste à déplacer la logique de décision hors du composant publicitaire:

- le frontend décide d’abord si l’utilisateur doit voir des encarts
- le backend décide quel encart actif est servi
- le suivi reste interne et limité au consentement

Cette séparation permet de garder le frontend sobre et de centraliser la vérité métier côté backend.
