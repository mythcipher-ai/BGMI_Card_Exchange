import { useState, useEffect, useMemo } from "react";
import CardItem, { type CardData } from "@/components/CardItem";
import CardSkeleton from "@/components/CardSkeleton";
import ClaimModal from "@/components/ClaimModal";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import Footer from "@/components/Footer";
import { fetchPublicListings, fetchDefinedCards, type DefinedCard } from "@/lib/api";
import { toast } from "sonner";

type SortKey = "newest" | "trust";

const Index = () => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [claimCard, setClaimCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<CardData[]>([]);
  const [definedCards, setDefinedCards] = useState<DefinedCard[]>([]);
  const [typeFilter, setTypeFilter] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [listingsRes, cardsRes] = await Promise.all([
        fetchPublicListings({ search, sort: sort === "trust" ? "trusted" : undefined }),
        fetchDefinedCards()
      ]);
      setListings(listingsRes.data as any);
      setDefinedCards(cardsRes.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [sort]);

  // Get unique types for filter
  const cardTypes = useMemo(() => {
    return [...new Set(definedCards.map((c) => c.type))];
  }, [definedCards]);

  // Client-side search + type filter
  const filtered = useMemo(() => {
    let cards = listings;
    if (search) {
      const q = search.toLowerCase();
      cards = cards.filter((c) =>
        c.offeringCard.toLowerCase().includes(q) ||
        c.offeringCardType.toLowerCase().includes(q) ||
        c.wantedCards.some((w) => w.toLowerCase().includes(q))
      );
    }
    if (typeFilter) {
      cards = cards.filter((c) => c.offeringCardType === typeFilter);
    }
    return cards;
  }, [listings, search, typeFilter]);

  const handleSearch = (query: string) => {
    setSearch(query);
    // Also trigger server-side search for broader results
    if (query.length > 2 || query.length === 0) {
      fetchPublicListings({ search: query, sort: sort === "trust" ? "trusted" : undefined })
        .then((res) => setListings(res.data as any))
        .catch(() => {});
    }
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar onSearch={handleSearch} />
      <HeroBanner />

      <main className="container py-4 space-y-4 flex-1">
        {/* Filters row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Exchange Offers</h2>
            {cardTypes.length > 0 && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Types</option>
                {cardTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>
          {/* <div className="flex gap-1">
            {(["newest", "trust"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  sort === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {key === "newest" ? "Newest" : "Top Trust"}
              </button>
            ))}
          </div> */}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No exchange offers found</p>
            <p className="text-xs text-muted-foreground">Be the first to list a card!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((card) => (
              <CardItem key={card.id} card={card} onClaim={setClaimCard} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />

      {claimCard && (
        <ClaimModal
          card={claimCard}
          onClose={() => setClaimCard(null)}
          onClaimed={() => loadData()}
        />
      )}
    </div>
  );
};

export default Index;
