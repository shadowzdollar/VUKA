import { useLangCopy, type Lang } from "@/lib/i18n";
import { ContactLink, CONTACT_EMAIL, PublicPage, Section } from "../public-page";

interface PrivacyCopy {
  kicker: string;
  titlePrefix: string;
  titleEm: string;
  titleSuffix: string;
  lead: string;
  toc: { id: string; label: string }[];
  collectTitle: string;
  collectItems: [string, string][];
  neverTitle: string;
  never1Prefix: string;
  never1Strong: string;
  never1Suffix: string;
  never2: string;
  storageTitle: string;
  storageLead: string;
  storageCaption: string;
  storageHeaders: [string, string, string];
  storageRows: [string, string, string][];
  thirdTitle: string;
  thirdItems: [string, string][];
  rightsTitle: string;
  rightsPrefix: string;
  rightsContactLabel: string;
  rightsSuffix: string;
}

const COPY: Record<Lang, PrivacyCopy> = {
  en: {
    kicker: "Privacy",
    titlePrefix: "What we keep, ",
    titleEm: "where",
    titleSuffix: ", and why.",
    lead: "A plain-language description of the data the platform handles as designed today.",
    toc: [
      { id: "collect", label: "What we collect" },
      { id: "never", label: "What we don't" },
      { id: "storage", label: "Cookies and storage" },
      { id: "third", label: "Third parties" },
      { id: "rights", label: "Your choices" },
    ],
    collectTitle: "What we collect",
    collectItems: [
      [
        "Account:",
        " your name, phone number, business name and country, and a salted hash of your password (never the password itself).",
      ],
      [
        "Transactions:",
        " invoices, quotes, payments and their ledger entries, which we must retain to keep an auditable record.",
      ],
      [
        "Verification:",
        " the reference you file (a provider job id, registry reference or document hash) and its review status.",
      ],
      [
        "Operations:",
        " request ids, timestamps and error codes in server logs; no credential values are logged.",
      ],
    ],
    neverTitle: "What we don't",
    never1Prefix: "Identity documents are ",
    never1Strong: "not uploaded",
    never1Suffix: " to VUKA; only references are stored.",
    never2: "No advertising trackers, no third-party analytics scripts, no selling of data.",
    storageTitle: "Cookies and browser storage",
    storageLead:
      "The site uses one session cookie and a few items in your browser's local storage. All are strictly functional; none tracks you across sites.",
    storageCaption: "Browser storage used by VUKA",
    storageHeaders: ["Name", "Purpose", "Lifetime"],
    storageRows: [
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
    ],
    thirdTitle: "Third parties",
    thirdItems: [
      [
        "Google Fonts",
        " serves the Newsreader, Inter and JetBrains Mono typefaces; your browser contacts Google to fetch them and Google sees your IP address. Self-hosting the fonts is planned.",
      ],
      [
        "Payout providers",
        " (mobile-money operators and banks) will receive the details needed to pay out once rails go live. Today all rails are sandboxes and receive nothing.",
      ],
    ],
    rightsTitle: "Your choices",
    rightsPrefix:
      "You can clear browser storage at any time, export your activity from the app, and ask for correction or deletion (subject to ledger records we are required to retain) at ",
    rightsContactLabel: "Privacy contact",
    rightsSuffix:
      ". The controller identity and applicable data-protection registrations will be added before launch.",
  },
  fr: {
    kicker: "Confidentialité",
    titlePrefix: "Ce que nous conservons, ",
    titleEm: "où",
    titleSuffix: " et pourquoi.",
    lead: "Une description en langage clair des données traitées par la plateforme telle qu'elle est conçue aujourd'hui.",
    toc: [
      { id: "collect", label: "Ce que nous collectons" },
      { id: "never", label: "Ce que nous ne collectons pas" },
      { id: "storage", label: "Cookies et stockage" },
      { id: "third", label: "Tiers" },
      { id: "rights", label: "Vos choix" },
    ],
    collectTitle: "Ce que nous collectons",
    collectItems: [
      [
        "Compte :",
        " votre nom, numéro de téléphone, nom d'entreprise et pays, ainsi qu'un hachage salé de votre mot de passe (jamais le mot de passe lui-même).",
      ],
      [
        "Transactions :",
        " factures, cotations, paiements et leurs écritures comptables, que nous devons conserver pour maintenir une piste d'audit.",
      ],
      [
        "Vérification :",
        " la référence que vous soumettez (identifiant de dossier prestataire, référence de registre ou empreinte de document) et son statut d'examen.",
      ],
      [
        "Opérations :",
        " identifiants de requête, horodatages et codes d'erreur dans les journaux serveur ; aucun identifiant secret n'est journalisé.",
      ],
    ],
    neverTitle: "Ce que nous ne collectons pas",
    never1Prefix: "Les pièces d'identité ne sont ",
    never1Strong: "pas téléversées",
    never1Suffix: " sur VUKA ; seules les références sont enregistrées.",
    never2: "Aucun traceur publicitaire, aucun script d'analyse tiers, aucune revente de données.",
    storageTitle: "Cookies et stockage du navigateur",
    storageLead:
      "Le site utilise un cookie de session et quelques entrées dans le stockage local de votre navigateur. Tous sont strictement fonctionnels ; aucun ne vous suit d'un site à l'autre.",
    storageCaption: "Stockage navigateur utilisé par VUKA",
    storageHeaders: ["Nom", "Finalité", "Durée de vie"],
    storageRows: [
      ["vuka.lang", "Votre choix de langue", "Jusqu'à suppression des données du site"],
      [
        "vuka.workflows.<id>",
        "Identifiants de vos paiements récents, pour que la page Envoyer puisse reprendre leur suivi",
        "Jusqu'à suppression des données du site",
      ],
      [
        "vuka.chainScope",
        "Opérateurs uniquement : contrat de séquestre et identifiant de chaîne consultés",
        "Jusqu'à suppression des données du site",
      ],
      [
        "Cookie de session",
        "Maintient votre session active. HttpOnly, donc illisible par les scripts",
        "Jusqu'à déconnexion ou inactivité",
      ],
    ],
    thirdTitle: "Tiers",
    thirdItems: [
      [
        "Google Fonts",
        " fournit les polices Newsreader, Inter et JetBrains Mono ; votre navigateur contacte Google pour les charger et Google voit votre adresse IP. L'auto-hébergement des polices est prévu.",
      ],
      [
        "Prestataires de paiement",
        " (opérateurs de monnaie mobile et banques) recevront les informations nécessaires au versement lorsque les rails seront actifs. Aujourd'hui, tous les rails sont en bac à sable et ne reçoivent rien.",
      ],
    ],
    rightsTitle: "Vos choix",
    rightsPrefix:
      "Vous pouvez effacer le stockage du navigateur à tout moment, exporter votre activité depuis l'application et demander une rectification ou une suppression (sous réserve des écritures comptables que nous devons conserver) à ",
    rightsContactLabel: "Contact confidentialité",
    rightsSuffix:
      ". L'identité du responsable de traitement et les enregistrements applicables en matière de protection des données seront ajoutés avant le lancement.",
  },
  sw: {
    kicker: "Faragha",
    titlePrefix: "Tunachohifadhi, ",
    titleEm: "wapi",
    titleSuffix: ", na kwa nini.",
    lead: "Maelezo kwa lugha rahisi kuhusu data ambazo jukwaa linashughulikia kama lilivyoundwa leo.",
    toc: [
      { id: "collect", label: "Tunachokusanya" },
      { id: "never", label: "Tusichokusanya" },
      { id: "storage", label: "Vidakuzi na hifadhi" },
      { id: "third", label: "Wahusika wengine" },
      { id: "rights", label: "Chaguo zako" },
    ],
    collectTitle: "Tunachokusanya",
    collectItems: [
      [
        "Akaunti:",
        " jina lako, nambari ya simu, jina la biashara na nchi, pamoja na alama ya siri (hash) ya nenosiri lako (kamwe si nenosiri lenyewe).",
      ],
      [
        "Miamala:",
        " ankara, nukuu za bei, malipo na maingizo yake kwenye leja, ambayo lazima tuyahifadhi ili kuweka kumbukumbu inayoweza kukaguliwa.",
      ],
      [
        "Uthibitisho:",
        " nambari ya kumbukumbu unayowasilisha (kitambulisho cha kazi ya mtoa huduma, kumbukumbu ya usajili au hash ya hati) na hali yake ya ukaguzi.",
      ],
      [
        "Uendeshaji:",
        " vitambulisho vya maombi, muda na misimbo ya hitilafu kwenye kumbukumbu za seva; hakuna taarifa za siri zinazorekodiwa.",
      ],
    ],
    neverTitle: "Tusichokusanya",
    never1Prefix: "Hati za utambulisho ",
    never1Strong: "hazipakiwi",
    never1Suffix: " kwenye VUKA; ni nambari za kumbukumbu pekee zinazohifadhiwa.",
    never2: "Hakuna vifuatiliaji vya matangazo, hakuna hati za uchambuzi za wahusika wengine, hakuna kuuza data.",
    storageTitle: "Vidakuzi na hifadhi ya kivinjari",
    storageLead:
      "Tovuti inatumia kidakuzi kimoja cha kikao na vipengele vichache kwenye hifadhi ya ndani ya kivinjari chako. Vyote ni kwa ajili ya utendaji tu; hakuna kinachokufuatilia kwenye tovuti nyingine.",
    storageCaption: "Hifadhi ya kivinjari inayotumiwa na VUKA",
    storageHeaders: ["Jina", "Madhumuni", "Muda wa kudumu"],
    storageRows: [
      ["vuka.lang", "Chaguo lako la lugha", "Hadi utakapofuta data za tovuti"],
      [
        "vuka.workflows.<id>",
        "Vitambulisho vya malipo yako ya hivi karibuni, ili ukurasa wa Tuma uweze kuendelea kuyafuatilia",
        "Hadi utakapofuta data za tovuti",
      ],
      [
        "vuka.chainScope",
        "Waendeshaji pekee: mkataba wa escrow na kitambulisho cha mtandao kinachotazamwa",
        "Hadi utakapofuta data za tovuti",
      ],
      [
        "Kidakuzi cha kikao (Session cookie)",
        "Kinakuweka ukiwa umeingia. HttpOnly, hivyo hati za programu haziwezi kukisoma",
        "Hadi utakapotoka au kukaa bila kutumia",
      ],
    ],
    thirdTitle: "Wahusika wengine",
    thirdItems: [
      [
        "Google Fonts",
        " inatoa fonti za Newsreader, Inter na JetBrains Mono; kivinjari chako huwasiliana na Google kuzipakua na Google huona anwani yako ya IP. Tunapanga kuhifadhi fonti hizi wenyewe.",
      ],
      [
        "Watoa huduma za malipo",
        " (kampuni za pesa za simu na benki) watapokea maelezo yanayohitajika kulipa mara tu njia halisi zitakapoanza kufanya kazi. Leo njia zote ni za majaribio (sandbox) na hazipokei chochote.",
      ],
    ],
    rightsTitle: "Chaguo zako",
    rightsPrefix:
      "Unaweza kufuta hifadhi ya kivinjari wakati wowote, kuhamisha shughuli zako kutoka kwenye programu, na kuomba marekebisho au kufutwa (kulingana na kumbukumbu za leja tunazopaswa kuhifadhi) kupitia ",
    rightsContactLabel: "Mawasiliano ya faragha",
    rightsSuffix:
      ". Utambulisho wa mdhibiti wa data na usajili husika wa ulinzi wa data utaongezwa kabla ya uzinduzi.",
  },
  pt: {
    kicker: "Privacidade",
    titlePrefix: "O que guardamos, ",
    titleEm: "onde",
    titleSuffix: " e porquê.",
    lead: "Uma descrição em linguagem simples dos dados que a plataforma trata tal como está concebida hoje.",
    toc: [
      { id: "collect", label: "O que recolhemos" },
      { id: "never", label: "O que não recolhemos" },
      { id: "storage", label: "Cookies e armazenamento" },
      { id: "third", label: "Terceiros" },
      { id: "rights", label: "As suas escolhas" },
    ],
    collectTitle: "O que recolhemos",
    collectItems: [
      [
        "Conta:",
        " o seu nome, número de telefone, nome da empresa e país, e um hash com salt da sua palavra-passe (nunca a própria palavra-passe).",
      ],
      [
        "Transações:",
        " faturas, cotações, pagamentos e respetivos lançamentos no razão, que devemos conservar para manter um registo auditável.",
      ],
      [
        "Verificação:",
        " a referência que submete (ID de processo do fornecedor, referência de registo ou hash de documento) e o respetivo estado de revisão.",
      ],
      [
        "Operações:",
        " IDs de pedidos, carimbos de data/hora e códigos de erro nos registos do servidor; nenhum valor de credencial é registado.",
      ],
    ],
    neverTitle: "O que não recolhemos",
    never1Prefix: "Os documentos de identificação ",
    never1Strong: "não são carregados",
    never1Suffix: " na VUKA; apenas são guardadas referências.",
    never2: "Sem rastreadores publicitários, sem scripts de análise de terceiros, sem venda de dados.",
    storageTitle: "Cookies e armazenamento do navegador",
    storageLead:
      "O site utiliza um cookie de sessão e alguns itens no armazenamento local do seu navegador. Todos são estritamente funcionais; nenhum o rastreia entre sites.",
    storageCaption: "Armazenamento do navegador utilizado pela VUKA",
    storageHeaders: ["Nome", "Finalidade", "Duração"],
    storageRows: [
      ["vuka.lang", "A sua escolha de idioma", "Até limpar os dados do site"],
      [
        "vuka.workflows.<id>",
        "IDs dos seus pagamentos recentes, para que a página Enviar possa retomar o acompanhamento",
        "Até limpar os dados do site",
      ],
      [
        "vuka.chainScope",
        "Apenas operadores: o contrato de caução e o ID da rede em visualização",
        "Até limpar os dados do site",
      ],
      [
        "Cookie de sessão",
        "Mantém a sua sessão iniciada. HttpOnly, pelo que os scripts não o conseguem ler",
        "Até terminar sessão ou ficar inativo",
      ],
    ],
    thirdTitle: "Terceiros",
    thirdItems: [
      [
        "Google Fonts",
        " fornece os tipos de letra Newsreader, Inter e JetBrains Mono; o seu navegador contacta a Google para os obter e a Google vê o seu endereço IP. Está planeado alojar os tipos de letra localmente.",
      ],
      [
        "Fornecedores de pagamento",
        " (operadores de dinheiro móvel e bancos) receberão os dados necessários para pagar assim que os canais entrarem em produção. Hoje todos os canais são sandboxes e não recebem nada.",
      ],
    ],
    rightsTitle: "As suas escolhas",
    rightsPrefix:
      "Pode limpar o armazenamento do navegador a qualquer momento, exportar a sua atividade a partir da aplicação e solicitar a correção ou eliminação (sujeito aos registos do razão que somos obrigados a reter) em ",
    rightsContactLabel: "Contacto de privacidade",
    rightsSuffix:
      ". A identidade do responsável pelo tratamento e os registos aplicáveis de proteção de dados serão adicionados antes do lançamento.",
  },
  rw: {
    kicker: "Ibanga",
    titlePrefix: "Ibyo tubika, ",
    titleEm: "aho tubibika",
    titleSuffix: ", n'impamvu.",
    lead: "Ibisobanuro byumvikana ku makuru urubuga rukoresha uko rwubatswe uyu munsi.",
    toc: [
      { id: "collect", label: "Ibyo dukusanya" },
      { id: "never", label: "Ibyo tudakusanya" },
      { id: "storage", label: "Cookies n'ububiko" },
      { id: "third", label: "abandi bafatanyabikorwa" },
      { id: "rights", label: "Amahitamo yawe" },
    ],
    collectTitle: "Ibyo dukusanya",
    collectItems: [
      [
        "Konti:",
        " amazina yawe, nimero ya telefone, izina ry'ubucuruzi n'igihugu, hamwe n'ikimenyetso cy'ibanga (hash) cy'ijambo ryawe ry'ibanga (ntabwo ari ijambo ry'ibanga ubwaryo).",
      ],
      [
        "Ibikorwa by'ubwishyu:",
        " inyemezabuguzi, ibiciro byemejwe, ubwishyu n'inyandiko zabyo mu gitabo cy'ibaruramari, tugomba kubika kugira ngo habe inyandiko igenzurwa.",
      ],
      [
        "Igenzura:",
        " nimero y'inyandiko utanga (nimero ya dosiye, irangamimerere ry'ubucuruzi cyangwa hash y'icyangombwa) n'uko isuzuma ryayo rihagaze.",
      ],
      [
        "Imikorere:",
        " ibirango by'ubusabe, amasaha na kode z'amakosa muri seriveri; nta makuru y'ibanga y'abakoresha yandikwamo.",
      ],
    ],
    neverTitle: "Ibyo tudakusanya",
    never1Prefix: "Ibyangombwa by'umwirondoro ",
    never1Strong: "ntibyoherezwa",
    never1Suffix: " kuri VUKA; habikwa gusa nimero ziranga inyandiko.",
    never2: "Nta bikurikirana kwamamaza, nta porogaramu z'abandi zisesengura imikoreshereze, nta kugurisha amakuru.",
    storageTitle: "Cookies n'ububiko bwa mushakisha (browser)",
    storageLead:
      "Urubuga rukoresha cookie imwe y'igihe winjiye n'uduce duke mu bubiko bwa mushakisha yawe. Byose bigamije imikorere y'urubuga gusa; nta na kimwe kigukurikirana ku zindi mbuga.",
    storageCaption: "Ububiko bwa mushakisha bukoreshwa na VUKA",
    storageHeaders: ["Izina", "Impamvu", "Igihe bimara"],
    storageRows: [
      ["vuka.lang", "Ururimi wahisemo", "Kugeza igihe usibiye amakuru y'urubuga"],
      [
        "vuka.workflows.<id>",
        "Ibirango by'ubwishyu bwawe bwa vuba, kugira ngo urupapuro rwo Kohereza rukomeze kubukurikirana",
        "Kugeza igihe usibiye amakuru y'urubuga",
      ],
      [
        "vuka.chainScope",
        "Ku bakozi gusa: amasezerano ya escrow na nimero y'umuyoboro birimo kurebwa",
        "Kugeza igihe usibiye amakuru y'urubuga",
      ],
      [
        "Session cookie",
        "Ituma uguma winjiye. Ni HttpOnly, bityo porogaramu zo ku rubuga ntizishobora kuyisoma",
        "Kugeza usohotse cyangwa umaze igihe udakoresha urubuga",
      ],
    ],
    thirdTitle: "Abandi bafatanyabikorwa",
    thirdItems: [
      [
        "Google Fonts",
        " itanga imyandikire ya Newsreader, Inter na JetBrains Mono; mushakisha yawe ivugana na Google kugira ngo iyizane kandi Google ibona aderesi ya IP yawe. Turateganya kubika iyo myandikire kuri seriveri zacu.",
      ],
      [
        "Abatanga serivisi z'ubwishyu",
        " (ibigo bya mobile money n'amabanki) bazahabwa amakuru akenewe yo kwishyura inzira z'ubwishyu nizitangira gukora ku mugaragaro. Uyu munsi inzira zose ni iz'igerageza (sandbox) kandi nta makuru zakira.",
      ],
    ],
    rightsTitle: "Amahitamo yawe",
    rightsPrefix:
      "Ushobora gusiba ububiko bwa mushakisha igihe icyo ari cyo cyose, gukuramo raporo y'ibikorwa byawe muri porogaramu, no gusaba gukosora cyangwa gusiba amakuru (uretse inyandiko z'igitabo cy'ibaruramari dutegetswe kubika) kuri ",
    rightsContactLabel: "Aderesi ishinzwe ibanga",
    rightsSuffix:
      ". Umwirondoro w'ugenzura amakuru n'iyandikwa ryemewe mu kurinda amakuru bizongerwaho mbere yo gutangiza urubuga ku mugaragaro.",
  },
};

export function PrivacyPage() {
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
      draft
      toc={copy.toc}
    >
      <Section id="collect" title={copy.collectTitle}>
        <ul>
          {copy.collectItems.map(([strong, rest]) => (
            <li key={strong}>
              <strong>{strong}</strong>
              {rest}
            </li>
          ))}
        </ul>
      </Section>
      <Section id="never" title={copy.neverTitle}>
        <ul>
          <li>
            {copy.never1Prefix}
            <strong>{copy.never1Strong}</strong>
            {copy.never1Suffix}
          </li>
          <li>{copy.never2}</li>
        </ul>
      </Section>
      <Section id="storage" title={copy.storageTitle}>
        <p>{copy.storageLead}</p>
        <div className="overflow-x-auto border border-border bg-card text-foreground">
          <table className="w-full min-w-[520px] text-sm">
            <caption className="sr-only">{copy.storageCaption}</caption>
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th scope="col" className="p-3 font-normal">
                  {copy.storageHeaders[0]}
                </th>
                <th scope="col" className="p-3 font-normal">
                  {copy.storageHeaders[1]}
                </th>
                <th scope="col" className="p-3 font-normal">
                  {copy.storageHeaders[2]}
                </th>
              </tr>
            </thead>
            <tbody>
              {copy.storageRows.map(([n, p, l]) => (
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
      <Section id="third" title={copy.thirdTitle}>
        <ul>
          {copy.thirdItems.map(([strong, rest]) => (
            <li key={strong}>
              <strong>{strong}</strong>
              {rest}
            </li>
          ))}
        </ul>
      </Section>
      <Section id="rights" title={copy.rightsTitle}>
        <p>
          {copy.rightsPrefix}
          <ContactLink address={CONTACT_EMAIL} label={copy.rightsContactLabel} />
          {copy.rightsSuffix}
        </p>
      </Section>
    </PublicPage>
  );
}
