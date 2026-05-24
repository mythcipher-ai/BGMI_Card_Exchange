import { useEffect, useState } from "react";
import { X, AlertTriangle, Loader2, Copy, Check } from "lucide-react";
import type { CardData } from "./CardItem";
import { toast } from "sonner";
import { claimListing } from "@/lib/api";

interface ClaimModalProps {
  card: CardData;
  onClose: () => void;
  onClaimed?: () => void;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const ClaimModal = ({ card, onClose, onClaimed }: ClaimModalProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revealedCode, setRevealedCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-copy when the code is first revealed so the user can paste straight
  // into BGMI. We still show a manual copy button as a fallback / re-copy.
  useEffect(() => {
    if (!confirmed || !revealedCode) return;
    copyToClipboard(revealedCode).then((ok) => {
      if (ok) {
        setCopied(true);
        toast.success("Code copied to clipboard");
      }
    });
  }, [confirmed, revealedCode]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await claimListing(card.id);
      setRevealedCode(result.revealedCode);
      setConfirmed(true);
      onClaimed?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(revealedCode);
    if (ok) {
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Couldn't copy. Long-press the code to copy it instead.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-lg border border-primary/40 bg-card p-5 space-y-4 animate-slide-up glow-blue"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="claim-modal-title" className="font-heading text-base font-semibold text-foreground">Claim Card</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close claim dialog"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {card.wantedCardImage ? (
          <div className="relative rounded-md overflow-hidden aspect-[3/3] border border-border">
            <img src={card.wantedCardImage} alt={card.wantedCard} className="w-full h-full object-cover" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 bg-gradient-to-b from-background/80 to-transparent">
              <p className="text-sm font-semibold text-foreground drop-shadow truncate">{card.wantedCard}</p>
              {card.wantedCardType && (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-background/80 backdrop-blur-sm text-primary border border-primary/40 rounded shrink-0">
                  {card.wantedCardType}
                </span>
              )}
            </div>

            {!confirmed && (
              <div className="absolute inset-x-0 bottom-0 flex items-start gap-2 px-3 py-2 bg-gradient-to-t from-destructive/80 via-destructive/50 to-transparent">
                <AlertTriangle size={14} className="text-white mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-[11px] font-medium text-white leading-tight">
                  This action is irreversible. Once claimed, the code is revealed and the listing is removed.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-foreground font-semibold">{card.wantedCard}</p>
            <p className="text-xs text-muted-foreground">{card.wantedCardType}</p>
          </div>
        )}

        <div className="space-y-1.5 rounded-md border border-accent/30 bg-accent/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-accent">You'll receive (pick one in-game)</p>
          <div className="flex flex-wrap gap-1">
            {card.offeringCards.map((o) => (
              <span key={o} className="px-1.5 py-0.5 rounded border border-accent/40 bg-accent/10 text-accent text-[10px] font-medium">
                {o}
              </span>
            ))}
          </div>
        </div>

        {confirmed && (
          <div className="rounded-md bg-secondary p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Code</p>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy code"
                className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="font-mono text-sm text-foreground tracking-wider select-all mt-1">
              {revealedCode}
            </p>
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
