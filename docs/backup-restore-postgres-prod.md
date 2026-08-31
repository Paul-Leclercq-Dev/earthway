# Backup et restauration PostgreSQL (production)

Objectif: ne jamais exposer PostgreSQL publiquement et pouvoir restaurer rapidement les donnees abonnes.

## 1) Strategie recommandee

- Sauvegarde automatisable avec `pg_dump` quotidien (format custom).
- Conservation locale/chiffree hors serveur (ex: stockage objet chiffre).
- Option complementaire: backups manages de l'hebergeur (snapshots disque ou base manag\u00e9e).
- Restaurations testees regulierement sur une base de test de restauration.

## 2) Prerequis

- Le compose prod est prive pour DB/Redis (aucun port publie).
- Variables de production dans `.env.production`.
- Scripts:
  - `scripts/backup_postgres.sh`
  - `scripts/restore_postgres.sh`

## 3) Backup manuel

```bash
cd /path/to/Earthway
chmod +x scripts/backup_postgres.sh scripts/restore_postgres.sh
./scripts/backup_postgres.sh \
  --compose-file docker-compose.prod.yml \
  --env-file .env.production \
  --backup-dir ./backups/postgres \
  --retention-days 14
```

Sortie attendue:
- un fichier `.dump`
- un checksum `.sha256`

## 4) Planification automatique (cron)

Exemple: tous les jours a 02:30 UTC

```cron
30 2 * * * cd /path/to/Earthway && ./scripts/backup_postgres.sh --compose-file docker-compose.prod.yml --env-file .env.production --backup-dir ./backups/postgres --retention-days 14 >> ./backups/postgres/backup.log 2>&1
```

## 5) Procedure de restauration

Restauration dans une base de test (sans ecraser la prod):

```bash
cd /path/to/Earthway
./scripts/restore_postgres.sh \
  --compose-file docker-compose.prod.yml \
  --env-file .env.production \
  --backup-file ./backups/postgres/<fichier>.dump \
  --target-db earthway_restore_test
```

Le script:
- verifie le checksum si present
- recree la base cible
- restaure le dump
- affiche le nombre de tables publiques restaurees

## 6) Validation post-restore

Verifier rapidement:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  psql -U "$POSTGRES_USER" -d earthway_restore_test -c "SELECT COUNT(*) FROM users;"
```

Adapter la table selon votre schema.

## 7) Acces ponctuel a la base de prod via tunnel SSH (sans port public)

Aucun port PostgreSQL n'est publie. Pour un acces ponctuel, utilisez un tunnel SSH vers l'hote qui execute Docker:

```bash
ssh -L 55432:127.0.0.1:5432 user@serveur-prod
```

Ensuite, sur la machine locale:

```bash
psql "postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@127.0.0.1:55432/<POSTGRES_DB>"
```

Important:
- ce tunnel ne doit etre ouvert que temporairement
- fermer la session SSH apres usage
- garder l'authentification SSH par cle, sans mot de passe

## 8) Variante hebergeur (backups manages)

Si votre hebergeur propose des backups manages PostgreSQL:
- activez snapshots quotidiens + retention >= 14 jours
- testez une restauration mensuelle dans un environnement isole
- conservez quand meme des dumps applicatifs pour defense en profondeur
