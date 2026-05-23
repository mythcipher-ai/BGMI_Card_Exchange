import { Layers, Ban } from "lucide-react";
import type { CatalogCard as CatalogCardData } from "@/lib/api";

interface CatalogCardProps {
  card: CatalogCardData;
  onOpen: (card: CatalogCardData) => void;
}

/**
 * One tile on the home catalog grid.
 * Type badge and code-count badge are both overlaid on the image at all
 * breakpoints. Mobile body shows only a centered title; desktop adds the
 * "event · type" description below.
 */
const CatalogCard = ({ card, onOpen }: CatalogCardProps) => {
  const inStock = card.availableCount > 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(card)}
      aria-label={inStock
        ? `${card.name}, ${card.availableCount} code${card.availableCount === 1 ? "" : "s"} available`
        : `${card.name}, no codes available yet`}
      className={`group text-left rounded-lg border bg-card overflow-hidden transition-all animate-slide-up ${
        inStock
          ? "border-border hover:border-primary/50 hover:glow-blue"
          : "border-border/60 opacity-80 hover:opacity-100 hover:border-border"
      }`}
    >
      <div className="aspect-[2/3] w-full bg-secondary overflow-hidden relative">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={`h-full w-full object-cover transition-all duration-300 ${
              inStock ? "opacity-90 group-hover:opacity-100 group-hover:scale-105" : "opacity-50 grayscale"
            }`}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-background">
            <span className="font-heading text-lg text-muted-foreground/60">{card.name}</span>
          </div>
        )}

        {/* Type badge: image overlay, all breakpoints. */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-background/80 backdrop-blur-sm text-primary border border-primary/40 rounded">
            {card.type || "Card"}
          </span>
        </div>

        {/* Code count / "No code" badge: image overlay, all breakpoints. */}
        <div className="absolute bottom-2 right-2">
          {inStock ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-400/15 text-emerald-300 border border-emerald-400/40 rounded backdrop-blur-sm"
              title={`${card.availableCount} active code${card.availableCount === 1 ? "" : "s"}`}
            >
              <Layers size={10} aria-hidden="true" />
              {card.availableCount} code{card.availableCount === 1 ? "" : "s"}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground border border-border rounded backdrop-blur-sm"
              title="No active codes for this card right now"
            >
              <Ban size={10} aria-hidden="true" />
              No code
            </span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-0.5">
        {/* Title — centered on mobile, left-aligned on desktop. */}
        <h3 className="font-heading text-sm font-semibold text-foreground leading-tight truncate text-center sm:text-left">
          {card.name}
        </h3>
        {/* Description shown only on desktop. */}
        <p className="hidden sm:block text-[10px] text-muted-foreground truncate">
          {card.eventName ? `${card.eventName} · ${card.type}` : card.type}
        </p>
      </div>
    </button>
  );
};

export default CatalogCard;
