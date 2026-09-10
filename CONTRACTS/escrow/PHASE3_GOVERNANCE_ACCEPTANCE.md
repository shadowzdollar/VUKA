# Phase 3 Governance and Acceptance

Status: **engineering control baseline — pending formal legal, regulatory, and
security approval** (2026-09-10).

This document records the acceptance posture for the local-only identity and
compliance workflow. It is not legal advice and does not claim that VUKA is
licensed, compliant, or approved in any jurisdiction.

## Control posture

- **Privacy/security review:** threat-model identity metadata, operator access,
  audit export, database access, and deletion requests before production use.
  No identity-document bytes, images, biometrics, provider credentials, or
  blockchain keys are accepted by the Phase 3 API.
- **Conservative retention:** retain only metadata required for an active
  workflow and auditability. Configurable UI/API read windows may hide older
  activity; verification metadata carries an explicit retention class,
  deletion-eligibility timestamp, and legal-hold flag, but does not delete
  append-only decision history. Any future
  deletion must be approved, documented, scoped to non-audit metadata, and
  executed as a separately reviewed migration.
- **Roles/workflow:** `operator` performs operational review; `arbiter` may
  record dispute/compliance recommendations; approvals remain explicit and
  role-guarded. Self-approval and invalid state transitions are rejected.
- **Explainability:** every verification/compliance decision requires a
  non-empty rationale; evidence is represented by a reference/label and
  retention metadata, never by uploaded documents.
- **Fail closed:** missing authentication, missing role, invalid transition,
  unknown evidence reference, and unsupported provider action are denied.

## Acceptance checklist

- [x] Metadata-only identity/compliance storage; no document upload route.
- [x] Decision and review-note history is append-only at the database trigger
  boundary.
- [x] Operator activity is append-only and has a configurable read window.
- [x] Role middleware protects inspection and decision routes.
- [x] Decision rationales are required and exposed for review/export.
- [x] Local tests cover metadata boundaries, authorization, append-only
  history, invalid transitions, and self-approval.
- [ ] Formal legal/privacy sign-off and production retention schedule.
- [ ] Independent security review and production secrets-management review.

## Evidence boundary

Phase 3 is local and simulated. It does not call KYC providers, upload or
retrieve identity documents, make a regulatory determination, or release,
refund, arbitrate, or settle funds.
