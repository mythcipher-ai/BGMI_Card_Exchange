import { useState, useEffect, useMemo } from "react";
import CardSkeleton from "@/components/CardSkeleton";
import ClaimModal from "@/components/ClaimModal";
import GiftRequestModal from "@/components/GiftRequestModal";
import CatalogCard from "@/components/CatalogCard";
import CardDetailModal from "@/components/CardDetailModal";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import RewardNudgeBanner from "@/components/RewardNudgeBanner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type CardData } from "@/components/CardItem";
import { fetchCatalog, type CatalogCard as CatalogCardData } from "@/lib/api";
import { fuzzyMatchAny } from "@/lib/fuzzy";
import { toast } from "sonner";

type StockFilter = "all" | "available";
const PAGE_SIZE = 20;

const Index = () => {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [catalog, setCatalog] = useState<CatalogCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const [openCard, setOpenCard] = useState<CatalogCardData | null>(null);
  const [claimCard, setClaimCard] = useState<CardData | null>(null);
  const [giftCard, setGiftCard] = useState<CardData | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetchCatalog();
      setCatalog(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCatalog(); }, []);

  // Refetch silently after a successful claim so the count updates in the grid.
  const refresh = () => { loadCatalog(); };

  const types = useMemo(
    () => [...new Set(catalog.map((c) => c.type).filter(Boolean))].sort(),
    [catalog]
  );

  const filtered = useMemo(() => {
    let list = catalog;
    if (stockFilter === "available") list = list.filter((c) => c.availableCount > 0);
    if (typeFilter) list = list.filter((c) => c.type === typeFilter);
    if (search.trim()) {
      list = list.filter((c) =>
        fuzzyMatchAny(search, [c.name, c.type, c.eventName])
      );
    }
    // Sort: available first (more codes first), then alpha by name.
    return [...list].sort((a, b) => {
      if (a.availableCount !== b.availableCount) return b.availableCount - a.availableCount;
      return a.name.localeCompare(b.name);
    });
  }, [catalog, stockFilter, typeFilter, search]);

  const availableTotal = catalog.reduce((sum, c) => sum + c.availableCount, 0);

  // Reset to page 1 whenever filters/search narrow the result set, so the
  // user isn't stranded on a now-empty page.
  useEffect(() => { setPage(1); }, [stockFilter, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar onSearch={setSearch} />
      <HeroBanner />

      {/* Fixed-position modal — sits over the whole viewport until dismissed. */}
      <RewardNudgeBanner />

      <main id="listings" className="container py-6 space-y-4 flex-1">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg font-semibold text-foreground">Card Catalog</h2>
            <span className="text-xs text-muted-foreground">
              {catalog.length} card{catalog.length === 1 ? "" : "s"} · {availableTotal} active code{availableTotal === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {types.length > 0 && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by card type"
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
            <div role="group" aria-label="Availability filter" className="flex rounded-md border border-border overflow-hidden text-xs">
              {(["all", "available"] as StockFilter[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStockFilter(k)}
                  aria-pressed={stockFilter === k}
                  className={`px-2.5 py-1 transition-colors capitalize ${
                    stockFilter === k
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k === "available" ? "In stock" : "All"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" aria-busy="true">
            {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 min-h-[40vh] flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-border rounded-lg p-8">
            <p className="text-sm text-foreground">No cards match your filters.</p>
            <p className="text-xs text-muted-foreground">Try clearing the type or availability filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {pageItems.map((c) => (
                <CatalogCard key={c.id} card={c} onOpen={setOpenCard} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Catalog pagination"
                className="flex items-center justify-between gap-3 pt-2"
              >
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                  Prev
                </button>
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  Page <span className="text-foreground font-medium">{safePage}</span> of {totalPages}
                  <span className="hidden sm:inline">
                    {" "}· showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      <FloatingActions />

      <Footer />
      <BottomNav />

      {openCard && (
        <CardDetailModal
          card={openCard}
          onClose={() => setOpenCard(null)}
          onClaim={(l) => { setClaimCard(l); setOpenCard(null); }}
          onGift={(l) => { setGiftCard(l); setOpenCard(null); }}
        />
      )}

      {claimCard && (
        <ClaimModal
          card={claimCard}
          onClose={() => setClaimCard(null)}
          onClaimed={refresh}
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
