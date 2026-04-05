import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import ProfileStats from "@/components/ProfileStats";
import TrustBadge from "@/components/TrustBadge";
import { Trash2, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchPublicListings, deleteListing, reportListing } from "@/lib/api";
import type { CardData } from "@/components/CardItem";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { isAuthenticated, isLoading: authLoading, user: authUser, login } = useAuth();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      login();
      return;
    }
    if (isAuthenticated) {
      fetchPublicListings({ limit: 50 })
        .then((res) => setMyListings(res.data as any))
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

  const handleReport = async (id: string) => {
    try {
      await reportListing(id);
      toast.success("Report submitted");
    } catch (err: any) {
      toast.error(err.message || "Failed to report");
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
  const displayName = user?.email || user?.auth0Id?.split("|").pop()?.slice(0, 8) || "Player";

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar />
      <main className="container py-4 space-y-6 max-w-lg mx-auto flex-1">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-heading text-lg font-semibold text-primary">
              {displayName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">Daily claims: {user?.dailyClaims ?? 0}/5</p>
            </div>
            <div className="ml-auto">
              <TrustBadge score={user?.trustScore ?? 0} />
            </div>
          </div>

          <ProfileStats
            totalClaims={user?.totalClaims ?? 0}
            successfulExchanges={user?.successfulClaims ?? 0}
            trustScore={user?.trustScore ?? 0}
          />
        </div>

        <section className="space-y-2">
          <h2 className="font-heading text-sm font-semibold text-foreground">Active Listings</h2>
          {myListings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No active listings</p>
          ) : (
            myListings.map((card) => (
              <div key={card.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-3 min-w-0">
                  {card.offeringCardImage && (
                    <img src={card.offeringCardImage} alt="" className="w-10 h-8 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{card.offeringCard}</p>
                    <p className="text-xs text-muted-foreground">Wants: {card.wantedCards[0]}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleReport(card.id)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                  >
                    <Flag size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
