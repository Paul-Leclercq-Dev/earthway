# CI/CD GitHub Actions

## Workflows

### 1) CI
File: `.github/workflows/ci.yml`

Runs on push and pull request for `main` and `develop`.

Checks:
- backend install
- Prisma generation
- NestJS build
- Jest test suite
- frontend install
- Vite production build

### 2) Deploy
File: `.github/workflows/deploy.yml`

Runs on:
- manual dispatch
- push to `main`
- tags starting with `v`

Builds and pushes Docker images to GitHub Container Registry (GHCR), then deploys over SSH on the target server.

## Required GitHub secrets

In GitHub repository settings > Secrets and variables > Actions, define:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`

Optional, depending on your server setup:
- `SSH_PORT` if you use a non-default port

## Example deployment server setup

On the target machine:

```bash
mkdir -p /opt/earthway
cd /opt/earthway

git clone <repo-url> .
# or git pull origin main

# ensure docker and docker compose are installed
# then run:
docker compose pull
docker compose up -d --remove-orphans
```

## Notes

- The root `docker-compose.yml` is used as the deployment stack.
- For production, keep `.env` values in the remote host or use a proper deployment secrets manager.
- The CI pipeline uses test credentials only and does not require real production secrets.
