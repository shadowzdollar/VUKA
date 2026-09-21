# Provider credentials & go-live guide

VUKA runs every payment rail as a **sandbox** by default. Nothing in this repository
contains a credential, and no external network call is made until a provider is
switched to live mode on purpose. This guide lists what to obtain, where each value
goes, and how the engine behaves until then.

> **Nothing here is a licence.** Operating cross-border mobile-money and payment
> services requires authorisation in each jurisdiction (e.g. a payment-service-provider
> or money-transfer licence, or a licensed partner acting as principal) and an
> agreement with each telecom or bank. The country/provider table is the
> *integration plan*, not a claim of partnership.

## How activation works

A provider goes live only when **all three** are true, otherwise the engine refuses to start:

| # | Setting | Where |
|---|---------|-------|
| 1 | `VUKA_ALLOW_LIVE_PROVIDERS=true` | deployment-wide acknowledgement |
| 2 | `VUKA_PROVIDER_MODE_<ID>=live` | one variable per provider, e.g. `VUKA_PROVIDER_MODE_MTN_RW=live` |
| 3 | `VUKA_PROVIDER_<ID>_CREDENTIALS='{"…":"…"}'` | a JSON object, injected by your secret manager |

`<ID>` is the provider id upper-cased with `-` → `_` (`mtn-rw` → `MTN_RW`).

Guarantees (all covered by tests in `internal/providers/live_test.go`):

* A failed activation leaves **every** provider in the sandbox — there is no half-live state.
* An unsupported provider, missing variable, malformed JSON, or credentials the vendor
  adapter rejects **aborts startup** with an actionable message. Credential values are
  never included in errors or logs.
* `vault://` / `secret://` references are refused until a secret-manager client is wired;
  use an `env://` reference populated by your platform (Kubernetes secret, Render env group, …).
* Webhooks are **fail-closed**: every provider callback is rejected until
  `VUKA_PROVIDER_<ID>_WEBHOOK_SECRET` is set (HMAC-SHA256 over the raw body,
  header `X-Provider-Signature`). Callbacks are recorded as *evidence*; they never post to the ledger.
* Production also requires `VUKA_QUOTE_SIGNING_KEY` (≥ 32 chars, identical on every replica).

## Launch matrix

| Country | Currency | Provider id | Rail | Live adapter | Credential JSON fields |
|---------|----------|-------------|------|--------------|------------------------|
| Rwanda | RWF | `mtn-rw` | MTN MoMo | **implemented** | `subscription_key`, `api_user`, `api_key`, `target_environment`, `callback_url` |
| Uganda | UGX | `mtn-ug` | MTN MoMo | **implemented** | same as above (`target_environment=mtnuganda`) |
| Ghana | GHS | `mtn-gh` | MTN MoMo | **implemented** | same as above (`target_environment=mtnghana`) |
| Kenya | KES | `mpesa-ke` | Safaricom M-Pesa (Daraja) | **implemented** | `consumer_key`, `consumer_secret`, `pass_key`, `short_code`, `b2c_short_code`, `initiator_name`, `security_credential`, `callback_url`, `environment` |
| Tanzania | TZS | `mpesa-tz` | Vodacom M-Pesa | *to build* (needs Vodacom Open API access) | — |
| Zambia | ZMW | `airtel-zm` | Airtel Money | *to build* (Airtel Africa Open API) | — |
| Senegal | XOF | `orange-sn` | Orange Money | *to build* (Orange Money Web Payment API) | — |
| Ethiopia | ETB | `telebirr-et` | Telebirr | *to build* (Ethio telecom partner API) | — |
| Nigeria | NGN | `nibss-ng` | NIBSS NIP via a licensed aggregator | *to build* (aggregator API, e.g. a CBN-licensed PSSP) | — |
| South Africa | ZAR | `eft-za` | Instant EFT via a licensed aggregator | *to build* | — |

"To build" providers stay in the sandbox even if you set `VUKA_PROVIDER_MODE_…=live`:
the engine refuses to start rather than pretend. Adding one means implementing
`adapters.ProviderAdapter` (`Payout`, `Collection`, `ValidateConfig`) and adding a case to
`providers.DefaultAdapterFactory` — see `internal/adapters/momo_api.go` for a complete example.

### Example (MTN Rwanda)

```sh
export VUKA_ALLOW_LIVE_PROVIDERS=true
export VUKA_PROVIDER_MODE_MTN_RW=live
export VUKA_PROVIDER_MTN_RW_CREDENTIALS='{"subscription_key":"…","api_user":"…","api_key":"…","target_environment":"mtnrwanda","callback_url":"https://api.example.org/api/provider-webhooks/mtn-rw"}'
export VUKA_PROVIDER_MTN_RW_WEBHOOK_SECRET='…'
```

## Other external dependencies (placeholders today)

| Need | Variable / place | Today | Before production |
|------|------------------|-------|-------------------|
| **FX rates** | `VUKA_FX_RATES="KES=129.5,RWF=1380,…"` (units per USD) + `VUKA_FX_SOURCE` | sandbox reference table (**indicative, not market data**) | a licensed FX/liquidity provider feeding a `providers.RateSource` |
| **Sanctions / PEP screening** | `internal/risk` `Screener` interface | sandbox screener, test lists via `VUKA_SANDBOX_SANCTIONS_DENY/REVIEW` | vendor integration (`env://VUKA_SANCTIONS_API_KEY`); fail-closed on error already enforced |
| **KYC / identity verification** | trader files a reference (`provider://…`, `registry://…`, `hash:sha256:…`) | metadata only — documents are never uploaded to VUKA | KYC vendor session ids (`provider://<vendor>/<job>`) reviewed by compliance |
| **Quote signing key** | `VUKA_QUOTE_SIGNING_KEY` | ephemeral per process (dev warning) | 32+ chars, from your secret manager, same on all replicas |
| **Metrics scrape** | `VUKA_METRICS_TOKEN` | open outside production | bearer token for Prometheus |
| **Blockchain RPC** | `VUKA_RECONCILIATION_RPC_URL` + `VUKA_RECONCILIATION_CONTRACT` | disabled | Polygon (or chosen chain) RPC + deployed `VukaEscrowV2` |
| **Escrow token** | `VUKA_SETTLEMENT_TOKEN` (contracts `.env`) | test token on Amoy | a regulated stablecoin acceptable to your compliance team |

## Go-live checklist (per provider)

1. Licence / partnership in place for the corridor; legal sign-off recorded.
2. Sandbox certification with the provider using this engine (their test numbers), evidence attached to `PHASE*_PROVIDER_*` records.
3. Credentials issued to a **dedicated** service identity; stored in the secret manager, not in `.env` files.
4. Webhook URL registered with the provider and `WEBHOOK_SECRET` set; send a test callback and confirm it is recorded and never settles.
5. Corridor limits (`VUKA_MAX_TXN_USD`, `VUKA_DAILY_CORRIDOR_USD`) and KYC tier limits reviewed by the compliance officer.
6. Switch **one** provider to live with a small pilot cap; watch `/metrics`, reconciliation and the activity log.
7. Only then repeat for further providers.
