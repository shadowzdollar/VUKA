import { useState } from "react";
import { Play, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLangCopy } from "@/lib/i18n";

const COPY = {
  en: {
    title: "1-Click Trade Simulator",
    subtitle: "Simulate a live cross-border trade between Rwanda and Kenya from start to finish.",
    step1: "1. Raise Invoice",
    step1Desc: "Amina (Kigali, RWF) creates an invoice for Kethan (Nairobi, KES).",
    step2: "2. Lock Escrow",
    step2Desc: "Kethan pays via MoMo; funds convert and lock in on-chain escrow.",
    step3: "3. Delivery Confirmed",
    step3Desc: "Goods cross the corridor; completion confirmed by buyer.",
    step4: "4. Escrow Released",
    step4Desc: "Escrow unlocks; Amina receives payout in local RWF with trust score incremented.",
    startBtn: "Run Live Simulation",
    running: "Simulating trade...",
    completed: "Trade Cycle Completed Successfully!",
    resetBtn: "Reset Simulation",
  },
  fr: {
    title: "Simulateur de commerce en 1 clic",
    subtitle: "Simulez une transaction transfrontalière en direct entre le Rwanda et le Kenya de bout en bout.",
    step1: "1. Émettre la facture",
    step1Desc: "Amina (Kigali, RWF) crée une facture pour Kethan (Nairobi, KES).",
    step2: "2. Verrouiller le séquestre",
    step2Desc: "Kethan paie par MoMo ; les fonds sont convertis et bloqués sur la blockchain.",
    step3: "3. Livraison confirmée",
    step3Desc: "Les marchandises franchissent le corridor ; réception confirmée par l'acheteur.",
    step4: "4. Séquestre libéré",
    step4Desc: "Les fonds sont débloqués ; Amina reçoit son paiement en RWF et son score de confiance augmente.",
    startBtn: "Lancer la simulation en direct",
    running: "Simulation en cours...",
    completed: "Cycle commercial terminé avec succès !",
    resetBtn: "Réinitialiser la simulation",
  },
  sw: {
    title: "Kielelezo cha Biashara cha Mbofyo 1",
    subtitle: "Kielelezo cha biashara ya mipakani kati ya Rwanda na Kenya kuanzia mwanzo hadi mwisho.",
    step1: "1. Toa Ankara",
    step1Desc: "Amina (Kigali, RWF) anatengeneza ankara ya Kethan (Nairobi, KES).",
    step2: "2. Funga Escrow",
    step2Desc: "Kethan analipa kwa MoMo; fedha zinabadilishwa na kufungwa kwenye escrow.",
    step3: "3. Uwasilishaji Umethibitishwa",
    step3Desc: "Bidhaa zinavuka mpaka; uthibitisho unatolewa na mnunuzi.",
    step4: "4. Escrow Imefunguliwa",
    step4Desc: "Escrow inafunguliwa; Amina anapokea fedha zake kwa RWF na alama ya uaminifu inapanda.",
    startBtn: "Endesha Jaribio la Moja kwa Moja",
    running: "Inaendesha biashara...",
    completed: "Mzunguko wa biashara umekamilika kikamilifu!",
    resetBtn: "Anza Upya",
  },
  pt: {
    title: "Simulador de Comércio com 1 Clique",
    subtitle: "Simule uma transação transfronteiriça entre Ruanda e Quénia do início ao fim.",
    step1: "1. Emitir Fatura",
    step1Desc: "Amina (Kigali, RWF) cria uma fatura para Kethan (Nairobi, KES).",
    step2: "2. Bloquear Caução",
    step2Desc: "Kethan paga via MoMo; os fundos são convertidos e bloqueados na blockchain.",
    step3: "3. Entrega Confirmada",
    step3Desc: "As mercadorias chegam ao destino; receção confirmada pelo comprador.",
    step4: "4. Caução Libertada",
    step4Desc: "Fundos libertados; Amina recebe em RWF local e o índice de confiança aumenta.",
    startBtn: "Executar Simulação ao Vivo",
    running: "A simular transação...",
    completed: "Ciclo comercial concluído com sucesso!",
    resetBtn: "Reiniciar Simulação",
  },
  rw: {
    title: "Icyitegererezo cy'Ubucuruzi ku Kanda Rimwe",
    subtitle: "Gerageza ubucuruzi bwambukiranya imipaka hagati y'u Rwanda na Kenya kuva ku ntangiriro kugeza ku musozo.",
    step1: "1. Tanga Inyemezabuguzi",
    step1Desc: "Amina (Kigali, RWF) yanditse inyemezabuguzi ya Kethan (Nairobi, KES).",
    step2: "2. Funga Escrow",
    step2Desc: "Kethan yishyuye kuri MoMo; amafaranga ahindurwa kandi afungirwa muri escrow.",
    step3: "3. Emeza ko ibicuruzwa byageze",
    step3Desc: "Ibicuruzwa byambutse umupaka; byemejwe n'umuguzi.",
    step4: "4. Fungura Escrow",
    step4Desc: "Amafaranga arafungurwa; Amina yakiriye amafaranga ye mu RWF kandi icyizere kiriyongera.",
    startBtn: "Tangiza Igerageza",
    running: "Birimo gukora...",
    completed: "Ubucuruzi bwarangiye neza!",
    resetBtn: "Ongera utangire",
  },
};

export function TradeSimulatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = useLangCopy(COPY);
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);

  if (!open) return null;

  async function runSimulation() {
    setRunning(true);
    setActiveStep(1);
    await new Promise((r) => setTimeout(r, 1200));
    setActiveStep(2);
    await new Promise((r) => setTimeout(r, 1400));
    setActiveStep(3);
    await new Promise((r) => setTimeout(r, 1200));
    setActiveStep(4);
    setRunning(false);
  }

  function reset() {
    setActiveStep(0);
    setRunning(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#151515] text-[#c2f74d]">
                <ShieldCheck className="size-4" />
              </span>
              <h2 className="text-lg font-bold">{c.title}</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className={`rounded-xl border p-3.5 transition-all ${activeStep >= 1 ? "border-[#79b200] bg-[#f6fce8]" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{c.step1}</span>
              {activeStep >= 1 ? <CheckCircle2 className="size-4 text-[#79b200]" /> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.step1Desc}</p>
          </div>

          <div className={`rounded-xl border p-3.5 transition-all ${activeStep >= 2 ? "border-[#79b200] bg-[#f6fce8]" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{c.step2}</span>
              {activeStep >= 2 ? <CheckCircle2 className="size-4 text-[#79b200]" /> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.step2Desc}</p>
          </div>

          <div className={`rounded-xl border p-3.5 transition-all ${activeStep >= 3 ? "border-[#79b200] bg-[#f6fce8]" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{c.step3}</span>
              {activeStep >= 3 ? <CheckCircle2 className="size-4 text-[#79b200]" /> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.step3Desc}</p>
          </div>

          <div className={`rounded-xl border p-3.5 transition-all ${activeStep >= 4 ? "border-[#79b200] bg-[#f6fce8]" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{c.step4}</span>
              {activeStep >= 4 ? <CheckCircle2 className="size-4 text-[#79b200]" /> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.step4Desc}</p>
          </div>
        </div>

        {activeStep === 4 ? (
          <div className="mt-4 rounded-xl border border-[#79b200]/50 bg-[#c2f74d]/20 p-3 text-center text-xs font-semibold text-[#151515]">
            🎉 {c.completed}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          {activeStep === 4 ? (
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 rounded-lg text-xs">
              <RefreshCw className="size-3.5" /> {c.resetBtn}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg text-xs">
              Close
            </Button>
            {activeStep < 4 ? (
              <Button
                size="sm"
                onClick={runSimulation}
                disabled={running}
                className="gap-1.5 rounded-lg bg-[#151515] text-[#c2f74d] hover:bg-black/90 text-xs"
              >
                {running ? (
                  c.running
                ) : (
                  <>
                    <Play className="size-3.5" /> {c.startBtn} <ArrowRight className="size-3" />
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
