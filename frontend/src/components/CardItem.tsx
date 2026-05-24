import { ArrowRightLeft, Gift, Hourglass, UserCheck } from "lucide-react";
import { expiresIn, EXPIRY_TONE_CLASS } from "@/lib/time";
import { useAuth } from "@/contexts/AuthContext";
import type { CardImage } from "@/lib/api";

export interface CardData {
  id: string;
  // Pool of cards the lister is willing to GIVE (1-3). The buyer picks one
  // in-game when redeeming the trade code.
  offeringCards: string[];
  offeringCardImages: CardImage[];
  // The single card the lister WANTS back in exchange.
  wantedCard: string;
  wantedCardImage: string;
  wantedCardType: string;
  trustScore: number;
  maskedCode: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  claimCount: number;
  // Lister's user id. Used to hide the Claim button on the user's own
  // listing — backend also rejects self-claims as a hard guarantee.
  createdById: string | null;
}

interface CardItemProps {
  card: CardData;
  onClaim: (card: CardData) => void;
  onGift?: (card: CardData) => void;
}

// timeAgo helper kept commented in case we restore the timestamp row later.
// function timeAgo(date: string) {
//   const diff = Date.now() - new Date(date).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// }

const CardItem = ({ card, onClaim, onGift }: CardItemProps) => {
  const expiry = expiresIn(card.expiresAt);
  const isExpired = expiry.tone === "expired";
  const { user } = useAuth();
  const isOwn = !!user && !!card.createdById && card.createdById === user.id;

  // Primary cover image — the wanted card. That's the single asset the lister
  // is hunting, so it's the most informative tile for browsers scanning the
  // listings grid.
  const cover = card.wantedCardImage;
  const coverAlt = card.wantedCard;
  const coverType = card.wantedCardType || "Card";

  return (
    <article
      className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:glow-blue animate-slide-up"
      aria-label={`Listing wanting ${card.wantedCard}`}
    >
      <div className="aspect-[2.5/3] w-full bg-secondary overflow-hidden relative">
        {cover ? (
          <img
            src={cover}
            alt={coverAlt}
            className="h-ful -mt-5 w-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-background">
            <span className="font-heading text-lg text-muted-foreground/60">{card.wantedCard}</span>
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-background/80 backdrop-blur-sm text-primary border border-primary/40 rounded">
            {coverType}
          </span>
        </div>

        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-background/80 backdrop-blur-sm border ${
            isExpired
              ? "border-destructive/40 text-destructive"
              : "border-border " + EXPIRY_TONE_CLASS[expiry.tone]
          }`}>
            <Hourglass size={10} aria-hidden="true" />
            {isExpired ? "Expired" : expiry.label.replace(" left", "")}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-heading text-sm font-semibold text-foreground leading-tight truncate">
          Wants: {card.wantedCard}
        </h3>

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-primary font-medium">Offers any of</span>
            <ArrowRightLeft size={10} className="text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">pick one in-game</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {card.offeringCards.map((o) => (
              <span
                key={o}
                className="px-1.5 py-0.5 rounded border border-accent/40 bg-accent/10 text-accent text-[10px] font-medium truncate max-w-[10rem]"
                title={o}
              >
                {o}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            You give "{card.wantedCard}" and receive one of the offered cards.
          </p>
        </div>

        {/* Time-ago row hidden by request; expiry now lives on the image overlay. */}
        {/* <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={10} aria-hidden="true" />
            <span>{timeAgo(card.createdAt)}</span>
          </div>
          {card.claimCount > 0 && (
            <span aria-label={`${card.claimCount} claims`}>· {card.claimCount} claim{card.claimCount === 1 ? "" : "s"}</span>
          )}
        </div> */}

        <div className="flex gap-1.5 mt-1">
          {isOwn ? (
            <div
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 py-1.5 text-xs font-semibold text-primary"
              title="This is your own listing. You can't claim it."
            >
              <UserCheck size={12} aria-hidden="true" />
              Your listing
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onClaim(card)}
                disabled={isExpired}
                className="flex-1 rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Claim listing wanting ${card.wantedCard}`}
              >
                {isExpired ? "Expired" : "Claim"}
              </button>
              {onGift && (
                <button
                  type="button"
                  onClick={() => onGift(card)}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-accent/40 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors active:scale-[0.98]"
                  aria-label={`Ask to give on listing wanting ${card.wantedCard}`}
                  title="Ask the owner to give this as a gift"
                >
                  <Gift size={12} aria-hidden="true" />
                  Ask to Give
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default CardItem;
