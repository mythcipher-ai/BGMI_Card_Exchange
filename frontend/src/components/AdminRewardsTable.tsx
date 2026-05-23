import { useEffect, useState } from "react";
import {
  adminGetRewards,
  adminSetRewardStatus,
  type AdminRewardRequest,
  type RewardStatus
} from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Truck, XCircle, Filter } from "lucide-react";

const STATUS_FILTERS: { key: RewardStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected", label: "Rejected" }
];

const STATUS_TONE: Record<RewardStatus, string> = {
  pending: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  approved: "bg-sky-400/15 text-sky-300 border-sky-400/40",
  delivered: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  rejected: "bg-destructive/15 text-destructive border-destructive/40"
};

const AdminRewardsTable = () => {
  const [filter, setFilter] = useState<RewardStatus | "all">("pending");
  const [rows, setRows] = useState<AdminRewardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetRewards(filter === "all" ? undefined : filter);
      setRows(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load reward requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (row: AdminRewardRequest, next: "approved" | "delivered" | "rejected") => {
    let reason: string | undefined;
    if (next === "rejected") {
      const input = window.prompt("Reason for rejection (shown to user, optional):") || "";
      reason = input.trim() || undefined;
    }
    setBusyId(row.id);
    try {
      await adminSetRewardStatus(row.id, next, reason);
      toast.success(
        next === "delivered" ? "Marked delivered, user emailed" :
        next === "approved" ? "Approved" :
        "Rejected, user emailed"
      );
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const stats = {
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    delivered: rows.filter((r) => r.status === "delivered").length,
    rejected: rows.filter((r) => r.status === "rejected").length
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={12} className="text-muted-foreground" aria-hidden="true" />
        <div role="group" aria-label="Filter by status" className="flex rounded-md border border-border overflow-hidden text-xs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`px-2.5 py-1 transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {filter === "all" && (
          <span className="text-[10px] text-muted-foreground">
            {stats.pending} pending · {stats.approved} approved · {stats.delivered} delivered · {stats.rejected} rejected
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={22} aria-label="Loading rewards" />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          No reward requests {filter !== "all" ? `with status "${filter}"` : "yet"}.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="text-left px-3 py-2">User</th>
                <th className="text-left px-3 py-2">Milestone</th>
                <th className="text-left px-3 py-2">Reward</th>
                <th className="text-left px-3 py-2">BGMI UID</th>
                <th className="text-left px-3 py-2">Trades</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Submitted</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 min-w-[160px]">
                    <p className="text-foreground font-medium truncate">{r.user?.name || "(no name)"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.user?.email}</p>
                  </td>
                  <td className="px-3 py-2 text-foreground">{r.milestone} trades</td>
                  <td className="px-3 py-2 text-accent font-medium">{r.popularityAmount.toLocaleString()} pop</td>
                  <td className="px-3 py-2 font-mono text-foreground">{r.bgmiUid}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.successfulTradesAtClaim} <span className="text-[10px]">at claim</span><br />
                    <span className="text-[10px]">{r.currentTrades} now</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${STATUS_TONE[r.status]}`}>
                      {r.status}
                    </span>
                    {r.rejectionReason && (
                      <p className="text-[10px] text-destructive mt-0.5" title={r.rejectionReason}>
                        Reason: {r.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString()}<br />
                    <span className="text-[10px]">{new Date(r.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end flex-wrap">
                      {r.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => updateStatus(r, "approved")}
                            className="inline-flex items-center gap-1 rounded-md border border-sky-400/40 px-2 py-1 text-[11px] text-sky-300 hover:bg-sky-400/10 disabled:opacity-50"
                          >
                            <CheckCircle2 size={11} aria-hidden="true" /> Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => updateStatus(r, "delivered")}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-400/20 border border-emerald-400/40 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-400/30 disabled:opacity-50"
                          >
                            <Truck size={11} aria-hidden="true" /> Delivered
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => updateStatus(r, "rejected")}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <XCircle size={11} aria-hidden="true" /> Reject
                          </button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => updateStatus(r, "delivered")}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-400/20 border border-emerald-400/40 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-400/30 disabled:opacity-50"
                          >
                            <Truck size={11} aria-hidden="true" /> Mark delivered
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => updateStatus(r, "rejected")}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <XCircle size={11} aria-hidden="true" /> Reject
                          </button>
                        </>
                      )}
                      {(r.status === "delivered" || r.status === "rejected") && (
                        <span className="text-[10px] text-muted-foreground">No further action</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRewardsTable;
