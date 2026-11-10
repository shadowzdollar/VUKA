import phoneImage from "@/assets/vuka-phone.png";
import { useLangCopy } from "@/lib/i18n";

const COPY = {
  en: {
    alt: "Illustrative preview of the VUKA mobile payment dashboard on a smartphone",
  },
  fr: {
    alt: "Aperçu illustratif du tableau de bord de paiement mobile VUKA sur un smartphone",
  },
  sw: {
    alt: "Mwonekano wa mfano wa dashibodi ya malipo ya simu ya VUKA kwenye simu janja",
  },
  pt: {
    alt: "Pré-visualização ilustrativa do painel de pagamentos móveis VUKA num smartphone",
  },
  rw: {
    alt: "Ishusho y'ikitegererezo y'ikibaho cy'ubwishyu kuri telefone ngendanwa cya VUKA",
  },
};

/** Illustrative device preview image — not a screenshot of the live product. */
export function PhoneMockup({ className = "" }: { className?: string }) {
  const c = useLangCopy(COPY);
  return (
    <img
      src={phoneImage}
      alt={c.alt}
      className={`block h-auto w-[280px] max-w-full ${className}`}
    />
  );
}
