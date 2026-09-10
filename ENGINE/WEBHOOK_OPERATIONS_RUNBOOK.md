# Provider webhook operations runbook

## Intake and signature verification

Require the provider identifier, replay key, body, and configured signature.
Verify the HMAC using secret-manager material in the future adapter boundary;
missing validators, malformed signatures, unknown providers, and invalid JSON
are rejected. Store an append-only evidence event with authenticated state.

## Replay and idempotency

The tuple `(provider_id, replay_key)` is unique. A previously accepted key is
reported as `DUPLICATE` and must not invoke an adapter, ledger write, payout,
refund, release, arbitration, or blockchain transaction.

## Outage, retry, and dead letter

Provider timeouts remain `pending_provider`; retry with bounded exponential
backoff and the same idempotency key. Do not create a second command. After
the retry budget, place the event in an operator-visible dead-letter queue
(failed reconciliation record), disable the affected corridor when required,
and reconcile against the provider statement manually.

## Monitoring and incident response

Alert on signature rejection spikes, replay spikes, pending age, dead-letter
count, reconciliation drift, provider/corridor kill-switch changes, and
unexpected execution attempts. During an incident activate the global and
corridor kill switches, preserve append-only audit evidence, identify the last
accepted replay key, and require two operators to approve recovery. Notify the
provider owner and record the incident timeline.

Accepted webhook evidence is observation-only in Phase 4 and Phase 5; it never
settles funds.
