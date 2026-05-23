import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Sparkles, X, KeyRound, Target } from "lucide-react";
import { fetchMyMilestones, type MilestoneEntry } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// Separate dismiss keys per auth state so a guest closing the promo doesn't
// suppress the "you have a reward!" popup once they sign in (and vice versa).
const DISMISS_KEY_AUTH = "rewards-popup-dismissed-auth";
const DISMISS_KEY_GUEST = "rewards-popup-dismissed-guest";

function wasDismissed(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * Reward popup shown on the home page.
 *
 * Per spec: always shows for both logged-in AND logged-out users, and only
 * goes away when the user clicks the close button (sessionStorage), so it
 * reappears on each fresh tab / refresh until then.
 *
 * Content varies by state:
 *   • Guest                                  -> "Earn rewards by trading"  CTA -> /login
 *   • Authed + has available milestone       -> "You've unlocked X popularity"  CTA -> /rewards
 *   • Authed + no milestone yet              -> "Keep trading to unlock rewards"  CTA -> /rewards
 */
const RewardNudgeBanner = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useAuth();

  const dismissKey = isAuthenticated ? DISMISS_KEY_AUTH : DISMISS_KEY_GUEST;
  const [hidden, setHidden] = useState(() => wasDismissed(dismissKey));
  const [milestone, setMilestone] = useState<MilestoneEntry | null>(null);

  // Re-evaluate dismissal state when auth flips so guest dismissal doesn't
  // leak into the authed view (and vice versa).
  useEffect(() => {
    setHidden(wasDismissed(dismissKey));
  }, [dismissKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMilestone(null);
      return;
    }
    let cancelled = false;
    fetchMyMilestones()
      .then((res) => {
        if (cancelled) return;
        const available = res.data.milestones.find((m) => m.state === "available");
        setMilestone(available ?? null);
      })
      .catch(() => { /* silent — popup still renders, just without specific data */ });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Render nothing while auth is still resolving (avoids a flash of the
  // guest variant before flipping to authed). Once isLoading is false we
  // always show — for both states — until the user dismisses.
  if (isLoading || hidden) return null;

  const close = () => {
    try { sessionStorage.setItem(dismissKey, "1"); } catch { /* ignore */ }
    setHidden(true);
  };

  const cta = () => {
    if (isAuthenticated) navigate("/rewards");
    else login();
  };

  // Pick content variant.
  let title: string;
  let body: React.ReactNode;
  let buttonLabel: string;
  let buttonIcon: React.ReactNode;
  if (!isAuthenticated) {
    title = "Earn BGMI in-game popularity";
    body = (
      <>
        Trade cards on Blue Lock Exchange and unlock up to{" "}
        <span className="text-foreground font-semibold">6,000 in-game popularity</span>{" "}
        across six milestones. Sign in to start tracking your trades.
      </>
    );
    buttonLabel = "Sign in to claim";
    buttonIcon = <KeyRound size={14} aria-hidden="true" />;
  } else if (milestone) {
    title = "You've unlocked a reward";
    body = (
      <>
        Claim your{" "}
        <span className="text-foreground font-semibold">
          {milestone.popularityReward.toLocaleString()} BGMI in-game popularity
        </span>{" "}
        for the {milestone.threshold}-trade milestone.
      </>
    );
    buttonLabel = "View rewards";
    buttonIcon = <Trophy size={14} aria-hidden="true" />;
  } else {
    title = "Keep trading to unlock rewards";
    body = (
      <>
        Complete more successful trades to hit the next milestone. Rewards range
        from{" "}
        <span className="text-foreground font-semibold">1,000 to 6,000 BGMI popularity</span>.
      </>
    );
    buttonLabel = "View milestones";
    buttonIcon = <Target size={14} aria-hidden="true" />;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-popup-title"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="relative w-full max-w-md rounded-xl border border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 p-5 sm:p-6 shadow-2xl glow-blue animate-slide-up">
        <button
          type="button"
          onClick={close}
          aria-label="Close reward popup"
          className="absolute right-2 top-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/40 to-accent/40 border border-primary/40 flex items-center justify-center shrink-0">
            <Trophy size={26} className="text-primary" aria-hidden="true" />
          </div>

          <h2 id="reward-popup-title" className="font-heading text-base sm:text-lg font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground">{body}</p>

          <button
            type="button"
            onClick={cta}
            className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            {buttonIcon}
            {buttonLabel}
          </button>

          <button
            type="button"
            onClick={close}
            className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline mt-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardNudgeBanner;
