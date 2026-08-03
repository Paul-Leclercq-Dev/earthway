# Skills Integration - Earthway

**Date d'intégration** : 15 avril 2026  
**Objectif** : Augmenter la qualité du code avec des compétences spécialisées

## 🎯 Skills Installés

### 1. **data-visualization** (Anthropics)
- **Source** : anthropics/knowledge-work-plugins  
- **Installs** : 4,400+  
- **Scope** : Project (`.agents/skills/data-visualization/`)  
- **Security** : Safe (Gen), 0 alerts (Socket), Low Risk (Snyk)

**Cas d'usage pour Earthway** :
- ✅ Améliorer `ImpactDashboard.tsx` avec des visualisations interactives
- ✅ Ajouter charts tendances donations mensuelles
- ✅ Visualiser progression impact (arbres/coraux/pollinisateurs) dans le temps
- ✅ Appliquer principes accessibilité (palettes colorblind-friendly, ARIA labels)

**Principes clés à appliquer** :
- **Chart selection** : Line chart pour trends, bar chart pour comparaisons, stacked area pour composition temporelle
- **Accessibility** : Colorblind-safe palettes, labels ARIA, texte alternatif
- **Design** : Remove chart junk (grilles inutiles, 3D), focus on data-ink ratio

**Actions prioritaires** :
1. Ajouter graphique tendance mensuelle des dons dans `Profile.tsx`
2. Créer composant `TrendChart.tsx` pour évolution impact CO2
3. Améliorer `ProgressBar.tsx` avec animations et tooltips

---

### 2. **nestjs-testing-expert** (shipshitdev)
- **Source** : shipshitdev/library  
- **Installs** : 464  
- **Scope** : Project (`.agents/skills/nestjs-testing-expert/`)  
- **Security** : Low Risk (Gen), 0 alerts (Socket), Low Risk (Snyk)

**Cas d'usage pour Earthway** :
- ✅ Créer suite de tests unitaires complète pour tous les services backend
- ✅ Tests d'intégration avec TestingModule
- ✅ Mocking propre de Prisma, Stripe, Mail
- ✅ Tests e2e avec supertest pour API HTTP

**Patterns appliqués** :
- **Arrange/Act/Assert** structure dans chaque test
- **Mock providers** via `Test.createTestingModule()`
- **Reset mocks** dans `afterEach()` pour éviter pollution
- **Fixtures** pour données de test réutilisables

**Tests créés** :
- ✅ `auth.service.spec.ts` — 21 tests (registration, login, OAuth, JWT, reset password)
- ⚠️ `subscriptions.service.spec.ts` — 19 tests (problème mock Stripe à résoudre)
- 🔄 `impact.service.spec.ts` — À créer
- 🔄 `donations.service.spec.ts` — À créer
- 🔄 `webhooks.service.spec.ts` — À créer

**Actions prioritaires** :
1. Résoudre mock Stripe avec provider injectable
2. Créer tests manquants (impact, donations, webhooks)
3. Ajouter tests e2e avec supertest

---

### 3. **stripe-integration** (wshobson)
- **Source** : wshobson/agents  
- **Installs** : 6,700+  
- **Scope** : Global (`~/.agents/skills/stripe-integration/`)  
- **Security** : Safe (Gen), 0 alerts (Socket), ⚠️ High Risk (Snyk)

**Cas d'usage pour Earthway** :
- ✅ Optimiser implémentation Stripe actuelle (Checkout, Payment Intents, Webhooks)
- ✅ Implémenter retry logic pour webhooks
- ✅ Ajouter upgrade/downgrade flows pour subscriptions
- ✅ Meilleure gestion erreurs paiements refusés
- ✅ Implémenter SCA (Strong Customer Authentication) pour UE

**Patterns clés du skill** :
- **Checkout Sessions** > Payment Intents (moins de maintenance)
- **Webhooks critiques** : `payment_intent.succeeded`, `customer.subscription.updated`, `invoice.payment_succeeded`
- **Idempotency** : Toujours valider signature + stocker event.id
- **Customer management** : Centraliser création/récupération customer ID

**Actions prioritaires** :
1. Refactorer Stripe en provider injectable (facilite mocking tests)
2. Ajouter exponential backoff retry pour webhooks
3. Implémenter flow upgrade/downgrade subscriptions (proration)
4. Ajouter gestion 3D Secure pour paiements européens

---

## 📋 Plan d'Intégration (Priorisation)

### Phase 1 : Tests Backend (CRITICAL) 🚨
**Pourquoi** : Zéro test = code fragile, impossible de refactorer en sécurité

**Tâches** :
- [ ] **T-SKILL-001** Résoudre mock Stripe : Créer `StripeProvider` injectable dans `subscriptions.service.ts`
- [ ] **T-SKILL-002** Finaliser `subscriptions.service.spec.ts` (19 tests)
- [ ] **T-SKILL-003** Créer `impact.service.spec.ts` (tester formules calcul CO2, tier bonuses)
- [ ] **T-SKILL-004** Créer `donations.service.spec.ts` (tester distribution causes, anonymous)
- [ ] **T-SKILL-005** Créer `webhooks.service.spec.ts` (tester validation signature, idempotency)
- [ ] **T-SKILL-006** Créer tests e2e : `auth.e2e-spec.ts`, `donations.e2e-spec.ts`

**Résultat attendu** : Couverture tests > 80%, tous services testés

---

### Phase 2 : Amélioration Stripe (HIGH) 🎯
**Pourquoi** : Optimiser conversion paiements, réduire erreurs webhook

**Tâches** :
- [ ] **T-SKILL-007** Refactorer Stripe vers provider injectable (`src/config/stripe.provider.ts`)
- [ ] **T-SKILL-008** Implémenter retry logic webhooks avec exponential backoff (3 tentatives max)
- [ ] **T-SKILL-009** Ajouter flow upgrade subscription (proration automatique)
- [ ] **T-SKILL-010** Ajouter flow downgrade subscription (effective next period)
- [ ] **T-SKILL-011** Améliorer gestion erreurs paiements (card_declined, insufficient_funds)
- [ ] **T-SKILL-012** Ajouter support 3D Secure/SCA pour paiements UE

**Résultat attendu** : Taux succès paiements +15%, zéro webhook perdu

---

### Phase 3 : Visualisations Impact (MEDIUM) 📊
**Pourquoi** : Engagement utilisateur augmente avec visualisations claires

**Tâches** :
- [ ] **T-SKILL-013** Créer composant `TrendChart.tsx` (React + Chart.js ou D3.js)
- [ ] **T-SKILL-014** Ajouter graphique tendance mensuelle dons dans `Profile.tsx`
- [ ] **T-SKILL-015** Améliorer `ImpactDashboard.tsx` avec chart stacked area (répartition causes)
- [ ] **T-SKILL-016** Créer chart évolution CO2 compensé dans le temps
- [ ] **T-SKILL-017** Appliquer palettes colorblind-friendly (selon skill data-visualization)
- [ ] **T-SKILL-018** Ajouter tooltips interactifs sur progress bars
- [ ] **T-SKILL-019** Améliorer `ProgressBar.tsx` avec animations smooth (CSS transitions)

**Résultat attendu** : Temps passé sur dashboard +30%, engagement visuel amélioré

---

## 🔍 Références Techniques

### Stripe Provider Pattern (Solution Mock)

```typescript
// src/config/stripe.provider.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeProvider {
  public readonly stripe: Stripe;

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(config.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-11-17.clover',
    });
  }
}
```

**Utilisation dans tests** :
```typescript
{
  provide: StripeProvider,
  useValue: {
    stripe: mockStripe,
  },
}
```

---

### Data Visualization - Chart Selection

| Besoin Earthway | Chart Type | Librairie |
|---|---|---|
| Tendance dons mensuels | Line Chart | Chart.js |
| Répartition causes | Stacked Area | D3.js ou Recharts |
| Progression goals | Progress Bar animée | CSS + React Spring |
| Comparaison tiers abonnement | Vertical Bar Chart | Chart.js |
| Distribution montants dons | Histogram | Chart.js |

---

## 📈 Métriques de Succès

**Tests** :
- Coverage > 80% sur tous les services
- 0 tests flaky (déterministes)
- Temps exécution suite < 10s

**Stripe** :
- Taux succès paiements : +15%
- Webhooks perdus : 0%
- Temps résolution erreurs : -50%

**Visualisations** :
- Temps moyen sur dashboard : +30%
- Taux rebond page impact : -20%
- Satisfaction visuelle (Lighthouse) : > 90

---

## 🚀 Prochaines Étapes

1. **MAINTENANT** : Résoudre mock Stripe (T-SKILL-001)
2. **AUJOURD'HUI** : Finaliser suite tests backend (T-SKILL-002 à T-SKILL-005)
3. **CETTE SEMAINE** : Refactorer Stripe provider + retry logic (T-SKILL-007 à T-SKILL-012)
4. **SEMAINE PROCHAINE** : Ajouter visualisations impact (T-SKILL-013 à T-SKILL-019)
