import { useState, useEffect } from "react";
import { X, Loader2, Trophy, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { claimMilestone, type MilestoneEntry } from "@/lib/api";

interface RewardClaimModalProps {
  milestone: MilestoneEntry;
  savedBgmiUid: string | null;
  onClose: () => void;
  onClaimed: () => void;
}

const UID_RE = /^\d{11}$/;

const RewardClaimModal = ({ milestone, savedBgmiUid, onClose, onClaimed }: RewardClaimModalProps) => {
  const [uid, setUid] = useState(savedBgmiUid ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (savedBgmiUid && !uid) setUid(savedBgmiUid);
  }, [savedBgmiUid]);

  const valid = UID_RE.test(uid);
  const partial = uid.length > 0 && uid.length < 11;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await claimMilestone(milestone.threshold, uid);
      toast.success("Claim submitted. Admin will deliver your reward soon.");
      onClaimed();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-claim-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-primary/40 bg-card p-5 space-y-4 animate-slide-up glow-blue"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="reward-claim-title" className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Trophy size={16} className="text-primary" aria-hidden="true" />
            Claim Reward
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reward claim dialog"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-md border border-border bg-background/40 p-3 flex items-center gap-3">
          <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/40 flex items-center justify-center shrink-0">
            <Sparkles className="text-primary" size={26} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold text-foreground">
              {milestone.threshold}-trade milestone
            </p>
            <p className="text-xs text-accent font-semibold">
              {milestone.popularityReward.toLocaleString()} BGMI in-game popularity
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="rounded-md bg-accent/5 border border-accent/20 p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-accent mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Popularity is a BGMI in-game asset. Admin will deliver it to the UID you enter below. Make sure it's correct.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center justify-between" htmlFor="bgmi-uid">
              <span>Your BGMI UID (11 digits)</span>
              <span className={`text-[10px] font-mono ${valid ? "text-emerald-400" : "text-muted-foreground"}`}>
                {uid.length} / 11
              </span>
            </label>
            <input
              id="bgmi-uid"
              type="text"
              inputMode="numeric"
              pattern="\d{11}"
              value={uid}
              onChange={(e) => setUid(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="12345678901"
              autoFocus
              required
              maxLength={11}
              aria-invalid={partial}
              aria-describedby="uid-help"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
            />
            <p id="uid-help" className="text-[11px] text-muted-foreground">
              {savedBgmiUid && uid === savedBgmiUid
                ? "Using the UID you saved last time. You can change it."
                : partial
                  ? `Enter the full 11-digit BGMI UID (${11 - uid.length} more digit${11 - uid.length === 1 ? "" : "s"}).`
                  : "Numbers only, exactly 11 digits."}
            </p>
          </div>

          <button
            type="submit"
            disabled={!valid || submitting}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Submit claim
          </button>
        </form>
      </div>
    </div>
  );
};

export default RewardClaimModal;
