import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import type { CardData } from "./CardItem";
import { toast } from "sonner";
import { claimListing } from "@/lib/api";

interface ClaimModalProps {
  card: CardData;
  onClose: () => void;
  onClaimed?: () => void;
}

const ClaimModal = ({ card, onClose, onClaimed }: ClaimModalProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revealedCode, setRevealedCode] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await claimListing(card.id);
      setRevealedCode(result.revealedCode);
      setConfirmed(true);
      toast.success("Code revealed! Copy it before closing.");
      onClaimed?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-card p-5 space-y-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">Claim Card</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-foreground">{card.offeringCard}</p>
          <p className="text-xs text-muted-foreground">{card.offeringCardType}</p>
        </div>

        {card.offeringCardImage && (
          <div className="rounded-md overflow-hidden aspect-[4/3]">
            <img src={card.offeringCardImage} alt={card.offeringCard} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="rounded-md bg-secondary p-3">
          <p className="text-xs text-muted-foreground mb-1">Code</p>
          <p className="font-mono text-sm text-foreground tracking-wider select-all">
            {confirmed ? revealedCode : card.maskedCode}
          </p>
        </div>

        {!confirmed && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">This action is irreversible. Once claimed, the code will be revealed and the listing removed.</p>
          </div>
        )}

        {!confirmed ? (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirm Claim
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full rounded-md border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default ClaimModal;
