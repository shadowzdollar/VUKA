import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/vuka/data-table";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { platform } from "@/lib/api/endpoints";
import type { KycLimits, Standing } from "@/lib/api/types";
import { when } from "@/lib/format";
import { evidenceReferenceSchema, sha256File } from "@/lib/schemas";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Verification & Limits — VUKA" },
      {
        name: "description",
        content: "Your verification level, transaction limits and evidence submissions.",
      },
    ],
  }),
  component: () => (
    <Shell role="trader">
      <Verification />
    </Shell>
  ),
});

const TYPES = [
  { value: "identity", label: "Identity (national ID / passport)" },
  { value: "business", label: "Business registration" },
  { value: "address", label: "Proof of address" },
  { value: "ownership", label: "Beneficial ownership" },
];

const TIERS: { status: string; name: string; needs: string }[] = [
  { status: "PENDING", name: "Unverified", needs: "Phone number only. Small everyday payments." },
  { status: "VERIFIED", name: "Verified", needs: "Identity verified by the compliance team." },
  {
    status: "BUSINESS_VERIFIED",
    name: "Business verified",
    needs: "Identity and business registration verified. Trade-sized limits.",
  },
];

const usd = (n: number) => `USD ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function Meter({ label, used, cap }: { label: string; used: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular font-mono">
          {usd(used)} / {usd(cap)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={Math.round(used)}
        className="mt-1.5 h-1.5 w-full bg-muted"
      >
        <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StandingCard({
  standing,
  tiers,
}: {
  standing: Standing;
  tiers: Record<string, KycLimits> | null;
}) {
  const blocked = standing.limits.per_txn_usd <= 0;
  return (
    <Panel
      title="Your standing"
      meta={<Chip tone={blocked ? "warn" : "invert"}>{standing.kyc_status.replace("_", " ")}</Chip>}
    >
      {blocked ? (
        <p role="alert" className="border-2 border-foreground p-3 text-sm">
          Payments are currently disabled for this account ({standing.kyc_status}). Contact support
          to resolve your verification.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Per payment" value={usd(standing.limits.per_txn_usd)} />
            <Metric label="Per day" value={usd(standing.limits.daily_usd)} />
            <Metric label="Per month" value={usd(standing.limits.monthly_usd)} />
          </div>
          <Meter
            label="Used in the last 24 hours"
            used={standing.used_day_usd}
            cap={standing.limits.daily_usd}
          />
          <Meter
            label="Used in the last 30 days"
            used={standing.used_month_usd}
            cap={standing.limits.monthly_usd}
          />
        </div>
      )}
      <ol className="mt-6 grid gap-2 sm:grid-cols-3" aria-label="Verification levels">
        {TIERS.map((tier) => {
          const lim = tiers?.[tier.status];
          const current = tier.status === standing.kyc_status;
          return (
            <li
              key={tier.status}
              className={current ? "border-2 border-foreground p-3" : "border border-border p-3"}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{tier.name}</span>
                {current ? <Chip tone="invert">You are here</Chip> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{tier.needs}</p>
              {lim ? (
                <p className="mt-2 font-mono text-[11px]">
                  {usd(lim.per_txn_usd)} per payment · {usd(lim.daily_usd)} / day
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function Verification() {
  const qc = useQueryClient();
  const kyc = useQuery({ queryKey: ["kyc"], queryFn: platform.kyc });
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
  });

  const [type, setType] = useState("identity");
  const [mode, setMode] = useState<"file" | "reference">("file");
  const [file, setFile] = useState<File | null>(null);
  const [digest, setDigest] = useState("");
  const [reference, setReference] = useState("");
  const [hashing, setHashing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(f: File | null) {
    setFile(f);
    setDigest("");
    setError(null);
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      setError("Choose a file under 25 MB.");
      return;
    }
    setHashing(true);
    try {
      setDigest(await sha256File(f));
    } catch {
      setError("Could not read that file.");
    } finally {
      setHashing(false);
    }
  }

  const evidenceRef = mode === "file" ? (digest ? `hash:sha256:${digest}` : "") : reference.trim();

  const submit = useMutation({
    mutationFn: () => {
      const parsed = evidenceReferenceSchema.safeParse(evidenceRef);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid reference");
      const label = mode === "file" && file ? `${file.name} (hash only)` : undefined;
      return platform.submitKyc({
        verification_type: type,
        reference: parsed.data,
        ...(label ? { evidence_label: label.slice(0, 160) } : {}),
      });
    },
    onSuccess: () => {
      toast.success("Evidence submitted", { description: "The compliance team will review it." });
      setFile(null);
      setDigest("");
      setReference("");
      void qc.invalidateQueries({ queryKey: ["kyc"] });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e) => setError(describeError(e)),
  });

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Verification & Limits"
        description="Higher verification unlocks larger payments. VUKA never stores your documents: you keep them, and only a cryptographic fingerprint (or a reference from a verification provider) is filed."
      />

      <QueryBoundary query={kyc}>
        {(data) =>
          data.standing ? (
            <StandingCard standing={data.standing} tiers={config.data?.kyc_limits ?? null} />
          ) : (
            <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
              Transaction limits are not configured on this engine.
            </p>
          )
        }
      </QueryBoundary>

      <div className="grid gap-3 lg:grid-cols-[420px_1fr]">
        <Panel
          title="Submit evidence"
          meta={<ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              submit.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="kyc-type"
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
              >
                What are you verifying?
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="kyc-type" className="rounded-none text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <fieldset className="space-y-2">
              <legend className="font-mono text-[10px] uppercase tracking-[0.16em]">
                How do you want to file it?
              </legend>
              {(
                [
                  ["file", "Fingerprint a document on this device"],
                  ["reference", "I have a provider / registry reference"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="kyc-mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => {
                      setMode(value);
                      setError(null);
                    }}
                    className="size-4 accent-foreground"
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            {mode === "file" ? (
              <div className="space-y-1.5">
                <Label
                  htmlFor="kyc-file"
                  className="font-mono text-[10px] uppercase tracking-[0.16em]"
                >
                  Document
                </Label>
                <Input
                  id="kyc-file"
                  type="file"
                  accept="image/*,.pdf"
                  className="rounded-none text-xs"
                  onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-[11px] text-muted-foreground" aria-live="polite">
                  {hashing
                    ? "Computing fingerprint…"
                    : digest
                      ? `SHA-256 ${digest.slice(0, 16)}… computed locally. The file is not uploaded.`
                      : "The file never leaves your device."}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label
                  htmlFor="kyc-ref"
                  className="font-mono text-[10px] uppercase tracking-[0.16em]"
                >
                  Reference
                </Label>
                <Input
                  id="kyc-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="provider://smile-id/job/…  or  registry://rdb/…"
                  className="rounded-none font-mono text-xs"
                  autoComplete="off"
                />
              </div>
            )}

            {error ? (
              <p role="alert" className="border-2 border-foreground p-3 text-xs">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full gap-2 rounded-none font-mono text-xs uppercase"
              disabled={!evidenceRef || hashing || submit.isPending}
            >
              <FileCheck2 className="size-4" aria-hidden="true" />
              {submit.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </form>
        </Panel>

        <Panel title="Your submissions">
          <QueryBoundary query={kyc}>
            {(data) => (
              <DataTable
                caption="Verification submissions"
                rows={data.verifications}
                rowKey={(v) => v.id}
                searchable={false}
                empty="Nothing submitted yet."
                initialSort={{ key: "when", dir: "desc" }}
                columns={[
                  {
                    key: "type",
                    header: "Type",
                    sort: (v) => v.verification_type,
                    cell: (v) => (
                      <span className="font-mono text-xs capitalize">{v.verification_type}</span>
                    ),
                  },
                  {
                    key: "ref",
                    header: "Reference",
                    text: (v) => v.reference,
                    cell: (v) => (
                      <span className="font-mono text-xs text-muted-foreground">
                        {v.reference.slice(0, 28)}…
                      </span>
                    ),
                  },
                  {
                    key: "when",
                    header: "Submitted",
                    sort: (v) => v.created_at,
                    cell: (v) => (
                      <span className="tabular font-mono text-xs">{when(v.created_at)}</span>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    align: "right",
                    sort: (v) => v.status,
                    cell: (v) => (
                      <Chip
                        tone={
                          v.status === "verified"
                            ? "invert"
                            : v.status === "pending"
                              ? "live"
                              : "warn"
                        }
                      >
                        {v.status}
                      </Chip>
                    ),
                  },
                ]}
              />
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </>
  );
}
