import { PublicPage, Section } from "../public-page";

export function TermsPage() {
  return (
    <PublicPage
      kicker="Terms of use"
      title={
        <>
          The ground rules, <em>in plain words</em>.
        </>
      }
      lead="Draft terms describing how the sandbox platform is intended to be used."
      draft
      toc={[
        { id: "sandbox", label: "Sandbox status" },
        { id: "accounts", label: "Accounts" },
        { id: "payments", label: "Payments and escrow" },
        { id: "acceptable", label: "Acceptable use" },
        { id: "liability", label: "Liability" },
      ]}
    >
      <Section id="sandbox" title="1. Sandbox status">
        <p>
          The platform is currently a <strong>sandbox</strong>. Balances are simulated, payout rails
          do not move real money, and nothing here is a financial service until the operator states
          in writing that a specific corridor is live and licensed.
        </p>
      </Section>
      <Section id="accounts" title="2. Accounts">
        <ul>
          <li>You must provide accurate information and keep your password secret.</li>
          <li>You are responsible for activity under your account.</li>
          <li>Limits depend on your verification tier and may change as you verify.</li>
        </ul>
      </Section>
      <Section id="payments" title="3. Payments and escrow">
        <ul>
          <li>A firm quote is valid for its stated period; after that a new quote is required.</li>
          <li>
            Escrow follows the contract's published rules: confirmation releases to the supplier,
            silence refunds the buyer, disputes go to an arbiter, and an unanswered dispute falls
            back to an even split.
          </li>
          <li>
            Payments that fail screening or exceed limits are refused; no payment is completed
            without a balanced ledger entry.
          </li>
        </ul>
      </Section>
      <Section id="acceptable" title="4. Acceptable use">
        <p>
          You must not use the platform for unlawful activity, sanctions evasion, fraud, or to
          interfere with its operation or other users' access.
        </p>
      </Section>
      <Section id="liability" title="5. Liability">
        <p>
          To be settled with counsel before launch, including governing law, dispute forum and
          limits of liability appropriate to each jurisdiction. Until then, do not rely on the
          sandbox for real financial decisions.
        </p>
      </Section>
    </PublicPage>
  );
}
