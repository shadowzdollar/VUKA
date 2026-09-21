import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/vuka/pages/about-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — VUKA" },
      {
        name: "description",
        content: "Why VUKA exists, the principles it is built on, and where it is going.",
      },
    ],
  }),
  component: AboutPage,
});
