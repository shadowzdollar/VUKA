import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platform } from "@/lib/api/endpoints";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { PublicPage, Section } from "../public-page";

const BASE = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

async function probe(
  path: string,
): Promise<{ ok: boolean; status: number; ms: number; body: unknown }> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, ms: Math.round(performance.now() - t0), body };
  } catch {
    return { ok: false, status: 0, ms: Math.round(performance.now() - t0), body: null };
  }
}

interface StatusCopy {
  kicker: string;
  checkingTitle: string;
  okPrefix: string;
  okEm: string;
  okSuffix: string;
  badPrefix: string;
  badEm: string;
  badSuffix: string;
  lead: string;
  checksTitle: string;
  engineLiveness: string;
  engineReadiness: string;
  database: string;
  providerCatalogue: string;
  noResponse: string;
  checkingDetail: string;
  srOk: string;
  srChecking: string;
  srFailing: string;
  recheckNow: string;
  deploymentTitle: string;
  envLabel: string;
  apiVersionLabel: string;
  marketsLabel: string;
  corridorsLabel: string;
  onChainEscrowLabel: string;
  enabledChain: (id: string | number) => string;
  disabled: string;
  ratesLabel: string;
  unreachable: string;
  loading: string;
  footnote: string;
}

const COPY: Record<Lang, StatusCopy> = {
  en: {
    kicker: "System status",
    checkingTitle: "Checking…",
    okPrefix: "All systems ",
    okEm: "operational",
    okSuffix: ".",
    badPrefix: "Something is ",
    badEm: "not right",
    badSuffix: ".",
    lead: "These checks run from your browser against the live engine and refresh every 30 seconds. They report only what this deployment can see about itself.",
    checksTitle: "Current checks",
    engineLiveness: "Engine (liveness)",
    engineReadiness: "Engine (readiness)",
    database: "Database",
    providerCatalogue: "Payout provider catalogue",
    noResponse: "no response",
    checkingDetail: "checking…",
    srOk: "OK. ",
    srChecking: "Checking. ",
    srFailing: "Failing. ",
    recheckNow: "Re-check now",
    deploymentTitle: "This deployment",
    envLabel: "Environment",
    apiVersionLabel: "API version",
    marketsLabel: "Markets",
    corridorsLabel: "Corridors",
    onChainEscrowLabel: "On-chain escrow",
    enabledChain: (id) => `enabled · chain ${id}`,
    disabled: "disabled",
    ratesLabel: "Rates",
    unreachable: "The engine could not be reached.",
    loading: "Loading…",
    footnote:
      "Historical uptime and incident reporting are not yet published; this page is a live probe, not a service-level commitment.",
  },
  fr: {
    kicker: "État du système",
    checkingTitle: "Vérification…",
    okPrefix: "Tous les systèmes sont ",
    okEm: "opérationnels",
    okSuffix: ".",
    badPrefix: "Un problème est ",
    badEm: "détecté",
    badSuffix: ".",
    lead: "Ces vérifications s'exécutent depuis votre navigateur vers le moteur actif et s'actualisent toutes les 30 secondes. Elles ne rapportent que ce que ce déploiement peut observer sur lui-même.",
    checksTitle: "Contrôles en cours",
    engineLiveness: "Moteur (disponibilité)",
    engineReadiness: "Moteur (prêt à servir)",
    database: "Base de données",
    providerCatalogue: "Catalogue des prestataires de paiement",
    noResponse: "aucune réponse",
    checkingDetail: "vérification…",
    srOk: "OK. ",
    srChecking: "Vérification. ",
    srFailing: "En échec. ",
    recheckNow: "Revérifier maintenant",
    deploymentTitle: "Ce déploiement",
    envLabel: "Environnement",
    apiVersionLabel: "Version de l'API",
    marketsLabel: "Marchés",
    corridorsLabel: "Corridors",
    onChainEscrowLabel: "Séquestre sur chaîne",
    enabledChain: (id) => `activé · chaîne ${id}`,
    disabled: "désactivé",
    ratesLabel: "Taux",
    unreachable: "Le moteur n'a pas pu être joint.",
    loading: "Chargement…",
    footnote:
      "L'historique de disponibilité et les rapports d'incidents ne sont pas encore publiés ; cette page est une sonde en direct et non un engagement de niveau de service (SLA).",
  },
  sw: {
    kicker: "Hali ya mfumo",
    checkingTitle: "Inakagua…",
    okPrefix: "Mifumo yote ",
    okEm: "inafanya kazi",
    okSuffix: ".",
    badPrefix: "Kuna kitu ",
    badEm: "hakiko sawa",
    badSuffix: ".",
    lead: "Ukaguzi huu unafanyika kutoka kwenye kivinjari chako kwenda kwenye mfumo mkuu na kujisasisha kila sekunde 30. Unaripoti tu kile toleo hili linachoweza kuona kuhusu lenyewe.",
    checksTitle: "Ukaguzi wa sasa",
    engineLiveness: "Mfumo mkuu (uhai)",
    engineReadiness: "Mfumo mkuu (utayari)",
    database: "Hifadhidata",
    providerCatalogue: "Orodha ya watoa huduma za malipo",
    noResponse: "hakuna jibu",
    checkingDetail: "inakagua…",
    srOk: "Sawa. ",
    srChecking: "Inakagua. ",
    srFailing: "Imeshindwa. ",
    recheckNow: "Kagua tena sasa",
    deploymentTitle: "Toleo hili",
    envLabel: "Mazingira",
    apiVersionLabel: "Toleo la API",
    marketsLabel: "Masoko",
    corridorsLabel: "Njia za malipo",
    onChainEscrowLabel: "Escrow kwenye mnyororo (on-chain)",
    enabledChain: (id) => `imewashwa · mnyororo ${id}`,
    disabled: "imezimwa",
    ratesLabel: "Viwango",
    unreachable: "Mfumo mkuu haukuweza kufikiwa.",
    loading: "Inapakia…",
    footnote:
      "Historia ya muda wa kufanya kazi na ripoti za matukio bado hazijachapishwa; ukurasa huu ni kipimo cha moja kwa moja, si ahadi ya kiwango cha huduma.",
  },
  pt: {
    kicker: "Estado do sistema",
    checkingTitle: "A verificar…",
    okPrefix: "Todos os sistemas ",
    okEm: "operacionais",
    okSuffix: ".",
    badPrefix: "Algo ",
    badEm: "não está bem",
    badSuffix: ".",
    lead: "Estas verificações são executadas a partir do seu navegador contra o motor ativo e atualizam a cada 30 segundos. Reportam apenas o que esta implementação consegue observar sobre si própria.",
    checksTitle: "Verificações atuais",
    engineLiveness: "Motor (atividade)",
    engineReadiness: "Motor (prontidão)",
    database: "Base de dados",
    providerCatalogue: "Catálogo de fornecedores de pagamento",
    noResponse: "sem resposta",
    checkingDetail: "a verificar…",
    srOk: "OK. ",
    srChecking: "A verificar. ",
    srFailing: "Com falha. ",
    recheckNow: "Verificar novamente",
    deploymentTitle: "Esta implementação",
    envLabel: "Ambiente",
    apiVersionLabel: "Versão da API",
    marketsLabel: "Mercados",
    corridorsLabel: "Corredores",
    onChainEscrowLabel: "Caução on-chain",
    enabledChain: (id) => `ativado · rede ${id}`,
    disabled: "desativado",
    ratesLabel: "Taxas",
    unreachable: "Não foi possível contactar o motor.",
    loading: "A carregar…",
    footnote:
      "O histórico de disponibilidade e o registo de incidentes ainda não são publicados; esta página é uma sonda em tempo real, não um compromisso de nível de serviço.",
  },
  rw: {
    kicker: "Imikorere ya sisitemu",
    checkingTitle: "Birimo kugenzurwa…",
    okPrefix: "Sisitemu zose ",
    okEm: "zirakora neza",
    okSuffix: ".",
    badPrefix: "Hari ikintu ",
    badEm: "kitagenda neza",
    badSuffix: ".",
    lead: " iri genzura rikorwa biturutse muri mushakisha yawe rigasuzuma moteri ya sisitemu kandi rikivugurura buri masegonda 30. Rigaragaza gusa ibyo uru rubuga rushobora kwibonaho.",
    checksTitle: "Igenzura rigezweho",
    engineLiveness: "Moteri (kuba iriho)",
    engineReadiness: "Moteri (kwitegura gukora)",
    database: "Ububiko bw'amakuru (Database)",
    providerCatalogue: "Urutonde rw'abatanga serivisi z'ubwishyu",
    noResponse: "nta gisubizo",
    checkingDetail: "birimo kugenzurwa…",
    srOk: "Ni sawa. ",
    srChecking: "Birimo kugenzurwa. ",
    srFailing: "Byanze. ",
    recheckNow: "Ongera ugenzure ubu",
    deploymentTitle: "Iri koranabuhanga ririho",
    envLabel: "Imiterere y'urubuga",
    apiVersionLabel: "Verisiyo ya API",
    marketsLabel: "Amasoko",
    corridorsLabel: "Inzira z'ubwishyu",
    onChainEscrowLabel: "Escrow kuri blockchain",
    enabledChain: (id) => `irakora · chain ${id}`,
    disabled: "ntikora",
    ratesLabel: "Ibipimo by'ivunjisha",
    unreachable: "Moteri ya sisitemu ntiyashoboye kuboneka.",
    loading: "Birimo gutangira…",
    footnote:
      "Amateka y'igihe urubuga rwamaze rukora na raporo z'ibibazo ntibiratangazwa; uru rupapuro ni igenzura ry'ako kanya, ntabwo ari amasezerano y'urwego rwa serivisi.",
  },
};

export function StatusPage() {
  const copy = useLangCopy(COPY);
  const live = useQuery({
    queryKey: ["probe", "healthz"],
    queryFn: () => probe("/healthz"),
    refetchInterval: 30_000,
    retry: false,
  });
  const ready = useQuery({
    queryKey: ["probe", "readyz"],
    queryFn: () => probe("/readyz"),
    refetchInterval: 30_000,
    retry: false,
  });
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    refetchInterval: 60_000,
    retry: false,
  });
  const checks = (ready.data?.body as { checks?: Record<string, string> } | null)?.checks ?? {};
  const all = live.data?.ok && ready.data?.ok;
  const loading = live.isPending || ready.isPending;

  const rows: [string, boolean | undefined, string][] = [
    [
      copy.engineLiveness,
      live.data?.ok,
      live.data
        ? `HTTP ${live.data.status || copy.noResponse} · ${live.data.ms} ms`
        : copy.checkingDetail,
    ],
    [
      copy.engineReadiness,
      ready.data?.ok,
      ready.data
        ? `HTTP ${ready.data.status || copy.noResponse} · ${ready.data.ms} ms`
        : copy.checkingDetail,
    ],
    ...Object.entries(checks).map(([k, v]): [string, boolean, string] => [
      k === "database" ? copy.database : k === "providers" ? copy.providerCatalogue : k,
      v === "ok",
      v,
    ]),
  ];

  return (
    <PublicPage
      kicker={copy.kicker}
      title={
        loading ? (
          copy.checkingTitle
        ) : all ? (
          <>
            {copy.okPrefix}
            <em>{copy.okEm}</em>
            {copy.okSuffix}
          </>
        ) : (
          <>
            {copy.badPrefix}
            <em>{copy.badEm}</em>
            {copy.badSuffix}
          </>
        )
      }
      lead={copy.lead}
    >
      <Section id="checks" title={copy.checksTitle}>
        <div
          aria-live="polite"
          className="divide-y divide-border border border-border bg-card text-foreground"
        >
          {rows.map(([name, ok, detail]) => (
            <div key={name} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`size-3 border-2 border-foreground ${ok ? "bg-foreground" : ok === undefined ? "border-dashed" : "bg-[repeating-linear-gradient(135deg,var(--color-foreground)_0_2px,transparent_2px_5px)]"}`}
                />
                <span className="text-sm">{name}</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                <span className="sr-only">
                  {ok ? copy.srOk : ok === undefined ? copy.srChecking : copy.srFailing}
                </span>
                {detail}
              </span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none font-mono text-xs uppercase"
          onClick={() => {
            void live.refetch();
            void ready.refetch();
            void config.refetch();
          }}
        >
          <RefreshCw className="mr-2 size-3.5" aria-hidden="true" />
          {copy.recheckNow}
        </Button>
      </Section>
      <Section id="deployment" title={copy.deploymentTitle}>
        {config.data ? (
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {[
              [copy.envLabel, config.data.environment],
              [copy.apiVersionLabel, config.data.api_version],
              [copy.marketsLabel, String(config.data.countries.length)],
              [copy.corridorsLabel, String(config.data.corridor_count)],
              [
                copy.onChainEscrowLabel,
                config.data.chain.enabled
                  ? copy.enabledChain(config.data.chain.chain_id)
                  : copy.disabled,
              ],
              [copy.ratesLabel, config.data.rate_convention],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-border py-2 text-sm"
              >
                <dt>{k}</dt>
                <dd className="font-mono text-xs text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{config.isError ? copy.unreachable : copy.loading}</p>
        )}
        <p className="text-xs">{copy.footnote}</p>
      </Section>
    </PublicPage>
  );
}
