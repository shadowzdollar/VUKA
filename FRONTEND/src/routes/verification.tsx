import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
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
  const remaining = Math.max(0, cap - used);
  return (
    <div className="rounded-xl border border-border/80 bg-muted/15 p-3.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular font-mono font-semibold">
          {usd(used)} / {usd(cap)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={Math.round(used)}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#151515] to-[#79b200] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>{pct.toFixed(1)}% utilized</span>
        <span>{usd(remaining)} available</span>
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
      subtitle="Live transaction velocity caps and 3-tier verification roadmap"
      meta={<Chip tone={blocked ? "warn" : "invert"}>{standing.kyc_status.replace("_", " ")}</Chip>}
    >
      {blocked ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            Payments are currently disabled for this account ({standing.kyc_status}). Contact
            support to resolve your verification.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Metric
              label="Per payment"
              value={usd(standing.limits.per_txn_usd)}
              sub="Single transfer ceiling"
              accent="lime"
            />
            <Metric
              label="Per day"
              value={usd(standing.limits.daily_usd)}
              sub="Rolling 24-hour allowance"
            />
            <Metric
              label="Per month"
              value={usd(standing.limits.monthly_usd)}
              sub="Rolling 30-day allowance"
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
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
        </div>
      )}

      <ol className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Verification levels">
        {TIERS.map((tier, idx) => {
          const lim = tiers?.[tier.status];
          const current = tier.status === standing.kyc_status;
          return (
            <li
              key={tier.status}
              className={
                current
                  ? "relative overflow-hidden rounded-xl border-2 border-[#151515] bg-[#151515] p-4 text-white shadow-md"
                  : "rounded-xl border border-border/80 bg-card p-4"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      current
                        ? "flex size-5 items-center justify-center rounded bg-[#c2f74d] font-mono text-[10px] font-bold text-[#151515]"
                        : "flex size-5 items-center justify-center rounded bg-muted font-mono text-[10px] font-bold text-muted-foreground"
                    }
                  >
                    0{idx + 1}
                  </span>
                  <span className="text-sm font-semibold">{tier.name}</span>
                </div>
                {current ? <Chip tone="lime">You are here</Chip> : null}
              </div>
              <p
                className={
                  current
                    ? "mt-2 text-xs leading-relaxed text-white/70"
                    : "mt-2 text-xs leading-relaxed text-muted-foreground"
                }
              >
                {tier.needs}
              </p>
              {lim ? (
                <p
                  className={
                    current
                      ? "mt-3 border-t border-white/10 pt-2.5 font-mono text-[11px] text-[#c2f74d]"
                      : "mt-3 border-t border-border/60 pt-2.5 font-mono text-[11px] text-foreground"
                  }
                >
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

  const standing = kyc.data?.standing;

  return (
    <>
      <PageHeader
        eyebrow="Zero-Document Compliance Engine"
        title="Verification & Limits"
        description="Higher verification unlocks larger payments. VUKA never stores your documents: you keep them, and only a cryptographic fingerprint (or a reference from a verification provider) is filed."
      />

      {/* Executive Zero-Document Privacy Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[320px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/3 size-72 rounded-full bg-[#c2f74d]/10 blur-3xl"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <Fingerprint className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                Client-Side WebCrypto SHA-256 Attestation
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Prove Compliance Without Surrendering Raw Files
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              When you select a PDF or ID scan below, your browser computes an immutable{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-[#c2f74d]">
                hash:sha256:…
              </code>{" "}
              digest locally via WebCrypto. Only that 64-character hex digest or a registry URI (e.g.{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/90">
                registry://rdb/…
              </code>
              ) is transmitted to the VUKA engine.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                <Lock className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                Zero Cloud File Storage
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                <KeyRound className="size-3.5 text-emerald-400" aria-hidden="true" />
                Provider & Registry URI Compatible
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-xs backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                Active Compliance Posture
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#c2f74d]">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                {standing ? standing.kyc_status.replace("_", " ") : "LOADING"}
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-white/50">Single payment cap</dt>
                <dd className="font-bold text-white">
                  {standing ? usd(standing.limits.per_txn_usd) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">24h remaining</dt>
                <dd className="text-[#c2f74d]">
                  {standing
                    ? usd(Math.max(0, standing.limits.daily_usd - standing.used_day_usd))
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">Submissions on file</dt>
                <dd className="text-white">{kyc.data?.verifications.length ?? 0} records</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <QueryBoundary query={kyc}>
        {(data) =>
          data.standing ? (
            <StandingCard standing={data.standing} tiers={config.data?.kyc_limits ?? null} />
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Transaction limits are not configured on this engine.
            </p>
          )
        }
      </QueryBoundary>

      <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
        <Panel
          title="Submit evidence"
          subtitle="Fingerprint a local document or submit an external registry reference"
          meta={<ShieldCheck className="size-4 text-[#79b200]" aria-hidden="true" />}
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
                <SelectTrigger id="kyc-type" className="rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
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
                <label
                  key={value}
                  className={
                    mode === value
                      ? "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#151515] bg-muted/30 p-3 text-xs font-medium transition-colors"
                      : "flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-xs transition-colors hover:bg-muted/20"
                  }
                >
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
              <div className="space-y-2">
                <Label
                  htmlFor="kyc-file"
                  className="font-mono text-[10px] uppercase tracking-[0.16em]"
                >
                  Document
                </Label>
                <div className="rounded-xl border border-dashed border-border bg-muted/15 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Upload className="size-3.5 text-foreground" aria-hidden="true" />
                    <span>Select PDF or image (max 25 MB)</span>
                  </div>
                  <Input
                    id="kyc-file"
                    type="file"
                    accept="image/*,.pdf"
                    className="rounded-lg text-xs"
                    onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <p
                  className="rounded-lg bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground"
                  aria-live="polite"
                >
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
                  className="rounded-lg font-mono text-xs"
                  autoComplete="off"
                />
              </div>
            )}

            {error ? (
              <p
                role="alert"
                className="rounded-lg border-2 border-foreground bg-amber-500/10 p-3 text-xs font-medium"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full gap-2 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
              disabled={!evidenceRef || hashing || submit.isPending}
            >
              <FileCheck2 className="size-4 text-[#c2f74d]" aria-hidden="true" />
              {submit.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </form>
        </Panel>

        <Panel
          title="Your submissions"
          subtitle="Immutable audit trail of cryptographic evidence and compliance reviews"
          meta={<Chip>{kyc.data?.verifications.length ?? 0} filed</Chip>}
        >
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
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-0.5 font-mono text-xs capitalize">
                        {v.verification_type}
                      </span>
                    ),
                  },
                  {
                    key: "ref",
                    header: "Reference",
                    text: (v) => v.reference,
                    cell: (v) => (
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {v.reference.slice(0, 28)}…
                        </span>
                        {v.evidence_label ? (
                          <div className="text-[11px] text-muted-foreground/80">
                            {v.evidence_label}
                          </div>
                        ) : null}
                      </div>
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
