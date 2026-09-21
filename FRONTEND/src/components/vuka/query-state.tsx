import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { describeError, isApiError } from "@/lib/api/client";

/** Monochrome placeholder used while a request is in flight. */
export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="border border-dashed border-border p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {label}…
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  // Weight, not colour, marks an error (frontend_color_guidelines.md): a heavy border.
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
          {isApiError(error) ? `Request failed · ${error.code}` : "Request failed"}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{describeError(error)}</p>
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-none font-mono text-[10px] uppercase"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Renders loading / error / empty / data for a query so every page handles all four states.
 * `disabledCodes` turns known "feature not configured on this engine" answers into a calm notice
 * instead of an error (e.g. reconciliation_disabled when no chain RPC is configured).
 */
export function QueryBoundary<T>({
  query,
  children,
  empty,
  isEmpty,
  disabledCodes = [],
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  disabledCodes?: string[];
}) {
  if (query.isPending) return <Loading />;
  if (query.isError) {
    if (isApiError(query.error) && disabledCodes.includes(query.error.code)) {
      return (
        <EmptyState>{query.error.message}. This feature is not enabled on this engine.</EmptyState>
      );
    }
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (isEmpty?.(query.data) && empty) return <EmptyState>{empty}</EmptyState>;
  return <>{children(query.data)}</>;
}
