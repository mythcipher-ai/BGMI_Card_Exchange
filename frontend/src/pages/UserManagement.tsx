import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AdminRewardsTable from "@/components/AdminRewardsTable";
import { toast } from "sonner";
import {
  adminGetUsers,
  type AdminUser
} from "@/lib/api";
import {
  Loader2, AlertTriangle, Ban,
  ChevronRight, Shield, Briefcase
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/** Extract a readable display name from user data */
function getDisplayName(u: { name?: string; email?: string; auth0Id?: string }): string {
  if (u.name) return u.name;
  if (u.email) return u.email.split("@")[0];
  return "User";
}

function getInitial(u: { name?: string; email?: string; auth0Id?: string }): string {
  const display = getDisplayName(u);
  return display[0]?.toUpperCase() || "?";
}

const UserManagement = () => {
  const { user: me, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "flagged" | "blocked">("all");
  const [section, setSection] = useState<"users" | "rewards">("users");

  useEffect(() => {
    if (!authLoading && me?.role !== "admin") {
      navigate("/");
      return;
    }
    loadUsers();
  }, [authLoading, me]);

  const loadUsers = async () => {
    try {
      const res = await adminGetUsers();
      setUsers(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  // "Flagged" now covers both: shared-IP detections AND trade-dispute flags
  // (lister marked the user's claim as "not received"). Either signal pulls a
  // user into the moderation queue.
  const isFlagged = (u: AdminUser) => u.flagged || (u.flagCount ?? 0) > 0;

  const filtered = users.filter((u) => {
    if (filter === "flagged") return isFlagged(u);
    if (filter === "blocked") return u.status === "blocked";
    return true;
  });

  const flaggedCount = users.filter(isFlagged).length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-4 flex-1 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">
            {section === "users" ? "User Management" : "Reward Claims"}
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-destructive/20 text-destructive border border-destructive/30 rounded">
            Admin Only
          </span>
        </div>

        <div role="tablist" aria-label="Admin sections" className="flex gap-1 border-b border-border">
          <button
            type="button"
            role="tab"
            aria-selected={section === "users"}
            onClick={() => setSection("users")}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              section === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Users
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === "rewards"}
            onClick={() => setSection("rewards")}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              section === "rewards"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Reward Claims
          </button>
        </div>

        {section === "rewards" ? (
          <AdminRewardsTable />
        ) : (
          <>
        {/* Stats bar */}
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-secondary text-foreground">{users.length} total</span>
          {flaggedCount > 0 && (
            <span className="px-2 py-1 rounded bg-neon-yellow/20 text-neon-yellow flex items-center gap-1">
              <AlertTriangle size={10} /> {flaggedCount} flagged
            </span>
          )}
          {blockedCount > 0 && (
            <span className="px-2 py-1 rounded bg-destructive/20 text-destructive flex items-center gap-1">
              <Ban size={10} /> {blockedCount} blocked
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(["all", "flagged", "blocked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* User list */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((u) => (
              <button
                key={u._id}
                onClick={() => openDetail(u._id)}
                className="w-full flex items-center gap-3 rounded-md border border-border bg-card p-3 hover:border-primary/30 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-heading text-xs font-semibold text-primary shrink-0 overflow-hidden">
                  {u.picture ? (
                    <img src={u.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitial(u)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground truncate">{getDisplayName(u)}</span>
                    {u.role === "admin" && (
                      <Shield size={10} className="text-primary shrink-0" aria-label="Admin" />
                    )}
                    {u.role === "manager" && (
                      <Briefcase size={10} className="text-accent shrink-0" aria-label="Manager" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Listed: {u.listingsCount}</span>
                    <span>Claimed: {u.claimedCount}</span>
                    <span>Trades: {u.successfulTrades ?? 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(u.flagCount ?? 0) > 0 && (
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-destructive/15 text-destructive border border-destructive/40 rounded flex items-center gap-0.5"
                      title={`${u.flagCount} dispute flag${u.flagCount === 1 ? "" : "s"} from listers reporting "not received"`}
                    >
                      <AlertTriangle size={8} /> {u.flagCount} flag{u.flagCount === 1 ? "" : "s"}
                    </span>
                  )}
                  {u.flagged && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-neon-yellow/20 text-neon-yellow rounded flex items-center gap-0.5" title="Shared IP detected across multiple users">
                      <AlertTriangle size={8} /> Shared IP
                    </span>
                  )}
                  {u.status === "blocked" && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-destructive/20 text-destructive rounded">
                      Blocked
                    </span>
                  )}
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}

          </>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
