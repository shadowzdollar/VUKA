import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpenCheck, FileDown, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/vuka/data-table";
import { Loading, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel } from "@/components/vuka/shell";
import { describeError, download } from "@/lib/api/client";
import { ledger } from "@/lib/api/endpoints";
import type { Account, StatementEntry } from "@/lib/api/types";
import { money, shortId, when } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";

export const Route = createFileRoute("/wallets/$id")({
  head: () => ({
    meta: [{ title: "Wallet statement — VUKA" }],
  }),
  component: WalletDetail,
});

const COPY = {
  en: {
    allWallets: "All wallets",
    bannerPill: "Double-Entry Account Statement · ISO 20022 camt.053",
    walletFallback: "Wallet",
    businessWallet: "Business wallet",
    personalWallet: "Personal wallet",
    acctPrefix: "acct",
    opened: "opened",
    downloadXml: "Download statement (ISO 20022)",
    currentBalance: "Current balance",
    currentBalanceSub: "Settled ledger balance",
    opening: (d: string) => `Opening · ${d}`,
    openingSub: "Start of statement window",
    closing: (d: string) => `Closing · ${d}`,
    closingSub: "End of statement window",
    netDelta: "Net period delta",
    netDeltaSub: (n: number) => `${n} ledger postings`,
    panelTitle: "Statement",
    panelSubtitle: "Cryptographically balanced journal entries for the selected date window",
    from: "From",
    fromAria: "Statement period start",
    to: "To",
    toAria: "Statement period end",
    entriesChip: (n: number) => `${n} entries`,
    dateRangeError: "The start date must be before the end date.",
    loadingStatement: "Loading statement",
    emptyPeriod: "No activity in this period.",
    tableCaption: (from: string, to: string) => `Ledger entries, ${from} to ${to}`,
    colDate: "Date",
    colAmount: "Amount",
    colStatus: "Status",
    colInvoice: "Invoice",
    colReference: "Reference",
    colTransfer: "Transfer",
  },
  fr: {
    allWallets: "Tous les portefeuilles",
    bannerPill: "Relevé de compte à double entrée · ISO 20022 camt.053",
    walletFallback: "Portefeuille",
    businessWallet: "Portefeuille professionnel",
    personalWallet: "Portefeuille personnel",
    acctPrefix: "cpte",
    opened: "ouvert le",
    downloadXml: "Télécharger le relevé (ISO 20022)",
    currentBalance: "Solde actuel",
    currentBalanceSub: "Solde réglé au registre",
    opening: (d: string) => `Ouverture · ${d}`,
    openingSub: "Début de la période du relevé",
    closing: (d: string) => `Clôture · ${d}`,
    closingSub: "Fin de la période du relevé",
    netDelta: "Variation nette de la période",
    netDeltaSub: (n: number) => `${n} écritures comptables`,
    panelTitle: "Relevé",
    panelSubtitle: "Écritures de journal équilibrées cryptographiquement pour la période choisie",
    from: "Du",
    fromAria: "Début de la période du relevé",
    to: "Au",
    toAria: "Fin de la période du relevé",
    entriesChip: (n: number) => `${n} écritures`,
    dateRangeError: "La date de début doit être antérieure à la date de fin.",
    loadingStatement: "Chargement du relevé",
    emptyPeriod: "Aucune activité sur cette période.",
    tableCaption: (from: string, to: string) => `Écritures du registre, du ${from} au ${to}`,
    colDate: "Date",
    colAmount: "Montant",
    colStatus: "Statut",
    colInvoice: "Facture",
    colReference: "Référence",
    colTransfer: "Transfert",
  },
  sw: {
    allWallets: "Pochi zote",
    bannerPill: "Taarifa ya Akaunti ya Maingizo Mawili · ISO 20022 camt.053",
    walletFallback: "Pochi",
    businessWallet: "Pochi ya biashara",
    personalWallet: "Pochi binafsi",
    acctPrefix: "aknt",
    opened: "ilifunguliwa",
    downloadXml: "Pakua taarifa (ISO 20022)",
    currentBalance: "Salio la sasa",
    currentBalanceSub: "Salio lililokamilika kwenye leja",
    opening: (d: string) => `Salio la kuanzia · ${d}`,
    openingSub: "Mwanzo wa kipindi cha taarifa",
    closing: (d: string) => `Salio la kufungia · ${d}`,
    closingSub: "Mwisho wa kipindi cha taarifa",
    netDelta: "Mabadiliko halisi ya kipindi",
    netDeltaSub: (n: number) => `maingizo ${n} ya leja`,
    panelTitle: "Taarifa ya Akaunti",
    panelSubtitle: "Maingizo ya leja yaliyosawazishwa kwa usimbaji fiche kwa kipindi kilichochaguliwa",
    from: "Kuanzia",
    fromAria: "Mwanzo wa kipindi cha taarifa",
    to: "Hadi",
    toAria: "Mwisho wa kipindi cha taarifa",
    entriesChip: (n: number) => `maingizo ${n}`,
    dateRangeError: "Tarehe ya kuanza lazima iwe kabla ya tarehe ya mwisho.",
    loadingStatement: "Inapakia taarifa",
    emptyPeriod: "Hakuna shughuli katika kipindi hiki.",
    tableCaption: (from: string, to: string) => `Maingizo ya leja, ${from} hadi ${to}`,
    colDate: "Tarehe",
    colAmount: "Kiasi",
    colStatus: "Hali",
    colInvoice: "Ankara",
    colReference: "Kumbukumbu",
    colTransfer: "Uhamisho",
  },
  pt: {
    allWallets: "Todas as carteiras",
    bannerPill: "Extrato de Conta de Partidas Dobradas · ISO 20022 camt.053",
    walletFallback: "Carteira",
    businessWallet: "Carteira empresarial",
    personalWallet: "Carteira pessoal",
    acctPrefix: "conta",
    opened: "aberta em",
    downloadXml: "Transferir extrato (ISO 20022)",
    currentBalance: "Saldo atual",
    currentBalanceSub: "Saldo liquidado no razão",
    opening: (d: string) => `Abertura · ${d}`,
    openingSub: "Início do período do extrato",
    closing: (d: string) => `Fecho · ${d}`,
    closingSub: "Fim do período do extrato",
    netDelta: "Variação líquida do período",
    netDeltaSub: (n: number) => `${n} lançamentos no razão`,
    panelTitle: "Extrato",
    panelSubtitle: "Lançamentos de diário criptograficamente equilibrados para o intervalo selecionado",
    from: "De",
    fromAria: "Início do período do extrato",
    to: "Até",
    toAria: "Fim do período do extrato",
    entriesChip: (n: number) => `${n} lançamentos`,
    dateRangeError: "A data de início deve ser anterior à data de fim.",
    loadingStatement: "A carregar extrato",
    emptyPeriod: "Sem atividade neste período.",
    tableCaption: (from: string, to: string) => `Lançamentos do razão, de ${from} a ${to}`,
    colDate: "Data",
    colAmount: "Montante",
    colStatus: "Estado",
    colInvoice: "Fatura",
    colReference: "Referência",
    colTransfer: "Transferência",
  },
  rw: {
    allWallets: "Amashakoshi yose",
    bannerPill: "Incamake ya Konti y'Igitabo cy'Impfuruka Ebyiri · ISO 20022 camt.053",
    walletFallback: "Ishakoshi",
    businessWallet: "Ishakoshi y'ubucuruzi",
    personalWallet: "Ishakoshi bwite",
    acctPrefix: "konti",
    opened: "yafunguwe",
    downloadXml: "Manura raporo ya konti (ISO 20022)",
    currentBalance: "Amafaranga ariho ubu",
    currentBalanceSub: "Amafaranga yatunganyijwe mu gitabo",
    opening: (d: string) => `Intangiriro · ${d}`,
    openingSub: "Intangiriro y'igihe cya raporo",
    closing: (d: string) => `Isoza · ${d}`,
    closingSub: "Iherezo ry'igihe cya raporo",
    netDelta: "Impinduka yose muri iki gihe",
    netDeltaSub: (n: number) => `inyandiko ${n} z'igitabo`,
    panelTitle: "Raporo ya konti",
    panelSubtitle: "Inyandiko z'igitabo ziringanijwe mu buryo bwizewe ku gihe wahisemo",
    from: "Guhera",
    fromAria: "Itariki yo gutangiriraho raporo",
    to: "Kugeza",
    toAria: "Itariki yo gusorezaho raporo",
    entriesChip: (n: number) => `inyandiko ${n}`,
    dateRangeError: "Itariki yo gutangira igomba kubanziriza itariki yo gusoza.",
    loadingStatement: "Birimo gupakira raporo ya konti",
    emptyPeriod: "Nta gikorwa cyabaye muri iki gihe.",
    tableCaption: (from: string, to: string) => `Inyandiko z'igitabo, kuva ${from} kugeza ${to}`,
    colDate: "Itariki",
    colAmount: "Umubare",
    colStatus: "Imiterere",
    colInvoice: "Inyemezabuguzi",
    colReference: "Indango",
    colTransfer: " Kohereza",
  },
} as const;

/** ISO date (YYYY-MM-DD), for the plain HTML date inputs below. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function statusTone(s: string) {
  if (s === "SUCCESS") return "invert" as const;
  if (s === "FAILED" || s === "REVERSED") return "warn" as const;
  return "live" as const;
}

function localAccountLabel(a: Account, c: (typeof COPY)[keyof typeof COPY]) {
  return a.type === "BUSINESS" ? c.businessWallet : c.personalWallet;
}

function WalletDetail() {
  const c = useLangCopy(COPY);
  const { id } = Route.useParams();
  const [fromDate, setFromDate] = useState(() => isoDate(new Date(Date.now() - 30 * 86_400_000)));
  const [toDate, setToDate] = useState(() => isoDate(new Date(Date.now() + 86_400_000)));

  const account = useQuery({ queryKey: ["account", id], queryFn: () => ledger.account(id) });
  const balance = useQuery({ queryKey: ["balance", id], queryFn: () => ledger.balance(id) });
  const from = `${fromDate}T00:00:00Z`;
  const to = `${toDate}T00:00:00Z`;
  const statement = useQuery({
    queryKey: ["statement", id, from, to],
    queryFn: () => ledger.statement(id, { from, to }),
    enabled: fromDate < toDate,
  });

  const entries = useMemo(
    () =>
      [...(statement.data?.entries ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [statement.data],
  );

  async function downloadXml() {
    try {
      await download(
        `/api/accounts/${id}/statement`,
        `vuka-statement-${shortId(id)}-${fromDate}-${toDate}.xml`,
        {
          from,
          to,
        },
      );
    } catch (err) {
      toast.error(describeError(err));
    }
  }

  const netChange =
    (statement.data?.closing_balance ?? 0) - (statement.data?.opening_balance ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/wallets"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {c.allWallets}
        </Link>
      </div>

      {/* Executive Account Statement Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[320px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <BookOpenCheck className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                {c.bannerPill}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {account.data ? (
                localAccountLabel(account.data, c)
              ) : (
                <span className="text-white/60">{c.walletFallback}</span>
              )}
            </h1>
            <p className="mt-1.5 font-mono text-xs text-white/65">
              {c.acctPrefix} {id}
              {account.data ? ` · ${c.opened} ${when(account.data.created_at)}` : ""}
            </p>
          </div>
          <Button
            onClick={() => void downloadXml()}
            className="gap-2 rounded-lg bg-[#c2f74d] font-mono text-xs font-bold uppercase text-[#151515] hover:bg-[#c2f74d]/90"
          >
            <FileDown className="size-3.5" aria-hidden="true" />
            {c.downloadXml}
          </Button>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label={c.currentBalance}
          value={balance.isPending ? "…" : money(balance.data?.amount ?? 0, account.data?.currency)}
          sub={c.currentBalanceSub}
          accent="lime"
        />
        <Metric
          label={c.opening(fromDate)}
          value={
            statement.isPending
              ? "…"
              : money(statement.data?.opening_balance ?? 0, account.data?.currency)
          }
          sub={c.openingSub}
        />
        <Metric
          label={c.closing(toDate)}
          value={
            statement.isPending
              ? "…"
              : money(statement.data?.closing_balance ?? 0, account.data?.currency)
          }
          sub={c.closingSub}
        />
        <Metric
          label={c.netDelta}
          value={
            statement.isPending
              ? "…"
              : `${netChange >= 0 ? "+" : "−"}${money(Math.abs(netChange), account.data?.currency)}`
          }
          sub={c.netDeltaSub(entries.length)}
        />
      </div>

      <Panel
        title={c.panelTitle}
        subtitle={c.panelSubtitle}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {c.from}
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 font-mono text-[11px] text-foreground"
                aria-label={c.fromAria}
              />
            </label>
            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {c.to}
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 font-mono text-[11px] text-foreground"
                aria-label={c.toAria}
              />
            </label>
            <Chip tone="lime">{c.entriesChip(entries.length)}</Chip>
          </div>
        }
      >
        {fromDate >= toDate ? (
          <p role="alert" className="rounded-xl border-2 border-foreground p-3 text-xs">
            {c.dateRangeError}
          </p>
        ) : statement.isPending ? (
          <Loading label={c.loadingStatement} />
        ) : (
          <QueryBoundary
            query={statement}
            empty={c.emptyPeriod}
            isEmpty={(s) => s.entries.length === 0}
          >
            {() => (
              <DataTable
                caption={c.tableCaption(fromDate, toDate)}
                exportName={`vuka-statement-${shortId(id)}.csv`}
                rows={entries}
                rowKey={(e: StatementEntry) => e.id}
                initialSort={{ key: "time", dir: "desc" }}
                empty={c.emptyPeriod}
                columns={[
                  {
                    key: "time",
                    header: c.colDate,
                    sort: (e) => e.created_at,
                    text: (e) => e.created_at,
                    cell: (e) => (
                      <span className="tabular font-mono text-xs text-muted-foreground">
                        {when(e.created_at)}
                      </span>
                    ),
                  },
                  {
                    key: "amount",
                    header: c.colAmount,
                    align: "right",
                    sort: (e) => e.amount,
                    text: (e) => `${e.amount}`,
                    cell: (e) => (
                      <span
                        className={
                          "tabular font-mono text-xs font-semibold " +
                          (e.amount < 0 ? "text-muted-foreground" : "text-[#4d7300]")
                        }
                      >
                        {e.amount < 0 ? "−" : "+"}
                        {money(Math.abs(e.amount), account.data?.currency)}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: c.colStatus,
                    text: (e) => e.transfer_status,
                    cell: (e) => (
                      <Chip tone={statusTone(e.transfer_status)}>{e.transfer_status}</Chip>
                    ),
                  },
                  {
                    key: "invoice",
                    header: c.colInvoice,
                    text: (e) => e.invoice_number ?? "",
                    cell: (e) => (
                      <span className="font-mono text-xs">{e.invoice_number ?? "—"}</span>
                    ),
                  },
                  {
                    key: "ref",
                    header: c.colReference,
                    text: (e) => e.reference ?? "",
                    cell: (e) => (
                      <span className="font-mono text-xs text-muted-foreground">
                        {e.reference ?? "—"}
                      </span>
                    ),
                  },
                  {
                    key: "transfer",
                    header: c.colTransfer,
                    text: (e) => e.transaction_id,
                    cell: (e) => (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                        <ShieldCheck className="size-3 text-[#79b200]" aria-hidden="true" />
                        {shortId(e.transaction_id)}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </QueryBoundary>
        )}
      </Panel>
    </div>
  );
}
