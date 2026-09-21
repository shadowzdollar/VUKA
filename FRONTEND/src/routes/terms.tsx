import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/vuka/pages/terms-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of use — VUKA" },
      { name: "description", content: "Draft terms of use for the VUKA platform." },
    ],
  }),
  component: TermsPage,
});
