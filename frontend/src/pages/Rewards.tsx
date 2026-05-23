import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import RewardClaimModal from "@/components/RewardClaimModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchMyMilestones,
  type MilestoneEntry,
  type MyMilestonesPayload
} from "@/lib/api";
import {
  Loader2, Trophy, Lock, CheckCircle2, XCircle, Hourglass, Sparkles, ArrowLeft, Gift
} from "lucide-react";

const STATE_LABEL: Record<MilestoneEntry["state"], string> = {
  locked: "Locked",
  available: "Claim available",
  pending: "Pending review",
  approved: "Approved",
  delivered: "Delivered",
  rejected: "Rejected"
};

const STATE_TONE: Record<MilestoneEntry["state"], string> = {
  locked: "bg-muted text-muted-foreground border-border",
  available: "bg-primary/20 text-primary border-primary/50",
  pending: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  approved: "bg-sky-400/15 text-sky-300 border-sky-400/40",
  delivered: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  rejected: "bg-destructive/15 text-destructive border-destructive/40"
};

function StateIcon({ state }: { state: MilestoneEntry["state"] }) {
  if (state === "locked") return <Lock size={11} aria-hidden="true" />;
  if (state === "available") return <Sparkles size={11} aria-hidden="true" />;
  if (state === "delivered") return <CheckCircle2 size={11} aria-hidden="true" />;
  if (state === "rejected") return <XCircle size={11} aria-hidden="true" />;
  return <Hourglass size={11} aria-hidden="true" />;
}

const Rewards = () => {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<MyMilestonesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<MilestoneEntry | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchMyMilestones();
      setData(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load rewards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      login();
      return;
    }
    load();
  }, [authLoading, isAuthenticated]);

  if (authLoading || loading || !data) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
        <Navbar />
        <main className="container flex-1 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} aria-label="Loading rewards" />
        </main>
        <BottomNav />
      </div>
    );
  }

  const trades = data.successfulTrades;
  const nextMilestone = data.milestones.find((m) => m.state === "locked");
  const progressToNext = nextMilestone
    ? Math.min(100, Math.round((trades / nextMilestone.threshold) * 100))
    : 100;

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar />
      <main className="container py-6 max-w-5xl mx-auto flex-1 space-y-6">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hidden md:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={12} aria-hidden="true" /> Home
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-14 md:w-10 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
              <Trophy size={20} aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Rewards &amp; Milestones</h1>
              <p className="text-xs text-muted-foreground">
                Earn BGMI in-game popularity for every successful trade you complete.
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar to next milestone */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-3 glow-blue">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Successful trades</p>
              <p className="font-heading text-2xl font-bold text-foreground">{trades}</p>
            </div>
            {nextMilestone ? (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next milestone</p>
                <p className="font-heading text-sm text-foreground">
                  {nextMilestone.threshold} trades · {nextMilestone.popularityReward.toLocaleString()} popularity
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-300 font-semibold inline-flex items-center gap-1">
                <Sparkles size={12} aria-hidden="true" /> All milestones reached
              </p>
            )}
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${progressToNext}%` }}
              aria-valuenow={progressToNext}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            A "successful trade" is when another user successfully claims a card you listed. Self-claims and failed claims don't count.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.milestones.map((m) => {
            const reached = trades >= m.threshold;
            const progressPct = Math.min(100, Math.round((Math.min(trades, m.threshold) / m.threshold) * 100));
            return (
              <article
                key={m.threshold}
                className={`relative rounded-lg border bg-card p-4 space-y-3 transition-all ${
                  m.state === "available"
                    ? "border-primary/60 glow-blue"
                    : m.state === "delivered"
                      ? "border-emerald-400/40"
                      : m.state === "rejected"
                        ? "border-destructive/30 opacity-80"
                        : reached
                          ? "border-border"
                          : "border-border/60 opacity-90"
                }`}
              >
                {/* Reward image placeholder + state badge */}
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                    {m.state === "delivered" ? (
                      <CheckCircle2 className="text-emerald-300" size={28} aria-hidden="true" />
                    ) : m.state === "locked" ? (
                      <Lock className="text-muted-foreground" size={24} aria-hidden="true" />
                    ) : (
                      <Trophy className="text-primary" size={28} aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-semibold text-foreground">
                      {m.threshold}-trade milestone
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Complete {m.threshold} successful trade{m.threshold === 1 ? "" : "s"}
                    </p>
                    <span className={`mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${STATE_TONE[m.state]}`}>
                      <StateIcon state={m.state} />
                      {STATE_LABEL[m.state]}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">
                      {Math.min(trades, m.threshold)} / {m.threshold}
                    </span>
                    <span className="text-accent font-semibold inline-flex items-center gap-1">
                      <Gift size={10} aria-hidden="true" />
                      {m.popularityReward.toLocaleString()} popularity
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        m.state === "delivered" ? "bg-emerald-400" :
                        m.state === "available" ? "bg-gradient-to-r from-primary to-accent" :
                        reached ? "bg-primary" : "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Action */}
                <div className="pt-1">
                  {m.state === "available" && (
                    <button
                      type="button"
                      onClick={() => setClaiming(m)}
                      className="w-full rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all glow-blue inline-flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={12} aria-hidden="true" />
                      Claim reward
                    </button>
                  )}
                  {m.state === "locked" && (
                    <p className="text-[11px] text-muted-foreground text-center">
                      {m.threshold - trades} more trade{m.threshold - trades === 1 ? "" : "s"} to unlock
                    </p>
                  )}
                  {m.state === "pending" && (
                    <p className="text-[11px] text-amber-300 text-center">Awaiting admin review</p>
                  )}
                  {m.state === "approved" && (
                    <p className="text-[11px] text-sky-300 text-center">Approved — delivery in progress</p>
                  )}
                  {m.state === "delivered" && (
                    <div className="text-[11px] text-emerald-300 text-center space-y-0.5">
                      <p>Delivered to UID {m.request?.bgmiUid}</p>
                      {m.request?.deliveredAt && (
                        <p className="text-muted-foreground">{new Date(m.request.deliveredAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                  {m.state === "rejected" && (
                    <p className="text-[11px] text-destructive text-center" title={m.request?.rejectionReason}>
                      Rejected{m.request?.rejectionReason ? `: ${m.request.rejectionReason}` : ""}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <p className="text-[11px] text-muted-foreground text-center">
          BGMI in-game popularity is delivered manually by admin after review. Typical turnaround: 24–48 hours.
          <Link to="/terms" className="text-primary hover:underline ml-1">See terms</Link>.
        </p>
      </main>
      <BottomNav />

      {claiming && (
        <RewardClaimModal
          milestone={claiming}
          savedBgmiUid={data.savedBgmiUid}
          onClose={() => setClaiming(null)}
          onClaimed={() => { setClaiming(null); load(); }}
        />
      )}
    </div>
  );
};

export default Rewards;
