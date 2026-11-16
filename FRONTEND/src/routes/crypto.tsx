import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CryptoPageClient } from "@/components/crypto/crypto-page-client";

export const Route = createFileRoute("/crypto")({
  head: () => ({
    meta: [{ title: "Crypto — VUKA" }],
  }),
  component: CryptoPage,
});

function CryptoPage() {
  return (
    <DashboardLayout>
      <CryptoPageClient />
    </DashboardLayout>
  );
}
