import { useMemo, useState } from "react";
import { Loader2, X, Check, ChevronLeft, ChevronRight, ArrowRightLeft } from "lucide-react";
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

type Step = "offer" | "want" | "code";

/**
 * Three-step wizard to create a listing:
 *   1. offer — pick up to 3 cards you'll give (preview strip on top)
 *   2. want  — pick the single card you want back (preview strip on top)
 *   3. code  — enter the 8-digit BGMI trade code; both previews recap on top
 */
const ListingPopup = ({ offeringCard, allCards, eventId, onClose, onListed }: ListingPopupProps) => {
  const [step, setStep] = useState<Step>("offer");
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
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= MAX_OFFER) {
        toast.error(`You can only offer up to ${MAX_OFFER} cards.`);
        return prev;
      }
      if (wantedId === cardId) setWantedId("");
      return [...prev, cardId];
    });
  };

  const pickerCards = useMemo(() => {
    return scope === "event"
      ? allCards.filter((c) => {
          if (!c.eventId) return false;
          const evId = typeof c.eventId === "string" ? c.eventId : c.eventId._id;
          return evId === eventId;
        })
      : allCards;
  }, [allCards, eventId, scope]);

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

  const offeringGroups = useMemo(() => groupBy(pickerCards), [pickerCards]);
  const wantedGroups = useMemo(() => groupBy(wantedPicker), [wantedPicker]);

  const cardById = useMemo(() => {
    const m = new Map<string, DefinedCard>();
    for (const c of allCards) m.set(c._id, c);
    return m;
  }, [allCards]);

  const offeringPreviews = offering.map((id) => cardById.get(id)).filter(Boolean) as DefinedCard[];
  const wantedPreview = wantedId ? cardById.get(wantedId) : undefined;

  const stepIndex = step === "offer" ? 0 : step === "want" ? 1 : 2;

  const goNext = () => {
    if (step === "offer") {
      if (offering.length === 0) return toast.error("Pick at least 1 card you'll offer");
      setStep("want");
    } else if (step === "want") {
      if (!wantedId) return toast.error("Pick the card you want in exchange");
      setStep("code");
    }
  };

  const goBack = () => {
    if (step === "want") setStep("offer");
    else if (step === "code") setStep("want");
  };

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
          <div className="flex items-center gap-2 min-w-0">
            <h2 id="listing-popup-title" className="font-heading text-sm font-semibold text-foreground truncate">
              {step === "offer" && "Pick cards you'll offer"}
              {step === "want" && "Pick the card you want"}
              {step === "code" && "Enter your trade code"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" aria-label={`Step ${stepIndex + 1} of 3`}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-5 rounded-full transition-colors ${
                    i <= stepIndex ? "bg-primary" : "bg-secondary"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* ---- Preview strip (always shown; what they've picked so far) ---- */}
        <PreviewStrip
          step={step}
          offeringPreviews={offeringPreviews}
          wantedPreview={wantedPreview}
          onRemoveOffering={(id) => offering.length > 1 && toggleOffering(id)}
          onClearWanted={() => setWantedId("")}
        />

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {step === "offer" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  Tap up to {MAX_OFFER} cards the buyer can pick from in-game.
                </p>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  offerFull
                    ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/40"
                    : "bg-secondary text-muted-foreground border-border"
                }`}>
                  {offering.length} / {MAX_OFFER}
                </span>
              </div>

              <CardGrid
                groups={offeringGroups}
                isPicked={(id) => offering.includes(id)}
                isDisabled={(id) => !offering.includes(id) && offerFull}
                onToggle={toggleOffering}
                tone="primary"
              />
            </div>
          )}

          {step === "want" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Tap the one card you want to receive back.
              </p>

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

              <CardGrid
                groups={wantedGroups}
                isPicked={(id) => wantedId === id}
                isDisabled={() => false}
                onToggle={(id) => setWantedId((prev) => (prev === id ? "" : id))}
                tone="accent"
              />
              {Object.keys(wantedGroups).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No cards available to pick.</p>
              )}
            </div>
          )}

          {step === "code" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Generate the 8-digit trade code from BGMI right before submitting. Each code can only be listed once.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center justify-between" htmlFor="popup-code">
                  <span>Trade code</span>
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
                  autoFocus
                  className="w-full rounded-md border border-border bg-secondary px-3 py-3 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest text-center"
                />
              </div>
            </div>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-border shrink-0 bg-card flex items-center gap-2">
          {step !== "offer" && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Back
            </button>
          )}
          {step !== "code" ? (
            <button
              type="button"
              onClick={goNext}
              disabled={step === "offer" ? offering.length === 0 : !wantedId}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || code.length !== 8 || offering.length === 0 || !wantedId}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              Submit listing
            </button>
          )}
        </footer>
      </form>
    </div>
  );
};

const PreviewStrip = ({
  step,
  offeringPreviews,
  wantedPreview,
  onRemoveOffering,
  onClearWanted
}: {
  step: Step;
  offeringPreviews: DefinedCard[];
  wantedPreview: DefinedCard | undefined;
  onRemoveOffering: (id: string) => void;
  onClearWanted: () => void;
}) => {
  // Single-row preview: [You give cards]  ⇄  [You want card].
  // On step 1 the right slot is dimmed (nothing picked yet); from step 2 on it
  // shows the actual choice so the user always sees the full trade at a glance.
  return (
    <div className="shrink-0 px-4 py-3 border-b border-border bg-background/40">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            You give
          </p>
          <div className="flex gap-1.5 overflow-x-auto">
            {offeringPreviews.length === 0 ? (
              <PreviewSlot label="Pick a card" />
            ) : (
              offeringPreviews.map((c, idx) => (
                <PreviewCard
                  key={c._id}
                  card={c}
                  tone="primary"
                  onRemove={offeringPreviews.length > 1 ? () => onRemoveOffering(c._id) : undefined}
                  removable={offeringPreviews.length > 1 && idx !== 0}
                />
              ))
            )}
          </div>
        </div>

        <div className="shrink-0 self-center h-8 w-8 rounded-full border border-border bg-secondary flex items-center justify-center text-muted-foreground">
          <ArrowRightLeft size={14} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            You want
          </p>
          <div className="flex gap-1.5">
            {wantedPreview ? (
              <PreviewCard card={wantedPreview} tone="accent" onRemove={onClearWanted} removable />
            ) : (
              <PreviewSlot label={step === "offer" ? "Next step" : "Pick a card"} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewSlot = ({ label }: { label: string }) => (
  <div className="h-16 w-12 rounded-md border border-dashed border-border bg-secondary/40 flex items-center justify-center text-[9px] text-muted-foreground text-center px-1 shrink-0">
    {label}
  </div>
);

const PreviewCard = ({
  card,
  tone,
  onRemove,
  removable
}: {
  card: DefinedCard;
  tone: "primary" | "accent";
  onRemove?: () => void;
  removable?: boolean;
}) => {
  const toneCls = tone === "primary"
    ? "border-primary/50 ring-1 ring-primary/30"
    : "border-accent/50 ring-1 ring-accent/30";
  return (
    <div className={`relative h-16 w-12 rounded-md overflow-hidden border ${toneCls} shrink-0`}>
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-[8px] text-muted-foreground bg-background text-center px-0.5">
          {card.name}
        </div>
      )}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${card.name}`}
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
        >
          <X size={9} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

const CardGrid = ({
  groups,
  isPicked,
  isDisabled,
  onToggle,
  tone
}: {
  groups: Record<string, DefinedCard[]>;
  isPicked: (id: string) => boolean;
  isDisabled: (id: string) => boolean;
  onToggle: (id: string) => void;
  tone: "primary" | "accent";
}) => {
  const pickedCls = tone === "primary"
    ? "border-primary ring-2 ring-primary/40"
    : "border-accent ring-2 ring-accent/40";
  const hoverCls = tone === "primary" ? "hover:border-primary/40" : "hover:border-accent/40";
  const dotCls = tone === "primary"
    ? "bg-primary text-primary-foreground"
    : "bg-accent text-accent-foreground";

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([type, cards]) => (
        <div key={type}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{type}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {cards.map((c) => {
              const picked = isPicked(c._id);
              const disabled = isDisabled(c._id);
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => onToggle(c._id)}
                  disabled={disabled}
                  aria-pressed={picked}
                  className={`relative rounded-md overflow-hidden border transition-all text-left ${
                    picked ? pickedCls : disabled ? "border-border opacity-40 cursor-not-allowed" : `border-border ${hoverCls}`
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
                    <span className={`absolute top-1 right-1 h-5 w-5 rounded-full ${dotCls} flex items-center justify-center shadow`}>
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
  );
};

export default ListingPopup;
