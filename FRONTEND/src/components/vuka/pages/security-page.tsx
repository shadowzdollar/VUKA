import { useLangCopy, type Lang } from "@/lib/i18n";
import { ContactLink, PublicPage, Section, SECURITY_EMAIL } from "../public-page";

interface SecurityCopy {
  kicker: string;
  titlePrefix: string;
  titleEm: string;
  titleSuffix: string;
  lead: string;
  toc: { id: string; label: string }[];
  controlsTitle: string;
  controls: [string, string[]][];
  limitsTitle: string;
  limits: [string, string][];
  reportTitle: string;
  reportP1Prefix: string;
  reportContactLabel: string;
  reportP1Suffix: string;
  reportP2: string;
}

const COPY: Record<Lang, SecurityCopy> = {
  en: {
    kicker: "Security",
    titlePrefix: "Designed so that ",
    titleEm: "no one person",
    titleSuffix: " can move your money.",
    lead: "This page lists the controls that exist in the code today, and — just as importantly — what has not yet been done.",
    toc: [
      { id: "controls", label: "Controls" },
      { id: "limits", label: "Honest limits" },
      { id: "report", label: "Report a vulnerability" },
    ],
    controlsTitle: "Controls in place",
    controls: [
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
    ],
    limitsTitle: "What is not done yet",
    limits: [
      [
        "No independent smart-contract audit yet.",
        " The contracts are covered by extensive tests, but a third-party audit is a prerequisite for holding real funds.",
      ],
      [
        "Payout rails are sandboxes.",
        " No real telecom or bank credentials are in use, and no funds are moved.",
      ],
      [
        "FX rates are reference values,",
        " not market data, until a licensed rate provider is connected.",
      ],
      [
        "No regulatory licence is claimed.",
        " Operating in each country needs authorisation we have not yet sought.",
      ],
      [
        "No penetration test yet.",
        " Automated dependency and accessibility checks run, but that is not a substitute.",
      ],
    ],
    reportTitle: "Report a vulnerability",
    reportP1Prefix: "If you believe you have found a security issue, please report it privately to ",
    reportContactLabel: "Security address",
    reportP1Suffix:
      " and give us reasonable time to respond before disclosing it. Include steps to reproduce; do not access other people's data or degrade the service.",
    reportP2:
      "Because the platform is pre-launch there is no bug bounty, but we will credit researchers who wish to be named.",
  },
  fr: {
    kicker: "Sécurité",
    titlePrefix: "Conçu pour ",
    titleEm: "qu'aucune personne seule",
    titleSuffix: " ne puisse déplacer votre argent.",
    lead: "Cette page présente les contrôles présents dans le code aujourd'hui et — tout aussi important — ce qui n'a pas encore été réalisé.",
    toc: [
      { id: "controls", label: "Contrôles" },
      { id: "limits", label: "Limites assumées" },
      { id: "report", label: "Signaler une vulnérabilité" },
    ],
    controlsTitle: "Contrôles en place",
    controls: [
      [
        "Mouvements de fonds",
        [
          "Registre à double entrée : toute écriture non équilibrée est rejetée",
          "Clés d'idempotence sur chaque paiement pour qu'une relance ne paie jamais deux fois",
          "Cotations fermes signées par HMAC liées au montant, au corridor et à l'échéance",
          "Filtrage des sanctions et plafonds KYC appliqués avant tout mouvement ; blocage automatique en cas d'erreur de contrôle",
        ],
      ],
      [
        "Contrat de séquestre",
        [
          "Protection contre la réentrance, retrait sécurisé (pull-payment), jetons à frais de transfert rejetés",
          "La mise en pause ne peut jamais bloquer le règlement des fonds déjà déposés",
          "Partage 50/50 sans permission en dernier recours pour qu'un arbitre absent ne bloque jamais les fonds",
          "Frais de protocole plafonnés à 1 % dans le code",
        ],
      ],
      [
        "Comptes et sessions",
        [
          "Cookies de session HttpOnly ; le navigateur ne détient jamais de jeton porteur",
          "Limitation des tentatives de connexion par compte et par adresse",
          "Déconnexion automatique après inactivité ; sessions commerçant et opérateur séparées",
          "Approbation à quatre yeux par les opérateurs pour les changements sensibles",
        ],
      ],
      [
        "Application web",
        [
          "Politique stricte de sécurité du contenu (CSP) et en-têtes de sécurité modernes sur chaque réponse",
          "Aucun secret dans le code client ; les identifiants fournisseurs sont injectés par l'environnement et jamais journalisés",
          "Les webhooks fournisseurs sont vérifiés par HMAC et bloqués par défaut tant qu'aucun secret n'est configuré ; ils enregistrent des preuves sans jamais écrire dans le registre comptable",
        ],
      ],
    ],
    limitsTitle: "Ce qui n'est pas encore fait",
    limits: [
      [
        "Pas encore d'audit indépendant des contrats intelligents.",
        " Les contrats sont couverts par des tests approfondis, mais un audit tiers est indispensable avant de détenir des fonds réels.",
      ],
      [
        "Les rails de paiement sont en bac à sable.",
        " Aucun identifiant réel d'opérateur télécom ou bancaire n'est utilisé, et aucun fonds réel n'est déplacé.",
      ],
      [
        "Les taux de change sont des valeurs de référence,",
        " et non des données de marché en direct, tant qu'un fournisseur agréé n'est pas connecté.",
      ],
      [
        "Aucune licence réglementaire n'est revendiquée.",
        " Opérer dans chaque pays nécessite des autorisations que nous n'avons pas encore sollicitées.",
      ],
      [
        "Pas encore de test d'intrusion.",
        " Des vérifications automatisées des dépendances et de l'accessibilité sont exécutées, mais ne remplacent pas un pentest.",
      ],
    ],
    reportTitle: "Signaler une vulnérabilité",
    reportP1Prefix:
      "Si vous pensez avoir découvert une faille de sécurité, veuillez la signaler en privé à ",
    reportContactLabel: "Adresse sécurité",
    reportP1Suffix:
      " et nous laisser un délai raisonnable pour répondre avant toute divulgation. Incluez les étapes de reproduction ; n'accédez pas aux données d'autrui et ne dégradez pas le service.",
    reportP2:
      "La plateforme étant en pré-lancement, il n'existe pas de programme de prime aux bogues (bug bounty), mais nous créditerons les chercheurs qui souhaitent être mentionnés.",
  },
  sw: {
    kicker: "Usalama",
    titlePrefix: "Imeundwa ili ",
    titleEm: "mtu mmoja peke yake",
    titleSuffix: " asiweze kuhamisha pesa zako.",
    lead: "Ukurasa huu unaorodhesha vidhibiti vilivyopo kwenye msimbo leo, na — muhimu vilevile — kile ambacho bado hakijafanyika.",
    toc: [
      { id: "controls", label: "Vidhibiti" },
      { id: "limits", label: "Mipaka ya ukweli" },
      { id: "report", label: "Ripoti udhaifu wa kiusalama" },
    ],
    controlsTitle: "Vidhibiti vilivyopo",
    controls: [
      [
        "Uhamishaji wa pesa",
        [
          "Leja ya maingizo mawili: ingizo lisilowiana linakataliwa",
          "Vifunguo vya idempotency kwenye kila malipo ili kujaribu tena kusilipe mara mbili",
          "Nukuu thabiti zilizotiwa sahihi ya HMAC zikifungwa na kiasi, njia na muda wa kuisha",
          "Uchunguzi wa vikwazo na viwango vya KYC hutekelezwa kabla pesa hazijasogea; mfumo husimama ikiwa ukaguzi utashindwa",
        ],
      ],
      [
        "Mkataba wa Escrow",
        [
          "Ulinzi dhidi ya reentrancy, mbadala wa pull-payment, tokeni zenye ada ya uhamisho hukataliwa",
          "Kusitisha mkataba hakuwezi kamwe kuzuia malipo ya pesa ambazo tayari zimeshikiliwa",
          "Mbadala wa kugawana 50/50 bila ruhusa maalum ili msuluhishi asiyekuwepo asiweze kufungia pesa",
          "Ada ya itifaki imefungwa isizidi 1% ndani ya msimbo",
        ],
      ],
      [
        "Akaunti na vikao",
        [
          "Vidakuzi vya kikao vya HttpOnly; kivinjari hakishikilii tokeni ya wazi",
          "Udhibiti wa kasi ya kuingia kwa kila akaunti na anwani",
          "Kutolewa kiotomatiki baada ya kutotumia; vikao tofauti kwa wafanyabiashara na waendeshaji",
          "Waendeshajioidhinisha mabadiliko nyeti chini ya sheria ya macho manne (watu wawili)",
        ],
      ],
      [
        "Programu ya wavuti",
        [
          "Sera kali ya Content-Security-Policy na vichwa vya kisasa vya usalama kwenye kila jibu",
          "Hakuna siri kwenye kifurushi cha mteja; vitambulisho vya watoa huduma vinaingizwa kupitia mazingira na havirekodiwi kwenye kumbukumbu",
          "Webhooks za watoa huduma zinathibitishwa kwa HMAC na kufungwa hadi siri iwekwe; zinarekodi ushahidi pekee na haziandiki moja kwa moja kwenye leja",
        ],
      ],
    ],
    limitsTitle: "Ambacho bado hakijafanyika",
    limits: [
      [
        "Bado hakuna ukaguzi huru wa mikataba mahiri.",
        " Mikataba imefanyiwa majaribio ya kina, lakini ukaguzi wa mhusika wa tatu ni sharti kabla ya kushikilia pesa halisi.",
      ],
      [
        "Njia za malipo ni za majaribio (sandbox).",
        " Hakuna vitambulisho halisi vya kampuni za simu au benki vinavyotumika, na hakuna pesa halisi zinazohamishwa.",
      ],
      [
        "Viwango vya FX ni thamani elekezi,",
        " si data za soko la moja kwa moja, hadi mtoa huduma mwenye leseni atakapounganishwa.",
      ],
      [
        "Hatudai kuwa na leseni ya udhibiti.",
        " Kuendesha huduma katika kila nchi kunahitaji idhini ambayo bado hatujaiomba.",
      ],
      [
        "Bado hakuna jaribio la udukuzi (penetration test).",
        " Ukaguzi wa kiotomatiki wa programu tegemezi na ufikivu unafanyika, lakini si mbadala.",
      ],
    ],
    reportTitle: "Ripoti udhaifu wa kiusalama",
    reportP1Prefix: "Ikiwa unaamini umepata tatizo la kiusalama, tafadhali liripoti kwa faragha kupitia ",
    reportContactLabel: "Anwani ya usalama",
    reportP1Suffix:
      " na utupe muda wa kutosha kujibu kabla ya kuliweka hadharani. Jumuisha hatua za kurudia tatizo hilo; usifikie data za watu wengine wala kuharibu huduma.",
    reportP2:
      "Kwa kuwa jukwaa bado halijazinduliwa rasmi hakuna zawadi ya kifedha (bug bounty), lakini tutawatambua watafiti wanaopenda kutajwa.",
  },
  pt: {
    kicker: "Segurança",
    titlePrefix: "Concebido para que ",
    titleEm: "nenhuma pessoa sozinha",
    titleSuffix: " possa movimentar o seu dinheiro.",
    lead: "Esta página lista os controlos que existem hoje no código e — igualmente importante — o que ainda não foi feito.",
    toc: [
      { id: "controls", label: "Controlos" },
      { id: "limits", label: "Limites honestos" },
      { id: "report", label: "Reportar uma vulnerabilidade" },
    ],
    controlsTitle: "Controlos implementados",
    controls: [
      [
        "Movimentação de fundos",
        [
          "Razão de partidas dobradas: um lançamento que não equilibre é rejeitado",
          "Chaves de idempotência em cada pagamento para que uma repetição nunca pague duas vezes",
          "Cotações firmes assinadas por HMAC vinculadas ao montante, corredor e validade",
          "Triagem de sanções e limites de escalão KYC aplicados antes de qualquer movimento; bloqueio seguro se uma verificação falhar",
        ],
      ],
      [
        "Contrato de caução (Escrow)",
        [
          "Proteção contra reentrância, alternativa pull-payment, tokens com taxa de transferência rejeitados",
          "A pausa nunca pode bloquear a liquidação de fundos já retidos",
          "Alternativa 50/50 sem permissão para que um árbitro ausente não possa bloquear fundos",
          "Taxa de protocolo limitada a 1% no código",
        ],
      ],
      [
        "Contas e sessões",
        [
          "Cookies de sessão HttpOnly; o navegador nunca guarda um bearer token",
          "Limitação de tentativas de início de sessão por conta e endereço",
          "Término de sessão por inatividade; sessões separadas para comerciantes e operadores",
          "Operadores aprovam alterações sensíveis sob a regra dos quatro olhos",
        ],
      ],
      [
        "Aplicação web",
        [
          "Content-Security-Policy rigorosa e cabeçalhos de segurança modernos em todas as respostas",
          "Sem segredos no pacote do cliente; credenciais de fornecedores são injetadas pelo ambiente e nunca registadas em logs",
          "Webhooks de fornecedores são verificados por HMAC e bloqueados até que um segredo seja configurado; registam evidências e nunca lançam no razão",
        ],
      ],
    ],
    limitsTitle: "O que ainda não está feito",
    limits: [
      [
        "Ainda sem auditoria independente de contratos inteligentes.",
        " Os contratos estão cobertos por testes extensivos, mas uma auditoria externa é pré-requisito para deter fundos reais.",
      ],
      [
        "Os canais de pagamento são sandboxes.",
        " Nenhuma credencial real de telecomunicações ou banco está em uso e nenhum fundo real é movimentado.",
      ],
      [
        "As taxas de câmbio são valores de referência,",
        " não dados de mercado, até que um fornecedor licenciado seja ligado.",
      ],
      [
        "Nenhuma licença regulatória é reivindicada.",
        " Operar em cada país exige autorização que ainda não solicitámos.",
      ],
      [
        "Ainda sem teste de intrusão (pentest).",
        " Verificações automatizadas de dependências e acessibilidade são executadas, mas não substituem um teste manual.",
      ],
    ],
    reportTitle: "Reportar uma vulnerabilidade",
    reportP1Prefix:
      "Se acredita ter encontrado um problema de segurança, reporte-o em privado para ",
    reportContactLabel: "Endereço de segurança",
    reportP1Suffix:
      " e dê-nos um prazo razoável para responder antes de o divulgar. Inclua passos para reproduzir; não aceda a dados de terceiros nem degrade o serviço.",
    reportP2:
      "Como a plataforma está em pré-lançamento, não existe programa de recompensas (bug bounty), mas daremos crédito aos investigadores que desejem ser nomeados.",
  },
  rw: {
    kicker: "Umutekano",
    titlePrefix: "Rwubatswe ku buryo ",
    titleEm: "nta muntu umwe ku giti cye",
    titleSuffix: " ushobora kwimura amafaranga yawe.",
    lead: "Uru rupapuro rugaragaza ubwirinzi buri muri kode uyu munsi, ndetse — icy'ingenzi kurushaho — ibitarakorwa.",
    toc: [
      { id: "controls", label: "Ubwirinzi" },
      { id: "limits", label: "Imbago zivugisha ukuri" },
      { id: "report", label: "Menyesha ikibazo cy'umutekano" },
    ],
    controlsTitle: "Ubwirinzi bwashyizweho",
    controls: [
      [
        "Kwimura amafaranga",
        [
          "Igitabo cy'ibaruramari ry'impande ebyiri: inyandiko itaringaniye irangwa",
          "Imfunguzo za idempotency kuri buri bwishyu kugira ngo kongera kugerageza bitishyura kabiri",
          "Ibiciro bidahinduka bifite umukono wa HMAC bihujwe n'umubare, inzira n'igihe birangirira",
          "Igenzura ry'ibihano n'imbago za KYC bikorwa mbere y'uko amafaranga agenda; sisitemu irahagarara niba hari ikosa mu igenzura",
        ],
      ],
      [
        "Amasezerano ya Escrow",
        [
          "Ubwirinzi bwa reentrancy, uburyo bwo kubikuza bwizewe (pull-payment), tokeni zikata ikiguzi mu kohereza zirangwa",
          "Guhagarika amasezerano by'agateganyo ntibishobora kubuza gutanga amafaranga yari asanzwe abitswe",
          "Kugabana 50/50 nta ruhushya rundi rukenewe mu gihe umucamanza adahari kugira ngo amafarangaadafungiranwa",
          "Ikiguzi cya porotokole kitarenga 1% muri kode",
        ],
      ],
      [
        "Konti n'ibihe byo kwinjira (sessions)",
        [
          "Cookies za HttpOnly; mushakisha ntibika tokeni igaragara",
          "Gukumira kwinjira inshuro nyinshi kuri buri konti na aderesi",
          "Gusohoka byikora nyuma yo kudakoresha urubuga; ibihe byo kwinjira bitandukanye ku bacuruzi n'abakozi",
          "Abakozi bemeza impinduka zikomeye ari babiri (four-eyes rule)",
        ],
      ],
      [
        "Porogaramu y'urubuga",
        [
          "Politiki ikomeye ya Content-Security-Policy n'imitwe y'umutekano igezweho kuri buri gisubizo",
          "Nta mabanga aboneka muri kode ihabwa umukiriya; imfunguzo z'abafatanyabikorwa zishyirwa muri seriveri kandi ntizandikwa muri logs",
          "Webhooks z'abafatanyabikorwa zigenzurwa na HMAC kandi zirafungwa kugeza ibanga rishyizweho; zandika ibimenyetso gusa ntizandika mu gitabo cy'ibaruramari",
        ],
      ],
    ],
    limitsTitle: "Ibitarakorwa",
    limits: [
      [
        "Nta bugenzuzi bwigenga bw'amasezerano yikoresha (smart contracts) burakorwa.",
        " Amasezerano afite igeragezwa rihagije, ariko ubugenzuzi bw'ikigo cyigenga ni itegeko mbere yo kubika amafaranga nyayo.",
      ],
      [
        "Inzira z'ubwishyu ni iz'igerageza (sandbox).",
        " Nta mfunguzo nyazo za sosiyete za telefone cyangwa amabanki zikoreshwa, kandi nta mafaranga nyayo ava aho ari.",
      ],
      [
        "Ibipimo by'ivunjisha ni ingero ngenderwaho,",
        " ntabwo ari ibiciro byo ku isoko nyaryo, kugeza igihe utanga ibiciro ufite uruhushya azahurizwaho.",
      ],
      [
        "Nta ruhushya rw'inzego zigenzura tuvuga ko dufite.",
        " Gukorera muri buri gihugu bisaba uburenganzira tutarasaba.",
      ],
      [
        "Ntasuzuma ryo kwinjirira sisitemu (penetration test) rirakorwa.",
        " Igenzura ryikora rya porogaramu no korohereza abakoresha rirakorwa, ariko ntirisimbura isuzuma ryimbitse.",
      ],
    ],
    reportTitle: "Menyesha ikibazo cy'umutekano",
    reportP1Prefix: "Niba ubona ko wavumbuye ikibazo cy'umutekano, turagusaba kukitumenyesha mu ibanga kuri ",
    reportContactLabel: "Aderesi y'umutekano",
    reportP1Suffix:
      " kandi uduhe igihe gikwiye cyo gusubiza mbere yo kukigaragaza ku mugaragaro. Shyiramo intambwe zigaragaza uko ikibazo kibaho; ntiwinjire mu makuru y'abandi cyangwa ngo wangize serivisi.",
    reportP2:
      "Kubera ko urubuga rutarajya ku mugaragaro nta gihembo cy'amafaranga (bug bounty) gihari, ariko tuzashimira mu izina abashakashatsi babyifuza.",
  },
};

export function SecurityPage() {
  const copy = useLangCopy(COPY);
  return (
    <PublicPage
      kicker={copy.kicker}
      title={
        <>
          {copy.titlePrefix}
          <em>{copy.titleEm}</em>
          {copy.titleSuffix}
        </>
      }
      lead={copy.lead}
      toc={copy.toc}
    >
      <Section id="controls" title={copy.controlsTitle}>
        <div className="grid gap-3 sm:grid-cols-2">
          {copy.controls.map(([h, items]) => (
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
      <Section id="limits" title={copy.limitsTitle}>
        <ul>
          {copy.limits.map(([strong, rest]) => (
            <li key={strong}>
              <strong>{strong}</strong>
              {rest}
            </li>
          ))}
        </ul>
      </Section>
      <Section id="report" title={copy.reportTitle}>
        <p>
          {copy.reportP1Prefix}
          <ContactLink address={SECURITY_EMAIL} label={copy.reportContactLabel} />
          {copy.reportP1Suffix}
        </p>
        <p>{copy.reportP2}</p>
      </Section>
    </PublicPage>
  );
}
