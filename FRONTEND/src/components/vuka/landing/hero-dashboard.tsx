import { ArrowUpRight, FileText, Globe2, LayoutGrid, Lock, Settings2, ShieldCheck, Wallet } from "lucide-react";
import { useLangCopy } from "@/lib/i18n";
import { VukaLogo } from "../brand";

/** Illustrative only — a mocked device preview, not a live data feed. */
const payments = [
  { name: "MTN Mobile Money", reference: "INV-2041 · Kigali", amount: "USDC 4,250.00", locked: false },
  { name: "M-Pesa", reference: "INV-2038 · Nairobi", amount: "USDC 2,180.00", locked: false },
  { name: "Airtel Money", reference: "INV-2036 · Kampala", amount: "USDC 6,720.00", locked: true },
  { name: "USDC · Polygon", reference: "INV-2032 · Dar", amount: "USDC 980.00", locked: false },
];

const NAV_ICONS = [LayoutGrid, FileText, Lock, Wallet, ShieldCheck, Settings2] as const;

const COPY = {
  en: {
    windowTitle: "VUKA Business — illustrative preview",
    nav: ["Overview", "Invoices", "Escrow", "Balances", "Trust score", "Settings"],
    escrowProtected: "Escrow protected",
    overview: "Overview",
    thisMonth: "This month ⌄",
    lockedInEscrow: "Locked in escrow",
    vsLastMonth: "vs. last month",
    paymentVolume: "Payment volume",
    recentSettlements: "Recent settlements",
    paymentsCount: "4 payments",
    thMethod: "PAYMENT METHOD",
    thReference: "REFERENCE",
    thAmount: "AMOUNT",
    thStatus: "STATUS",
    statusReleased: "Released",
    statusLocked: "Locked",
    tradeAcrossBorders: "Trade across borders",
    corridorCountriesTop: "Rwanda · Kenya · Uganda",
    corridorCountriesBottom: "Tanzania · Burundi",
    everyPaymentProtected: "Every payment protected",
    invoiceLinkedEscrow: "Invoice-linked escrow.",
    mobileMoneyConfidence: "Mobile money in. Confidence out.",
    trustScoreLabel: "Trust score",
    strongSettlementRecord: "Strong settlement record",
  },
  fr: {
    windowTitle: "VUKA Business — aperçu illustratif",
    nav: ["Aperçu", "Factures", "Séquestre", "Soldes", "Score de confiance", "Paramètres"],
    escrowProtected: "Protégé par séquestre",
    overview: "Aperçu",
    thisMonth: "Ce mois-ci ⌄",
    lockedInEscrow: "Bloqué en séquestre",
    vsLastMonth: "vs mois dernier",
    paymentVolume: "Volume de paiements",
    recentSettlements: "Règlements récents",
    paymentsCount: "4 paiements",
    thMethod: "MODE DE PAIEMENT",
    thReference: "RÉFÉRENCE",
    thAmount: "MONTANT",
    thStatus: "STATUT",
    statusReleased: "Libéré",
    statusLocked: "Bloqué",
    tradeAcrossBorders: "Commercez sans frontières",
    corridorCountriesTop: "Rwanda · Kenya · Ouganda",
    corridorCountriesBottom: "Tanzanie · Burundi",
    everyPaymentProtected: "Chaque paiement protégé",
    invoiceLinkedEscrow: "Séquestre lié à la facture.",
    mobileMoneyConfidence: "Mobile money en entrée. Confiance en sortie.",
    trustScoreLabel: "Score de confiance",
    strongSettlementRecord: "Historique de règlement solide",
  },
  sw: {
    windowTitle: "VUKA Business — mwonekano wa mfano",
    nav: ["Muhtasari", "Ankara", "Escrow", "Salio", "Alama ya imani", "Mipangilio"],
    escrowProtected: "Imelindwa kwa escrow",
    overview: "Muhtasari",
    thisMonth: "Mwezi huu ⌄",
    lockedInEscrow: "Imefungwa kwenye escrow",
    vsLastMonth: "dhidi ya mwezi uliopita",
    paymentVolume: "Kiasi cha malipo",
    recentSettlements: "Malipo ya hivi karibuni",
    paymentsCount: "Malipo 4",
    thMethod: "NJIA YA MALIPO",
    thReference: "KUMBUKUMBU",
    thAmount: "KIASI",
    thStatus: "HALI",
    statusReleased: "Imeachiwa",
    statusLocked: "Imefungwa",
    tradeAcrossBorders: "Fanya biashara kuvuka mipaka",
    corridorCountriesTop: "Rwanda · Kenya · Uganda",
    corridorCountriesBottom: "Tanzania · Burundi",
    everyPaymentProtected: "Kila malipo yamelindwa",
    invoiceLinkedEscrow: "Escrow iliyounganishwa na ankara.",
    mobileMoneyConfidence: "Pesa za simu ndani. Uhakika nje.",
    trustScoreLabel: "Alama ya imani",
    strongSettlementRecord: "Rekodi imara ya malipo",
  },
  pt: {
    windowTitle: "VUKA Business — pré-visualização ilustrativa",
    nav: ["Visão geral", "Faturas", "Caução", "Saldos", "Pontuação de confiança", "Definições"],
    escrowProtected: "Protegido por caução",
    overview: "Visão geral",
    thisMonth: "Este mês ⌄",
    lockedInEscrow: "Bloqueado em caução",
    vsLastMonth: "vs. mês anterior",
    paymentVolume: "Volume de pagamentos",
    recentSettlements: "Liquidações recentes",
    paymentsCount: "4 pagamentos",
    thMethod: "MÉTODO DE PAGAMENTO",
    thReference: "REFERÊNCIA",
    thAmount: "MONTANTE",
    thStatus: "ESTADO",
    statusReleased: "Libertado",
    statusLocked: "Bloqueado",
    tradeAcrossBorders: "Comercie além-fronteiras",
    corridorCountriesTop: "Ruanda · Quénia · Uganda",
    corridorCountriesBottom: "Tanzânia · Burundi",
    everyPaymentProtected: "Cada pagamento protegido",
    invoiceLinkedEscrow: "Caução associada à fatura.",
    mobileMoneyConfidence: "Mobile money à entrada. Confiança à saída.",
    trustScoreLabel: "Pontuação de confiança",
    strongSettlementRecord: "Histórico sólido de liquidação",
  },
  rw: {
    windowTitle: "VUKA Business — ishusho y'ikitegererezo",
    nav: ["Incamake", "Inyemezabuguzi", "Escrow", "Imisigire", "Amanota y'icyizere", "Igenamiterere"],
    escrowProtected: "Birinzwe na escrow",
    overview: "Incamake",
    thisMonth: "Uku kwezi ⌄",
    lockedInEscrow: "Bifungiye muri escrow",
    vsLastMonth: "ugereranyije n'ukwezi gushize",
    paymentVolume: "Ingano y'ubwishyu",
    recentSettlements: "Ubwishyu bwa vuba",
    paymentsCount: "Ubwishyu 4",
    thMethod: "UBURYO BW'UBWISHYU",
    thReference: "INDANGO",
    thAmount: "AMAFARANGA",
    thStatus: "IMIMERERE",
    statusReleased: "Byarekuwe",
    statusLocked: "Birafunze",
    tradeAcrossBorders: "Curuza wambukiranya imipaka",
    corridorCountriesTop: "Rwanda · Kenya · Uganda",
    corridorCountriesBottom: "Tanzaniya · Burundi",
    everyPaymentProtected: "Buri bwishyu burarinzwe",
    invoiceLinkedEscrow: "Escrow ihujwe n'inyemezabuguzi.",
    mobileMoneyConfidence: "Mobile money yinjiye. Icyizere gisohotse.",
    trustScoreLabel: "Amanota y'icyizere",
    strongSettlementRecord: "Amateka meza yo kwishyurana",
  },
};

/** Mocked device preview for the landing hero. All figures are illustrative. */
export function HeroDashboard() {
  const c = useLangCopy(COPY);
  return (
    <div className="hero-dashboard" aria-hidden="true">
      <div className="dashboard-window">
        <span /><span /><span /><p>{c.windowTitle}</p>
      </div>
      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <VukaLogo size="md" />
          <div className="dashboard-business">
            Amani Textiles <span>⌄</span>
          </div>
          {NAV_ICONS.map((Icon, i) => (
            <div key={i} className={`dashboard-nav ${i === 0 ? "is-active" : ""}`}>
              <Icon size={13} />
              {c.nav[i]}
            </div>
          ))}
          <div className="dashboard-sidebar-foot">
            <ShieldCheck size={15} /> {c.escrowProtected}
          </div>
        </aside>
        <div className="dashboard-content">
          <div className="dashboard-heading">
            <h3>{c.overview}</h3>
            <span>{c.thisMonth}</span>
          </div>
          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <div>
                {c.lockedInEscrow} <ArrowUpRight size={13} />
              </div>
              <strong>USDC 18,420.00</strong>
              <small>
                ↑ +12.4% <span>{c.vsLastMonth}</span>
              </small>
            </div>
            <div className="dashboard-stat">
              <div>
                {c.paymentVolume} <ArrowUpRight size={13} />
              </div>
              <strong>USDC 42,915.50</strong>
              <div className="dashboard-bars">
                {[25, 29, 36, 32, 45, 40, 53, 61, 58, 69, 80, 73, 92].map((height, i) => (
                  <span key={i} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-transactions">
            <div className="dashboard-heading">
              <h4>{c.recentSettlements}</h4>
              <small>{c.paymentsCount}</small>
            </div>
            <table>
              <thead>
                <tr>
                  <th>{c.thMethod}</th>
                  <th>{c.thReference}</th>
                  <th>{c.thAmount}</th>
                  <th>{c.thStatus}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, i) => (
                  <tr key={payment.reference}>
                    <td>
                      <span className="payment-symbol">{["M", "M", "A", "$"][i]}</span>
                      {payment.name}
                    </td>
                    <td>{payment.reference}</td>
                    <td>{payment.amount}</td>
                    <td>
                      <span className={`payment-status ${payment.locked ? "is-locked" : ""}`}>
                        {payment.locked ? c.statusLocked : c.statusReleased}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dashboard-bottom">
            <div>
              <Globe2 size={27} />
              <h4>{c.tradeAcrossBorders}</h4>
              <p>
                {c.corridorCountriesTop}
                <br />
                {c.corridorCountriesBottom}
              </p>
              <div className="dashboard-corridor">
                KGL <span>↗</span> NBO <span>↗</span> EAC
              </div>
            </div>
            <div>
              <ShieldCheck size={27} />
              <h4>{c.everyPaymentProtected}</h4>
              <p>
                {c.invoiceLinkedEscrow}
                <br />
                {c.mobileMoneyConfidence}
              </p>
              <div className="dashboard-trust">
                <strong>812</strong>
                <span>
                  {c.trustScoreLabel}
                  <br />
                  {c.strongSettlementRecord}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
