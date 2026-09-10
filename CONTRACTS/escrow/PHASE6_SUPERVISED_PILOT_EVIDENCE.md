# Phase 6 Supervised Pilot Preparation Evidence

Status: **IMPLEMENTED LOCALLY; synthetic local/sandbox preparation only**

This phase prepares governance and observation workflows. It does not activate
production pilots, move funds, call providers, upload documents, write to
blockchain/escrow, or disable the Phase 5 global settlement kill switch.

## Delivered controls

- [x] Pilot ID, Rwanda–Kenya corridor/provider, local/sandbox environment,
  scope, participant cap, amount/transaction/daily limits, time window, named
  owner/support/incident owner, and explicit status state machine.
- [x] Observation-only and live-disabled invariants at model, schema, service,
  configuration, and API boundaries.
- [x] Participant allowlist linked to Phase 3 organizations/users, with
  approved/verified KYC prerequisite, consent/terms metadata, and no document
  bytes.
- [x] Supervised scenario/run records for happy path, provider timeout,
  webhook replay, corridor kill switch, limit exceedance, reconciliation
  drift, approval failure, and read-only refusal.
- [x] Append-only observations, incidents/support records, approvals, runs, and
  pilot audit events.
- [x] Multi-party approval, requester separation, self-approval protection,
  participant cap, limits, global kill-switch, and read-only checks.
- [x] Protected create/list/get/update, allowlist, approve/pause/resume/cancel,
  scenario/run, observation, incident/support, approvals and audit APIs.
- [x] Bootstrap schema, migration 006, recovery-compatible append-only
  history, and synthetic `go run ./cmd/seed-pilot` fixture.
- [x] Dashboard inspection surfaces consume the pilot API without settlement
  controls.

## Scenario catalogue

| Scenario | Expected supervised result | Evidence |
|---|---|---|
| Happy path | Observation recorded; no settlement call | |
| Provider timeout | Incident/observation recorded; no retry side effect | |
| Webhook replay | Provider boundary rejects replay; pilot records observation | |
| Corridor kill switch | Scenario is refused/recorded; no execution | |
| Limit exceedance | Preflight/pilot policy refuses the observation | |
| Reconciliation drift | Incident opened and evidence reference recorded | |
| Operator approval failure | Self-approval/insufficient approvals rejected | |
| Read-only refusal | Every pilot mutation returns 423 | `POST /api/pilots` returned HTTP 423 `read_only_mode` |

## Acceptance status

- Local compile/unit validation: **PASS where dependencies are available**
- PostgreSQL integration validation: **PASS in the user environment** for
  provisioning, schema application, and synthetic identity/settlement/pilot
  seeds
- External provider certification: **PENDING**
- Legal/compliance approval: **PENDING**
- Independent security review: **PENDING**
- Production activation/live settlement: **NOT PERMITTED**

## Synthetic verification record

- Test window (UTC): 2026-09-10
- Build/commit: Local Phase 6 verification run
- Database/migration result: Provisioning and synthetic seeds passed
- Dashboard build result: Passed after moving `handlePilotAction` to component scope
- Reviewer: _______________________________
- Decision: **LOCAL ACCEPTANCE PASS; EXTERNAL APPROVALS PENDING**

### Runtime smoke verification

Authenticated operator access returned HTTP 200. The pilot listing returned the
synthetic pilot with `observation_only=true`, `live_enabled=false`, and
`kill_switch=true`; the response also confirmed `settlement_kill_switch_active=true`.
Provider status and settlement inspection returned HTTP 200. A pilot mutation
returned HTTP 423 with `read_only_mode`, confirming that state-changing pilot
operations remain blocked.
