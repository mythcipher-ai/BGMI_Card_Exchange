import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPendingConfirmations,
  confirmTradeReceived,
  disputeTrade,
  type PendingConfirmation
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Global modal that surfaces every time the listing owner opens the site
 * with a claim still awaiting their verdict. The modal is non-dismissable —
 * they HAVE to pick "Received" (counts toward milestones) or "Not received"
 * (flags the claimer). This is what enforces the post-claim feedback loop.
 *
 * Mounted once at the App root. Polls on mount and on a slow interval so
 * a claim that arrives mid-session also prompts without a refresh.
 */
const POLL_MS = 60_000;

const TradeConfirmationGate = () => {
  const { isAuthenticated } = useAuth();
  const [queue, setQueue] = useState<PendingConfirmation[]>([]);
  const [mode, setMode] = useState<"choose" | "dispute">("choose");
  const [disputeReason, setDisputeReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setQueue([]);
      return;
    }
    try {
      const res = await fetchPendingConfirmations();
      setQueue(res.data);
    } catch {
      // Silent — the page should still render even if this fails.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
    if (!isAuthenticated) return;
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load, isAuthenticated]);

  const current = queue[0];

  // Reset transient state when the active item changes.
  useEffect(() => {
    setMode("choose");
    setDisputeReason("");
  }, [current?.id]);

  if (!current) return null;

  const advance = () => {
    setQueue((prev) => prev.slice(1));
  };

  const handleReceived = async () => {
    setBusy(true);
    try {
      await confirmTradeReceived(current.id);
      toast.success("Trade confirmed. Counted toward your milestone rewards.");
      advance();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm trade");
    } finally {
      setBusy(false);
    }
  };

  const handleDispute = async () => {
    setBusy(true);
    try {
      const reason = disputeReason.trim() || undefined;
      await disputeTrade(current.id, reason);
      toast.success("Marked as not received. The claimer has been flagged.");
      advance();
    } catch (err: any) {
      toast.error(err.message || "Failed to flag trade");
    } finally {
      setBusy(false);
    }
  };

  const cover = current.wantedCardImage || current.offeringCardImages[0]?.imageUrl;
  const offeringLabel = current.offeringCards.join(", ");
  const claimerName = current.claimedBy?.name || "A player";
  const remaining = queue.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-gate-title"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-background/90 backdrop-blur-md p-0 sm:p-4"
    >
      <div className="relative w-full sm:max-w-md max-h-[95vh] flex flex-col bg-card border border-amber-400/40 sm:rounded-xl rounded-t-2xl shadow-2xl">
        <header className="px-4 py-3 border-b border-border shrink-0 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-300 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <h2 id="trade-gate-title" className="font-heading text-sm font-semibold text-foreground">
              Confirm your trade
            </h2>
            {remaining > 1 && (
              <p className="text-[10px] text-muted-foreground">{remaining} pending</p>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{claimerName}</span> just claimed your code for{" "}
            <span className="font-semibold text-primary">{current.wantedCard}</span>.
          </p>

          {cover && (
            <div className="rounded-md overflow-hidden border border-border">
              <img src={cover} alt={current.wantedCard} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-accent">They picked one of</p>
            <p className="text-xs text-foreground">{offeringLabel || "-"}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Open BGMI and check whether <span className="text-foreground font-medium">{current.wantedCard}</span> was actually transferred to you. Was the trade successful?
          </p>

          {mode === "dispute" && (
            <div className="space-y-1.5">
              <label htmlFor="trade-gate-reason" className="text-xs font-medium text-muted-foreground">
                What happened? (optional, helps admin review)
              </label>
              <textarea
                id="trade-gate-reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value.slice(0, 400))}
                rows={3}
                placeholder="They never sent the card, or sent something else…"
                className="w-full rounded-md border border-destructive/30 bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">{disputeReason.length}/400</p>
            </div>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-border shrink-0 bg-card space-y-2">
          {mode === "choose" ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleReceived}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={14} aria-hidden="true" />}
                Yes, received
              </button>
              <button
                type="button"
                onClick={() => setMode("dispute")}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive/15 border border-destructive/40 text-destructive py-2.5 text-sm font-semibold hover:bg-destructive/25 disabled:opacity-50"
              >
                <ShieldAlert size={14} aria-hidden="true" />
                No, not received
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("choose")}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleDispute}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive text-destructive-foreground py-2.5 text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50"
              >
                {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <ShieldAlert size={14} aria-hidden="true" />}
                Flag claimer
              </button>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center">
            You need to answer this before continuing. We notify both sides by email.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TradeConfirmationGate;
