import { useState, useEffect } from "react";
import { X, Gift, Loader2, AlertCircle } from "lucide-react";
import type { CardData } from "./CardItem";
import { toast } from "sonner";
import { createGiftRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface GiftRequestModalProps {
  card: CardData;
  onClose: () => void;
}

const MIN_MESSAGE = 10;
const MAX_MESSAGE = 500;
const POPULARITY_MAX = 1000;

const GiftRequestModal = ({ card, onClose }: GiftRequestModalProps) => {
  const { isAuthenticated, user, login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [popularity, setPopularity] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-lg border border-border bg-card p-5 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="font-heading text-base font-semibold text-foreground">Sign in to request gifts</h2>
          <p className="text-xs text-muted-foreground">
            Gift requests are tied to your account so card owners know who's asking. Sign in to continue.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={login}
              className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const messageTooShort = message.trim().length > 0 && message.trim().length < MIN_MESSAGE;
  const formValid =
    name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    message.trim().length >= MIN_MESSAGE &&
    popularity >= 0 &&
    popularity <= POPULARITY_MAX;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid || submitting) return;
    setSubmitting(true);
    try {
      await createGiftRequest(card.id, {
        requesterName: name.trim(),
        requesterEmail: email.trim(),
        message: message.trim(),
        popularityOffered: popularity
      });
      setSubmitted(true);
      toast.success("Gift request sent. The card owner has been emailed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send gift request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-accent/40 bg-card p-5 space-y-4 animate-slide-up glow-cyan"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="gift-modal-title" className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Gift size={16} className="text-accent" aria-hidden="true" />
            Request Gift
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gift request dialog"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-md border border-border bg-background/50 p-3 flex items-center gap-3">
          {card.offeringCardImage ? (
            <img src={card.offeringCardImage} alt="" className="w-14 h-10 rounded object-cover" />
          ) : (
            <div className="w-14 h-10 rounded bg-secondary" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{card.offeringCard}</p>
            <p className="text-xs text-muted-foreground">{card.offeringCardType}</p>
          </div>
        </div>

        {submitted ? (
          <div className="space-y-3">
            <div className="rounded-md bg-accent/10 border border-accent/30 p-3">
              <p className="text-sm text-foreground font-medium">Request sent.</p>
              <p className="text-xs text-muted-foreground mt-1">
                The card owner has been emailed. If they're interested they'll reach you at <span className="text-foreground">{email}</span>.
                Any BGMI in-game popularity you offered would be transferred directly to them in-game; we don't handle it.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="rounded-md bg-accent/5 border border-accent/20 p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-accent mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This sends an email to the card owner. We don't move the card, the code, or any in-game popularity. Everything happens directly between you two in BGMI. The owner can ignore or decline.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="gift-name">Your name</label>
                <input
                  id="gift-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  required
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="gift-email">Your email</label>
                <input
                  id="gift-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={120}
                  required
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between" htmlFor="gift-message">
                Message to owner
                <span className={messageTooShort ? "text-destructive" : ""}>
                  {message.trim().length}/{MAX_MESSAGE}
                </span>
              </label>
              <textarea
                id="gift-message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                rows={4}
                placeholder="Why are you hoping for this card? Keep it kind."
                required
                aria-describedby={messageTooShort ? "gift-message-error" : undefined}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {messageTooShort && (
                <p id="gift-message-error" className="text-[11px] text-destructive">
                  Please write at least {MIN_MESSAGE} characters.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between" htmlFor="gift-pop">
                BGMI in-game popularity you'll offer
                <span>{popularity} pts</span>
              </label>
              <input
                id="gift-pop"
                type="number"
                min={0}
                max={POPULARITY_MAX}
                value={popularity}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(POPULARITY_MAX, Number(e.target.value) || 0));
                  setPopularity(v);
                }}
                placeholder="0"
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Popularity is a BGMI in-game asset. You would transfer it to the owner directly in the game if they accept. Blue Lock Exchange does not handle, track, or award popularity.
              </p>
            </div>

            <button
              type="submit"
              disabled={!formValid || submitting}
              className="w-full rounded-md bg-accent py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              Send Gift Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GiftRequestModal;
