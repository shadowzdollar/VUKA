import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Building2, FileText, Send, UserCheck } from "lucide-react";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/vuka/query-state";
import { Chip, Panel } from "@/components/vuka/shell";
import { invoiceSubtotal, invoiceTotal } from "@/components/vuka/trader-invoices";
import { describeError } from "@/lib/api/client";
import { invoices as invoiceApi } from "@/lib/api/endpoints";
import { day, money } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const COPY: Record<
  Lang,
  {
    operatorNoticePrefix: string;
    operatorNoticeLink: string;
    allInvoices: string;
    loadingInvoice: string;
    voucherPayable: string;
    voucherReceivable: string;
    issuedDueLine: (issued: string, due: string, owePart: string) => string;
    youOwe: (name: string) => string;
    owesYou: (name: string) => string;
    invoiceTotal: string;
    payThisInvoice: string;
    issuedBy: string;
    billedTo: string;
    lineItemsTitle: string;
    lineItemsSubtitle: string;
    itemsCount: (n: number) => string;
    colItem: string;
    colQty: string;
    colUnit: string;
    colLine: string;
    subtotal: string;
    vat: (rate: number) => string;
    total: string;
  }
> = {
  en: {
    operatorNoticePrefix:
      "Invoice detail is a trader view. Operators observe the on-chain escrow register on the ",
    operatorNoticeLink: "escrow list",
    allInvoices: "All invoices",
    loadingInvoice: "Loading invoice",
    voucherPayable: "Commercial Trade Voucher · Payable",
    voucherReceivable: "Commercial Trade Voucher · Receivable",
    issuedDueLine: (issued, due, owePart) => `Issued ${issued} · due ${due} · ${owePart}`,
    youOwe: (name) => `you owe ${name}`,
    owesYou: (name) => `${name} owes you`,
    invoiceTotal: "Invoice Total",
    payThisInvoice: "Pay this invoice",
    issuedBy: "Issued by",
    billedTo: "Billed to",
    lineItemsTitle: "Line items",
    lineItemsSubtitle: "Itemized commercial schedule and VAT calculation",
    itemsCount: (n) => `${n} items`,
    colItem: "Item",
    colQty: "Qty",
    colUnit: "Unit",
    colLine: "Line",
    subtotal: "Subtotal",
    vat: (rate) => `VAT ${rate}%`,
    total: "Total",
  },
  fr: {
    operatorNoticePrefix:
      "Le détail d'une facture est une vue commerçant. Les opérateurs observent le registre des séquestres sur chaîne dans la ",
    operatorNoticeLink: "liste des séquestres",
    allInvoices: "Toutes les factures",
    loadingInvoice: "Chargement de la facture",
    voucherPayable: "Bon de commerce · À payer",
    voucherReceivable: "Bon de commerce · À recevoir",
    issuedDueLine: (issued, due, owePart) => `Émise le ${issued} · échéance ${due} · ${owePart}`,
    youOwe: (name) => `vous devez à ${name}`,
    owesYou: (name) => `${name} vous doit`,
    invoiceTotal: "Total facture",
    payThisInvoice: "Payer cette facture",
    issuedBy: "Émise par",
    billedTo: "Facturé à",
    lineItemsTitle: "Lignes de facture",
    lineItemsSubtitle: "Bordereau commercial détaillé et calcul de la TVA",
    itemsCount: (n) => `${n} articles`,
    colItem: "Article",
    colQty: "Qté",
    colUnit: "Unité",
    colLine: "Ligne",
    subtotal: "Sous-total",
    vat: (rate) => `TVA ${rate}%`,
    total: "Total",
  },
  sw: {
    operatorNoticePrefix:
      "Maelezo ya ankara ni mwonekano wa mfanyabiashara. Waendeshaji wanatazama rejista ya escrow kwenye mnyororo katika ",
    operatorNoticeLink: "orodha ya escrow",
    allInvoices: "Ankara zote",
    loadingInvoice: "Inapakia ankara",
    voucherPayable: "Vocha ya Biashara · Ya Kulipwa",
    voucherReceivable: "Vocha ya Biashara · Ya Kupokelewa",
    issuedDueLine: (issued, due, owePart) =>
      `Imetolewa ${issued} · inatarajiwa ${due} · ${owePart}`,
    youOwe: (name) => `unadaiwa na ${name}`,
    owesYou: (name) => `${name} anadaiwa nawe`,
    invoiceTotal: "Jumla ya Ankara",
    payThisInvoice: "Lipa ankara hii",
    issuedBy: "Imetolewa na",
    billedTo: "Imetozwa kwa",
    lineItemsTitle: "Vipengele vya ankara",
    lineItemsSubtitle: "Orodha ya kibiashara na ukokotoaji wa VAT",
    itemsCount: (n) => `vipengele ${n}`,
    colItem: "Bidhaa",
    colQty: "Idadi",
    colUnit: "Bei/Kitengo",
    colLine: "Jumla",
    subtotal: "Jumla ndogo",
    vat: (rate) => `VAT ${rate}%`,
    total: "Jumla",
  },
  pt: {
    operatorNoticePrefix:
      "O detalhe da fatura é uma vista de comerciante. Os operadores observam o registo de caução on-chain na ",
    operatorNoticeLink: "lista de cauções",
    allInvoices: "Todas as faturas",
    loadingInvoice: "A carregar fatura",
    voucherPayable: "Comprovativo Comercial · A Pagar",
    voucherReceivable: "Comprovativo Comercial · A Receber",
    issuedDueLine: (issued, due, owePart) => `Emitida ${issued} · vencimento ${due} · ${owePart}`,
    youOwe: (name) => `deve a ${name}`,
    owesYou: (name) => `${name} deve-lhe`,
    invoiceTotal: "Total da Fatura",
    payThisInvoice: "Pagar esta fatura",
    issuedBy: "Emitida por",
    billedTo: "Faturado a",
    lineItemsTitle: "Itens da fatura",
    lineItemsSubtitle: "Tabela comercial discriminada e cálculo de IVA",
    itemsCount: (n) => `${n} itens`,
    colItem: "Item",
    colQty: "Qtd",
    colUnit: "Unidade",
    colLine: "Linha",
    subtotal: "Subtotal",
    vat: (rate) => `IVA ${rate}%`,
    total: "Total",
  },
  rw: {
    operatorNoticePrefix:
      "Ibisobanuro by'inyemezabuguzi bigenewe umucuruzi. Abakozi bareba igitabo cya escrow kuri chain ku ",
    operatorNoticeLink: "rutonde rwa escrow",
    allInvoices: "Inyemezabuguzi zose",
    loadingInvoice: " Birimo gufungura inyemezabuguzi",
    voucherPayable: "Impapuro z'Ubucuruzi · Izigomba Kwishyurwa",
    voucherReceivable: "Impapuro z'Ubucuruzi · Izigomba Kwakirwa",
    issuedDueLine: (issued, due, owePart) =>
      `Yatanzwe ${issued} · itariki ntarengwa ${due} · ${owePart}`,
    youOwe: (name) => `urimo umwenda ${name}`,
    owesYou: (name) => `${name} akurimo umwenda`,
    invoiceTotal: "Igiteranyo cy'Inyemezabuguzi",
    payThisInvoice: "Ishyura iyi nyemezabuguzi",
    issuedBy: "Yatanzwe na",
    billedTo: "Yandikiwe",
    lineItemsTitle: "Ibigize inyemezabuguzi",
    lineItemsSubtitle: "Urutonde rw'ibicuruzwa n'imibare ya TVA",
    itemsCount: (n) => `ibintu ${n}`,
    colItem: "Igicuruzwa",
    colQty: "Ingano",
    colUnit: "Igiciro",
    colLine: "Igiteranyo",
    subtotal: "Igiteranyo cy'ibanze",
    vat: (rate) => `TVA ${rate}%`,
    total: "Igiteranyo rusange",
  },
};

export const Route = createFileRoute("/escrow/$id")({
  head: () => ({ meta: [{ title: "Invoice — VUKA" }] }),
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { session } = useSession();
  const c = useLangCopy(COPY);
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["invoice", id], queryFn: () => invoiceApi.get(id) });

  if (session.status === "operator") {
    return (
      <EmptyState>
        {c.operatorNoticePrefix}
        <Link to="/escrow" className="underline underline-offset-4">
          {c.operatorNoticeLink}
        </Link>
        .
      </EmptyState>
    );
  }
  const traderId = session.status === "trader" ? session.trader.id : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/escrow"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {c.allInvoices}
        </Link>
      </div>

      {q.isPending ? (
        <Loading label={c.loadingInvoice} />
      ) : q.isError ? (
        <div className="rounded-xl border-2 border-foreground p-4 text-sm">
          {describeError(q.error)}
        </div>
      ) : (
        (() => {
          const invoice = q.data;
          const iOwe = traderId ? invoice.counterparty_user_id === traderId : false;
          const subtotal = invoiceSubtotal(invoice);
          const total = invoiceTotal(invoice);
          return (
            <>
              {/* Executive Commercial Invoice Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
                <img
                  src={escrowGlobe}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -bottom-16 w-[300px] opacity-[0.14] mix-blend-screen select-none"
                />
                <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
                      <FileText className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                        {iOwe ? c.voucherPayable : c.voucherReceivable}
                      </span>
                    </div>
                    <h1 className="mt-3 font-mono text-3xl font-bold tracking-tight text-white">
                      {invoice.number}
                    </h1>
                    <p className="mt-1.5 text-xs text-white/65">
                      {c.issuedDueLine(
                        day(invoice.issue_date),
                        day(invoice.due_date),
                        iOwe
                          ? c.youOwe(invoice.issuer_name)
                          : c.owesYou(invoice.counterparty_name),
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-right font-mono">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-white/50">
                        {c.invoiceTotal}
                      </div>
                      <div className="text-lg font-bold text-[#c2f74d]">
                        {money(total, invoice.currency)}
                      </div>
                    </div>
                    <Chip tone={invoice.status === "PAID" ? "lime" : "live"}>
                      {invoice.status}
                    </Chip>
                    {iOwe && invoice.status !== "PAID" ? (
                      <Button
                        asChild
                        className="gap-1.5 rounded-lg bg-[#c2f74d] font-mono text-xs font-bold uppercase text-[#151515] hover:bg-[#c2f74d]/90"
                      >
                        <Link to="/send" search={{ invoice: invoice.number }}>
                          <Send className="size-3.5" aria-hidden="true" />
                          {c.payThisInvoice}
                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <Building2 className="size-3.5 text-[#79b200]" aria-hidden="true" />
                    {c.issuedBy}
                  </div>
                  <div className="mt-2 text-xl font-bold tracking-tight text-foreground">
                    {invoice.issuer_name}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <UserCheck className="size-3.5 text-[#79b200]" aria-hidden="true" />
                    {c.billedTo}
                  </div>
                  <div className="mt-2 text-xl font-bold tracking-tight text-foreground">
                    {invoice.counterparty_name}
                  </div>
                </div>
              </div>

              <Panel
                title={c.lineItemsTitle}
                subtitle={c.lineItemsSubtitle}
                meta={<Chip>{c.itemsCount(invoice.items.length)}</Chip>}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <th scope="col" className="px-3 py-2.5">
                        {c.colItem}
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        {c.colQty}
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        {c.colUnit}
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        {c.colLine}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((it) => (
                      <tr key={it.id} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-3 font-medium">{it.description}</td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">
                          {it.quantity}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">
                          {money(it.unit_price, invoice.currency)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                          {money(it.quantity * it.unit_price, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <dl className="mt-4 space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4 font-mono text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{c.subtotal}</dt>
                    <dd className="tabular-nums">{money(subtotal, invoice.currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{c.vat(invoice.vat_rate)}</dt>
                    <dd className="tabular-nums">{money(total - subtotal, invoice.currency)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold text-foreground">
                    <dt>{c.total}</dt>
                    <dd className="tabular-nums">{money(total, invoice.currency)}</dd>
                  </div>
                </dl>
              </Panel>

              {invoice.terms || invoice.notes ? (
                <p className="rounded-xl border border-dashed border-border bg-muted/15 p-4 text-xs text-muted-foreground">
                  {[invoice.terms, invoice.notes].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </>
          );
        })()
      )}
    </div>
  );
}
