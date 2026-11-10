import { Link } from "@tanstack/react-router";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { ContactLink, CONTACT_EMAIL, PublicPage, Section } from "../public-page";

interface AboutCopy {
  kicker: string;
  titlePrefix: string;
  titleEm: string;
  titleSuffix: string;
  lead: string;
  photoAlt: string;
  toc: { id: string; label: string }[];
  problemTitle: string;
  problemP1: string;
  problemP2: string;
  principlesTitle: string;
  principles: [string, string][];
  roadmapTitle: string;
  roadmapLead: string;
  roadmapHere: string;
  roadmap: [string, string, string[]][];
  accessibilityTitle: string;
  accessibilityP1: string;
  accessibilityLimitsLabel: string;
  accessibilityLimitsBody: string;
  contactTitle: string;
  contactPrefix: string;
  contactLabel: string;
  contactMid: string;
  contactSecurityLink: string;
}

const COPY: Record<Lang, AboutCopy> = {
  en: {
    kicker: "About VUKA",
    titlePrefix: "Rise and ",
    titleEm: "cross over",
    titleSuffix: ": trade that trusts the rules.",
    lead: "VUKA is a cross-border payment platform for African small and medium businesses. It combines mobile-money payouts, a transparent double-entry ledger and smart-contract escrow so that a trader in one country can pay a supplier in another without hoping the other side keeps their word.",
    photoAlt: "Aerial view of a busy produce market in Lagos, Nigeria",
    toc: [
      { id: "problem", label: "The problem" },
      { id: "principles", label: "Principles" },
      { id: "roadmap", label: "Roadmap" },
      { id: "accessibility", label: "Accessibility" },
      { id: "contact", label: "Contact" },
    ],
    problemTitle: "The problem we are working on",
    problemP1:
      "Intra-African trade is held back by three frictions: uncertain cost, uncertain counterparties, and slow or fragmented settlement across currencies and payment rails. Small traders feel all three most, and have the least recourse when something goes wrong.",
    problemP2:
      "VUKA's answer is deliberately modest: make the cost visible, make the money conditional on delivery, and make the record complete. It does not replace banks or mobile-money operators; it connects to them.",
    principlesTitle: "Principles",
    principles: [
      [
        "Enforce, don't promise",
        "Where a rule matters — who gets paid, when, and how much — it lives in code that anyone can read, not in a policy someone can waive.",
      ],
      [
        "Show the price first",
        "Every fee, rate and delivered amount is visible before a trader commits. A number that appears afterwards is a defect.",
      ],
      [
        "Fail closed",
        "If a screening check, a signature or a limit cannot be verified, the payment does not proceed. We prefer a refused payment to an uncertain one.",
      ],
      [
        "Say what is not done",
        "Sandbox rails, first-pass translations and unaudited contracts are labelled as such. Trust is earned by being precise about limits.",
      ],
      [
        "Small businesses first",
        "The people who most need safer cross-border trade are SMEs with thin margins. Every default is chosen for them, not for institutions.",
      ],
      [
        "Built to be inspected",
        "Double-entry ledger, public escrow rules, exportable activity, tables behind every chart. Auditors are a user group, not an obstacle.",
      ],
    ],
    roadmapTitle: "Roadmap",
    roadmapLead:
      "Dates are deliberately absent: each step depends on licensing, audit and partner agreements that are outside the engineering team's control.",
    roadmapHere: "here",
    roadmap: [
      [
        "Now",
        "Sandbox platform",
        [
          "Ten launch markets with sandbox rails",
          "Escrow V2 contracts on a public test network",
          "Firm quotes, tiered KYC limits, trust score, analytics",
        ],
      ],
      [
        "Next",
        "Pilot readiness",
        [
          "Independent smart-contract audit",
          "Native-speaker review of all translations",
          "First live rails (MTN MoMo, M-Pesa) under a licensed partner, capped pilot",
        ],
      ],
      [
        "Then",
        "Regional rollout",
        [
          "Remaining rails: Vodacom, Airtel, Orange, Telebirr, NIBSS, instant EFT",
          "Licensed FX and liquidity provider replacing reference rates",
          "Regulatory engagement per corridor",
        ],
      ],
      [
        "Later",
        "Continental network",
        [
          "Interoperability with pan-African payment systems",
          "Expansion beyond the launch markets",
          "Open, documented APIs for banks and fintechs",
        ],
      ],
    ],
    accessibilityTitle: "Accessibility statement",
    accessibilityP1:
      "We aim for conformance with WCAG 2.1 level AA. The interface is keyboard operable, uses semantic landmarks and labelled controls, respects reduced-motion and light/dark preferences, and every chart has an equivalent data table.",
    accessibilityLimitsLabel: "Known limits:",
    accessibilityLimitsBody:
      " non-English translations are first-pass; the decorative globe on the home page is pointer-driven but has button and market-list alternatives. We test with automated tooling; that does not find everything, so please tell us if you hit a barrier.",
    contactTitle: "Contact",
    contactPrefix: "General enquiries and accessibility reports: ",
    contactLabel: "Contact address",
    contactMid: ". Security reports go to the address on the ",
    contactSecurityLink: "security page",
  },
  fr: {
    kicker: "À propos de VUKA",
    titlePrefix: "Se lever et ",
    titleEm: "traverser",
    titleSuffix: " : le commerce qui fait confiance aux règles.",
    lead: "VUKA est une plateforme de paiement transfrontalier pour les petites et moyennes entreprises africaines. Elle combine des paiements par monnaie mobile, un registre à double entrée transparent et un séquestre par contrat intelligent afin qu'un commerçant d'un pays puisse payer un fournisseur dans un autre sans simplement espérer que l'autre partie tienne parole.",
    photoAlt: "Vue aérienne d'un marché de produits frais animé à Lagos, au Nigeria",
    toc: [
      { id: "problem", label: "Le problème" },
      { id: "principles", label: "Principes" },
      { id: "roadmap", label: "Feuille de route" },
      { id: "accessibility", label: "Accessibilité" },
      { id: "contact", label: "Contact" },
    ],
    problemTitle: "Le problème sur lequel nous travaillons",
    problemP1:
      "Le commerce intra-africain est freiné par trois frictions : des coûts incertains, des contreparties incertaines et un règlement lent ou fragmenté entre devises et réseaux de paiement. Les petits commerçants subissent le plus ces trois obstacles et disposent du moins de recours en cas de problème.",
    problemP2:
      "La réponse de VUKA est volontairement sobre : rendre le coût visible, conditionner l'argent à la livraison et tenir un registre complet. Elle ne remplace ni les banques ni les opérateurs de monnaie mobile ; elle s'y connecte.",
    principlesTitle: "Principes",
    principles: [
      [
        "Garantir plutôt que promettre",
        "Lorsqu'une règle compte — qui est payé, quand et combien — elle est inscrite dans un code lisible par tous, et non dans une politique qu'on peut contourner.",
      ],
      [
        "Afficher le prix d'abord",
        "Chaque frais, taux et montant livré est visible avant l'engagement du commerçant. Un chiffre qui apparaît après coup est un défaut.",
      ],
      [
        "Échec sécurisé (fail closed)",
        "Si un contrôle de conformité, une signature ou un plafond ne peut être vérifié, le paiement n'aboutit pas. Nous préférons un paiement refusé à un paiement incertain.",
      ],
      [
        "Dire ce qui n'est pas encore fait",
        "Les rails bac à sable, les traductions de première passe et les contrats non audités sont signalés comme tels. La confiance se gagne par la précision sur nos limites.",
      ],
      [
        "Les petites entreprises d'abord",
        "Ceux qui ont le plus besoin d'un commerce transfrontalier sûr sont les PME à faibles marges. Chaque réglage par défaut est conçu pour elles, pas pour les institutions.",
      ],
      [
        "Conçu pour être inspecté",
        "Registre à double entrée, règles de séquestre publiques, activité exportable, tableaux derrière chaque graphique. Les auditeurs sont un groupe d'utilisateurs, pas un obstacle.",
      ],
    ],
    roadmapTitle: "Feuille de route",
    roadmapLead:
      "Les dates sont volontairement absentes : chaque étape dépend d'agréments, d'audits et d'accords partenaires qui ne dépendent pas uniquement de l'équipe d'ingénierie.",
    roadmapHere: "ici",
    roadmap: [
      [
        "Aujourd'hui",
        "Plateforme bac à sable",
        [
          "Dix marchés de lancement avec rails simulés",
          "Contrats Escrow V2 sur un réseau de test public",
          "Cotations fermes, plafonds KYC par palier, score de confiance, analyses",
        ],
      ],
      [
        "Ensuite",
        "Préparation au pilote",
        [
          "Audit indépendant des contrats intelligents",
          "Révision de toutes les traductions par des locuteurs natifs",
          "Premiers rails réels (MTN MoMo, M-Pesa) via un partenaire agréé, pilote plafonné",
        ],
      ],
      [
        "Puis",
        "Déploiement régional",
        [
          "Autres rails : Vodacom, Airtel, Orange, Telebirr, NIBSS, virement instantané",
          "Fournisseur agréé de change et de liquidité remplaçant les taux de référence",
          "Engagement réglementaire par corridor",
        ],
      ],
      [
        "Plus tard",
        "Réseau continental",
        [
          "Interopérabilité avec les systèmes de paiement panafricains",
          "Expansion au-delà des marchés de lancement",
          "API ouvertes et documentées pour les banques et fintechs",
        ],
      ],
    ],
    accessibilityTitle: "Déclaration d'accessibilité",
    accessibilityP1:
      "Nous visons la conformité WCAG 2.1 niveau AA. L'interface est utilisable au clavier, utilise des repères sémantiques et des contrôles étiquetés, respecte les préférences de réduction de mouvement et de thème clair/sombre, et chaque graphique dispose d'un tableau de données équivalent.",
    accessibilityLimitsLabel: "Limites connues :",
    accessibilityLimitsBody:
      " les traductions non anglaises sont de première passe ; le globe décoratif de la page d'accueil est piloté au pointeur mais dispose d'alternatives par boutons et liste de marchés. Nos tests automatisés ne détectent pas tout : signalez-nous tout obstacle rencontré.",
    contactTitle: "Contact",
    contactPrefix: "Demandes générales et signalements d'accessibilité : ",
    contactLabel: "Adresse de contact",
    contactMid: ". Les signalements de sécurité sont à adresser sur la ",
    contactSecurityLink: "page sécurité",
  },
  sw: {
    kicker: "Kuhusu VUKA",
    titlePrefix: "Inuka na ",
    titleEm: "uvuke mipaka",
    titleSuffix: ": biashara inayoamini sheria.",
    lead: "VUKA ni jukwaa la malipo ya kuvuka mipaka kwa biashara ndogo na za kati barani Afrika. Linachanganya malipo ya pesa za simu, leja wazi ya maingizo mawili na escrow ya mkataba mahiri ili mfanyabiashara katika nchi moja aweze kumlipa muuzaji katika nchi nyingine bila kutegemea tu ahadi ya mdomo.",
    photoAlt: "Mwonekano wa angani wa soko lenye shughuli nyingi huko Lagos, Nigeria",
    toc: [
      { id: "problem", label: "Tatizo" },
      { id: "principles", label: "Kanuni" },
      { id: "roadmap", label: "Mpango wa maendeleo" },
      { id: "accessibility", label: "Ufikivu" },
      { id: "contact", label: "Mawasiliano" },
    ],
    problemTitle: "Tatizo tunalolifanyia kazi",
    problemP1:
      "Biashara ndani ya Afrika inakwamishwa na vikwazo vitatu: gharama zisizo na uhakika, washirika wa biashara wasiojulikana vizuri, na malipo ya polepole au yaliyogawanyika kati ya sarafu na mifumo ya malipo. Wafanyabiashara wadogo ndio wanaoumia zaidi na hawana pa kukimbilia mambo yanapoharibika.",
    problemP2:
      "Jibu la VUKA ni rahisi na la makusudi: weka gharama wazi, fungamanisha pesa na utoaji wa bidhaa, na weka kumbukumbu kamili. Haichukui nafasi ya benki au kampuni za simu; inaungana nazo.",
    principlesTitle: "Kanuni",
    principles: [
      [
        "Tekeleza, usiahidi tu",
        "Pale sheria inapohitajika — nani analipwa, lini, na kiasi gani — inawekwa kwenye msimbo ambao mtu yeyote anaweza kusoma, si kwenye sera inayoweza kupindishwa.",
      ],
      [
        "Onyesha bei kwanza",
        "Kila ada, kiwango cha ubadilishaji na kiasi kinachofika kinaonekana kabla mfanyabiashara hajakubali. Nambari inayojitokeza baadaye ni kasoro.",
      ],
      [
        "Simama ikiwa kuna shaka (fail closed)",
        "Ikiwa ukaguzi wa usalama, sahihi au kiwango cha kikomo hakiwezi kuthibitishwa, malipo hayaendelei. Tunapendelea malipo yaliyokataliwa kuliko yasiyo na uhakika.",
      ],
      [
        "Sema kile ambacho bado hakijafanyika",
        "Njia za majaribio (sandbox), tafsiri za awali na mikataba ambayo haijakaguliwa inawekwa wazi hivyo. Uaminifu unapatikana kwa kuwa wakweli kuhusu mipaka yetu.",
      ],
      [
        "Biashara ndogo kwanza",
        "Watu wanaohitaji zaidi biashara salama ya kuvuka mipaka ni biashara ndogo na za kati (SMEs). Kila chaguo la msingi limewekwa kwa ajili yao, si kwa taasisi kubwa.",
      ],
      [
        "Imejengwa ili kukaguliwa",
        "Leja ya maingizo mawili, sheria za wazi za escrow, shughuli zinazoweza kuhamishwa, na majedwali nyuma ya kila chati. Wakaguzi ni watumiaji wetu, si kikwazo.",
      ],
    ],
    roadmapTitle: "Mpango wa maendeleo",
    roadmapLead:
      "Tarehe hazijawekwa kwa makusudi: kila hatua inategemea leseni, ukaguzi na mikataba ya washirika iliyo nje ya uwezo wa timu ya uhandisi pekee.",
    roadmapHere: "hapa",
    roadmap: [
      [
        "Sasa",
        "Jukwaa la majaribio (Sandbox)",
        [
          "Masoko kumi ya uzinduzi yenye njia za majaribio",
          "Mikataba ya Escrow V2 kwenye mtandao wa majaribio wa umma",
          "Nukuu thabiti, viwango vya KYC kwa ngazi, alama ya uaminifu, uchambuzi",
        ],
      ],
      [
        "Inayofuata",
        "Utayari wa majaribio halisi (Pilot)",
        [
          "Ukaguzi huru wa mikataba mahiri (smart contracts)",
          "Uhakiki wa tafsiri zote na wazungumzaji wazawa",
          "Njia za kwanza halisi (MTN MoMo, M-Pesa) chini ya mshirika mwenye leseni",
        ],
      ],
      [
        "Kisha",
        "Upanuzi wa kikanda",
        [
          "Njia zilizosalia: Vodacom, Airtel, Orange, Telebirr, NIBSS, EFT ya papo hapo",
          "Mtoa huduma wa FX na ukwasi mwenye leseni kuchukua nafasi ya viwango elekezi",
          "Ushirikiano na wadhibiti katika kila njia ya malipo",
        ],
      ],
      [
        "Baadaye",
        "Mtandao wa bara zima",
        [
          "Muunganisho na mifumo ya malipo ya Afrika nzima",
          "Upanuzi zaidi ya masoko ya uzinduzi",
          "API zilizo wazi na zenye maelezo kwa benki na fintechs",
        ],
      ],
    ],
    accessibilityTitle: "Taarifa ya ufikivu",
    accessibilityP1:
      "Tunalenga kufikia viwango vya WCAG 2.1 kiwango cha AA. Kiolesura kinatumika kwa kibodi, kinatumia alama za kisemantiki na vidhibiti vilivyo na lebo, kinaheshimu mapendeleo ya mwendo mdogo na mwanga/giza, na kila chati ina jedwali la data sawa.",
    accessibilityLimitsLabel: "Mipaka inayojulikana:",
    accessibilityLimitsBody:
      " tafsiri zisizo za Kiingereza ni za awali; tufe la mapambo kwenye ukurasa wa mwanzo linatumia kipanya lakini lina mbadala wa vitufe na orodha ya masoko. Tunajaribu kwa zana za kiotomatiki; hazipati kila kitu, hivyo tafadhali tufahamishe ukikumbana na kikwazo.",
    contactTitle: "Mawasiliano",
    contactPrefix: "Maswali ya jumla na ripoti za ufikivu: ",
    contactLabel: "Anwani ya mawasiliano",
    contactMid: ". Ripoti za usalama zinatumwa kwa anwani iliyo kwenye ",
    contactSecurityLink: "ukurasa wa usalama",
  },
  pt: {
    kicker: "Sobre a VUKA",
    titlePrefix: "Levante-se e ",
    titleEm: "atravesse",
    titleSuffix: ": comércio que confia nas regras.",
    lead: "A VUKA é uma plataforma de pagamentos transfronteiriços para pequenas e médias empresas africanas. Combina pagamentos por dinheiro móvel, um livro-razão transparente de partidas dobradas e caução (escrow) por contrato inteligente para que um comerciante num país possa pagar a um fornecedor noutro sem depender apenas da palavra da outra parte.",
    photoAlt: "Vista aérea de um mercado de produtos frescos movimentado em Lagos, Nigéria",
    toc: [
      { id: "problem", label: "O problema" },
      { id: "principles", label: "Princípios" },
      { id: "roadmap", label: "Roteiro" },
      { id: "accessibility", label: "Acessibilidade" },
      { id: "contact", label: "Contacto" },
    ],
    problemTitle: "O problema em que estamos a trabalhar",
    problemP1:
      "O comércio intra-africano é travado por três fricções: custo incerto, contrapartes incertas e liquidação lenta ou fragmentada entre moedas e canais de pagamento. Os pequenos comerciantes sentem estes três problemas de forma mais aguda e têm menos recurso quando algo corre mal.",
    problemP2:
      "A resposta da VUKA é deliberadamente modesta: tornar o custo visível, tornar o dinheiro condicional à entrega e manter o registo completo. Não substitui bancos nem operadores de dinheiro móvel; liga-se a eles.",
    principlesTitle: "Princípios",
    principles: [
      [
        "Aplicar, não apenas prometer",
        "Onde uma regra importa — quem recebe, quando e quanto — ela vive em código que qualquer pessoa pode ler, não numa política que alguém possa dispensar.",
      ],
      [
        "Mostrar o preço primeiro",
        "Cada comissão, taxa e montante entregue é visível antes de o comerciante se comprometer. Um número que aparece depois é um defeito.",
      ],
      [
        "Falhar em segurança (fail closed)",
        "Se uma verificação de conformidade, uma assinatura ou um limite não puder ser confirmado, o pagamento não avança. Preferimos um pagamento recusado a um pagamento incerto.",
      ],
      [
        "Dizer o que ainda não está feito",
        "Canais sandbox, traduções de primeira passagem e contratos não auditados são identificados como tal. A confiança conquista-se sendo preciso sobre os limites.",
      ],
      [
        "Pequenas empresas primeiro",
        "Quem mais precisa de comércio transfronteiriço seguro são as PME com margens reduzidas. Cada predefinição é escolhida para elas, não para instituições.",
      ],
      [
        "Construído para ser inspecionado",
        "Razão de partidas dobradas, regras públicas de caução, atividade exportável, tabelas por trás de cada gráfico. Os auditores são um grupo de utilizadores, não um obstáculo.",
      ],
    ],
    roadmapTitle: "Roteiro",
    roadmapLead:
      "As datas estão deliberadamente ausentes: cada etapa depende de licenciamento, auditoria e acordos de parceria que estão fora do controlo exclusivo da equipa de engenharia.",
    roadmapHere: "aqui",
    roadmap: [
      [
        "Agora",
        "Plataforma sandbox",
        [
          "Dez mercados de lançamento com canais simulados",
          "Contratos Escrow V2 numa rede de testes pública",
          "Cotações firmes, limites KYC por escalão, pontuação de confiança, análises",
        ],
      ],
      [
        "Seguinte",
        "Preparação para piloto",
        [
          "Auditoria independente de contratos inteligentes",
          "Revisão de todas as traduções por falantes nativos",
          "Primeiros canais reais (MTN MoMo, M-Pesa) sob parceiro licenciado, piloto limitado",
        ],
      ],
      [
        "Depois",
        "Expansão regional",
        [
          "Restantes canais: Vodacom, Airtel, Orange, Telebirr, NIBSS, transferência instantânea",
          "Fornecedor licenciado de câmbios e liquidez a substituir taxas de referência",
          "Envolvimento regulatório por corredor",
        ],
      ],
      [
        "Mais tarde",
        "Rede continental",
        [
          "Interoperabilidade com sistemas de pagamento pan-africanos",
          "Expansão além dos mercados de lançamento",
          "APIs abertas e documentadas para bancos e fintechs",
        ],
      ],
    ],
    accessibilityTitle: "Declaração de acessibilidade",
    accessibilityP1:
      "Procuramos a conformidade com as WCAG 2.1 nível AA. A interface é operável por teclado, utiliza marcos semânticos e controlos identificados, respeita as preferências de movimento reduzido e tema claro/escuro, e cada gráfico tem uma tabela de dados equivalente.",
    accessibilityLimitsLabel: "Limites conhecidos:",
    accessibilityLimitsBody:
      " as traduções não inglesas são de primeira passagem; o globo decorativo na página inicial é controlado por ponteiro, mas tem alternativas em botões e lista de mercados. Testamos com ferramentas automatizadas; isso não deteta tudo, por isso avise-nos se encontrar uma barreira.",
    contactTitle: "Contacto",
    contactPrefix: "Questões gerais e relatórios de acessibilidade: ",
    contactLabel: "Endereço de contacto",
    contactMid: ". Relatórios de segurança devem ser enviados para o endereço na ",
    contactSecurityLink: "página de segurança",
  },
  rw: {
    kicker: "Ibyerekeye VUKA",
    titlePrefix: "Haguruka ",
    titleEm: "wambuke imipaka",
    titleSuffix: ": ubucuruzi bwiringira amategeko.",
    lead: "VUKA ni urubuga rw'ubwishyu bwambukiranya imipaka rugenewe ubucuruzi buto n'ubuciriritse bwo muri Afurika. Ruhuza ubwishyu bwa mobile money, igitabo cy'ibaruramari kiboneye na escrow ikoresha amasezerano yikoresha (smart contract) kugira ngo umucuruzi wo mu gihugu kimwe yishyure utanga ibicuruzwa mu kindi atishingikirije ku cyizere cy'amagambo gusa.",
    photoAlt: "Ifoto yo mu kirere y'isoko ry'ibiribwa rihuze i Lagos, muri Nijeriya",
    toc: [
      { id: "problem", label: "Ikibazo" },
      { id: "principles", label: "Amahame" },
      { id: "roadmap", label: "Icyerekezo" },
      { id: "accessibility", label: "Korohereza bose" },
      { id: "contact", label: "Twandikire" },
    ],
    problemTitle: "Ikibazo turimo gukemura",
    problemP1:
      "Ubucuruzi hagati y'ibihugu bya Afurika budindizwa n'inzitizi eshatu: ikiguzi kitizewe, abo mucuruzanya batizewe, n'ubwishyu butinda cyangwa butatanye mu mafaranga n'inzira z'ubwishyu zitandukanye. Abacuruzi bato ni bo bagerwaho cyane n'izo nzitizi kandi ni bo bafite uburyo buke bwo kwirengera iyo hagize ikigenda nabi.",
    problemP2:
      "Igisubizo cya VUKA cyoroshye ku bushake: kugaragaza ikiguzi mbere, guhuza amafaranga no kugeza ibicuruzwa ku muguzi, no kubika inyandiko yuzuye. Ntabwo isimbura amabanki cyangwa ibigo bya mobile money; ahubwo irabihuza.",
    principlesTitle: "Amahame",
    principles: [
      [
        "Kubahiriza amategeko, ntitwizeze gusa",
        "Aho itegeko rikenewe — uwishyurwa, ryari, n'angahe — riba ryanditse muri kode buri wese ashobora gusoma, atari muri politiki umuntu ashobora kwirengagiza.",
      ],
      [
        "Erekana igiciro mbere",
        "Buri kiguzi, igipimo cy'ivunjisha n'amafaranga agera ku uwishyurwa bigaragara mbere y'uko umucuruzi yemeza. Umubare ugaragaye nyuma ni ikosa.",
      ],
      [
        "Hagarara mu gihe hari gushidikanya (fail closed)",
        "Niba igenzura, umukono cyangwa urugero rwemewe bidashobora kugenzurwa, ubwishyu ntibukomeza. Duhitamo ubwishyu bwanze kuruta ubwishyu budafite gihamya.",
      ],
      [
        "Vuga ibitarakorwa",
        "Inzira z'igerageza (sandbox), ubuhinduzi bw'ibanze n'amasezerano atarakorerwa ubugenzuzi birangwa gutyo. Icyizere kigerwaho mu kuvugisha ukuri ku mbago zacu.",
      ],
      [
        "Ubucuruzi buto mbere na mbere",
        "Abakeneye cyane ubucuruzi bwambukiranya imipaka bwizewe ni ibigo bito n'ibiciriritse (SMEs). Buri mahitamo y'ibanze yashyizweho ku bwabyo, atari ku bigo binini.",
      ],
      [
        "Rwubakiwe kugenzurwa",
        "Igitabo cy'ibaruramari ry'impande ebyiri, amategeko ya escrow agaragarira bose, ibikorwa bishobora kuvanwamo muri CSV, n'imbonerahamwe inyuma ya buri gishushanyo.",
      ],
    ],
    roadmapTitle: "Icyerekezo",
    roadmapLead:
      "Amikiro ntiyashyizweho ku bushake: buri ntambwe iterwa n'impushya, ubugenzuzi n'amasezerano y'abafatanyabikorwa birenze ubushobozi bw'ikipe y'ubwubatsi bw'ikoranabuhanga yonyine.",
    roadmapHere: "aha",
    roadmap: [
      [
        "Ubu",
        "Urubuga rw'igerageza (Sandbox)",
        [
          "Amasoko icumi yatangirijweho afite inzira z'igerageza",
          "Amasezerano ya Escrow V2 ku rubuga rw'igerageza rusange",
          "Ibiciro bidahinduka, imbago za KYC mu byiciro, amanota y'icyizere, n'isesengura",
        ],
      ],
      [
        "Igikurikira",
        "Kwitegura igerageza nyaryo (Pilot)",
        [
          "Ubugenzuzi bwigenga bw'amasezerano yikoresha (smart contracts)",
          "Gusubiramo ubuhinduzi bwose n'abavuga izo ndimi kavukire",
          "Inzira za mbere nyazo (MTN MoMo, M-Pesa) binyuze ku mufatanyabikorwa ufite uruhushya",
        ],
      ],
      [
        "Nyuma yaho",
        "Kugeza serivisi mu karere",
        [
          "Izindi nzira: Vodacom, Airtel, Orange, Telebirr, NIBSS, EFT y'ako kanya",
          "Utanga serivisi z'ivunjisha ufite uruhushya usimbura ibipimo ngenderwaho",
          "Gukorana n'inzego zigenzura muri buri nzira y'ubwishyu",
        ],
      ],
      [
        "Mu gihe kizaza",
        "Umuyoboro mugari wa Afurika",
        [
          "Guhuza imikorere na sisitemu z'ubwishyu za Afurika yose",
          "Kwaguka tukarenga amasoko yatangirijweho",
          "API zifunguye kandi zisobanutse ku mabanki n'ibigo by'ikoranabuhanga mu by'imari",
        ],
      ],
    ],
    accessibilityTitle: "Itangazo ryo korohereza abakoresha bose",
    accessibilityP1:
      "Intego yacu ni ukubahiriza amabwiriza ya WCAG 2.1 ku rwego rwa AA. Urubuga rushobora gukoreshwa na mwandikisho (keyboard), rukoresha ibimenyetso bisobanutse, rwubahiriza amahitamo y'urumuri ruke cyangwa rwinshi, kandi buri gishushanyo gifite imbonerahamwe y'amakuru ihwanye na cyo.",
    accessibilityLimitsLabel: "Imbago zizwi:",
    accessibilityLimitsBody:
      " ubuhinduzi butari mu Cyongereza ni ubw'ibanze; umubumbe w'isi ku rupapuro rubanza ukoreshwa n'imbeba ya mudasobwa ariko ufite uburyo busimbura bwa buto n'urutonde rw'amasoko. Tugenzura dukoresheje ibikoresho byikoresha; ntibibona byose, bityo utumenyeshe nuhura n'imbogamizi.",
    contactTitle: "Twandikire",
    contactPrefix: "Ibibazo rusange na raporo ku korohereza abakoresha: ",
    contactLabel: "Aderesi yo kutwandikira",
    contactMid: ". Raporo zerekeye umutekano zohererezwa kuri aderesi iri ku ",
    contactSecurityLink: "rupapuro rw'umutekano",
  },
};

export function AboutPage() {
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
      photo={{
        src: "/images/landing/lagos-market.webp",
        alt: copy.photoAlt,
        credit: {
          location: "Lagos, Nigeria",
          credit: "Ayorinde Ogundele",
          license: "CC BY-SA 4.0",
          sourceUrl:
            "https://commons.wikimedia.org/wiki/File:Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg",
        },
      }}
      toc={copy.toc}
    >
      <Section id="problem" title={copy.problemTitle}>
        <p>{copy.problemP1}</p>
        <p>{copy.problemP2}</p>
      </Section>

      <Section id="principles" title={copy.principlesTitle}>
        <ol className="grid gap-3 sm:grid-cols-2">
          {copy.principles.map(([h, b], i) => (
            <li key={h} className="!ml-0 list-none border border-border bg-card p-5">
              <div className="font-mono text-[10px] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-1 font-display text-xl text-foreground">{h}</div>
              <p className="mt-2 text-sm">{b}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="roadmap" title={copy.roadmapTitle}>
        <p>{copy.roadmapLead}</p>
        <ol className="space-y-3">
          {copy.roadmap.map(([when, h, items], i) => (
            <li
              key={when}
              className="!ml-0 grid list-none gap-3 border border-border bg-card p-5 sm:grid-cols-[100px_1fr]"
            >
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                {when}
                {i === 0 ? (
                  <span className="ml-2 border border-foreground px-1 text-[9px]">{copy.roadmapHere}</span>
                ) : null}
              </div>
              <div>
                <div className="font-display text-xl text-foreground">{h}</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="accessibility" title={copy.accessibilityTitle}>
        <p>{copy.accessibilityP1}</p>
        <p>
          <strong>{copy.accessibilityLimitsLabel}</strong>
          {copy.accessibilityLimitsBody}
        </p>
      </Section>

      <Section id="contact" title={copy.contactTitle}>
        <p>
          {copy.contactPrefix}
          <ContactLink address={CONTACT_EMAIL} label={copy.contactLabel} />
          {copy.contactMid}
          <Link to="/security" className="underline underline-offset-4">
            {copy.contactSecurityLink}
          </Link>
          .
        </p>
      </Section>
    </PublicPage>
  );
}
