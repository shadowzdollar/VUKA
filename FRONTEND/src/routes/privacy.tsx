import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/vuka/pages/privacy-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — VUKA" },
      { name: "description", content: "What VUKA stores, where, and why." },
    ],
  }),
  component: PrivacyPage,
});
