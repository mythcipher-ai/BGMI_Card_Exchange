import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import CardItem, { type CardData } from "@/components/CardItem";
import CardSkeleton from "@/components/CardSkeleton";
import ClaimModal from "@/components/ClaimModal";
import GiftRequestModal from "@/components/GiftRequestModal";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { fetchPublicListings, fetchDefinedCards, type DefinedCard } from "@/lib/api";
import { fuzzyMatchAny } from "@/lib/fuzzy";
import { toast } from "sonner";

type SortKey = "newest" | "trust";

const Index = () => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [claimCard, setClaimCard] = useState<CardData | null>(null);
  const [giftCard, setGiftCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<CardData[]>([]);
  const [definedCards, setDefinedCards] = useState<DefinedCard[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch a broad set so the client-side fuzzy filter can find typo matches.
      // We deliberately don't pass `search` to the backend. Regex doesn't
      // tolerate typos, so we filter locally below.
      const [listingsRes, cardsRes] = await Promise.all([
        fetchPublicListings({ sort: sort === "trust" ? "trusted" : undefined, limit: 50 }),
        fetchDefinedCards()
      ]);
      setListings(listingsRes.data as unknown as CardData[]);
      setDefinedCards(cardsRes.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [sort]);

  const cardTypes = useMemo(() => {
    return [...new Set(definedCards.map((c) => c.type))];
  }, [definedCards]);

  const filtered = useMemo(() => {
    let cards = listings;
    if (search.trim()) {
      cards = cards.filter((c) =>
        fuzzyMatchAny(search, [
          c.offeringCard,
          c.offeringCardType,
          ...c.wantedCards
        ])
      );
    }
    if (typeFilter) {
      cards = cards.filter((c) => c.offeringCardType === typeFilter);
    }
    return cards;
  }, [listings, search, typeFilter]);

  const visibleCards = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => { setVisibleCount(10); }, [search, typeFilter]);

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

  // Fuzzy matching is client-side, so the search box just sets state.
  const handleSearch = (query: string) => {
    setSearch(query);
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar onSearch={handleSearch} />
      <HeroBanner />

      <main id="listings" className="container py-6 space-y-4 flex-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Active Listings</h2>
            {cardTypes.length > 0 && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by card type"
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                {cardTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            One active listing per user. Keep the community fair.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 min-h-[40vh] flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-border rounded-lg p-8">
            <p className="text-sm text-foreground">No listings match your filters yet.</p>
            <p className="text-xs text-muted-foreground">Be the first to list a card and help the community.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  onClaim={setClaimCard}
                  onGift={setGiftCard}
                />
              ))}
            </div>
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center py-4" aria-hidden="true">
                <span className="text-xs text-muted-foreground animate-pulse">Loading more…</span>
              </div>
            )}
          </>
        )}
      </main>

      <FloatingActions />

      <Footer />
      <BottomNav />

      {claimCard && (
        <ClaimModal
          card={claimCard}
          onClose={() => setClaimCard(null)}
          onClaimed={() => loadData()}
        />
      )}

      {giftCard && (
        <GiftRequestModal
          card={giftCard}
          onClose={() => setGiftCard(null)}
        />
      )}
    </div>
  );
};

export default Index;
