import { ContactLink, PublicPage, Section, SECURITY_EMAIL } from "../public-page";

const CONTROLS: [string, string[]][] = [
  [
    "Money movement",
    [
      "Double-entry ledger: an entry that does not balance is rejected",
      "Idempotency keys on every payment so a retry never pays twice",
      "HMAC-signed firm quotes bound to amount, corridor and expiry",
      "Sanctions screening and KYC-tier limits enforced before any funds move; fail-closed if a check errors",
    ],
  ],
  [
    "Escrow contract",
    [
      "Reentrancy guard, pull-payment fallback, fee-on-transfer tokens rejected",
      "Pausing can never block settlement of funds already held",
      "Permissionless 50/50 fallback so an absent arbiter cannot lock funds",
      "Protocol fee capped at 1% in code",
    ],
  ],
  [
    "Accounts and sessions",
    [
      "HttpOnly session cookies; the browser never holds a bearer token",
      "Login throttling per account and address",
      "Idle-timeout sign-out; separate trader and operator sessions",
      "Operators approve sensitive changes under a four-eyes rule",
    ],
  ],
  [
    "Web application",
    [
      "Strict Content-Security-Policy and modern security headers on every response",
      "No secrets in the client bundle; provider credentials are environment-injected and never logged",
      "Provider webhooks are HMAC-verified and fail-closed until a secret is configured; they record evidence and never post to the ledger",
    ],
  ],
];

export function SecurityPage() {
  return (
    <PublicPage
      kicker="Security"
      title={
        <>
          Designed so that <em>no one person</em> can move your money.
        </>
      }
      lead="This page lists the controls that exist in the code today, and — just as importantly — what has not yet been done."
      toc={[
        { id: "controls", label: "Controls" },
        { id: "limits", label: "Honest limits" },
        { id: "report", label: "Report a vulnerability" },
      ]}
    >
      <Section id="controls" title="Controls in place">
        <div className="grid gap-3 sm:grid-cols-2">
          {CONTROLS.map(([h, items]) => (
            <div key={h} className="border border-border bg-card p-5">
              <h3 className="font-display text-xl text-foreground">{h}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
      <Section id="limits" title="What is not done yet">
        <ul>
          <li>
            <strong>No independent smart-contract audit yet.</strong> The contracts are covered by
            extensive tests, but a third-party audit is a prerequisite for holding real funds.
          </li>
          <li>
            <strong>Payout rails are sandboxes.</strong> No real telecom or bank credentials are in
            use, and no funds are moved.
          </li>
          <li>
            <strong>FX rates are reference values,</strong> not market data, until a licensed rate
            provider is connected.
          </li>
          <li>
            <strong>No regulatory licence is claimed.</strong> Operating in each country needs
            authorisation we have not yet sought.
          </li>
          <li>
            <strong>No penetration test yet.</strong> Automated dependency and accessibility checks
            run, but that is not a substitute.
          </li>
        </ul>
      </Section>
      <Section id="report" title="Report a vulnerability">
        <p>
          If you believe you have found a security issue, please report it privately to{" "}
          <ContactLink address={SECURITY_EMAIL} label="Security address" /> and give us reasonable
          time to respond before disclosing it. Include steps to reproduce; do not access other
          people's data or degrade the service.
        </p>
        <p>
          Because the platform is pre-launch there is no bug bounty, but we will credit researchers
          who wish to be named.
        </p>
      </Section>
    </PublicPage>
  );
}
