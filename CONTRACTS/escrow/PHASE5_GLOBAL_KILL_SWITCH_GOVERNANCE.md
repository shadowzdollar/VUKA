# Global Settlement Kill-Switch Governance Record

Status: **ACTIVE and enforced. Live execution is disabled.**

The global settlement kill switch is a safety control, not an environment
toggle. It may not be disabled by a single operator, deployment, migration,
provider callback, or pilot action.

## Current control state

- Global settlement kill switch: **ACTIVE**
- Live execution: **DISABLED**
- Provider calls / ledger settlement / escrow writes: **REFUSED**
- Phase 6 pilot mode: **observation-only, local/sandbox-only**

## Future change-control requirement

Before any future disablement, all of the following are mandatory:

1. Independent security review is complete with no open critical/high blocker.
2. Provider sandbox certification and corridor legal/compliance approval are
   signed.
3. Secret-manager rotation and recovery evidence are approved.
4. A change ticket names the exact scope, time window, loss cap, rollback and
   monitoring plan.
5. At least two distinct authorized approvers, including Security and
   Operations, approve the same change intent.
6. A separate release operator executes the change and records the resulting
   configuration and audit event.
7. A post-change review confirms the kill switch can be reactivated.

| Change request | Scope / expiry | Security approver | Operations approver | Release operator | Decision |
|---|---|---|---|---|---|
| | | | | | **PENDING** |

No current code path or pilot API can disable this switch.
