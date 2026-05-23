import { ArrowRightLeft, Clock, Gift } from "lucide-react";

export interface CardData {
  id: string;
  offeringCard: string;
  offeringCardImage: string;
  offeringCardType: string;
  wantedCards: string[];
  wantedCardImages: { name: string; imageUrl: string; type: string }[];
  trustScore: number;
  maskedCode: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  claimCount: number;
}

interface CardItemProps {
  card: CardData;
  onClaim: (card: CardData) => void;
  onGift?: (card: CardData) => void;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CardItem = ({ card, onClaim, onGift }: CardItemProps) => {
  return (
    <article
      className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:glow-blue animate-slide-up"
      aria-label={`${card.offeringCard} listing`}
    >
      <div className="aspect-[4/3] w-full bg-secondary overflow-hidden relative">
        {card.offeringCardImage ? (
          <img
            src={card.offeringCardImage}
            alt={card.offeringCard}
            className="h-full w-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-background">
            <span className="font-heading text-lg text-muted-foreground/60">{card.offeringCard}</span>
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-background/80 backdrop-blur-sm text-primary border border-primary/40 rounded">
            {card.offeringCardType || "Card"}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-heading text-sm font-semibold text-foreground leading-tight truncate">
          {card.offeringCard}
        </h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-primary font-medium">Owner</span>
          <ArrowRightLeft size={10} className="text-muted-foreground" aria-hidden="true" />
          <span className="text-accent font-medium truncate">
            Wants {card.wantedCards[0]}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={10} aria-hidden="true" />
            <span>{timeAgo(card.createdAt)}</span>
          </div>
          {card.claimCount > 0 && (
            <span aria-label={`${card.claimCount} claims`}>· {card.claimCount} claim{card.claimCount === 1 ? "" : "s"}</span>
          )}
        </div>

        <div className="flex gap-1.5 mt-1">
          <button
            type="button"
            onClick={() => onClaim(card)}
            className="flex-1 rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98]"
            aria-label={`Claim ${card.offeringCard}`}
          >
            Claim
          </button>
          {onGift && (
            <button
              type="button"
              onClick={() => onGift(card)}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-accent/40 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors active:scale-[0.98]"
              aria-label={`Request gift for ${card.offeringCard}`}
              title="Request as a gift"
            >
              <Gift size={12} aria-hidden="true" />
              Gift
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default CardItem;
