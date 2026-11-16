import { useRouter as useTanstackRouter, useLocation } from "@tanstack/react-router";

export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}

export function useSearchParams(): URLSearchParams {
  const location = useLocation();
  return new URLSearchParams(location.searchStr);
}

export function useRouter() {
  const router = useTanstackRouter();
  return {
    push: (path: string) => void router.navigate({ to: path as any }),
    replace: (path: string) => void router.navigate({ to: path as any, replace: true }),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => void router.invalidate(),
  };
}
