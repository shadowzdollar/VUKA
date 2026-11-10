import { useQuery } from "@tanstack/react-query";
import { Blocks, Landmark, Lock, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import escrowGlobe from "@/assets/escrow-globe.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChainScopeBar } from "@/components/vuka/chain-scope-bar";
import { DataTable } from "@/components/vuka/data-table";
import { LazyStateChart } from "@/components/vuka/lazy-charts";
import { EmptyState, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel } from "@/components/vuka/shell";
import { operator } from "@/lib/api/endpoints";
import type { EscrowState, EscrowSummary } from "@/lib/api/types";
import { scopeReady, useChainScope } from "@/lib/chain-scope";
import { money, tokenUnits, truncMid, when } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";

const STATES: EscrowState[] = ["CREATED", "LOCKED", "RELEASED", "REFUNDED", "DISPUTED", "SPLIT"];

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    bannerBadge: string;
    bannerTitle: string;
    bannerDesc: string;
    custodyInvariant: string;
    readOnlyTruth: string;
    enterContract: string;
    lockedCreated: string;
    lockedCreatedSub: string;
    released: string;
    releasedSub: string;
    refunded: string;
    refundedSub: string;
    disputed: string;
    disputedSub: string;
    split: string;
    splitSub: string;
    chartTitle: string;
    chartSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    allFilter: string;
    emptyEscrows: string;
    emptyFilter: string;
    colEscrow: string;
    colInvoice: string;
    colBuyer: string;
    colSupplier: string;
    colAmount: string;
    colTimeout: string;
    colState: string;
    dialogTitle: (id: number) => string;
    dialogDesc: (ref: string, block: number) => string;
    contract: string;
    chainEvents: string;
    noEvents: string;
    blockLabel: (num: number) => string;
  }
> = {
  en: {
    eyebrow: "On-chain settlement",
    title: "Escrow Register",
    description:
      "Read model of the invoice-linked escrow contract, reconciled from chain events after confirmations. States are chain truth: this desk observes escrows, it cannot move them.",
    bannerBadge: "Polygon Smart-Contract Read Model · Non-Custodial Observer",
    bannerTitle: "Confirmed Block-Finality Escrow Ledger",
    bannerDesc:
      "Every state transition (`CREATED`, `LOCKED`, `RELEASED`, `REFUNDED`, `DISPUTED`, `SPLIT`) is indexed strictly from confirmed smart-contract events on chain.",
    custodyInvariant: "Custody Invariant",
    readOnlyTruth: "Read-Only Chain Truth",
    enterContract: "Enter the escrow contract address to load escrows.",
    lockedCreated: "Locked / created",
    lockedCreatedSub: "Token units held in escrow",
    released: "Released",
    releasedSub: "Paid to suppliers",
    refunded: "Refunded",
    refundedSub: "Returned to buyers",
    disputed: "Disputed",
    disputedSub: "Frozen pending arbitration",
    split: "Split",
    splitSub: "Settled by arbiter ruling",
    chartTitle: "Escrow value by state",
    chartSubtitle: "Aggregated token volume across smart-contract lifecycle states",
    registerTitle: "Escrow register",
    registerSubtitle: "Click any escrow row to inspect its on-chain event log and block confirmations",
    allFilter: "ALL",
    emptyEscrows: "No escrows have been reconciled for this contract yet.",
    emptyFilter: "No escrows match this filter.",
    colEscrow: "Escrow",
    colInvoice: "Invoice ref",
    colBuyer: "Buyer",
    colSupplier: "Supplier",
    colAmount: "Amount",
    colTimeout: "Timeout",
    colState: "State",
    dialogTitle: (id) => `Escrow #${id}`,
    dialogDesc: (ref, block) => `Invoice ref ${ref} · last updated at block ${block}`,
    contract: "Contract",
    chainEvents: "Chain events",
    noEvents: "No events recorded.",
    blockLabel: (num) => `block ${num}`,
  },
  fr: {
    eyebrow: "Règlement sur chaîne",
    title: "Registre des séquestres",
    description:
      "Modèle de lecture du contrat de séquestre lié aux factures, rapproché à partir des événements de chaîne après confirmations. Les états sont la vérité de la chaîne : ce poste observe les séquestres, il ne peut pas les déplacer.",
    bannerBadge: "Modèle de lecture Smart-Contract Polygon · Observateur non dépositaire",
    bannerTitle: "Registre des séquestres à finalité de bloc confirmée",
    bannerDesc:
      "Chaque transition d'état (`CREATED`, `LOCKED`, `RELEASED`, `REFUNDED`, `DISPUTED`, `SPLIT`) est indexée strictement à partir d'événements de contrat intelligent confirmés sur la chaîne.",
    custodyInvariant: "Invariant de garde",
    readOnlyTruth: "Vérité sur chaîne en lecture seule",
    enterContract: "Saisissez l'adresse du contrat de séquestre pour charger les séquestres.",
    lockedCreated: "Verrouillé / créé",
    lockedCreatedSub: "Unités de jetons détenues en séquestre",
    released: "Libéré",
    releasedSub: "Payé aux fournisseurs",
    refunded: "Remboursé",
    refundedSub: "Retourné aux acheteurs",
    disputed: "En litige",
    disputedSub: "Gelé en attente d'arbitrage",
    split: "Partagé",
    splitSub: "Réglé par décision d'arbitre",
    chartTitle: "Valeur des séquestres par état",
    chartSubtitle: "Volume agrégé de jetons selon le cycle de vie du contrat intelligent",
    registerTitle: "Registre des séquestres",
    registerSubtitle:
      "Cliquez sur une ligne de séquestre pour inspecter son journal d'événements sur chaîne et ses confirmations de bloc",
    allFilter: "TOUS",
    emptyEscrows: "Aucun séquestre n'a encore été rapproché pour ce contrat.",
    emptyFilter: "Aucun séquestre ne correspond à ce filtre.",
    colEscrow: "Séquestre",
    colInvoice: "Réf. facture",
    colBuyer: "Acheteur",
    colSupplier: "Fournisseur",
    colAmount: "Montant",
    colTimeout: "Expiration",
    colState: "État",
    dialogTitle: (id) => `Séquestre #${id}`,
    dialogDesc: (ref, block) => `Réf. facture ${ref} · dernière mise à jour au bloc ${block}`,
    contract: "Contrat",
    chainEvents: "Événements sur chaîne",
    noEvents: "Aucun événement enregistré.",
    blockLabel: (num) => `bloc ${num}`,
  },
  sw: {
    eyebrow: "Malipo kwenye mnyororo",
    title: "Rejista ya Escrow",
    description:
      "Mfumo wa kusoma wa mkataba wa escrow uliounganishwa na ankara, uliopatanishwa kutoka kwa matukio ya mnyororo baada ya uthibitisho. Hali ni ukweli wa mnyororo: dawati hili linatazama escrow, haliwezi kuzihamisha.",
    bannerBadge: "Mfumo wa Kusoma wa Mkataba-Janja wa Polygon · Mtazamaji Asiye na Ulinzi wa Fedha",
    bannerTitle: "Leja ya Escrow yenye Ukomo wa Bloku Uliothibitishwa",
    bannerDesc:
      "Kila mabadiliko ya hali (`CREATED`, `LOCKED`, `RELEASED`, `REFUNDED`, `DISPUTED`, `SPLIT`) yanaorodheshwa moja kwa moja kutoka kwa matukio yaliyothibitishwa ya mkataba-janja kwenye mnyororo.",
    custodyInvariant: "Kanuni ya Ulinzi",
    readOnlyTruth: "Ukweli wa Mnyororo wa Kusoma Pekee",
    enterContract: "Weka anwani ya mkataba wa escrow ili kupakia escrow.",
    lockedCreated: "Imefungwa / imeundwa",
    lockedCreatedSub: "Vitengo vya tokeni vinavyoshikiliwa kwenye escrow",
    released: "Imetolewa",
    releasedSub: "Imelipwa kwa wasambazaji",
    refunded: "Imerudishwa",
    refundedSub: "Imerudishwa kwa wanunuzi",
    disputed: "Inabishaniwa",
    disputedSub: "Imegandishwa ikisubiri usuluhishi",
    split: "Imegawanywa",
    splitSub: "Imelipwa kwa uamuzi wa msuluhishi",
    chartTitle: "Thamani ya escrow kwa hali",
    chartSubtitle: "Kiasi cha jumla cha tokeni katika hatua za mzunguko wa mkataba-janja",
    registerTitle: "Rejista ya escrow",
    registerSubtitle:
      "Bofya safu yoyote ya escrow kukagua kumbukumbu yake ya matukio kwenye mnyororo na uthibitisho wa bloku",
    allFilter: "ZOTE",
    emptyEscrows: "Hakuna escrow zilizopatanishwa kwa mkataba huu bado.",
    emptyFilter: "Hakuna escrow zinazolingana na kichujio hiki.",
    colEscrow: "Escrow",
    colInvoice: "Kumb. ya ankara",
    colBuyer: "Mnunuzi",
    colSupplier: "Msambazaji",
    colAmount: "Kiasi",
    colTimeout: "Muda kuisha",
    colState: "Hali",
    dialogTitle: (id) => `Escrow #${id}`,
    dialogDesc: (ref, block) => `Kumb. ya ankara ${ref} · ilisasishwa mwisho kwenye bloku ${block}`,
    contract: "Mkataba",
    chainEvents: "Matukio ya mnyororo",
    noEvents: "Hakuna matukio yaliyorekodiwa.",
    blockLabel: (num) => `bloku ${num}`,
  },
  pt: {
    eyebrow: "Liquidação on-chain",
    title: "Registo de Caução",
    description:
      "Modelo de leitura do contrato de caução associado à fatura, reconciliado a partir de eventos da rede após confirmações. Os estados são a verdade da rede: este posto observa cauções, não pode movê-las.",
    bannerBadge: "Modelo de Leitura de Smart-Contract Polygon · Observador Não Custodial",
    bannerTitle: "Razão de Caução com Finalidade de Bloco Confirmada",
    bannerDesc:
      "Cada transição de estado (`CREATED`, `LOCKED`, `RELEASED`, `REFUNDED`, `DISPUTED`, `SPLIT`) é indexada estritamente a partir de eventos confirmados de contratos inteligentes na rede.",
    custodyInvariant: "Invariante de Custódia",
    readOnlyTruth: "Verdade On-Chain Apenas de Leitura",
    enterContract: "Introduza o endereço do contrato de caução para carregar as cauções.",
    lockedCreated: "Bloqueado / criado",
    lockedCreatedSub: "Unidades de token retidas em caução",
    released: "Libertado",
    releasedSub: "Pago aos fornecedores",
    refunded: "Reembolsado",
    refundedSub: "Devolvido aos compradores",
    disputed: "Em litígio",
    disputedSub: "Congelado a aguardar arbitragem",
    split: "Partilhado",
    splitSub: "Liquidado por decisão de árbitro",
    chartTitle: "Valor em caução por estado",
    chartSubtitle: "Volume agregado de tokens nos estados do ciclo de vida do contrato inteligente",
    registerTitle: "Registo de caução",
    registerSubtitle:
      "Clique em qualquer linha de caução para inspecionar o registo de eventos on-chain e confirmações de blocos",
    allFilter: "TODOS",
    emptyEscrows: "Ainda não foram reconciliadas cauções para este contrato.",
    emptyFilter: "Nenhuma caução corresponde a este filtro.",
    colEscrow: "Caução",
    colInvoice: "Ref. fatura",
    colBuyer: "Comprador",
    colSupplier: "Fornecedor",
    colAmount: "Montante",
    colTimeout: "Expiração",
    colState: "Estado",
    dialogTitle: (id) => `Caução #${id}`,
    dialogDesc: (ref, block) => `Ref. fatura ${ref} · última atualização no bloco ${block}`,
    contract: "Contrato",
    chainEvents: "Eventos da rede",
    noEvents: "Nenhum evento registado.",
    blockLabel: (num) => `bloco ${num}`,
  },
  rw: {
    eyebrow: "Ubwishyu kuri chain",
    title: "Igitabo cya Escrow",
    description:
      " uburyo bwo gusoma amasezerano ya escrow ahujwe n'inyemezabuguzi, bugenzurwa bivuye ku byabaye kuri chain nyuma yo kwemezwa. Imiterere ni ukuri kwa chain: iyi biro ireba escrow gusa, ntishobora kuzimura.",
    bannerBadge: "Uburyo bwo Gusoma Smart-Contract ya Polygon · Indorerezi Idafite Ububasha ku Mutungo",
    bannerTitle: "Igitabo cya Escrow gifite Iherezo rya Bloku Ryemejwe",
    bannerDesc:
      "Buri mpinduka y'imiterere (`CREATED`, `LOCKED`, `RELEASED`, `REFUNDED`, `DISPUTED`, `SPLIT`) yandikwa gusa bivuye ku bikorwa bya smart-contract byemejwe kuri chain.",
    custodyInvariant: "Ihame ry'Ububiko",
    readOnlyTruth: "Ukuri kwa Chain Gusomwa Gusa",
    enterContract: "Shyiramo aderesi y'amasezerano ya escrow kugira ngo ufungure escrow.",
    lockedCreated: "Yafunzwe / yaremwe",
    lockedCreatedSub: "Tokeni zibitswe muri escrow",
    released: "Yarekuwe",
    releasedSub: "Yishyuwe abagurisha",
    refunded: "Yasubijwe",
    refundedSub: "Yasubijwe abaguzi",
    disputed: "Iri mu mpaka",
    disputedSub: "Yafatiriwe itegereje ubukemurampaka",
    split: "Yagabanyijwe",
    splitSub: "Yakemuwe n'umwanzuro w'umukemurampaka",
    chartTitle: "Agaciro ka escrow ukurikije imiterere",
    chartSubtitle: "Ingano ya tokeni mu byiciro by'ubuzima bwa smart-contract",
    registerTitle: "Igitabo cya escrow",
    registerSubtitle:
      "Kanda ku murongo uwo ari wo wose wa escrow kugira ngo usuzume ibyabaye kuri chain n'iyemezwa rya bloku",
    allFilter: "ZOSE",
    emptyEscrows: "Nta escrow iragenzurwa kuri aya masezerano.",
    emptyFilter: "Nta escrow ihuye n'iyi muyunguruzi.",
    colEscrow: "Escrow",
    colInvoice: " nimero y'inyemezabuguzi",
    colBuyer: "Umuguzi",
    colSupplier: "Umugurisha",
    colAmount: "Amafaranga",
    colTimeout: "Igihe ntarengwa",
    colState: "Imiterere",
    dialogTitle: (id) => `Escrow #${id}`,
    dialogDesc: (ref, block) =>
      `Inyemezabuguzi ${ref} · yahinduwe bwa nyuma kuri bloku ${block}`,
    contract: "Amasezerano",
    chainEvents: "Ibyabaye kuri chain",
    noEvents: "Nta byabaye byanditswe.",
    blockLabel: (num) => `bloku ${num}`,
  },
};

const tone = (s: EscrowState) =>
  s === "RELEASED"
    ? ("invert" as const)
    : s === "DISPUTED"
      ? ("warn" as const)
      : s === "REFUNDED"
        ? ("dead" as const)
        : ("live" as const);

/** Operator view of the reconciled on-chain escrow read model (GET /api/escrows). */
export function OperatorEscrows() {
  const c = useLangCopy(COPY);
  const [scope, setScope] = useChainScope();
  const ready = scopeReady(scope);
  const [filter, setFilter] = useState<"ALL" | EscrowState>("ALL");
  const [active, setActive] = useState<EscrowSummary | null>(null);

  const escrows = useQuery({
    queryKey: ["escrows", scope],
    queryFn: () => operator.escrows(scope),
    enabled: ready,
    refetchInterval: 20_000,
  });

  const totals = useMemo(() => {
    const t: Record<EscrowState, number> = {
      CREATED: 0,
      LOCKED: 0,
      RELEASED: 0,
      REFUNDED: 0,
      DISPUTED: 0,
      SPLIT: 0,
    };
    for (const e of escrows.data ?? []) t[e.state] += tokenUnits(e.amount);
    return t;
  }, [escrows.data]);

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      {/* Executive On-Chain Escrow Register Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[300px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <Landmark className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                {c.bannerBadge}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {c.bannerTitle}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              {c.bannerDesc}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
            <ShieldCheck className="size-4 text-[#c2f74d]" aria-hidden="true" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                {c.custodyInvariant}
              </div>
              <div className="font-bold text-white">{c.readOnlyTruth}</div>
            </div>
          </div>
        </div>
      </div>

      <ChainScopeBar scope={scope} onChange={setScope} />

      {!ready ? (
        <EmptyState>{c.enterContract}</EmptyState>
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
            <Metric
              label={c.lockedCreated}
              value={money(totals.LOCKED + totals.CREATED)}
              sub={c.lockedCreatedSub}
              accent="lime"
            />
            <Metric label={c.released} value={money(totals.RELEASED)} sub={c.releasedSub} />
            <Metric label={c.refunded} value={money(totals.REFUNDED)} sub={c.refundedSub} />
            <Metric
              label={c.disputed}
              value={money(totals.DISPUTED)}
              sub={c.disputedSub}
              accent={totals.DISPUTED > 0 ? "warn" : "default"}
            />
            <Metric label={c.split} value={money(totals.SPLIT)} sub={c.splitSub} />
          </div>

          <Panel title={c.chartTitle} subtitle={c.chartSubtitle}>
            <LazyStateChart data={STATES.map((st) => ({ state: st, amount: totals[st] }))} />
          </Panel>

          <Panel
            title={c.registerTitle}
            subtitle={c.registerSubtitle}
            meta={
              <div className="flex flex-wrap gap-1.5">
                {(["ALL", ...STATES] as const).map((s) => (
                  <button key={s} onClick={() => setFilter(s)} className="cursor-pointer">
                    <Chip tone={filter === s ? "invert" : "neutral"}>
                      {s === "ALL" ? c.allFilter : s}
                    </Chip>
                  </button>
                ))}
              </div>
            }
          >
            <QueryBoundary
              query={escrows}
              disabledCodes={["reconciliation_disabled"]}
              isEmpty={(d) => d.length === 0}
              empty={c.emptyEscrows}
            >
              {(rows) => (
                <DataTable
                  caption={c.registerTitle}
                  exportName="vuka-escrows.csv"
                  rows={rows.filter((e) => filter === "ALL" || e.state === filter)}
                  rowKey={(e) => String(e.escrow_id)}
                  onRowClick={setActive}
                  initialSort={{ key: "id", dir: "desc" }}
                  empty={c.emptyFilter}
                  columns={[
                    {
                      key: "id",
                      header: c.colEscrow,
                      sort: (e) => e.escrow_id,
                      text: (e) => `#${e.escrow_id}`,
                      cell: (e) => (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                          <Lock className="size-3 text-[#79b200]" aria-hidden="true" />#
                          {e.escrow_id}
                        </span>
                      ),
                    },
                    {
                      key: "invoice",
                      header: c.colInvoice,
                      sort: (e) => e.invoice_ref,
                      cell: (e) => (
                        <span className="font-mono text-xs">{truncMid(e.invoice_ref)}</span>
                      ),
                    },
                    {
                      key: "buyer",
                      header: c.colBuyer,
                      text: (e) => e.buyer,
                      cell: (e) => (
                        <span className="font-mono text-xs text-muted-foreground">
                          {truncMid(e.buyer)}
                        </span>
                      ),
                    },
                    {
                      key: "supplier",
                      header: c.colSupplier,
                      text: (e) => e.supplier,
                      cell: (e) => (
                        <span className="font-mono text-xs text-muted-foreground">
                          {truncMid(e.supplier)}
                        </span>
                      ),
                    },
                    {
                      key: "amount",
                      header: c.colAmount,
                      align: "right",
                      sort: (e) => tokenUnits(e.amount),
                      text: (e) => String(tokenUnits(e.amount)),
                      cell: (e) => (
                        <span className="tabular font-mono font-semibold">
                          {money(tokenUnits(e.amount))}
                        </span>
                      ),
                    },
                    {
                      key: "timeout",
                      header: c.colTimeout,
                      align: "right",
                      sort: (e) => e.timeout_at,
                      text: (e) => new Date(e.timeout_at * 1000).toISOString(),
                      cell: (e) => (
                        <span className="tabular font-mono text-xs">
                          {when(new Date(e.timeout_at * 1000).toISOString())}
                        </span>
                      ),
                    },
                    {
                      key: "state",
                      header: c.colState,
                      align: "right",
                      sort: (e) => e.state,
                      cell: (e) => <Chip tone={tone(e.state)}>{e.state}</Chip>,
                    },
                  ]}
                />
              )}
            </QueryBoundary>
          </Panel>
        </>
      )}

      <EscrowDialog escrow={active} scope={scope} onClose={() => setActive(null)} />
    </>
  );
}

function EscrowDialog({
  escrow,
  scope,
  onClose,
}: {
  escrow: EscrowSummary | null;
  scope: { contract: string; chain_id?: number };
  onClose: () => void;
}) {
  const c = useLangCopy(COPY);
  const events = useQuery({
    queryKey: ["escrow-events", scope, escrow?.escrow_id],
    queryFn: () => operator.escrowEvents(escrow!.escrow_id, scope),
    enabled: escrow !== null,
  });
  return (
    <Dialog open={escrow !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        {escrow ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                {c.dialogTitle(escrow.escrow_id)}
              </DialogTitle>
              <DialogDescription>
                {c.dialogDesc(escrow.invoice_ref, escrow.updated_block)}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-2.5 rounded-xl border border-[#151515] bg-[#151515] p-4 font-mono text-[11px] text-white">
              <div className="flex justify-between gap-3">
                <dt className="text-white/55">{c.colBuyer}</dt>
                <dd className="truncate">{escrow.buyer}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/55">{c.colSupplier}</dt>
                <dd className="truncate">{escrow.supplier}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/55">{c.colAmount}</dt>
                <dd className="font-bold text-[#c2f74d]">{money(tokenUnits(escrow.amount))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/55">{c.contract}</dt>
                <dd className="truncate">{escrow.contract_address}</dd>
              </div>
            </dl>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Blocks className="size-3.5 text-[#79b200]" aria-hidden="true" />
              {c.chainEvents}
            </div>
            <QueryBoundary query={events} isEmpty={(d) => d.length === 0} empty={c.noEvents}>
              {(rows) => (
                <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
                  {rows.map((e) => (
                    <li key={`${e.transaction_hash}-${e.log_index}`} className="px-3.5 py-2.5">
                      <div className="flex justify-between gap-3">
                        <span className="font-mono text-xs font-semibold">{e.event_type}</span>
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {c.blockLabel(e.block_number)}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {truncMid(e.transaction_hash, 12, 8)} · {when(e.observed_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </QueryBoundary>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
