export interface InvoiceSharePayload {
  number: string;
  amount: number;
  currency: string;
  description: string;
  dueDate: string;
  counterparty?: string;
}

export function buildWhatsAppInvoiceShareUrl(payload: InvoiceSharePayload, lang: string = "en"): string {
  let intro = "🤝 *VUKA TRADE ESCROW INVOICE*";
  let protectNote = "🔒 *Trust Enforced by Smart-Contract Escrow*\nFunds are locked safely on Polygon L2 until goods/services are verified.";

  if (lang === "sw") {
    intro = "🤝 *INKARA YA VUKA (TRADE ESCROW)*";
    protectNote = "🔒 *Imani Inalindwa na Mkataba wa Escrow*\nFedha zinatunzwa kwa usalama hadi mzigo au huduma ithibitishwe.";
  } else if (lang === "fr") {
    intro = "🤝 *FACTURE VUKA (ESCROW COMMERCIAL)*";
    protectNote = "🔒 *Confiance Garantie par Contrat Escrow*\nLes fonds sont sécurisés jusqu'à confirmation de la livraison.";
  } else if (lang === "rw") {
    intro = "🤝 *INYEMEZABWISHYU YA VUKA (ESCROW)*";
    protectNote = "🔒 *Bwishingiwe na Kontarato ya Escrow*\nAmafaranga arinzwe kugeza ibicuruzwa byemejwe.";
  }

  const message = `${intro}\n` +
    `📄 Invoice #: ${payload.number}\n` +
    `💰 Amount: ${payload.amount.toLocaleString()} ${payload.currency}\n` +
    `📅 Due Date: ${payload.dueDate}\n` +
    `📦 Item: ${payload.description}\n\n` +
    `${protectNote}\n\n` +
    `📲 Pay & Lock Escrow: https://vuka.africa/pay/${encodeURIComponent(payload.number)}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildSMSInvoiceShareUrl(payload: InvoiceSharePayload): string {
  const body = `VUKA Escrow Invoice #${payload.number} for ${payload.amount} ${payload.currency}. Due: ${payload.dueDate}. Pay safely at: https://vuka.africa/pay/${encodeURIComponent(payload.number)}`;
  return `sms:?body=${encodeURIComponent(body)}`;
}
