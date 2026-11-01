import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity as ActivityIcon, Download, Eye, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError, download } from "@/lib/api/client";
import { operator } from "@/lib/api/endpoints";
import { when } from "@/lib/format";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity Log — VUKA" }] }),
  component: () => (
    <Shell role="operator">
      <Activity />
    </Shell>
  ),
});

const PAGE = 25;

function Activity() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  // No polling here: every read of this log is itself recorded as ACTIVITY_VIEWED by the engine.
  const q = useQuery({
    queryKey: ["activity", search, action, from, to, page],
    queryFn: () =>
      operator.activity({ limit: PAGE, offset: page * PAGE, search, action, from, to }),
    staleTime: 60_000,
  });
  const pages = Math.max(1, Math.ceil((q.data?.total ?? 0) / PAGE));

  return (
    <>
      <PageHeader
        eyebrow="Immutable Operator Audit"
        title="Activity Log"
        description="Append-only record of every operator action: sign-ins, approvals, exports and alert acknowledgements. Viewing this page is itself recorded."
        actions={
          <Button
            variant="outline"
            className="gap-1.5 rounded-lg font-mono text-xs uppercase"
            onClick={() =>
              void download("/api/activity/export", "vuka-operator-activity.csv", {
                search,
                action,
                from,
                to,
              }).catch((e) => toast.error(describeError(e)))
            }
          >
            <Download className="size-3.5 text-[#79b200]" aria-hidden="true" />
            Export CSV
          </Button>
        }
      />

      {/* Executive Append-Only Audit Banner */}
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
              <ActivityIcon className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                Append-Only Security & Governance Log
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {q.data?.total ?? "—"} Recorded Operator & Arbiter Events
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              Every administrative read, dispute approval, compliance decision, and CSV export is
              permanently stamped with actor identity, role, and UTC timestamp.
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
            <Eye className="size-4 text-[#c2f74d]" aria-hidden="true" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                Observer Rule
              </div>
              <div className="font-bold text-white">Reads Logged as ACTIVITY_VIEWED</div>
            </div>
          </div>
        </div>
      </div>

      <Panel
        title="Operator activity"
        subtitle="Filter by actor, resource, action code, or date window"
        meta={<Chip tone="lime">{q.data?.total ?? "—"} records</Chip>}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            aria-label="Search actor, resource or details"
            placeholder="Search actor, resource, details…"
            className="w-72 rounded-lg font-mono text-xs"
          />
          <Input
            value={action}
            onChange={(e) => {
              setAction(e.target.value.toUpperCase());
              setPage(0);
            }}
            aria-label="Filter by action"
            placeholder="ACTION"
            className="w-48 rounded-lg font-mono text-xs"
          />
          <Input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            className="w-40 rounded-lg font-mono text-xs"
          />
          <Input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            className="w-40 rounded-lg font-mono text-xs"
          />
        </div>
        <QueryBoundary
          query={q}
          isEmpty={(d) => d.activities.length === 0}
          empty="No activity matches these filters."
        >
          {({ activities }) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-2.5 py-2.5">Time</th>
                    <th className="px-2.5 py-2.5">Actor</th>
                    <th className="px-2.5 py-2.5">Role</th>
                    <th className="px-2.5 py-2.5">Action</th>
                    <th className="px-2.5 py-2.5">Resource</th>
                    <th className="px-2.5 py-2.5">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-2.5 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                        {when(a.created_at)}
                      </td>
                      <td className="px-2.5 py-3 font-mono text-xs font-medium">{a.actor}</td>
                      <td className="px-2.5 py-3 font-mono text-xs uppercase text-muted-foreground">
                        {a.role}
                      </td>
                      <td className="px-2.5 py-3">
                        <Chip tone="live">{a.action}</Chip>
                      </td>
                      <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                        {a.resource ?? "—"}
                      </td>
                      <td className="px-2.5 py-3 text-xs text-muted-foreground">
                        {a.details ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
        <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[#79b200]" aria-hidden="true" />
            Page {page + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg font-mono text-[10px] uppercase"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg font-mono text-[10px] uppercase"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
