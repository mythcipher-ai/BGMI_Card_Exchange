import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import ProfileStats from "@/components/ProfileStats";
import GiftRequestList from "@/components/GiftRequestList";
import { Trash2, Loader2, CheckCircle, Clock, LogOut, Hourglass, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { expiresIn, EXPIRY_TONE_CLASS } from "@/lib/time";
import { toast } from "sonner";
import {
  fetchMyListings,
  deleteListing,
  confirmTradeReceived,
  disputeTrade,
  type MyListing
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Tab = "listings" | "gifts-in" | "gifts-out";

const Profile = () => {
  const { isAuthenticated, isLoading: authLoading, user: authUser, login, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialTab: Tab = params.get("tab") === "gifts" ? "gifts-in"
    : params.get("tab") === "gifts-out" ? "gifts-out"
    : "listings";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeBusyId, setOutcomeBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      login();
      return;
    }
    if (isAuthenticated) {
      fetchMyListings()
        .then((res) => setMyListings(res.data))
        .catch((err: any) => toast.error(err.message || "Failed to load listings"))
        .finally(() => setLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  const handleDelete = async (id: string) => {
    try {
      await deleteListing(id);
      toast.success("Listing deleted");
      setMyListings((prev) => prev.filter((l) => l.id !== id));
      refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleConfirm = async (id: string) => {
    setOutcomeBusyId(id);
    try {
      const res = await confirmTradeReceived(id);
      toast.success("Trade confirmed — counted toward your milestone rewards.");
      setMyListings((prev) => prev.map((l) =>
        l.id === id ? { ...l, tradeOutcome: res.tradeOutcome, outcomeAt: res.outcomeAt } : l
      ));
      refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm trade");
    } finally {
      setOutcomeBusyId(null);
    }
  };

  const handleDispute = async (id: string) => {
    const reasonInput = window.prompt(
      "Why are you reporting this trade as not received? (optional, helps admin review)"
    );
    if (reasonInput === null) return;
    const reason = reasonInput.trim() || undefined;
    setOutcomeBusyId(id);
    try {
      const res = await disputeTrade(id, reason);
      toast.success("Trade marked as not received — the claimer has been flagged.");
      setMyListings((prev) => prev.map((l) =>
        l.id === id ? { ...l, tradeOutcome: res.tradeOutcome, outcomeAt: res.outcomeAt, disputeReason: reason ?? null } : l
      ));
    } catch (err: any) {
      toast.error(err.message || "Failed to dispute trade");
    } finally {
      setOutcomeBusyId(null);
    }
  };

  const setActiveTab = (t: Tab) => {
    setTab(t);
    const tabParam = t === "gifts-in" ? "gifts" : t === "gifts-out" ? "gifts-out" : null;
    if (tabParam) {
      setParams({ tab: tabParam });
    } else {
      params.delete("tab");
      setParams(params);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
        <Navbar />
        <main className="container flex-1 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} aria-label="Loading" />
        </main>
        <BottomNav />
      </div>
    );
  }

  const user = authUser;
  const displayName = user?.name || user?.email?.split("@")[0] || "Player";

  const activeListings = myListings.filter((l) => l.status === "active");
  const claimedListings = myListings.filter((l) => l.status === "claimed");

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar />
      <main className="container py-4 space-y-6 max-w-lg mx-auto flex-1">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-heading text-lg font-semibold text-primary overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                displayName[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                Daily claims: {user?.dailyClaims ?? 0}/5
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 text-destructive px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10 transition-colors shrink-0"
            >
              <LogOut size={14} aria-hidden="true" />
              Logout
            </button>
          </div>

          <ProfileStats
            listed={myListings.length}
            claimed={claimedListings.length}
          />
        </div>

        <div role="tablist" aria-label="Profile sections" className="flex gap-1 border-b border-border">
          <TabButton active={tab === "listings"} onClick={() => setActiveTab("listings")}>
            My Listings
          </TabButton>
          <TabButton active={tab === "gifts-in"} onClick={() => setActiveTab("gifts-in")}>
            Gift Requests
          </TabButton>
          <TabButton active={tab === "gifts-out"} onClick={() => setActiveTab("gifts-out")}>
            Sent
          </TabButton>
        </div>

        {tab === "listings" && (
          <>
            <section className="space-y-2">
              <h2 className="font-heading text-sm font-semibold text-foreground">Active Listing</h2>
              {activeListings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No active listing. Create one from the home page.</p>
              ) : (
                activeListings.map((listing) => {
                  const expiry = expiresIn(listing.expiresAt);
                  const offeringLabel = listing.offeringCards.join(", ");
                  // Cover image: prefer the wanted card (most informative — that's
                  // what the lister is hunting). Fall back to the first offered card.
                  const cover = listing.wantedCardImage || listing.offeringCardImages[0]?.imageUrl;
                  return (
                    <div key={listing.id} className="rounded-md border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {cover && (
                            <img src={cover} alt="" className="w-10 h-8 rounded object-cover shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">Wants: {listing.wantedCard}</p>
                            <p className="text-xs text-muted-foreground truncate">Offers: {offeringLabel}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(listing.id)}
                          aria-label={`Delete listing wanting ${listing.wantedCard}`}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock size={10} aria-hidden="true" /> Listed {timeAgo(listing.createdAt)}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${EXPIRY_TONE_CLASS[expiry.tone]}`}>
                          <Hourglass size={10} aria-hidden="true" />
                          {expiry.tone === "expired" ? "Expired" : `Expires in ${expiry.label.replace(" left", "")}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <section className="space-y-2">
              <h2 className="font-heading text-sm font-semibold text-foreground">Past Trades</h2>
              {claimedListings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No claimed listings yet</p>
              ) : (
                claimedListings.map((listing) => {
                  const outcome = listing.tradeOutcome;
                  const busy = outcomeBusyId === listing.id;
                  const offeringLabel = listing.offeringCards.join(", ");
                  const cover = listing.wantedCardImage || listing.offeringCardImages[0]?.imageUrl;
                  return (
                    <div key={listing.id} className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        {cover && (
                          <img src={cover} alt="" className="w-10 h-8 rounded object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">Wanted: {listing.wantedCard}</p>
                          <p className="text-xs text-muted-foreground truncate">Offered: {offeringLabel}</p>
                        </div>
                        <OutcomeBadge outcome={outcome} />
                      </div>

                      {listing.claimedBy && (
                        <div className="text-xs text-muted-foreground">
                          Claimed by <span className="text-foreground font-medium">{listing.claimedBy.name}</span>
                          {listing.claimedAt && <span> · {timeAgo(listing.claimedAt)}</span>}
                        </div>
                      )}

                      {outcome === "pending" && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] text-amber-300/90 flex items-start gap-1">
                            <AlertTriangle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
                            Check BGMI for your wanted card. Did you receive it in-game?
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleConfirm(listing.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2.5 py-1 text-[11px] font-semibold hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                              {busy ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={11} aria-hidden="true" />}
                              Received
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDispute(listing.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-md bg-destructive/15 border border-destructive/40 text-destructive px-2.5 py-1 text-[11px] font-semibold hover:bg-destructive/25 disabled:opacity-50"
                            >
                              <ShieldAlert size={11} aria-hidden="true" />
                              Not received
                            </button>
                          </div>
                        </div>
                      )}

                      {outcome === "disputed" && listing.disputeReason && (
                        <p className="text-[11px] text-destructive">
                          Reason: <span className="text-foreground">{listing.disputeReason}</span>
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </section>
          </>
        )}

        {tab === "gifts-in" && (
          <section className="space-y-2">
            <h2 className="font-heading text-sm font-semibold text-foreground">Incoming Gift Requests</h2>
            <GiftRequestList direction="incoming" />
          </section>
        )}

        {tab === "gifts-out" && (
          <section className="space-y-2">
            <h2 className="font-heading text-sm font-semibold text-foreground">Gift Requests You Sent</h2>
            <GiftRequestList direction="outgoing" />
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

const OutcomeBadge = ({ outcome }: { outcome: MyListing["tradeOutcome"] }) => {
  if (outcome === "confirmed") {
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded flex items-center gap-1 shrink-0">
        <ShieldCheck size={10} aria-hidden="true" /> Received
      </span>
    );
  }
  if (outcome === "disputed") {
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-destructive/15 text-destructive border border-destructive/40 rounded flex items-center gap-1 shrink-0">
        <ShieldAlert size={10} aria-hidden="true" /> Disputed
      </span>
    );
  }
  if (outcome === "pending") {
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-amber-400/15 text-amber-300 border border-amber-400/40 rounded flex items-center gap-1 shrink-0">
        <Hourglass size={10} aria-hidden="true" /> Awaiting
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-primary/20 text-primary rounded flex items-center gap-1 shrink-0">
      <CheckCircle size={10} aria-hidden="true" /> Claimed
    </span>
  );
};

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
      active
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

export default Profile;
