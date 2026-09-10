# VUKA Phase 3 Identity, Compliance, and Trust Data Evidence

**Scope:** local synthetic fixtures and read-only external posture only. Phase
3 does not call an identity provider, upload or retain document bytes, broadcast
transactions, or change settlement execution.

## Delivered controls

- Organization profiles with country and organization type.
- User/operator organization memberships with role and active state.
- Identity/KYC verification metadata with pending, verified, rejected, and
  expired states. References are synthetic labels; no documents are stored.
- Compliance reviews with `pending`, `approved`, `rejected`, `suspended`, and
  `needs_information` transitions.
- Risk flags, append-only review notes, and decision history.
- Operator activity events for profile, membership, verification, risk, and
  review changes. Activity remains protected by the existing append-only
  trigger.
- Operator/arbiter authorization on workflow routes and self-approval
  rejection for both verification and compliance decisions.
- Embedded idempotent schema plus `deploy/migrations/003_identity_compliance.sql`.
- `make identity-seed` synthetic local fixture command. It refuses production.

## Safety boundary

Phase 3 stores only structured trust/compliance metadata and synthetic
references. It has no provider SDK, webhook, document object store, private
key, settlement write, or broadcast path. Existing `VUKA_READ_ONLY` protections
continue to block ledger funding, transfers, reversals, and invoice writes.
Manual compliance workflow writes are local database operations and are audited.

## Validation record

Run from `ENGINE/`:

```bash
go test ./go-bridge-core/internal/identity ./go-bridge-core/internal/api ./go-bridge-core/internal/ledger
make build
make dashboard-build
```

When PostgreSQL is available, run the full integration suite with:

```bash
make test-integration
```

The integration suite verifies schema bootstrap, state transitions, conflict
handling, append-only history, authorization, self-approval protection, and
the existing Phase 1/2 ledger and reconciliation behavior.

## Acceptance notes

This evidence is for local development and review only. Policy approval,
privacy/security review, retention schedules, deletion workflows, and any real
provider integration remain explicit gates for a future phase.

## Final local verification

Completed on 2026-09-10 against the local PostgreSQL-backed engine:

- Engine startup: successful on HTTP `:8080` and gRPC `:50051`
- Synthetic identity seed: successful
- Dashboard production build: successful
- Operator authentication: HTTP 200
- `GET /api/organizations`: HTTP 200 with the synthetic organization
- `GET /api/compliance/reviews`: successful authenticated response
- `GET /api/verifications`: HTTP 200 with synthetic metadata-only records
- Ledger write attempt with `VUKA_READ_ONLY=true`: HTTP 423
  `read_only_mode`

The Phase 3 local-only workflow is therefore implemented and operational.
External identity providers, document storage, production compliance policy,
and settlement execution remain outside this phase.
