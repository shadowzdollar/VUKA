import { createFileRoute } from "@tanstack/react-router";
import { SecurityPage } from "@/components/vuka/pages/security-page";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — VUKA" },
      {
        name: "description",
        content:
          "How VUKA protects traders and funds, what is not yet done, and how to report a vulnerability.",
      },
    ],
  }),
  component: SecurityPage,
});
