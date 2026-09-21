import { ContactLink, CONTACT_EMAIL, PublicPage, Section } from "../public-page";

const STORAGE: [string, string, string][] = [
  ["vuka.theme", "Your light / dark / system choice", "Until you clear site data"],
  ["vuka.lang", "Your language choice", "Until you clear site data"],
  [
    "vuka.workflows.<id>",
    "Ids of your recent payments, so the Send page can resume tracking them",
    "Until you clear site data",
  ],
  [
    "vuka.chainScope",
    "Operators only: the escrow contract and chain id being viewed",
    "Until you clear site data",
  ],
  [
    "Session cookie",
    "Keeps you signed in. HttpOnly, so scripts cannot read it",
    "Until you sign out or go idle",
  ],
];

export function PrivacyPage() {
  return (
    <PublicPage
      kicker="Privacy"
      title={
        <>
          What we keep, <em>where</em>, and why.
        </>
      }
      lead="A plain-language description of the data the platform handles as designed today."
      draft
      toc={[
        { id: "collect", label: "What we collect" },
        { id: "never", label: "What we don't" },
        { id: "storage", label: "Cookies and storage" },
        { id: "third", label: "Third parties" },
        { id: "rights", label: "Your choices" },
      ]}
    >
      <Section id="collect" title="What we collect">
        <ul>
          <li>
            <strong>Account:</strong> your name, phone number, business name and country, and a
            salted hash of your password (never the password itself).
          </li>
          <li>
            <strong>Transactions:</strong> invoices, quotes, payments and their ledger entries,
            which we must retain to keep an auditable record.
          </li>
          <li>
            <strong>Verification:</strong> the reference you file (a provider job id, registry
            reference or document hash) and its review status.
          </li>
          <li>
            <strong>Operations:</strong> request ids, timestamps and error codes in server logs; no
            credential values are logged.
          </li>
        </ul>
      </Section>
      <Section id="never" title="What we don't">
        <ul>
          <li>
            Identity documents are <strong>not uploaded</strong> to VUKA; only references are
            stored.
          </li>
          <li>No advertising trackers, no third-party analytics scripts, no selling of data.</li>
        </ul>
      </Section>
      <Section id="storage" title="Cookies and browser storage">
        <p>
          The site uses one session cookie and a few items in your browser's local storage. All are
          strictly functional; none tracks you across sites.
        </p>
        <div className="overflow-x-auto border border-border bg-card text-foreground">
          <table className="w-full min-w-[520px] text-sm">
            <caption className="sr-only">Browser storage used by VUKA</caption>
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th scope="col" className="p-3 font-normal">
                  Name
                </th>
                <th scope="col" className="p-3 font-normal">
                  Purpose
                </th>
                <th scope="col" className="p-3 font-normal">
                  Lifetime
                </th>
              </tr>
            </thead>
            <tbody>
              {STORAGE.map(([n, p, l]) => (
                <tr key={n} className="border-b border-border last:border-0">
                  <th scope="row" className="p-3 text-left font-mono text-xs font-normal">
                    {n}
                  </th>
                  <td className="p-3">{p}</td>
                  <td className="p-3 text-muted-foreground">{l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section id="third" title="Third parties">
        <ul>
          <li>
            <strong>Google Fonts</strong> serves the Newsreader, Inter and JetBrains Mono typefaces;
            your browser contacts Google to fetch them and Google sees your IP address. Self-hosting
            the fonts is planned.
          </li>
          <li>
            <strong>Payout providers</strong> (mobile-money operators and banks) will receive the
            details needed to pay out once rails go live. Today all rails are sandboxes and receive
            nothing.
          </li>
        </ul>
      </Section>
      <Section id="rights" title="Your choices">
        <p>
          You can clear browser storage at any time, export your activity from the app, and ask for
          correction or deletion (subject to ledger records we are required to retain) at{" "}
          <ContactLink address={CONTACT_EMAIL} label="Privacy contact" />. The controller identity
          and applicable data-protection registrations will be added before launch.
        </p>
      </Section>
    </PublicPage>
  );
}
