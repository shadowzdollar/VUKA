# Phase 5 Secret-Manager and Credential Rotation Approval

Status: **PENDING — no production or provider credentials are stored or
approved.**

This record contains references and approvals only. Never paste secrets,
private keys, tokens, PINs, certificates, or document bytes into this file.

## Checklist

- [ ] Secret manager selected and independently reviewed.
- [ ] Provider credentials are sandbox-scoped and stored only by reference.
- [ ] Least-privilege service identities and separate operator identities are
  configured.
- [ ] Rotation interval, dual control, emergency revocation, and break-glass
  procedure are documented.
- [ ] Rotation was tested without exposing values in logs, traces, backups, or
  audit events.
- [ ] Old credentials were revoked and provider webhook signing keys rotated.
- [ ] Recovery/restore procedure does not restore expired credentials.
- [ ] Security owner and operations owner independently approved the change.

| Field | Value |
|---|---|
| Secret manager / vault reference | |
| Credential class (no value) | |
| Sandbox tenant / provider | |
| Rotation request ID | |
| Planned rotation date (UTC) | |
| Security approver | |
| Operations approver | |
| Evidence reference | |
| Expiry / next review | |
| Decision | **PENDING** |

No credential rotation changes the active global settlement kill switch.
