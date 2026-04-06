import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import ProfileStats from "@/components/ProfileStats";
import { Trash2, Loader2, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { fetchMyListings, deleteListing, type MyListing } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const Profile = () => {
  const { isAuthenticated, isLoading: authLoading, user: authUser, login } = useAuth();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0">
        <Navbar />
        <main className="container py-16 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
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
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">Daily claims: {user?.dailyClaims ?? 0}/5</p>
            </div>
          </div>

          <ProfileStats
            listed={myListings.length}
            claimed={claimedListings.length}
          />
        </div>

        {/* Active listings */}
        <section className="space-y-2">
          <h2 className="font-heading text-sm font-semibold text-foreground">Active Listings</h2>
          {activeListings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No active listings</p>
          ) : (
            activeListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-3 min-w-0">
                  {listing.offeringCardImage && (
                    <img src={listing.offeringCardImage} alt="" className="w-10 h-8 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{listing.offeringCard}</p>
                    <p className="text-xs text-muted-foreground">Wants: {listing.wantedCards[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock size={10} /> {timeAgo(listing.createdAt)}
                  </span>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Claimed listings */}
        <section className="space-y-2">
          <h2 className="font-heading text-sm font-semibold text-foreground">Claimed</h2>
          {claimedListings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No claimed listings yet</p>
          ) : (
            claimedListings.map((listing) => (
              <div key={listing.id} className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                <div className="flex items-center gap-3">
                  {listing.offeringCardImage && (
                    <img src={listing.offeringCardImage} alt="" className="w-10 h-8 rounded object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{listing.offeringCard}</p>
                    <p className="text-xs text-muted-foreground">Wanted: {listing.wantedCards[0]}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-primary/20 text-primary rounded flex items-center gap-1 shrink-0">
                    <CheckCircle size={10} /> Claimed
                  </span>
                </div>
                {listing.claimedBy && (
                  <div className="text-xs text-muted-foreground pl-13">
                    Claimed by <span className="text-foreground font-medium">{listing.claimedBy.name}</span>
                    {listing.claimedAt && <span> &middot; {timeAgo(listing.claimedAt)}</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Profile;
