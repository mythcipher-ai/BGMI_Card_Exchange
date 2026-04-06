import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  adminGetUsers,
  adminGetUserDetail,
  adminBlockUser,
  adminUnblockUser,
  type AdminUser
} from "@/lib/api";
import {
  Loader2, AlertTriangle, Ban, CheckCircle, X,
  ChevronRight, Clock, Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface UserDetail {
  user: any;
  listings: any[];
  claims: any[];
  ips: string[];
  sharedIpUsers: any[];
}

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
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "flagged" | "blocked">("all");

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

  const openDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const detail = await adminGetUserDetail(userId);
      setSelectedUser(detail);
    } catch (err: any) {
      toast.error(err.message || "Failed to load user detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBlock = async (userId: string) => {
    try {
      await adminBlockUser(userId);
      toast.success("User blocked");
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, status: "blocked" } : u));
      if (selectedUser?.user._id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, user: { ...prev.user, status: "blocked" } } : null);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await adminUnblockUser(userId);
      toast.success("User unblocked");
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, status: "active" } : u));
      if (selectedUser?.user._id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, user: { ...prev.user, status: "active" } } : null);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = users.filter((u) => {
    if (filter === "flagged") return u.flagged;
    if (filter === "blocked") return u.status === "blocked";
    return true;
  });

  const flaggedCount = users.filter((u) => u.flagged).length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-4 flex-1 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">User Management</h1>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-destructive/20 text-destructive border border-destructive/30 rounded">
            Admin Only
          </span>
        </div>

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
                      <Shield size={10} className="text-primary shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Listed: {u.listingsCount}</span>
                    <span>Claimed: {u.claimedCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.flagged && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-neon-yellow/20 text-neon-yellow rounded flex items-center gap-0.5">
                      <AlertTriangle size={8} /> Flagged
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

        {/* User Detail Modal */}
        {(selectedUser || detailLoading) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setSelectedUser(null)}>
            <div
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-card p-5 space-y-4 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {detailLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : selectedUser && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-base font-semibold text-foreground">User Detail</h2>
                    <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground">
                      <X size={18} />
                    </button>
                  </div>

                  {/* User info */}
                  <div className="rounded-md bg-secondary p-3 space-y-1 text-sm">
                    <p className="text-foreground font-medium">{getDisplayName(selectedUser.user)}</p>
                    {selectedUser.user.email && (
                      <p className="text-xs text-muted-foreground">{selectedUser.user.email}</p>
                    )}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Status: <span className={selectedUser.user.status === "blocked" ? "text-destructive" : "text-primary"}>{selectedUser.user.status}</span></span>
                      <span>Listed: {selectedUser.listings.length}</span>
                      <span>Claimed: {selectedUser.listings.filter((l: any) => l.status === "claimed").length}</span>
                    </div>
                  </div>

                  {/* IP Info */}
                  {selectedUser.ips.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-foreground">IP Addresses Used</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.ips.map((ip: string) => (
                          <span key={ip} className="px-2 py-0.5 text-[10px] font-mono bg-secondary rounded text-muted-foreground">{ip}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shared IP Users */}
                  {selectedUser.sharedIpUsers.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-destructive flex items-center gap-1">
                        <AlertTriangle size={12} /> Shares IP with other accounts
                      </h3>
                      {selectedUser.sharedIpUsers.map((su: any) => (
                        <div key={su._id} className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 p-2 text-xs">
                          <span className="text-foreground">{getDisplayName(su)}</span>
                          <span className="text-muted-foreground font-mono">{su.sharedIps.join(", ")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Listings */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-foreground">Listings ({selectedUser.listings.length})</h3>
                    {selectedUser.listings.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">No listings</p>
                    ) : (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {selectedUser.listings.map((l: any) => (
                          <div key={l._id} className="flex items-center justify-between rounded bg-secondary p-2 text-xs">
                            <span className="text-foreground">{l.offeringCard}</span>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>{l.status}</span>
                              <Clock size={10} />
                              <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Claims */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-foreground">Claims ({selectedUser.claims.length})</h3>
                    {selectedUser.claims.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">No claims</p>
                    ) : (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {selectedUser.claims.map((c: any) => (
                          <div key={c._id} className="flex items-center justify-between rounded bg-secondary p-2 text-xs">
                            <span className="text-foreground">{c.listingId?.offeringCard || "Unknown"}</span>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-mono">{c.ipAddress}</span>
                              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {selectedUser.user.role !== "admin" && (
                    <div className="pt-2 border-t border-border">
                      {selectedUser.user.status === "active" ? (
                        <button
                          onClick={() => handleBlock(selectedUser.user._id)}
                          className="w-full rounded-md bg-destructive py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Ban size={14} /> Block User
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblock(selectedUser.user._id)}
                          className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={14} /> Unblock User
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default UserManagement;
