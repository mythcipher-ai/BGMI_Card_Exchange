import { useEffect, useState } from "react";
import {
  fetchIncomingGiftRequests,
  fetchOutgoingGiftRequests,
  updateGiftRequestStatus,
  type GiftRequestRecord
} from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Gift, CheckCircle2, XCircle, MailCheck } from "lucide-react";

type Direction = "incoming" | "outgoing";

interface GiftRequestListProps {
  direction: Direction;
}

const STATUS_LABEL: Record<GiftRequestRecord["status"], string> = {
  pending: "Pending",
  acknowledged: "Acknowledged",
  fulfilled: "Fulfilled",
  declined: "Declined",
  expired: "Expired"
};

const STATUS_CLASS: Record<GiftRequestRecord["status"], string> = {
  pending: "bg-accent/20 text-accent border-accent/40",
  acknowledged: "bg-primary/20 text-primary border-primary/40",
  fulfilled: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
  declined: "bg-destructive/20 text-destructive border-destructive/40",
  expired: "bg-muted text-muted-foreground border-border"
};

const GiftRequestList = ({ direction }: GiftRequestListProps) => {
  const [items, setItems] = useState<GiftRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const fetcher = direction === "incoming" ? fetchIncomingGiftRequests : fetchOutgoingGiftRequests;
      const res = await fetcher();
      setItems(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load gift requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [direction]);

  const setStatus = async (id: string, status: GiftRequestRecord["status"]) => {
    try {
      await updateGiftRequestStatus(id, status);
      toast.success(`Marked ${STATUS_LABEL[status].toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="animate-spin text-primary" size={20} aria-label="Loading gift requests" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        {direction === "incoming"
          ? "No incoming gift requests yet."
          : "You haven't sent any gift requests."}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((g) => (
        <li
          key={g.id}
          className="rounded-md border border-border bg-card p-3 space-y-2"
        >
          <div className="flex items-start gap-3">
            {g.listingCardImage ? (
              <img src={g.listingCardImage} alt="" className="w-12 h-9 rounded object-cover shrink-0" />
            ) : (
              <div className="w-12 h-9 rounded bg-secondary shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground truncate">{g.listingCard}</p>
                <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${STATUS_CLASS[g.status]}`}>
                  {STATUS_LABEL[g.status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {direction === "incoming"
                  ? <>From <span className="text-foreground">{g.requesterName}</span> · {g.requesterEmail}</>
                  : <>To <span className="text-foreground">{g.toUserName || "owner"}</span></>}
              </p>
            </div>
            {g.emailSent && direction === "outgoing" && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0" title="Owner was emailed">
                <MailCheck size={10} aria-hidden="true" /> sent
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words bg-background/50 rounded p-2 border border-border/40">
            {g.message}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[11px] text-accent inline-flex items-center gap-1"
              title="In-game BGMI popularity. Transferred directly between players, not handled by this site."
            >
              <Gift size={11} aria-hidden="true" /> {g.popularityOffered} BGMI in-game popularity offered
            </span>

            {direction === "incoming" && g.status === "pending" && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus(g.id, "acknowledged")}
                  className="rounded-md border border-primary/40 px-2 py-1 text-[11px] text-primary hover:bg-primary/10"
                >
                  Acknowledge
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(g.id, "fulfilled")}
                  className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1"
                >
                  <CheckCircle2 size={11} aria-hidden="true" /> Mark fulfilled
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(g.id, "declined")}
                  className="rounded-md border border-destructive/40 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10 inline-flex items-center gap-1"
                >
                  <XCircle size={11} aria-hidden="true" /> Decline
                </button>
              </div>
            )}

            {direction === "incoming" && g.status === "acknowledged" && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus(g.id, "fulfilled")}
                  className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Mark fulfilled
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(g.id, "declined")}
                  className="rounded-md border border-destructive/40 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default GiftRequestList;
