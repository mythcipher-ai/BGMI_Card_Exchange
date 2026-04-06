import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement | null>(null);

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

  const visibleCards = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(10); }, [search, typeFilter]);

  // Infinite scroll observer
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore) {
      setVisibleCount((prev) => prev + 10);
    }
  }, [hasMore]);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [observerCallback]);

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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleCards.map((card) => (
                <CardItem key={card.id} card={card} onClaim={setClaimCard} />
              ))}
            </div>
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center py-4">
                <span className="text-xs text-muted-foreground animate-pulse">Loading more...</span>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating WhatsApp Invite Button */}
      <a
        href="https://wa.me/?text=Hey!%20Check%20out%20BGMI%20Card%20Exchange%20%E2%80%93%20trade%20your%20cards%20easily!%20%F0%9F%8E%AE%0Ahttps%3A%2F%2Fbgmi-card.netlify.app%2F"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 bottom-20 sm:bottom-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg hover:bg-[#1ebe57] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-sm font-medium hidden sm:inline">Invite Friends</span>
      </a>

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
