## Paiements Stripe, SCA et Webhooks

### Objectif

Cette note documente les concepts introduits pour rendre les paiements Earthway compatibles avec l'authentification forte (SCA / PSD2), tout en gardant des webhooks Stripe robustes et idempotents.

### 1. Dons ponctuels: PaymentIntent + SCA

Le flux de don repose sur un `PaymentIntent` Stripe avec `automatic_payment_methods` activé.

Backend:
- le frontend demande la création d'un don via `POST /api/donations`
- le backend crée un `PaymentIntent`
- le backend renvoie au frontend le `clientSecret`

Frontend:
- le frontend affiche `PaymentElement`
- l'utilisateur saisit son moyen de paiement
- le frontend appelle `stripe.confirmPayment(...)`
- Stripe déclenche automatiquement une étape 3D Secure si la banque l'exige

Résultats possibles:
- `succeeded`: paiement confirmé
- `processing`: paiement accepté mais encore en traitement
- `requires_payment_method`: paiement refusé ou moyen de paiement invalide
- `requires_action`: authentification complémentaire encore requise

### 2. Abonnements: Checkout Session + SCA

Les abonnements utilisent Stripe Checkout.

Pourquoi:
- Checkout gère automatiquement la collecte carte
- Checkout gère nativement SCA / 3D Secure
- le frontend n'a pas à implémenter la logique carte pour l'abonnement

Flux:
- le frontend appelle `POST /api/subscriptions`
- le backend crée une `Checkout Session`
- le frontend redirige l'utilisateur vers `checkoutUrl`
- Stripe prend en charge l'authentification forte si nécessaire
- au retour, le frontend lit `checkout=success` ou `checkout=cancelled`
- l'état définitif de l'abonnement est ensuite consolidé par webhook

### 3. Webhooks Stripe sécurisés

Le webhook Stripe doit valider la signature avec le body brut.

Principes:
- `rawBody` activé côté Nest
- validation via `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`
- réponse HTTP 200 rapide après validation
- traitement lourd délégué à Bull

### 4. Idempotence des webhooks

Chaque événement Stripe est journalisé dans `WebhookLog`.

Champs principaux:
- `eventId`
- `type`
- `status`
- `payload`
- `createdAt`

Règle:
- si `eventId` existe déjà, l'événement est ignoré sans retraitement

### 5. Retry Bull sur les webhooks

Le job `process-stripe-event` utilise:
- `attempts: 5`
- `backoff: exponential`
- base `2000ms`

Comportement:
- tant qu'il reste des tentatives, Bull reprogramme le job
- si toutes les tentatives échouent, `WebhookLog.status` passe à `failed`
- ce statut permet un retraitement manuel ultérieur

### 6. Variables d'environnement utiles

Backend:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`

Frontend:
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_API_URL`

### 7. Tester localement avec Stripe CLI

#### Écouter les webhooks

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

La CLI renvoie un secret `whsec_...` à reporter dans `STRIPE_WEBHOOK_SECRET`.

#### Déclencher des événements

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

### 8. Tester SCA / 3D Secure avec les cartes Stripe

Cartes de test utiles:

- succès sans challenge: `4242 4242 4242 4242`
- 3D Secure challenge réussi: `4000 0025 0000 3155`
- 3D Secure requis puis échec: `4000 0084 0000 1629`

Date d'expiration: n'importe quelle date future

CVC: n'importe quelle valeur à 3 chiffres

Code postal: n'importe quelle valeur valide

### 9. Point d'attention produit

Pour les dons, la confirmation visuelle frontend n'est pas la source de vérité finale.
La source de vérité reste le webhook Stripe, qui met à jour l'état métier (`pending`, `succeeded`, `failed`).