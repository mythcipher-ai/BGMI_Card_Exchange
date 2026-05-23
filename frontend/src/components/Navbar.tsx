import { Link, useLocation } from "react-router-dom";
import { Plus, Search, Shield, Users, Loader2, KeyRound, Trophy, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

// Smoothly scroll the home catalog into view. Called whenever the user
// engages the search (focus or types) so the list they're filtering is
// actually visible instead of hidden below the hero.
function scrollToListings() {
  const el = document.getElementById("listings");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { isAuthenticated, isLoading, user, login } = useAuth();

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isStaff = isAdmin || isManager;
  const onHome = location.pathname === "/";

  const handleQueryChange = (q: string) => {
    setQuery(q);
    onSearch?.(q);
    if (q) scrollToListings();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between gap-3">
        <Link
          to="/"
          aria-label="Blue Lock Exchange home"
          className="font-heading text-lg font-semibold tracking-wider text-primary glow-text-blue shrink-0"
        >
          BLUE LOCK · EXCHANGE
        </Link>

        {onHome && (
          <div className="hidden sm:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <Search
                size={14}
                aria-hidden="true"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by card name or type..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={scrollToListings}
                aria-label="Search cards"
                className="w-full rounded-md border border-border bg-secondary pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {onHome && (
            <button
              type="button"
              onClick={() => {
                const next = !searchOpen;
                setSearchOpen(next);
                if (next) scrollToListings();
              }}
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
              className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground focus-visible:text-foreground"
            >
              <Search size={18} aria-hidden="true" />
            </button>
          )}

          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground mx-2" />
          ) : isAuthenticated ? (
            <>
              {/* Standard player: List Card + Rewards. Profile and Logout are reached via bottom nav / profile page. */}
              {!isStaff && (
                <>
                  <Link
                    to="/rewards"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    title="Reward milestones"
                  >
                    <Trophy size={14} aria-hidden="true" />
                    Rewards
                  </Link>
                  <Link
                    to="/add"
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={14} aria-hidden="true" />
                    <span className="hidden sm:inline">List Card</span>
                  </Link>
                </>
              )}

              {/* Manager and Admin both see Cards. */}
              {isStaff && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  title="Card Management"
                >
                  <Shield size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Cards</span>
                </Link>
              )}

              {/* Only Admin sees Users. Manager is strictly Cards-only. */}
              {isAdmin && (
                <Link
                  to="/admin/users"
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  title="User Management"
                >
                  <Users size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Users</span>
                </Link>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={login}
              aria-label="Sign in"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/50 transition-all glow-blue active:scale-[0.98]"
            >
              <KeyRound size={16} aria-hidden="true" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {searchOpen && onHome && (
        <div className="sm:hidden border-t border-border px-4 py-2">
          <div className="relative">
            <Search
              size={14}
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by card name or type..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={scrollToListings}
              className="w-full rounded-md border border-border bg-secondary pl-8 pr-8 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
