"use client";

import { SectionHeader } from "@/components/section-header";

export default function CalculatorPage() {
  return (
    <main className="page">
      <SectionHeader
        eyebrow="Outil interne"
        title="Simulateur de revenus événements"
        description="Modélise la billetterie de Speed Dating, Mixers, activités à thème et soirées spéciales. Ajuste les paramètres — tout se recalcule en temps réel."
      />

      <div className="calculator-frame-wrap">
        <iframe
          src="/calculator.html"
          title="Simulateur de revenus événements Crush.lu"
          className="calculator-frame"
        />
      </div>
    </main>
  );
}
