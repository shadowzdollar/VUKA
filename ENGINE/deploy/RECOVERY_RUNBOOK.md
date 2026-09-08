# VUKA Database Recovery Runbook

This runbook covers PostgreSQL backup and restore for the read-only operations
console and ledger engine. Recovery is an operator-led maintenance action.
VUKA never deletes, rewrites, or restores data automatically.

## Before every production deployment

1. Create and verify a fresh database backup.
2. Record the backup location, UTC timestamp, database environment, and deploy
   version in the incident/deployment record.
3. Confirm the backup is stored outside the database host and is access
   controlled.
4. Confirm the application migration/bootstrap step is compatible with the
   current schema.
5. Keep the previous application version available for rollback.

## Managed PostgreSQL backup

Use a controlled workstation with `pg_dump` installed. Never place the
connection string in shell history or commit it:

```bash
umask 077
read -s VUKA_DATABASE_URL
export VUKA_DATABASE_URL
pg_dump "$VUKA_DATABASE_URL" \
  --format=custom \
  --file="vuka-$(date -u +%Y%m%dT%H%M%SZ).dump"
unset VUKA_DATABASE_URL
```

Verify the file is non-empty and record its SHA-256 checksum:

```bash
sha256sum vuka-*.dump
```

Store the dump in encrypted, access-controlled storage. Do not upload
production backups to public repositories, issue comments, or chat.

## Local backup

From `ENGINE`, with local PostgreSQL running:

```bash
make backup BACKUP_FILE=deploy/backups/vuka-local.dump
```

The `deploy/backups/` directory is intended for local operator use and should
remain untracked.

## Restore procedure

Restore is destructive to the target database. First stop application traffic,
confirm the target database and backup file, and obtain explicit maintenance
approval.

For local development only:

```bash
make restore \
  CONFIRM_RESTORE=YES \
  BACKUP_FILE=deploy/backups/vuka-local.dump
```

For managed PostgreSQL, use `pg_restore` from a controlled workstation:

```bash
read -s VUKA_DATABASE_URL
export VUKA_DATABASE_URL
pg_restore "$VUKA_DATABASE_URL" \
  --clean --if-exists --no-owner --exit-on-error \
  vuka-production.dump
unset VUKA_DATABASE_URL
```

After restore:

1. Run database connectivity and `/healthz` checks.
2. Confirm ledger and reconciliation schema bootstrap successfully.
3. Confirm operator sign-in and audit activity recording.
4. Confirm reconciliation remains read-only and no transaction execution is
   enabled.
5. Inspect escrow, dispute, timeline, and activity counts against the
   deployment record.
6. Reopen traffic only after the smoke checks pass.

## Recovery drill cadence

Perform a restore drill at least quarterly and after any database-provider
change. Record recovery time, backup age, checksum, operator, and failed
assumptions. A backup that has never been restored is not a verified backup.
