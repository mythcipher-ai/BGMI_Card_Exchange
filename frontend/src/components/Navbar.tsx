import { Link, useLocation } from "react-router-dom";
import { Plus, Search, Shield, Users, Loader2, KeyRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { isAuthenticated, isLoading, user, login } = useAuth();

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isStaff = isAdmin || isManager;

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

        {location.pathname === "/" && (
          <div className="hidden sm:flex flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search by card name or type..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }}
              className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {location.pathname === "/" && (
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
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
              {/* Standard player: List Card. Profile and Logout are reached via bottom nav / profile page. */}
              {!isStaff && (
                <Link
                  to="/add"
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">List Card</span>
                </Link>
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

      {searchOpen && location.pathname === "/" && (
        <div className="sm:hidden border-t border-border px-4 py-2">
          <input
            type="text"
            placeholder="Search by card name or type..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }}
            className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
