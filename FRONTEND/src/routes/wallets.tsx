import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/vuka/shell";

/**
 * Layout for /wallets and /wallets/$id: shared trader Shell chrome, with the list
 * (wallets.index.tsx) or a single account's detail (wallets.$id.tsx) rendered through the outlet.
 */
export const Route = createFileRoute("/wallets")({
  component: () => (
    <Shell role="trader">
      <Outlet />
    </Shell>
  ),
});
