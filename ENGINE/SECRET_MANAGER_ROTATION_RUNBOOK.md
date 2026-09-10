# Secret-manager boundary and credential rotation runbook

Phase 4 remains sandbox/simulated. VUKA stores only a non-secret reference such
as `vault://vuka/provider/mtn-rw` or `sandbox://...`; it never stores secret
values, private keys, callback signing material, or provider tokens in source,
database configuration, logs, fixtures, or dashboard payloads.

## Boundary

1. A future secret-manager integration resolves a reference inside a dedicated
   provider adapter process.
2. The resolver must refuse production references in local/simulated mode.
3. The adapter receives short-lived credentials in memory only and must not
   log them.
4. The settlement boundary must remain disabled until security and provider
   certification approvals are recorded.

## Rotation

1. Open a change/incident record and identify the provider, reference, owner,
   expiry, and rollback reference.
2. Create the replacement credential in the provider portal/secret manager.
3. Validate it against the provider sandbox using a restricted operator.
4. Update the reference, restart/reload the adapter, and verify webhook
   signature validation and reconciliation.
5. Revoke the previous credential only after the observation window succeeds.
6. Record timestamps, approvers, test evidence, and expiry; never record the
   secret value.

Emergency rotation disables the provider and corridor first, preserves webhook
evidence, rotates the reference, and requires a second operator to re-enable
the sandbox control. There is no emergency path to live execution.
