import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import {
  adminGetUserDetail,
  adminBlockUser,
  adminUnblockUser,
  adminSetUserRole,
  type AdminUserDetailPayload,
  type AdminListingDetail,
  type AdminClaimDetail
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2, ArrowLeft, Ban, CheckCircle, Shield, Briefcase, UserCog,
  AlertTriangle, Hourglass, ShieldCheck, ShieldAlert, ArrowUpRight, Clock
} from "lucide-react";

function display(n?: string, e?: string) {
  return n || (e ? e.split("@")[0] : "User");
}

function fmtDate(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

function fmtDateOnly(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString();
}

const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user: me, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminUserDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && me?.role !== "admin") {
      navigate("/");
      return;
    }
    if (!id) return;
    adminGetUserDetail(id)
      .then((res) => setData(res))
      .catch((err: any) => toast.error(err.message || "Failed to load user"))
      .finally(() => setLoading(false));
  }, [id, authLoading, me]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container flex-1 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} aria-label="Loading" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container py-8 max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground">User not found.</p>
        </main>
      </div>
    );
  }

  const u = data.user;

  const handleBlock = async () => {
    setBusy(true);
    try {
      await adminBlockUser(u._id);
      toast.success("User blocked");
      setData({ ...data, user: { ...u, status: "blocked" } });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUnblock = async () => {
    setBusy(true);
    try {
      await adminUnblockUser(u._id);
      toast.success("User unblocked");
      setData({ ...data, user: { ...u, status: "active" } });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRole = async (role: "user" | "manager") => {
    setBusy(true);
    try {
      await adminSetUserRole(u._id, role);
      toast.success(role === "manager" ? "Promoted to Manager" : "Demoted to User");
      setData({ ...data, user: { ...u, role } });
    } catch (err: any) {
      toast.error(err.message || "Failed to change role");
    } finally {
      setBusy(false);
    }
  };

  const initial = (display(u.name, u.email)[0] || "?").toUpperCase();

  return (
    <div className="min-h-screen flex flex-col pb-8">
      <Navbar />
      <main className="container py-4 flex-1 max-w-7xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={12} aria-hidden="true" /> Back to users
        </button>

        {/* ---- Header ---- */}
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center font-heading text-lg font-semibold text-primary overflow-hidden shrink-0">
            {u.picture ? (
              <img src={u.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
              {display(u.name, u.email)}
              {u.role === "admin" && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-primary/20 text-primary border border-primary/40 rounded">
                  <Shield size={9} aria-hidden="true" /> Admin
                </span>
              )}
              {u.role === "manager" && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-accent/20 text-accent border border-accent/40 rounded">
                  <Briefcase size={9} aria-hidden="true" /> Manager
                </span>
              )}
              {u.status === "blocked" && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-destructive/20 text-destructive rounded">
                  Blocked
                </span>
              )}
            </p>
            {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
            {u.createdAt && (
              <p className="text-[10px] text-muted-foreground">Joined {fmtDateOnly(u.createdAt)}</p>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {u.role !== "admin" && (
              u.status === "active" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleBlock}
                  className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Ban size={12} aria-hidden="true" /> Block
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleUnblock}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <CheckCircle size={12} aria-hidden="true" /> Unblock
                </button>
              )
            )}
          </div>
        </div>

        {/* ---- Stat tiles ---- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatTile label="Listed" value={data.listings.length} />
          <StatTile label="Claims made" value={data.claims.length} />
          <StatTile label="Effective trades" value={data.effectiveTrades} accent />
          <StatTile label="Flags" value={u.flagCount ?? 0} tone={(u.flagCount ?? 0) > 0 ? "destructive" : undefined} />
        </div>

        {/* ---- Feedback breakdown ---- */}
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trade feedback received</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <FeedbackTile icon={<Hourglass size={12} aria-hidden="true" />} label="Awaiting" value={data.feedback.pending} tone="amber" />
            <FeedbackTile icon={<ShieldCheck size={12} aria-hidden="true" />} label="Confirmed" value={data.feedback.confirmed} tone="emerald" />
            <FeedbackTile icon={<ShieldAlert size={12} aria-hidden="true" />} label="Disputed" value={data.feedback.disputed} tone="destructive" />
            <FeedbackTile icon={<ArrowUpRight size={12} aria-hidden="true" />} label="Off-platform" value={data.feedback.external} tone="muted" />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Listed confirmed: {data.listedConfirmed} · Claimed confirmed: {data.claimedConfirmed}. Milestones count the smaller of the two ({data.effectiveTrades}).
          </p>
        </div>

        {/* ---- Role controls ---- */}
        {u.role !== "admin" && (
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <UserCog size={12} aria-hidden="true" /> Role
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Managers can manage cards and events. They cannot access user management.
            </p>
            <div className="flex gap-2">
              {u.role === "user" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRole("manager")}
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Briefcase size={11} aria-hidden="true" /> Promote to Manager
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRole("user")}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50 inline-flex items-center gap-1"
                >
                  Demote to User
                </button>
              )}
            </div>
          </div>
        )}

        {/* ---- Shared-IP warning ---- */}
        {data.sharedIpUsers.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <h2 className="text-xs font-semibold text-destructive flex items-center gap-1">
              <AlertTriangle size={12} aria-hidden="true" /> Shares IP with {data.sharedIpUsers.length} other account(s)
            </h2>
            <div className="space-y-1">
              {data.sharedIpUsers.map((su) => (
                <div key={su._id} className="flex items-center justify-between rounded bg-destructive/10 p-2 text-xs">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/users/${su._id}`)}
                    className="text-foreground hover:text-primary truncate text-left"
                  >
                    {display(su.name, su.email)}
                  </button>
                  <span className="text-muted-foreground font-mono text-[10px] truncate ml-2">{su.sharedIps.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Listings ---- */}
        <section className="space-y-2">
          <h2 className="font-heading text-sm font-semibold text-foreground">Listings ({data.listings.length})</h2>
          {data.listings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">No listings.</p>
          ) : (
            data.listings.map((l) => <ListingRow key={l._id} listing={l} />)
          )}
        </section>

        {/* ---- Claims ---- */}
        <section className="space-y-2">
          <h2 className="font-heading text-sm font-semibold text-foreground">Claims ({data.claims.length})</h2>
          {data.claims.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">No claims made.</p>
          ) : (
            data.claims.map((c) => <ClaimRow key={c._id} claim={c} />)
          )}
        </section>

        {/* ---- IPs ---- */}
        {data.ips.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP addresses used</h2>
            <div className="flex flex-wrap gap-1">
              {data.ips.map((ip) => (
                <span key={ip} className="px-2 py-0.5 text-[10px] font-mono bg-secondary rounded text-muted-foreground">{ip}</span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const StatTile = ({ label, value, accent, tone }: { label: string; value: number; accent?: boolean; tone?: "destructive" }) => (
  <div className={`rounded-lg border p-3 text-center ${
    tone === "destructive"
      ? "border-destructive/40 bg-destructive/10"
      : accent
        ? "border-primary/40 bg-primary/10"
        : "border-border bg-card"
  }`}>
    <p className={`font-heading text-lg font-semibold ${
      tone === "destructive" ? "text-destructive" : accent ? "text-primary" : "text-foreground"
    }`}>{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
);

const FeedbackTile = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "amber" | "emerald" | "destructive" | "muted" }) => {
  const cls = tone === "emerald"
    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
    : tone === "amber"
      ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
      : tone === "destructive"
        ? "border-destructive/40 bg-destructive/10 text-destructive"
        : "border-border bg-secondary text-muted-foreground";
  return (
    <div className={`rounded-md border px-2 py-1.5 flex items-center gap-2 ${cls}`}>
      {icon}
      <div className="leading-tight">
        <p className="text-base font-semibold">{value}</p>
        <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      </div>
    </div>
  );
};

const ListingRow = ({ listing }: { listing: AdminListingDetail }) => {
  const cover = listing.wantedCardImage || listing.offeringCardImages[0]?.imageUrl;
  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-3">
        {cover && (
          <img src={cover} alt="" className="w-12 h-12 rounded object-cover shrink-0 border border-border" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">Wants: {listing.wantedCard}</p>
          <p className="text-xs text-muted-foreground truncate">Offers: {listing.offeringCards.join(", ") || "-"}</p>
        </div>
        <StatusChip status={listing.status} outcome={listing.tradeOutcome} />
      </div>

      {/* Show small chips of each offered card with image */}
      <div className="flex gap-1.5 overflow-x-auto">
        {listing.offeringCardImages.map((c) => (
          <div key={c.name} className="shrink-0 flex items-center gap-1 rounded border border-border bg-secondary/50 pr-2">
            {c.imageUrl ? (
              <img src={c.imageUrl} alt="" className="h-8 w-6 object-cover" />
            ) : (
              <div className="h-8 w-6 bg-background" />
            )}
            <span className="text-[10px] text-foreground">{c.name}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <p className="flex items-center gap-1">
          <Clock size={10} aria-hidden="true" /> Listed {fmtDate(listing.createdAt)}
        </p>
        {listing.claimedAt && (
          <p>Claimed {fmtDate(listing.claimedAt)} {listing.claimedBy ? `by ${listing.claimedBy.name}` : ""}</p>
        )}
        {listing.outcomeAt && (
          <p>Outcome set {fmtDate(listing.outcomeAt)}</p>
        )}
        {listing.closedExternallyAt && (
          <p>Closed off-platform {fmtDate(listing.closedExternallyAt)}</p>
        )}
        {listing.disputeReason && (
          <p className="text-destructive">Reason: <span className="text-foreground">{listing.disputeReason}</span></p>
        )}
      </div>
    </div>
  );
};

const ClaimRow = ({ claim }: { claim: AdminClaimDetail }) => {
  const l = claim.listing;
  const cover = l?.wantedCardImage || l?.offeringCardImages[0]?.imageUrl;
  return (
    <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-2">
      <div className="flex items-center gap-3">
        {cover && (
          <img src={cover} alt="" className="w-12 h-12 rounded object-cover shrink-0 border border-border" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">
            Received: <span className="text-accent">{l?.offeringCards.join(", ") || "-"}</span>
          </p>
          <p className="text-xs text-muted-foreground truncate">Sent: {l?.wantedCard || "-"}</p>
        </div>
        <StatusChip status="claimed" outcome={l?.tradeOutcome ?? null} />
      </div>

      <div className="rounded bg-secondary px-2 py-1 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Code</span>
        <span className="font-mono text-xs text-foreground tracking-wider select-all">{claim.revealedCode}</span>
      </div>

      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <p className="flex items-center gap-1">
          <Clock size={10} aria-hidden="true" /> Claimed {fmtDate(claim.createdAt)}
        </p>
        {l?.owner && <p>From {l.owner.name}{l.owner.email ? ` (${l.owner.email})` : ""}</p>}
        <p>IP: <span className="font-mono">{claim.ipAddress || "-"}</span></p>
      </div>
    </div>
  );
};

const StatusChip = ({ status, outcome }: { status: string; outcome: string | null }) => {
  if (outcome === "confirmed") {
    return <Chip className="border-emerald-400/40 bg-emerald-400/10 text-emerald-300" icon={<ShieldCheck size={10} aria-hidden="true" />}>Confirmed</Chip>;
  }
  if (outcome === "disputed") {
    return <Chip className="border-destructive/40 bg-destructive/10 text-destructive" icon={<ShieldAlert size={10} aria-hidden="true" />}>Disputed</Chip>;
  }
  if (outcome === "pending") {
    return <Chip className="border-amber-400/40 bg-amber-400/10 text-amber-300" icon={<Hourglass size={10} aria-hidden="true" />}>Awaiting</Chip>;
  }
  if (status === "active") {
    return <Chip className="border-primary/40 bg-primary/10 text-primary">Active</Chip>;
  }
  if (status === "external") {
    return <Chip className="border-border bg-secondary text-muted-foreground" icon={<ArrowUpRight size={10} aria-hidden="true" />}>Off-platform</Chip>;
  }
  if (status === "expired") {
    return <Chip className="border-border bg-secondary text-muted-foreground">Expired</Chip>;
  }
  return <Chip className="border-border bg-secondary text-muted-foreground">{status}</Chip>;
};

const Chip = ({ className, icon, children }: { className: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded border ${className} shrink-0`}>
    {icon}
    {children}
  </span>
);

export default AdminUserDetail;
