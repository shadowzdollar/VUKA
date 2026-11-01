import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Globe2,
  Headphones,
  LifeBuoy,
  MessageSquarePlus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError, newIdempotencyKey } from "@/lib/api/client";
import { support } from "@/lib/api/endpoints";
import type { TicketStatus } from "@/lib/api/types";
import { shortId, when } from "@/lib/format";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — VUKA" }] }),
  component: () => (
    <Shell role="trader">
      <Support />
    </Shell>
  ),
});

const PRIORITIES = ["low", "normal", "high"] as const;
const NEXT: Record<TicketStatus, TicketStatus> = {
  open: "pending",
  pending: "closed",
  closed: "open",
};
const NEXT_LABEL: Record<TicketStatus, string> = {
  open: "Mark pending",
  pending: "Close",
  closed: "Reopen",
};

const QUICK_TEMPLATES: {
  label: string;
  subject: string;
  priority: (typeof PRIORITIES)[number];
  body: string;
}[] = [
  {
    label: "Corridor Payout Delay",
    subject: "Payout to supplier still pending on destination rail",
    priority: "high",
    body: "Transfer ID: \nCorridor: \nRecipient phone: \nObserved state: Collection succeeded, awaiting telecom payout confirmation.",
  },
  {
    label: "Invoice Settlement",
    subject: "Commercial invoice settlement reconciliation",
    priority: "normal",
    body: "Invoice Number: \nTransfer Reference: \nDetails: Please verify ledger link between invoice and transfer.",
  },
  {
    label: "KYC Limit Upgrade",
    subject: "Business verification evidence review request",
    priority: "normal",
    body: "Verification Type: business\nSHA-256 / Registry Reference: \nRequested Tier: BUSINESS_VERIFIED",
  },
  {
    label: "Mobile Money Callback",
    subject: "Mobile money debit reference inquiry",
    priority: "low",
    body: "Provider (MTN / M-Pesa / Airtel): \nExternal Telecom Receipt: \nAmount & Currency: ",
  },
];

function Support() {
  const qc = useQueryClient();
  const tickets = useQuery({ queryKey: ["tickets"], queryFn: () => support.tickets() });
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("normal");
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  // Stable per draft: a double-submit returns the same ticket (engine replays by key).
  const keyRef = useRef(newIdempotencyKey());

  const create = useMutation({
    mutationFn: () =>
      support.createTicket(
        { subject: subject.trim(), description: description.trim(), priority },
        keyRef.current,
      ),
    onSuccess: ({ ticket }) => {
      toast.success("Ticket opened", { description: `Reference ${shortId(ticket.id, 12)}` });
      setSubject("");
      setDescription("");
      keyRef.current = newIdempotencyKey();
      void qc.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (e) => toast.error("Ticket not created", { description: describeError(e) }),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      support.setStatus(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tickets"] }),
    onError: (e) => toast.error("Could not update ticket", { description: describeError(e) }),
  });

  const allTickets = tickets.data ?? [];
  const open = allTickets.filter((t) => t.status !== "closed").length;
  const pendingCount = allTickets.filter((t) => t.status === "pending").length;
  const closedCount = allTickets.filter((t) => t.status === "closed").length;

  return (
    <>
      <PageHeader
        eyebrow="Trade Resolution & Operations Desk"
        title="Support"
        description="Raise an issue with a payment, invoice or verification. Include the payment reference from Send Payment so the team can trace it."
      />

      {/* Executive Multilingual Trade Support Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[320px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/4 size-72 rounded-full bg-[#c2f74d]/10 blur-3xl"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <Headphones className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                Ledger-Linked Resolution Desk
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Direct Corridor & Settlement Traceability
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              Every support ticket is protected by an idempotency key so duplicate network clicks
              never open duplicate cases. Attach your transfer ID, invoice number, or SHA-256
              verification digest for direct engine inspection.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                <Globe2 className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                Desk Languages: EN · FR · SW · RW
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
                Idempotent Ticket Replay Protection
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-xs backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                Resolution Queue
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#c2f74d]">
                <LifeBuoy className="size-3" aria-hidden="true" />
                ACTIVE DESK
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-white/50">Active open cases</dt>
                <dd className="font-bold text-white">{open}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">Awaiting review</dt>
                <dd className="text-[#c2f74d]">{pendingCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">Resolved & closed</dt>
                <dd className="text-white">{closedCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Open tickets" value={open} sub="Not yet closed" accent="lime" />
        <Metric label="Pending review" value={pendingCount} sub="In operator queue" />
        <Metric label="Resolved" value={closedCount} sub="Closed cases" />
        <Metric label="Total tickets" value={tickets.data?.length ?? "—"} sub="All time" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
        <Panel
          title="New ticket"
          subtitle="Use a quick template or describe your settlement inquiry"
          meta={<MessageSquarePlus className="size-4 text-[#79b200]" aria-hidden="true" />}
        >
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <Sparkles className="size-3 text-[#79b200]" aria-hidden="true" />
                Quick Issue Templates
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setSubject(tpl.subject);
                      setPriority(tpl.priority);
                      setDescription(tpl.body);
                    }}
                    className="rounded-md border border-border bg-muted/25 px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/50 hover:text-foreground"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ticket-subject"
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
              >
                Subject
              </Label>
              <Input
                id="ticket-subject"
                value={subject}
                maxLength={200}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-lg"
                placeholder="Payout to Nairobi supplier still pending"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger aria-label="Priority" className="rounded-lg font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ticket-details"
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
              >
                Details
              </Label>
              <Textarea
                id="ticket-details"
                value={description}
                maxLength={10000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include transfer ID, invoice number, or telecom receipt reference…"
                className="min-h-32 rounded-lg text-xs"
              />
            </div>

            <Button
              className="w-full rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
              disabled={!subject.trim() || !description.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Sending…" : "Open ticket"}
            </Button>
          </div>
        </Panel>

        <Panel
          title="Your tickets"
          subtitle="Track resolution progress or update ticket status"
          meta={
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
              {(["all", "open", "pending", "closed"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={
                    filter === tab
                      ? "rounded-md bg-[#151515] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-[#c2f74d]"
                      : "rounded-md px-2.5 py-1 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground"
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          }
        >
          <QueryBoundary
            query={tickets}
            isEmpty={(d) => d.length === 0}
            empty="No tickets yet."
            disabledCodes={["support_unavailable"]}
          >
            {(rows) => {
              const filtered =
                filter === "all" ? rows : rows.filter((t) => t.status === filter);
              return filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No tickets match the "{filter}" filter.
                </p>
              ) : (
                <ul className="space-y-3">
                  {filtered.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-xl border border-border/80 bg-muted/15 p-4 transition-colors hover:border-foreground/25"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {t.subject}
                            </span>
                            <span
                              className={
                                t.priority === "high"
                                  ? "rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-800"
                                  : "rounded bg-muted px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground"
                              }
                            >
                              {t.priority}
                            </span>
                          </div>
                          <p className="mt-1.5 whitespace-pre-line line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                            {t.description}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                            <span className="rounded bg-muted/60 px-1.5 py-0.5 text-foreground">
                              {shortId(t.id, 12)}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" aria-hidden="true" />
                              opened {when(t.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip
                            tone={
                              t.status === "closed"
                                ? "invert"
                                : t.status === "pending"
                                  ? "live"
                                  : "warn"
                            }
                          >
                            {t.status === "closed" ? (
                              <CheckCircle2 className="mr-1 inline size-3" aria-hidden="true" />
                            ) : null}
                            {t.status}
                          </Chip>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-md font-mono text-[10px] uppercase"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: t.id, status: NEXT[t.status] })}
                          >
                            {NEXT_LABEL[t.status]}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            }}
          </QueryBoundary>
        </Panel>
      </div>
    </>
  );
}
