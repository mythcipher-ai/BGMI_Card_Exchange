import { Link, useLocation } from "react-router-dom";
import { Plus, User, Search, Shield, Users, LogIn, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between gap-3">
        <Link to="/" className="font-heading text-lg font-semibold tracking-wide text-primary glow-text-green shrink-0">
          JJK EXCHANGE
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
          {/* Mobile search toggle */}
          {location.pathname === "/" && (
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
            >
              <Search size={18} />
            </button>
          )}

          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground mx-2" />
          ) : isAuthenticated ? (
            <>
              {/* User role: List Card + Profile */}
              {!isAdmin && (
                <>
                  <Link
                    to="/add"
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">List Card</span>
                  </Link>
                  <Link to="/profile" className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Profile">
                    <User size={18} />
                  </Link>
                </>
              )}

              {/* Admin role: Admin + User Management */}
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    title="Card Management"
                  >
                    <Shield size={14} />
                    <span className="hidden sm:inline">Cards</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    title="User Management"
                  >
                    <Users size={14} />
                    <span className="hidden sm:inline">Users</span>
                  </Link>
                </>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LogIn size={14} />
              Login
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
