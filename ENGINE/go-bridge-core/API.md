# Go Bridge HTTP API contract

The REST API is served by `ENGINE/go-bridge-core` and uses JSON for request and
response bodies. The current contract version is **1**, advertised on every
response as `X-API-Version: 1`. Additive fields and endpoints are compatible;
breaking changes require a new version.

## Endpoints

The ledger surface includes `POST /api/users`, account reads and funding,
`POST /api/transfers`, `POST /api/transfers/cross-border`, transfer status and
entry reads, invoice endpoints, and `GET /api/fx`. Control-plane endpoints
include authentication (`/api/auth/*`), activity, reconciliation, disputes,
identity/compliance, providers, settlements, pilots, support, notifications,
and `GET /api/events` (SSE). `GET /healthz` is the liveness probe and does not
consume rate-limit budget. The authoritative route list is in
`internal/api/server.go`.

Provider execution is a separate append-only evidence boundary:

* `POST /api/provider-executions` claims and dispatches a normalized payout or
  collection operation with an `Idempotency-Key`.
* `GET /api/provider-executions/{id}` and
  `GET /api/provider-executions/transaction/{id}` return provider state,
  attempts, external references, and the last raw response.
* `POST /api/provider-webhooks/{provider}` authenticates and records callback
  evidence. Callback replay is safe and callbacks never mutate ledger entries.

Cross-border provider workflows are a separate durable state machine:

* `POST /api/transaction-workflows` starts a quote-bound workflow and requires
  `Idempotency-Key` and a provider authorization reference. VUKA does not
  collect or store telecom PINs; the configured provider must complete its own
  USSD, app, or API challenge before VUKA accepts the reference. Successful
  authorization is recorded against the exact trader, accounts, amount,
  currencies, and idempotency key before collection.
* `GET /api/transaction-workflows/{id}` and
  `GET /api/transaction-workflows/{id}/events` expose trader-owned state and
  append-only transitions. Operators may inspect
  `GET /api/operator/transaction-workflows/{id}`.
* `POST /api/transaction-workflows/{id}/retry` retries only a failed
  collection or a payout marked `REQUIRES_REVIEW`; it never retries a
  completed workflow or silently turns a payout error into success.
* Authenticated provider callbacks are recorded by `providerexec` first and
  then advance the matching workflow when the callback is a trusted terminal
  outcome. Unknown or late callbacks remain evidence and do not regress a
  terminal workflow.

Collection must succeed before the isolated ledger handoff is attempted.
Payout is a separate step: failures remain `REQUIRES_REVIEW` and require an
explicit retry or operator action. Real provider credentials, approvals, and
network adapters are intentionally not implemented; the default runtime uses
simulated adapters and remains sandbox/kill-switch gated.

The default runtime is sandbox/simulated only. Real adapters must be wired
explicitly, use managed credential references (for example
`env://VUKA_MTN_CREDENTIALS` or `vault://payments/mtn-rw`), and pass an
activation review. No credential value belongs in configuration or source.
Production remains read-only and settlement execution remains disabled behind
the global kill switch.

Transfers and other replay-sensitive writes require an `Idempotency-Key`
header. Replaying a key returns the original result rather than duplicating a
charge.

## Pan-African platform additions

* `GET /api/config/public` (no auth) — deployment description: supported countries and currencies,
  corridor count, KYC limit tiers, chain/contract for escrow reads, feature flags, and
  `rate_convention`. The web app configures itself from this; it never contains secrets.
* `GET /api/public/estimate?from=RWF&to=KES&amount=100000` (no auth) — an **indicative** price for the public
  cost calculator: `fee`, `fee_bps`, `delivered`, `rate`/`inverse_rate`, `rate_source`, `provider_id` and the
  corridor's `min_amount`/`max_amount`. It carries no quote id and locks nothing; `404 no_corridor`,
  `422` (with the allowed range) outside corridor limits, `423` when a kill switch is on. Rate-limited like any
  unauthenticated route.
* `GET /readyz` (readiness: database + provider catalog) and `GET /healthz` (liveness).
* `GET /metrics` — Prometheus text. Requires `Authorization: Bearer $VUKA_METRICS_TOKEN`;
  served openly only outside production.
* **Firm quotes.** `GET /api/quotes?corridor_id&amount_minor` returns a signed `quote.id`
  (`q1.<payload>.<hmac>`) that locks the rate for `VUKA_QUOTE_TTL_MS`. `rate` is
  **source units per one destination unit** (the ledger convention: destination = amount / rate);
  `inverse_rate` is destination per source unit; `rate_convention` names it. Cross-border
  transfers and workflows settle at the quote's locked rate and refuse a mismatching `fx_rate`.
* **KYC tiers.** Trader endpoints `GET|POST /api/trader/kyc` (evidence *references* only, never
  documents: `provider://…`, `registry://…`, `case://…`, `hash:sha256:…`) and `GET /api/trader/limits`.
  Compliance decisions recompute `users.kyc_status` (`PENDING`→`VERIFIED`→`BUSINESS_VERIFIED`, or `REJECTED`).
  Per-transaction / daily / monthly USD limits are enforced on `POST /api/transfers`,
  `/api/transfers/cross-border` and `/api/transaction-workflows`
  (`422 kyc_limit_exceeded` / `kyc_not_permitted`). Replays of an already-recorded idempotency key are not re-blocked.
* **Sanctions screening** runs on sender and recipient before any money moves; a hit or
  `compliance_review_required` is `403` with a deliberately generic message (no tipping-off); a screening
  outage is `503` and the payment is *not* processed (fail closed).
* `GET /api/trader/trust-score` — deterministic, explainable score from the trader's own settlement outcomes.
* `POST /api/transaction-workflows` accepts `invoice_number`, so invoice-linked FX payments use the provider rails.
* Sign-in throttling: 5 failures in 15 minutes locks the subject (`429 too_many_attempts` + `Retry-After`),
  stored in PostgreSQL so it holds across replicas.
* Every API response carries `nosniff`, `X-Frame-Options: DENY`, a deny-all CSP, `Cache-Control: no-store`
  (and HSTS over TLS).

## Analytics

* `GET /api/trader/analytics?days=7|30|90|365` — the signed-in trader's own report (id taken from the
  session, never a parameter). `GET /api/operator/analytics?days=…` — platform-wide, operator/arbiter roles.
* Both return the same shape: `totals`, a gap-free `daily` series, `currencies` and `statuses` slices, a
  payment-size `histogram` (USD buckets, half-open, last open-ended), `corridors` (currency → currency flows),
  and a weekday × hour `heatmap` (UTC). Trader reports add `counterparties`; platform reports add the KYC
  distribution, workflow states, provider success rates, support tickets and settlement commands.
* Definitions: a *payment* moves money between two trader accounts; *cash-in* is a top-up from a settlement
  account; *volume* is the USD equivalent of **successful** payments at the platform's reference rates
  (`rate_basis` is echoed). Top-ups are never counted as payments.

## Request IDs

Clients may send `X-Request-ID`; otherwise the service generates one. The
service returns the value in `X-Request-ID` and includes it in request logs.
Propagate this value when reporting an error or support issue.

## Errors

Errors always use this envelope, including throttling:

```json
{"error":{"code":"invalid_json","message":"request body is invalid"}}
```

HTTP status conveys the class of failure. A `429 Too Many Requests` response
uses code `rate_limited` and includes `Retry-After` (whole seconds).

## Rate limiting

The optional in-process fixed-window limiter is configured with
`VUKA_RATE_LIMIT_REQUESTS` and `VUKA_RATE_LIMIT_WINDOW_MS`. A zero request limit
(the default) preserves local testing and disables throttling. Requests are
bucketed by `X-Client-ID` when supplied, otherwise by the peer IP. Limits are
local to one process and are not a substitute for a distributed edge limiter.
