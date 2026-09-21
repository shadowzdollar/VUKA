import { createFileRoute } from "@tanstack/react-router";
import { StatusPage } from "@/components/vuka/pages/status-page";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "System status — VUKA" },
      { name: "description", content: "Live health of the VUKA engine and its dependencies." },
    ],
  }),
  component: StatusPage,
});
