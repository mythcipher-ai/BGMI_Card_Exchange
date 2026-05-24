import { useCallback, useEffect, useState } from "react";
import { Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { fetchMyListings, markListingExternal, type MyListing } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Lightweight popup that asks the user whether their active listing was
 * traded off-platform. Shown once per browser session, and only when the
 * user actually has an active listing. Picking "Yes, traded off-platform"
 * closes the listing WITHOUT counting toward milestone rewards.
 *
 * Suppressed entirely if the user has a pending trade-outcome confirmation
 * (TradeConfirmationGate runs at a higher z-index and we don't want to
 * stack two modals on top of each other).
 */
const SESSION_KEY = "bx:externalTradePromptSeen";

const ExternalTradePrompt = () => {
  const { isAuthenticated } = useAuth();
  const [listing, setListing] = useState<MyListing | null>(null);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    try {
      const res = await fetchMyListings();
      const active = res.data.find((l) => l.status === "active");
      if (active) {
        setListing(active);
        setShown(true);
      }
    } catch {
      // silent
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setShown(false);
  };

  const handleYes = async () => {
    if (!listing) return;
    setBusy(true);
    try {
      await markListingExternal(listing.id);
      toast.success("Listing closed. It won't count as a trade.");
      sessionStorage.setItem(SESSION_KEY, "1");
      setShown(false);
      // Soft refresh so the rest of the app picks up the closed listing.
      window.setTimeout(() => window.location.reload(), 400);
    } catch (err: any) {
      toast.error(err.message || "Failed to mark listing as off-platform");
    } finally {
      setBusy(false);
    }
  };

  if (!shown || !listing) return null;

  const offeringLabel = listing.offeringCards.join(", ");
  const cover = listing.wantedCardImage || listing.offeringCardImages[0]?.imageUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="external-trade-title"
      className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="relative w-full sm:max-w-md flex flex-col bg-card border border-accent/40 sm:rounded-xl rounded-t-2xl shadow-2xl">
        <header className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ArrowUpRight size={16} className="text-accent" aria-hidden="true" />
          <h2 id="external-trade-title" className="font-heading text-sm font-semibold text-foreground">
            Did you trade this off-platform?
          </h2>
        </header>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            {cover && (
              <img src={cover} alt="" className="w-14 h-14 rounded-md object-cover shrink-0 border border-border" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-foreground truncate">Wants: {listing.wantedCard}</p>
              <p className="text-xs text-muted-foreground truncate">Offers: {offeringLabel}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            If the trade happened outside Blue Lock Exchange, mark it so we can close your listing. This will NOT count toward your milestone rewards.
          </p>
        </div>

        <footer className="px-4 py-3 border-t border-border grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className="rounded-md border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            No, still active
          </button>
          <button
            type="button"
            onClick={handleYes}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Yes, traded off-platform
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ExternalTradePrompt;
