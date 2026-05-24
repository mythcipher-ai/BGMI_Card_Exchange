import { useEffect, useState } from "react";
import { X, Loader2, Layers, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import CardItem, { type CardData } from "./CardItem";
import { fetchPublicListings, type CatalogCard as CatalogCardData } from "@/lib/api";
import { toast } from "sonner";

interface CardDetailModalProps {
  card: CatalogCardData;
  onClose: () => void;
  onClaim: (listing: CardData) => void;
  onGift: (listing: CardData) => void;
}

/**
 * Opened when a user taps a catalog tile.
 * Shows every active listing (code) currently available for that card.
 * If none, shows a clear empty state with a CTA for the user to list theirs.
 */
const CardDetailModal = ({ card, onClose, onClaim, onGift }: CardDetailModalProps) => {
  const [listings, setListings] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicListings({ cardId: card.id, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setListings(res.data as unknown as CardData[]);
      })
      .catch((err: any) => {
        if (!cancelled) toast.error(err.message || "Failed to load codes");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [card.id]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-lg border border-border bg-card flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 p-4 border-b border-border">
          {card.imageUrl && (
            <img src={card.imageUrl} alt="" className="w-14 h-20 rounded object-cover bg-secondary shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h2 id="card-detail-title" className="font-heading text-base font-semibold text-foreground truncate">
              {card.name}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {card.eventName ? `${card.eventName} · ${card.type}` : card.type}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border shrink-0 ${
              card.availableCount > 0
                ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/40"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            <Layers size={10} aria-hidden="true" />
            {card.availableCount} code{card.availableCount === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={22} aria-label="Loading codes" />
            </div>
          ) : listings.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Layers size={24} aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="font-heading text-sm font-semibold text-foreground">No codes available yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Be the first to list this card and help someone complete their collection.
                </p>
              </div>
              <Link
                to="/add"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={14} aria-hidden="true" />
                List this card
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {listings.map((listing) => (
                <CardItem
                  key={listing.id}
                  card={listing}
                  onClaim={onClaim}
                  onGift={onGift}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
