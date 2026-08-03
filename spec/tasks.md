# Earthway — Tasks (par phases)

Ce document recense les tâches clés du projet, groupées par phases. Chaque tâche inclut objectifs, critères d’acceptation, commandes utiles (zsh), et risques/rollbacks. Il est non destructif: il référence et orchestre l’existant (`EarthwayBack`, `EarthwayFront`, `docker-compose.yml`).

Table des matières
- Phase 0 — Baseline & Onboarding
- Phase 1 — Backend Foundation (NestJS)
- Phase 2 — Base de données & Prisma
- Phase 3 — Frontend Integration (Vite/React + Nginx)
- Phase 4 — Mail & Jobs (Bull/Redis)
- Phase 5 — Auth & Sécurité
- Phase 6 — Docker & DevOps
- Phase 7 — Observabilité
- Phase S — SpecKit Integration

---

## Phase 0 — Baseline & Onboarding

Objectifs
- Standardiser l’environnement, sécuriser les secrets, stabiliser les versions Docker.
- Avoir un cycle de dev local reproductible.

Tâches
1) Fichier d’environnement Compose
- Créer un `.env` à la racine (non commit) avec:
  - `DATABASE_URL`, `SECRET_KEY`, `REFRESH_SECRET_KEY`, `MAIL_*`, `REDIS_HOST`, `REDIS_PORT`.
- Vérifier que `docker-compose.yml` consomme ces variables.

2) Pinner les images Docker
- Remplacer `latest` par versions stables (ex.: `mysql:8.0`, `redis:7`, `phpmyadmin:5`).

3) Sanity check du stack
```zsh
# Lancer toute la stack
docker compose up -d
# Vérifier la DB et le backend
docker compose logs -f bdd_earthway_sql
docker compose logs -f backend_earthway
# Arrêt
docker compose down
```

Critères d’acceptation
- `docker compose up -d` démarre sans erreur.
- Secrets gérés via `.env` (pas en dur dans compose).

Risques & Rollback
- Si changement de version DB: prévoir migration/backup.

---

## Phase 1 — Backend Foundation (NestJS)

Objectifs
- Démarrer l’API de manière fiable et documentée.
- CORS, préfixe global, healthcheck.

Tâches
1) Configuration CORS + Préfixe `/api`
- Activer CORS dans `main.ts` et définir `app.setGlobalPrefix('api')`.

2) Endpoints de santé
- Ajouter `/api/health` (OK 200) pour readiness.

3) Scripts de démarrage
```zsh
npm run --prefix EarthwayBack start:dev
npm run --prefix EarthwayBack build
npm run --prefix EarthwayBack start:prod
```

Critères d’acceptation
- `GET /api/health` renvoie 200 en dev et en container.

Risques & Rollback
- CORS trop permissif: restreindre origines quand nécessaire.

---

## Phase 2 — Base de données & Prisma

Objectifs
- Génération client Prisma, migrations reproductibles, seed optionnel.

Tâches
1) Génération client
```zsh
npx --prefix EarthwayBack prisma generate
```

2) Déploiement des migrations
```zsh
npx --prefix EarthwayBack prisma migrate deploy
# ou, en dev (création):
# npx --prefix EarthwayBack prisma migrate dev --name init
```

3) Seed (optionnel)
```zsh
node EarthwayBack/dist/seed.js
```

Critères d’acceptation
- `prisma generate` et `migrate deploy` réussissent avec la `DATABASE_URL`.

Risques & Rollback
- Migrations destructives: toujours valider sur un dump.

---

## Phase 3 — Frontend Integration (Vite/React + Nginx)

Objectifs
- Front communique avec le backend sans CORS ou via proxy propre.

Tâches
1) Variable `VITE_API_URL`
- Ajouter `VITE_API_URL` (ex.: `http://localhost:3000/api`).
- Utiliser cette base URL dans `src/Hooks/UseApi.tsx`.

2) Nginx proxy (en prod container)
- Router `/api` → `backend_earthway:3000` dans `EarthwayFront/nginx.conf`.

3) Commandes front
```zsh
npm run --prefix EarthwayFront dev
npm run --prefix EarthwayFront build
npm run --prefix EarthwayFront preview
```

Critères d’acceptation
- Appels API du front fonctionnent en dev et en image Nginx.

Risques & Rollback
- Double base URL: privilégier `/api` proxifié pour éviter CORS.

---

## Phase 4 — Mail & Jobs (Bull/Redis)

Objectifs
- Files Bull opérationnelles, envoi d’emails Handlebars fiable.

Tâches
1) Redis
- Vérifier `REDIS_HOST=redis_earthway`, `REDIS_PORT=6379` en compose.

2) Mailer
- Variables `MAIL_HOST`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` présentes.

3) Test d’un job mail
```zsh
# Démarrer stack puis déclencher un job depuis un endpoint de test
curl -X POST http://localhost:3000/api/mail/test
```

Critères d’acceptation
- Un email de test est envoyé, files stables.

Risques & Rollback
- Throttling/quotas SMTP: prévoir retries et logs.

---

## Phase 5 — Auth & Sécurité

Objectifs
- JWT access/refresh, sécurisation clés, cookies httpOnly optionnels.

Tâches
- Configurer `SECRET_KEY` et `REFRESH_SECRET_KEY`.
- Définir endpoints `login`, `refresh`, `logout`.
- Mettre en place guards Nest et stratégies.

Critères d’acceptation
- Flux login/refresh fonctionne; endpoints sensibles protégés.

Risques & Rollback
- Stockage tokens côté front: préférer cookies sécurisés si possible.

---

## Phase 6 — Docker & DevOps

Objectifs
- Exécution prévisible, profils compose, production prête.

Tâches
1) Compose profiles
- `dev` vs `prod` (phpMyAdmin seulement en dev).

2) Healthchecks compose
- Ajouter healthcheck pour MySQL, Backend, Redis.

3) CI (optionnel)
- Lint, build, tests, prisma generate.

Commandes
```zsh
docker compose --profile dev up -d
docker compose --profile prod up -d
```

Critères d’acceptation
- Profils distincts fonctionnent; build CI passe.

---

## Phase 7 — Observabilité

Objectifs
- Logs structurés, métriques, readiness/liveness.

Tâches
- Ajouter endpoints/indicateurs de santé.
- Configurer niveau de logs par env.

Critères d’acceptation
- Dashboards simples (ou logs consultables) disponibles.

---

## Phase S — SpecKit Integration

Objectifs
- Centraliser constitution, plan et tasks; lier artefacts existants.

Tâches
1) Constitution légère
- `spec/constitution.yaml`: system `Earthway`, domaines: backend (`EarthwayBack`), frontend (`EarthwayFront`), infra (`.`).

2) Lier artefacts
- `prisma/schema.prisma`, `docker-compose.yml`, `nginx.conf`, `package.json`.

3) Tasks runner (si supporté par ta version)
- Mapper les commandes de ce `tasks.md` en tâches SpecKit exécutable (optionnel).

Critères d’acceptation
- `spec/` versionné; documentation des tâches unique et à jour.

---

Notes
- Ce `tasks.md` est la source lisible par l’équipe. Si SpecKit est utilisé comme runner, il peut référencer ces tâches. Sinon, ce fichier reste la vérité de référence.
