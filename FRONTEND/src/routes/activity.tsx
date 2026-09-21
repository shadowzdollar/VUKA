import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
        eyebrow="Audit"
        title="Activity Log"
        description="Append-only record of every operator action: sign-ins, approvals, exports and alert acknowledgements. Viewing this page is itself recorded."
        actions={
          <Button
            variant="outline"
            className="rounded-none font-mono text-xs uppercase"
            onClick={() =>
              void download("/api/activity/export", "vuka-operator-activity.csv", {
                search,
                action,
                from,
                to,
              }).catch((e) => toast.error(describeError(e)))
            }
          >
            Export CSV
          </Button>
        }
      />
      <Panel title="Operator activity" meta={<Chip>{q.data?.total ?? "—"} records</Chip>}>
        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search actor, resource, details…"
            className="w-72 rounded-none font-mono text-xs"
          />
          <Input
            value={action}
            onChange={(e) => {
              setAction(e.target.value.toUpperCase());
              setPage(0);
            }}
            placeholder="ACTION"
            className="w-48 rounded-none font-mono text-xs"
          />
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            className="w-40 rounded-none font-mono text-xs"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            className="w-40 rounded-none font-mono text-xs"
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
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="py-2">Time</th>
                    <th className="py-2">Actor</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Resource</th>
                    <th className="py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                        {when(a.created_at)}
                      </td>
                      <td className="py-2.5 font-mono text-xs">{a.actor}</td>
                      <td className="py-2.5 font-mono text-xs">{a.role}</td>
                      <td className="py-2.5">
                        <Chip>{a.action}</Chip>
                      </td>
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">
                        {a.resource ?? "—"}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{a.details ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
        <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>
            Page {page + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-none font-mono text-[10px] uppercase"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-none font-mono text-[10px] uppercase"
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
