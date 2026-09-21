import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
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

function Support() {
  const qc = useQueryClient();
  const tickets = useQuery({ queryKey: ["tickets"], queryFn: () => support.tickets() });
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("normal");
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

  const open = (tickets.data ?? []).filter((t) => t.status !== "closed").length;

  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Support"
        description="Raise an issue with a payment, invoice or verification. Include the payment reference from Send Payment so the team can trace it."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Open tickets" value={open} sub="Not yet closed" />
        <Metric label="Total tickets" value={tickets.data?.length ?? "—"} sub="All time" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[400px_1fr]">
        <Panel title="New ticket">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Subject</Label>
              <Input
                value={subject}
                maxLength={200}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-none"
                placeholder="Payout to Nairobi supplier still pending"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger className="rounded-none font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Details</Label>
              <Textarea
                value={description}
                maxLength={10000}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32 rounded-none"
              />
            </div>
            <Button
              className="w-full rounded-none font-mono text-xs uppercase"
              disabled={!subject.trim() || !description.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Sending…" : "Open ticket"}
            </Button>
          </div>
        </Panel>

        <Panel title="Your tickets">
          <QueryBoundary
            query={tickets}
            isEmpty={(d) => d.length === 0}
            empty="No tickets yet."
            disabledCodes={["support_unavailable"]}
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.map((t) => (
                  <li key={t.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm">{t.subject}</div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {t.description}
                        </p>
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {shortId(t.id, 12)} · {t.priority} · opened {when(t.created_at)}
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
                          {t.status}
                        </Chip>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-none font-mono text-[10px] uppercase"
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
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </>
  );
}
