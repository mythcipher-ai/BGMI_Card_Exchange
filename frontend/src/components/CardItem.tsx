import TrustBadge from "./TrustBadge";
import { ArrowRightLeft, Clock } from "lucide-react";

export interface CardData {
  id: string;
  offeringCard: string;
  offeringCardImage: string;
  offeringCardType: string;
  offeringCount: number;
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
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CardItem = ({ card, onClaim }: CardItemProps) => {
  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:glow-green animate-slide-up">
      {/* Card Image */}
      <div className="aspect-[4/3] w-full bg-secondary overflow-hidden relative">
        {card.offeringCardImage ? (
          <img
            src={card.offeringCardImage}
            alt={card.offeringCard}
            className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-background">
            <span className="font-heading text-lg text-muted-foreground/50">{card.offeringCard}</span>
          </div>
        )}
        {/* Type badge overlay */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-background/80 backdrop-blur-sm text-primary border border-primary/30 rounded">
            {card.offeringCardType || "Card"}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <TrustBadge score={card.trustScore} />
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-heading text-sm font-semibold text-foreground leading-tight truncate">
          {card.offeringCard}
          {card.offeringCount > 1 && (
            <span className="text-primary ml-1">x{card.offeringCount}</span>
          )}
        </h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-primary font-medium">Has</span>
          <ArrowRightLeft size={10} className="text-muted-foreground" />
          <span className="text-accent font-medium truncate">
            Wants {card.wantedCards.slice(0, 2).join(", ")}
            {card.wantedCards.length > 2 && ` +${card.wantedCards.length - 2}`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{timeAgo(card.createdAt)}</span>
          </div>
        </div>

        <button
          onClick={() => onClaim(card)}
          className="w-full mt-1 rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          Claim
        </button>
      </div>
    </div>
  );
};

export default CardItem;
