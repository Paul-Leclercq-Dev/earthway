# Research & Technical Decisions

**Feature**: Earthway Global Product  
**Date**: 2025-12-05  
**Status**: ✅ Validated

---

## 1. API Externe pour Actualités Environnementales

### Decision
**Approche hybride** : RSS Parser custom + cache Redis pour MVP, migration vers NewsAPI.org si nécessaire.

### Rationale

**Choix retenu** : Parser RSS de sources fiables
- **Avantages** :
  - Gratuit et sans limite de requêtes
  - Contrôle total sur les sources (crédibilité)
  - Pas de dépendance à un service tiers payant
  - Sources RSS environnementales de qualité disponibles gratuitement
  - Cache Redis 24h réduit la charge sur les sources

- **Implémentation** :
  - Utiliser `rss-parser` (npm package léger)
  - Sources initiales :
    - The Guardian Environment : `https://www.theguardian.com/environment/rss`
    - BBC Science & Environment : `https://feeds.bbci.co.uk/news/science_and_environment/rss.xml`
    - National Geographic Environment : RSS disponible
    - WWF News : RSS disponible
  - Cron job quotidien (Bull queue) pour fetch + stockage PostgreSQL
  - Cache Redis pour lectures rapides
  - Endpoint backend : `GET /news` retourne articles cachés/DB

### Alternatives Considérées

1. **NewsAPI.org**
   - ❌ Tier gratuit limité à 100 req/jour (insuffisant si trafic élevé)
   - ❌ Pas de filtrage thématique précis sur tier gratuit
   - ❌ Payant à partir de 449$/mois (premium)
   - ✅ Fallback possible si RSS insuffisant

2. **GNews API**
   - ❌ Tier gratuit très limité (100 req/jour aussi)
   - ❌ Moins de sources spécialisées environnement

3. **API Custom Agrégée**
   - ❌ Complexité trop élevée pour MVP
   - ❌ Coûts serveur supplémentaires
   - ✅ À envisager en phase de scale si RSS parser atteint ses limites

### Documentation & Sources
- Package NPM : `rss-parser` - https://www.npmjs.com/package/rss-parser
- NestJS Cron/Bull : https://docs.nestjs.com/techniques/task-scheduling
- Redis caching : https://docs.nestjs.com/techniques/caching

---

## 2. Calcul d'Impact Environnemental

### Decision
**Formules proportionnelles transparentes** basées sur coûts ONG vérifiables + affichage des sources dans l'UI.

### Rationale

**Approche retenue** :
- Formules simples et transparentes :
  ```
  arbres_financés = total_contributions_eur / coût_moyen_arbre
  coraux_restaurés = total_contributions_eur / coût_moyen_corail
  pollinisateurs_protégés = total_contributions_eur / coût_moyen_protection
  ```

- **Coûts de référence** (sources ONG publiques) :
  - **Arbre** : 5€ (source : Reforest'Action, One Tree Planted)
  - **Corail** : 15€ par fragment restauré (source : Coral Guardian)
  - **Pollinisateur** : 10€ pour protection habitat/an (source : WWF, Pollinator Partnership)

- **Transparence obligatoire** (principe I constitution) :
  - Afficher les formules dans l'UI (page "Comment ça marche ?")
  - Lien vers sources ONG pour chaque métrique
  - Disclaimer : "Estimation basée sur coûts moyens fournis par nos partenaires ONG"
  - Mise à jour annuelle des coûts

- **Calcul en backend** :
  - Service `ImpactService.calculateImpact(userId)`
  - Somme de tous les abonnements + dons de l'utilisateur
  - Stockage dans table `Impact` (màj à chaque paiement via webhooks Stripe)

### Alternatives Considérées

1. **Partenariat ONG avec données réelles**
   - ✅ Crédibilité maximale
   - ❌ Complexité administrative pour MVP
   - ❌ Délais de négociation (mois)
   - ✅ À envisager post-MVP pour validation scientifique

2. **Estimation proportionnelle simple (X% abonnement → Y arbres)**
   - ❌ Moins transparent
   - ❌ Risque de greenwashing perçu

3. **Calcul par projet financé (tracking réel)**
   - ❌ Complexité trop élevée (nécessite intégration ONG)
   - ✅ Objectif long terme (v2.0)

### Documentation & Sources
- Reforest'Action tarifs : https://www.reforestaction.com
- Coral Guardian coûts : https://www.coralguardian.org
- WWF Pollinators : https://www.worldwildlife.org/initiatives/pollinator-protection
- Formules stockées dans : `EarthwayBack/src/impact/impact.constants.ts`

---

## 3. Best Practices Stripe (Webhooks + Abonnements)

### Decision
Endpoint `/webhooks/stripe` sécurisé avec validation signature HMAC + traitement asynchrone via Bull queue.

### Rationale

**Implémentation sécurisée** :
1. **Validation signature** (obligatoire, principe V constitution) :
   ```typescript
   const signature = req.headers['stripe-signature'];
   const event = stripe.webhooks.constructEvent(
     req.body,
     signature,
     process.env.STRIPE_WEBHOOK_SECRET
   );
   ```

2. **Événements critiques à écouter** :
   - `customer.subscription.created` → Créer `Subscription` en DB
   - `customer.subscription.updated` → Mettre à jour statut
   - `customer.subscription.deleted` → Marquer comme `canceled`
   - `invoice.payment_succeeded` → Mettre à jour période + recalculer impact
   - `invoice.payment_failed` → Notifier utilisateur (email)
   - `checkout.session.completed` → Finaliser abonnement/don

3. **Idempotence** (éviter double traitement) :
   - Utiliser `stripeSubscriptionId` ou `stripePaymentIntentId` comme clé unique
   - Vérifier existence en DB avant création
   - Log tous les événements dans table `WebhookLog` (audit trail)

4. **Traitement asynchrone** :
   - Webhook reçu → validation signature → retourner 200 OK immédiatement
   - Enqueue job Bull `process-stripe-event` → traitement en background
   - Retry automatique si échec (3 tentatives max)

5. **Logging structuré** :
   - Utiliser Winston/Pino
   - Log level `info` pour tous les événements
   - Log level `error` pour échecs + contexte complet

### Alternatives Considérées

1. **Traitement synchrone dans le webhook**
   - ❌ Timeout si traitement long (>5s)
   - ❌ Stripe retry si pas de 200 OK rapide

2. **Polling API Stripe au lieu de webhooks**
   - ❌ Latence élevée (minutes)
   - ❌ Consommation API Stripe inutile

### Documentation & Sources
- Stripe Webhooks Guide : https://stripe.com/docs/webhooks
- Signature Validation : https://stripe.com/docs/webhooks/signatures
- NestJS Stripe Module : `@golevelup/nestjs-stripe` ou custom
- Best practices : https://stripe.com/docs/webhooks/best-practices
- Code exemple : `EarthwayBack/src/webhooks/webhooks.service.ts`

---

## 4. PWA Best Practices (Service Worker + Offline)

### Decision
**Vite Plugin PWA** (`vite-plugin-pwa`) avec stratégie de cache hybride (Network First pour API, Cache First pour assets).

### Rationale

**Choix retenu** : `vite-plugin-pwa`
- **Avantages** :
  - Génération automatique du service worker
  - Manifest.json généré automatiquement
  - Workbox intégré (stratégies de cache prêtes)
  - Score Lighthouse PWA > 90 garanti
  - Maintenance minimale (updates automatiques)
  - Compatible principe II constitution (PWA obligatoire)

- **Configuration recommandée** :
  ```typescript
  // vite.config.ts
  import { VitePWA } from 'vite-plugin-pwa';
  
  export default defineConfig({
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Earthway',
          short_name: 'Earthway',
          theme_color: '#10b981', // green-500 Tailwind
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.earthway\.com\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 300 } // 5min
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 86400 } // 24h
              }
            }
          ]
        }
      })
    ]
  });
  ```

- **Stratégies de cache** :
  - **Network First** pour `/api/*` : Données fraîches prioritaires, fallback cache si offline
  - **Cache First** pour images/assets : Performance maximale
  - **Stale While Revalidate** pour actualités : Affichage immédiat + màj en background

### Alternatives Considérées

1. **Service Worker custom (écrit à la main)**
   - ❌ Complexité élevée (maintenance, bugs)
   - ❌ Temps de développement long
   - ✅ Contrôle total (utile pour cas très spécifiques)
   - ❌ Non justifié pour MVP

2. **Pas de PWA (web app classique)**
   - ❌ Violation principe II constitution (PWA obligatoire)

### Documentation & Sources
- Vite Plugin PWA : https://vite-pwa-org.netlify.app/
- Workbox Strategies : https://developer.chrome.com/docs/workbox/modules/workbox-strategies
- PWA Checklist : https://web.dev/pwa-checklist/
- Manifest Generator : https://www.simicart.com/manifest-generator.html/
- Icons : Générer avec https://realfavicongenerator.net/

---

## 5. Authentification Google OAuth (Passport NestJS)

### Decision
**Passport Google OAuth2.0** avec `@nestjs/passport` + création automatique utilisateur si inexistant.

### Rationale

**Implémentation** :
1. **Packages requis** :
   - `@nestjs/passport`
   - `passport`
   - `passport-google-oauth20`
   - `@nestjs/jwt` (déjà installé pour JWT)

2. **Flow OAuth** :
   ```
   Frontend → GET /auth/google 
   → Redirect Google OAuth consent screen
   → User consent
   → Redirect /auth/google/callback?code=xxx
   → Backend exchange code for Google profile
   → Check if user exists (by email)
   → If not exist: create User with oauthProvider="google"
   → Generate JWT access + refresh tokens
   → Redirect frontend with tokens in URL params
   → Frontend stocke tokens in localStorage
   ```

3. **Configuration** :
   ```typescript
   // auth/strategies/google.strategy.ts
   @Injectable()
   export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
     constructor(private authService: AuthService) {
       super({
         clientID: process.env.GOOGLE_CLIENT_ID,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
         callbackURL: process.env.GOOGLE_CALLBACK_URL,
         scope: ['email', 'profile']
       });
     }
     
     async validate(accessToken, refreshToken, profile) {
       const user = await this.authService.validateGoogleUser(profile);
       return user;
     }
   }
   ```

4. **Gestion utilisateurs** :
   - Si email existe déjà (inscription email/password) → linker compte OAuth
   - Si email nouveau → créer `User` avec `oauthProvider="google"`, `oauthId=profile.id`, `password=null`
   - Même tokens JWT que connexion classique (uniformité)

5. **Sécurité** :
   - Valider email Google (`email_verified=true`)
   - HTTPS obligatoire pour callback URL
   - State parameter pour CSRF protection (géré par Passport)

### Alternatives Considérées

1. **OAuth custom (sans Passport)**
   - ❌ Réinventer la roue
   - ❌ Risques de sécurité (erreurs implémentation)

2. **OAuth.js ou autres libs frontend**
   - ❌ Tokens Google exposés au frontend (moins sécurisé)
   - ❌ Backend doit quand même valider

3. **Firebase Auth**
   - ❌ Lock-in Firebase
   - ❌ Complexité supplémentaire (pas nécessaire)

### Documentation & Sources
- NestJS Passport Guide : https://docs.nestjs.com/recipes/passport
- Passport Google OAuth20 : http://www.passportjs.org/packages/passport-google-oauth20/
- Google OAuth Setup : https://console.cloud.google.com/apis/credentials
- NestJS Auth Recipe : https://docs.nestjs.com/security/authentication
- Code exemple : `EarthwayBack/src/auth/strategies/google.strategy.ts`

---

## Summary

Toutes les décisions techniques sont **validées et documentées**. Aucune clarification restante.

### Prochaines étapes (Phase 1)
1. ✅ `research.md` terminé
2. → Générer `data-model.md` (schéma Prisma complet)
3. → Générer `contracts/api-spec.yaml` (OpenAPI 3.0)
4. → Générer `quickstart.md` (guide développement)
5. → Exécuter `update-agent-context.sh copilot`

**Status**: ✅ Phase 0 Complete — Ready for Phase 1
