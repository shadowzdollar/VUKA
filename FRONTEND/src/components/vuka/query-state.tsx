import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { VukaMark } from "@/components/vuka/brand";
import { describeError, isApiError } from "@/lib/api/client";
import { useLangCopy, useT } from "@/lib/i18n";

const COPY = {
  en: {
    requestFailed: "Request failed",
    notEnabled: "This feature is not enabled on this engine.",
  },
  fr: {
    requestFailed: "Échec de la requête",
    notEnabled: "Cette fonctionnalité n'est pas activée sur ce moteur.",
  },
  sw: {
    requestFailed: "Ombi limeshindwa",
    notEnabled: "Kipengele hiki hakijawashwa kwenye mfumo huu.",
  },
  pt: {
    requestFailed: "Pedido falhou",
    notEnabled: "Esta funcionalidade não está ativada neste motor.",
  },
  rw: {
    requestFailed: "Icyifuzo cyanze",
    notEnabled: "Iki gice ntikirafungurwa kuri iyi sisitemu.",
  },
} as const;

/** Enterprise telemetry placeholder used while a request is in flight. */
export function Loading({ label }: { label?: string }) {
  const t = useT();
  const displayLabel = label ?? t("common.loading");
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/15 p-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#151515] text-white">
        <VukaMark className="size-4 animate-pulse" accent />
      </span>
      <div className="flex-1">
        <div>{displayLabel}…</div>
        <div className="mt-1.5 h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#79b200]" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/15 p-6 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT();
  const copy = useLangCopy(COPY);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-foreground bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
            {isApiError(error) ? `${copy.requestFailed} · ${error.code}` : copy.requestFailed}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{describeError(error)}</p>
        </div>
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg font-mono text-[10px] uppercase"
          onClick={onRetry}
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          {t("common.retry")}
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
  const copy = useLangCopy(COPY);
  if (query.isPending) return <Loading />;
  if (query.isError) {
    if (isApiError(query.error) && disabledCodes.includes(query.error.code)) {
      return (
        <EmptyState>
          {query.error.message}. {copy.notEnabled}
        </EmptyState>
      );
    }
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (isEmpty?.(query.data) && empty) return <EmptyState>{empty}</EmptyState>;
  return <>{children(query.data)}</>;
}
