import { useMemo, useState } from "react";
import { Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { createListing, type DefinedCard } from "@/lib/api";

const MAX_OFFER = 3;

interface ListingPopupProps {
  // The card the user just clicked — pre-seeded as the first card in the
  // offering pool. They can add up to two more.
  offeringCard: DefinedCard;
  allCards: DefinedCard[];
  // The event the click came from. The wanted-card picker defaults to this
  // event because in-game trades usually stay within an event.
  eventId: string;
  onClose: () => void;
  onListed: () => void;
}

/**
 * Modal that finalises a listing.
 *
 * Model: the lister GIVES one of up to 3 offered cards (buyer picks in-game)
 * and WANTS one specific card back. Inputs:
 *   • offering pool (1-3) — pre-seeded with the card the user clicked
 *   • wanted card (1) — chosen from the same event by default
 *   • 8-digit BGMI trade code
 */
const ListingPopup = ({ offeringCard, allCards, eventId, onClose, onListed }: ListingPopupProps) => {
  const [code, setCode] = useState("");
  const [offering, setOffering] = useState<string[]>([offeringCard._id]);
  const [wantedId, setWantedId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Wanted picker scope. Defaults to "this event" — most BGMI trades stay
  // inside one event — but the user can switch to "all events" if they want.
  const [scope, setScope] = useState<"event" | "all">("event");

  const offerFull = offering.length >= MAX_OFFER;

  const toggleOffering = (cardId: string) => {
    setOffering((prev) => {
      if (prev.includes(cardId)) {
        // Don't let them drop the originally-clicked card to zero offerings.
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= MAX_OFFER) {
        toast.error(`You can only offer up to ${MAX_OFFER} cards.`);
        return prev;
      }
      // Picking a card as offering removes it from wanted if set.
      if (wantedId === cardId) setWantedId("");
      return [...prev, cardId];
    });
  };

  const pickerCards = useMemo(() => {
    const base = scope === "event"
      ? allCards.filter((c) => {
          if (!c.eventId) return false;
          const evId = typeof c.eventId === "string" ? c.eventId : c.eventId._id;
          return evId === eventId;
        })
      : allCards;
    return base;
  }, [allCards, eventId, scope]);

  const offeringPicker = useMemo(() => pickerCards, [pickerCards]);

  // Wanted picker: hide cards that are already in the offering pool so the
  // user can't pick the same card to both give and receive.
  const wantedPicker = useMemo(
    () => pickerCards.filter((c) => !offering.includes(c._id)),
    [pickerCards, offering]
  );

  const groupBy = (cards: DefinedCard[]) => {
    const map: Record<string, DefinedCard[]> = {};
    for (const c of cards) {
      (map[c.type] = map[c.type] || []).push(c);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.name.localeCompare(b.name));
    return map;
  };

  const offeringGroups = useMemo(() => groupBy(offeringPicker), [offeringPicker]);
  const wantedGroups = useMemo(() => groupBy(wantedPicker), [wantedPicker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(code)) return toast.error("Code must be exactly 8 digits");
    if (offering.length === 0) return toast.error("Pick at least 1 card you'll offer");
    if (offering.length > MAX_OFFER) return toast.error(`Max ${MAX_OFFER} offered cards`);
    if (!wantedId) return toast.error("Pick the card you want in exchange");

    setSubmitting(true);
    try {
      await createListing({
        offeringCardIds: offering,
        wantedCardId: wantedId,
        code
      });
      toast.success("Card listed successfully!");
      onListed();
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-popup-title"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-card border border-border sm:rounded-xl rounded-t-2xl shadow-2xl"
      >
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
          <h2 id="listing-popup-title" className="font-heading text-sm font-semibold text-foreground truncate">
            New trade listing
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* ---- Offering pool (1-3) ---- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-medium text-muted-foreground">
                Cards you're offering (buyer picks one)
              </label>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                offerFull
                  ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/40"
                  : "bg-secondary text-muted-foreground border-border"
              }`}>
                {offering.length} / {MAX_OFFER}
              </span>
            </div>

            {offering.length > 0 && (
              <div className="flex flex-wrap gap-1.5 rounded-md border border-primary/30 bg-primary/5 p-2">
                {offering.map((id) => {
                  const c = allCards.find((x) => x._id === id);
                  if (!c) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleOffering(id)}
                      aria-label={`Remove ${c.name}`}
                      disabled={offering.length === 1}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 text-xs hover:bg-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {c.name}
                      {offering.length > 1 && <X size={11} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              {Object.entries(offeringGroups).map(([type, cards]) => (
                <div key={type}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{type}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {cards.map((c) => {
                      const picked = offering.includes(c._id);
                      const disabled = !picked && offerFull;
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => toggleOffering(c._id)}
                          disabled={disabled}
                          aria-pressed={picked}
                          className={`relative rounded-md overflow-hidden border transition-all text-left ${
                            picked
                              ? "border-primary ring-2 ring-primary/40"
                              : disabled
                                ? "border-border opacity-40 cursor-not-allowed"
                                : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="aspect-[2/3] w-full bg-background">
                            {c.imageUrl ? (
                              <img
                                src={c.imageUrl}
                                alt={c.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/70 px-1 text-center">{c.name}</div>
                            )}
                          </div>
                          <div className="px-1.5 py-1 bg-card">
                            <p className="text-[10px] text-foreground truncate">{c.name}</p>
                          </div>
                          {picked && (
                            <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                              <Check size={11} aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Wanted card (single) ---- */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-medium text-muted-foreground">
                Card you want in exchange (pick one)
              </label>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                wantedId
                  ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/40"
                  : "bg-secondary text-muted-foreground border-border"
              }`}>
                {wantedId ? "Selected" : "Not selected"}
              </span>
            </div>

            <div role="group" aria-label="Wanted picker scope" className="flex rounded-md border border-border overflow-hidden text-[11px] w-fit">
              {(["event", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  aria-pressed={scope === s}
                  className={`px-2.5 py-1 transition-colors ${
                    scope === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "event" ? "This event" : "All events"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {Object.entries(wantedGroups).map(([type, cards]) => (
                <div key={type}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{type}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {cards.map((c) => {
                      const picked = wantedId === c._id;
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => setWantedId(picked ? "" : c._id)}
                          aria-pressed={picked}
                          className={`relative rounded-md overflow-hidden border transition-all text-left ${
                            picked
                              ? "border-accent ring-2 ring-accent/40"
                              : "border-border hover:border-accent/40"
                          }`}
                        >
                          <div className="aspect-[2/3] w-full bg-background">
                            {c.imageUrl ? (
                              <img
                                src={c.imageUrl}
                                alt={c.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/70 px-1 text-center">{c.name}</div>
                            )}
                          </div>
                          <div className="px-1.5 py-1 bg-card">
                            <p className="text-[10px] text-foreground truncate">{c.name}</p>
                          </div>
                          {picked && (
                            <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow">
                              <Check size={11} aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {Object.keys(wantedGroups).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No cards available to pick.</p>
              )}
            </div>
          </div>

          {/* ---- Trade code ---- */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <label className="text-xs font-medium text-muted-foreground flex items-center justify-between" htmlFor="popup-code">
              <span>Trade code (8 digits)</span>
              <span className={`text-[10px] font-mono ${code.length === 8 ? "text-emerald-400" : "text-muted-foreground"}`}>
                {code.length} / 8
              </span>
            </label>
            <input
              id="popup-code"
              type="text"
              inputMode="numeric"
              pattern="\d{8}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="12345678"
              maxLength={8}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
            />
            <p className="text-[10px] text-muted-foreground">
              Each code can only be listed once. Generate it from BGMI right before listing.
            </p>
          </div>
        </div>

        <footer className="px-4 py-3 border-t border-border shrink-0 bg-card">
          <button
            type="submit"
            disabled={submitting || code.length !== 8 || offering.length === 0 || !wantedId}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Submit listing
          </button>
        </footer>
      </form>
    </div>
  );
};

export default ListingPopup;
