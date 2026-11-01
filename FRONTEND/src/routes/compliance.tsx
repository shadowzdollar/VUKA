import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, FileCheck2, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "@/components/vuka/landing/flags";
import { LazyDonutChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { compliance } from "@/lib/api/endpoints";
import type { Organization } from "@/lib/api/types";
import { shortId, when } from "@/lib/format";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & KYC — VUKA" },
      {
        name: "description",
        content:
          "Organizations, verification evidence, compliance reviews and risk flags with an explainable decision trail.",
      },
    ],
  }),
  component: () => (
    <Shell role="operator">
      <Compliance />
    </Shell>
  ),
});

type Tab = "organizations" | "verifications" | "reviews";

const ORG_TYPES = ["company", "sole_trader", "partnership", "cooperative", "nonprofit"];
const VERIFICATION_TYPES = ["identity", "business", "address", "ownership"];
const REVIEW_STATUSES = ["approved", "rejected", "suspended", "needs_information"];
const VERIFICATION_DECISIONS = ["verified", "rejected", "expired"];
const SEVERITIES = ["low", "medium", "high", "critical"];

function tally(values: string[]) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return Array.from(m, ([label, value]) => ({ label, value }));
}

const statusTone = (s: string) =>
  ["approved", "verified", "resolved"].includes(s)
    ? ("invert" as const)
    : ["rejected", "suspended", "expired", "critical", "high"].includes(s)
      ? ("warn" as const)
      : ("live" as const);

function Compliance() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("organizations");
  const orgs = useQuery({ queryKey: ["orgs"], queryFn: compliance.organizations });
  const verifications = useQuery({
    queryKey: ["verifications"],
    queryFn: compliance.verifications,
  });
  const reviews = useQuery({ queryKey: ["reviews"], queryFn: compliance.reviews });

  const [orgOpen, setOrgOpen] = useState(false);
  const [openOrg, setOpenOrg] = useState<Organization | null>(null);
  const [decide, setDecide] = useState<{ kind: "verification" | "review"; id: string } | null>(
    null,
  );
  const [newVerification, setNewVerification] = useState(false);
  const [newReviewFor, setNewReviewFor] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["orgs"] });
    void qc.invalidateQueries({ queryKey: ["verifications"] });
    void qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  const orgName = (id?: string) => orgs.data?.find((o) => o.id === id)?.legal_name ?? shortId(id);

  return (
    <>
      <PageHeader
        eyebrow="Regulatory gateway"
        title="Compliance & KYC"
        description="Verification is proportionate to exposure. Every decision records who made it, from which state to which, and why — the log is append-only."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setNewVerification(true)}
              className="gap-1.5 rounded-lg font-mono text-xs uppercase"
            >
              <FileCheck2 className="size-3.5 text-[#79b200]" aria-hidden="true" />
              Submit evidence
            </Button>
            <Button
              onClick={() => setOrgOpen(true)}
              className="gap-1.5 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            >
              <Building2 className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              New organization
            </Button>
          </>
        }
      />

      {/* Executive Compliance & KYB Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[300px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <ShieldCheck className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                Proportionate KYB & Cryptographic Evidence Desk
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Explainable Compliance & Risk Flag Registry
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              Review SHA-256 document fingerprints, national business registry references, and
              entity risk flags. Every verification decision requires a permanent written rationale.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <Metric
          label="Organizations"
          value={orgs.data?.length ?? "—"}
          sub={`${orgs.data?.filter((o) => o.verification_status === "approved").length ?? 0} approved`}
          accent="lime"
        />
        <Metric
          label="Pending verifications"
          value={verifications.data?.filter((v) => v.status === "pending").length ?? "—"}
          sub="Evidence awaiting a decision"
        />
        <Metric
          label="Open reviews"
          value={reviews.data?.filter((r) => r.status === "pending").length ?? "—"}
          sub="Compliance cases in flight"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Verification evidence · by status"
          subtitle="Breakdown of submitted cryptographic fingerprints and registry references"
        >
          <LazyDonutChart
            data={tally((verifications.data ?? []).map((v) => v.status))}
            ariaLabel="Verification evidence by status"
            center={{ value: String(verifications.data?.length ?? 0), label: "items" }}
            format={(v) => String(v)}
          />
        </Panel>
        <Panel
          title="Organizations · by verification status"
          subtitle="KYB standing across registered legal entities"
        >
          <LazyDonutChart
            data={tally((orgs.data ?? []).map((o) => o.verification_status))}
            ariaLabel="Organizations by verification status"
            center={{ value: String(orgs.data?.length ?? 0), label: "organizations" }}
            format={(v) => String(v)}
          />
        </Panel>
      </div>

      <Panel
        title="Register"
        subtitle="Inspect organizations, adjudicate verification evidence, or manage compliance reviews"
        meta={
          <div className="flex gap-1.5">
            {(["organizations", "verifications", "reviews"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className="cursor-pointer">
                <Chip tone={tab === t ? "invert" : "neutral"}>{t}</Chip>
              </button>
            ))}
          </div>
        }
      >
        {tab === "organizations" ? (
          <QueryBoundary
            query={orgs}
            isEmpty={(d) => d.length === 0}
            empty="No organizations yet. Create one to start a review."
          >
            {(rows) => (
              <Table head={["Organization", "Country", "Type", "Registration", "Status"]}>
                {rows.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setOpenOrg(o)}
                    className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-2.5 py-3 font-medium">{o.legal_name}</td>
                    <td className="px-2.5 py-3 font-mono text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Flag code={o.country_code} className="h-3 w-4 rounded-[1px]" />
                        {o.country_code}
                      </span>
                    </td>
                    <td className="px-2.5 py-3 font-mono text-xs">{o.organization_type}</td>
                    <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                      {o.registration_number ?? "—"}
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Chip tone={statusTone(o.verification_status)}>{o.verification_status}</Chip>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </QueryBoundary>
        ) : tab === "verifications" ? (
          <QueryBoundary
            query={verifications}
            isEmpty={(d) => d.length === 0}
            empty="No verification evidence submitted."
          >
            {(rows) => (
              <Table head={["Subject", "Type", "Reference", "Submitted", "Status", ""]}>
                {rows.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-2.5 py-3 text-xs font-medium">
                      {v.organization_id
                        ? orgName(v.organization_id)
                        : `trader ${shortId(v.user_id)}`}
                    </td>
                    <td className="px-2.5 py-3 font-mono text-xs">{v.verification_type}</td>
                    <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                      {v.reference}
                    </td>
                    <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                      {when(v.created_at)} · {v.submitted_by}
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Chip tone={statusTone(v.status)}>{v.status}</Chip>
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      {v.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-lg font-mono text-[10px] uppercase"
                          onClick={() => setDecide({ kind: "verification", id: v.id })}
                        >
                          Decide
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </QueryBoundary>
        ) : (
          <QueryBoundary
            query={reviews}
            isEmpty={(d) => d.length === 0}
            empty="No compliance reviews opened."
          >
            {(rows) => (
              <Table head={["Organization", "Reason", "Opened", "Status", ""]}>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-2.5 py-3 text-xs font-medium">
                      {orgName(r.organization_id)}
                    </td>
                    <td className="max-w-xs truncate px-2.5 py-3 text-xs">{r.reason}</td>
                    <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                      {when(r.created_at)} · {r.opened_by}
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Chip tone={statusTone(r.status)}>{r.status}</Chip>
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-lg font-mono text-[10px] uppercase"
                        onClick={() => setDecide({ kind: "review", id: r.id })}
                      >
                        Decide
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </QueryBoundary>
        )}
      </Panel>

      <OrgDialog open={orgOpen} onOpenChange={setOrgOpen} onDone={refresh} />
      <OrgDetail
        org={openOrg}
        onClose={() => setOpenOrg(null)}
        onOpenReview={(id) => setNewReviewFor(id)}
      />
      <DecisionDialog target={decide} onClose={() => setDecide(null)} onDone={refresh} />
      <VerificationDialog
        open={newVerification}
        onOpenChange={setNewVerification}
        orgs={orgs.data ?? []}
        onDone={refresh}
      />
      <ReviewDialog orgId={newReviewFor} onClose={() => setNewReviewFor(null)} onDone={refresh} />
    </>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {head.map((h, i) => (
              <th
                key={i}
                className={`px-2.5 py-2.5 ${i >= head.length - 2 ? "text-right" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">{label}</Label>
      {children}
    </div>
  );
}

function Pick({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Choose an option" className="rounded-lg font-mono text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-lg">
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OrgDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    legal_name: "",
    trading_name: "",
    country_code: "RW",
    organization_type: "company",
    registration_number: "",
  });
  const create = useMutation({
    mutationFn: () =>
      compliance.createOrganization({
        legal_name: f.legal_name.trim(),
        country_code: f.country_code.trim().toUpperCase(),
        organization_type: f.organization_type,
        ...(f.trading_name.trim() ? { trading_name: f.trading_name.trim() } : {}),
        ...(f.registration_number.trim()
          ? { registration_number: f.registration_number.trim() }
          : {}),
      }),
    onSuccess: (o) => {
      toast.success(`${o.legal_name} created`);
      onDone();
      onOpenChange(false);
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            New organization
          </DialogTitle>
          <DialogDescription>Legal entity subject to verification.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Legal name">
            <Input
              className="rounded-lg"
              value={f.legal_name}
              onChange={(e) => setF({ ...f, legal_name: e.target.value })}
            />
          </Field>
          <Field label="Trading name (optional)">
            <Input
              className="rounded-lg"
              value={f.trading_name}
              onChange={(e) => setF({ ...f, trading_name: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Country (ISO-2)">
              <Input
                maxLength={2}
                className="rounded-lg font-mono"
                value={f.country_code}
                onChange={(e) => setF({ ...f, country_code: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <Pick
                value={f.organization_type}
                onChange={(v) => setF({ ...f, organization_type: v })}
                options={ORG_TYPES}
              />
            </Field>
          </div>
          <Field label="Registration number (optional)">
            <Input
              className="rounded-lg font-mono"
              value={f.registration_number}
              onChange={(e) => setF({ ...f, registration_number: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!f.legal_name.trim() || f.country_code.length !== 2 || create.isPending}
            onClick={() => create.mutate()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrgDetail({
  org,
  onClose,
  onOpenReview,
}: {
  org: Organization | null;
  onClose: () => void;
  onOpenReview: (id: string) => void;
}) {
  const qc = useQueryClient();
  const flags = useQuery({
    queryKey: ["flags", org?.id],
    queryFn: () => compliance.riskFlags(org!.id),
    enabled: !!org,
  });
  const [code, setCode] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [desc, setDesc] = useState("");
  const add = useMutation({
    mutationFn: () =>
      compliance.addRiskFlag(org!.id, {
        code: code.trim().toUpperCase(),
        severity,
        description: desc.trim(),
      }),
    onSuccess: () => {
      toast.success("Risk flag raised");
      setCode("");
      setDesc("");
      void qc.invalidateQueries({ queryKey: ["flags", org?.id] });
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const resolve = useMutation({
    mutationFn: (flagId: string) =>
      compliance.resolveRiskFlag(org!.id, flagId, "Resolved by operator review"),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["flags", org?.id] }),
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog open={org !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        {org ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                {org.legal_name}
              </DialogTitle>
              <DialogDescription>
                {org.country_code} · {org.organization_type} · {org.verification_status}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg font-mono text-[10px] uppercase"
                onClick={() => onOpenReview(org.id)}
              >
                Open compliance review
              </Button>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Risk flags
            </div>
            <QueryBoundary query={flags} isEmpty={(d) => d.length === 0} empty="No risk flags.">
              {(rows) => (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {rows.map((fl) => (
                    <li
                      key={fl.id}
                      className="flex items-start justify-between gap-3 px-3.5 py-2.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{fl.code}</span>
                          <Chip tone={statusTone(fl.severity)}>{fl.severity}</Chip>
                          <Chip tone={statusTone(fl.status)}>{fl.status}</Chip>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{fl.description}</p>
                      </div>
                      {fl.status === "open" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-lg font-mono text-[10px] uppercase"
                          disabled={resolve.isPending}
                          onClick={() => resolve.mutate(fl.id)}
                        >
                          Resolve
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </QueryBoundary>
            <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
              <Input
                className="rounded-lg font-mono"
                placeholder="Flag code e.g. VOLUME_SPIKE"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Pick value={severity} onChange={setSeverity} options={SEVERITIES} />
            </div>
            <Textarea
              className="min-h-16 rounded-lg"
              placeholder="Describe the concern…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <Button
              className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
              disabled={!code.trim() || !desc.trim() || add.isPending}
              onClick={() => add.mutate()}
            >
              Raise flag
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DecisionDialog({
  target,
  onClose,
  onDone,
}: {
  target: { kind: "verification" | "review"; id: string } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const options = target?.kind === "verification" ? VERIFICATION_DECISIONS : REVIEW_STATUSES;
  const [status, setStatus] = useState("");
  const [rationale, setRationale] = useState("");
  const chosen = status || options[0] || "";
  const decide = useMutation({
    mutationFn: async () => {
      if (target!.kind === "verification")
        await compliance.decideVerification(target!.id, chosen, rationale.trim());
      else await compliance.decideReview(target!.id, chosen, rationale.trim());
    },
    onSuccess: () => {
      toast.success("Decision recorded");
      setRationale("");
      setStatus("");
      onDone();
      onClose();
    },
    onError: (e) => toast.error("Decision refused", { description: describeError(e) }),
  });
  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            Record decision
          </DialogTitle>
          <DialogDescription>
            The rationale is stored with the state change and cannot be edited.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Outcome">
            <Pick value={chosen} onChange={setStatus} options={options} />
          </Field>
          <Field label="Rationale">
            <Textarea
              className="min-h-24 rounded-lg"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!rationale.trim() || decide.isPending}
            onClick={() => decide.mutate()}
          >
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VerificationDialog({
  open,
  onOpenChange,
  orgs,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgs: Organization[];
  onDone: () => void;
}) {
  const [orgId, setOrgId] = useState("");
  const [type, setType] = useState("identity");
  const [reference, setReference] = useState("");
  const [label, setLabel] = useState("");
  const create = useMutation({
    mutationFn: () =>
      compliance.createVerification({
        organization_id: orgId || orgs[0]!.id,
        verification_type: type,
        reference: reference.trim(),
        ...(label.trim() ? { evidence_label: label.trim() } : {}),
      }),
    onSuccess: () => {
      toast.success("Evidence recorded");
      setReference("");
      setLabel("");
      onDone();
      onOpenChange(false);
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            Submit evidence
          </DialogTitle>
          <DialogDescription>
            Record a reference to evidence held elsewhere. Document contents are never uploaded
            here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Organization">
            {orgs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Create an organization first.</p>
            ) : (
              <Select value={orgId || orgs[0]!.id} onValueChange={setOrgId}>
                <SelectTrigger aria-label="Organization" className="rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label="Type">
            <Pick value={type} onChange={setType} options={VERIFICATION_TYPES} />
          </Field>
          <Field label="Reference">
            <Input
              className="rounded-lg font-mono"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Certificate / document reference"
            />
          </Field>
          <Field label="Label (optional)">
            <Input
              className="rounded-lg"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={orgs.length === 0 || !reference.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({
  orgId,
  onClose,
  onDone,
}: {
  orgId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const create = useMutation({
    mutationFn: () => compliance.createReview(orgId!, reason.trim()),
    onSuccess: () => {
      toast.success("Review opened");
      setReason("");
      onDone();
      onClose();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog open={orgId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            Open compliance review
          </DialogTitle>
          <DialogDescription>Describe why this organization needs review.</DialogDescription>
        </DialogHeader>
        <Textarea
          className="min-h-24 rounded-lg"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!reason.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            Open review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
