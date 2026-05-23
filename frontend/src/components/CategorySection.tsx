import { memo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { DefinedCard } from "@/lib/api";

interface CategorySectionProps {
  cat: string;
  cards: DefinedCard[];
  blocked: boolean;
  onPick: (card: DefinedCard) => void;
  defaultOpen?: boolean;
}

/**
 * Collapsible category panel listing cards as image tiles.
 *
 * Performance design: each instance owns its own open state, and once it has
 * been opened we keep the heavy card grid mounted and just toggle it with the
 * `hidden` class. This keeps re-expansion instant — no image re-mount, no
 * sibling re-render — which fixed the "category dropdown lag" report.
 */
const CategorySection = memo(function CategorySection({
  cat, cards, blocked, onPick, defaultOpen = false
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [everOpened, setEverOpened] = useState(defaultOpen);

  const toggle = () => {
    setOpen((prev) => {
      if (!prev && !everOpened) setEverOpened(true);
      return !prev;
    });
  };

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors"
      >
        <span className="font-heading text-sm font-semibold text-foreground">{cat}</span>
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {cards.length} card{cards.length === 1 ? "" : "s"}
          {open
            ? <ChevronDown size={14} aria-hidden="true" />
            : <ChevronRight size={14} aria-hidden="true" />}
        </span>
      </button>

      {everOpened && (
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3 border-t border-border ${
            open ? "" : "hidden"
          }`}
        >
          {cards.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => {
                if (blocked) {
                  toast.error("You already have an active card listing.");
                  return;
                }
                onPick(c);
              }}
              className="group text-left rounded-md border border-border bg-secondary overflow-hidden hover:border-primary/50 hover:glow-blue transition-all"
              aria-label={`List ${c.name}`}
            >
              <div className="aspect-[2/3] w-full bg-background overflow-hidden">
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground/60 text-xs px-2 text-center">
                    {c.name}
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
});

export default CategorySection;
