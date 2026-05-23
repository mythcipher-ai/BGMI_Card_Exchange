import { Link, useLocation } from "react-router-dom";
import { Home, Plus, User, Shield, Users, LogIn, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated, user, login } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  let items: { to: string; icon: typeof Home; label: string }[] = [];

  if (isAuthenticated) {
    if (isAdmin) {
      items = [
        { to: "/", icon: Home, label: "Home" },
        { to: "/admin", icon: Shield, label: "Cards" },
        { to: "/admin/users", icon: Users, label: "Users" },
        { to: "/profile", icon: User, label: "Profile" },
      ];
    } else if (isManager) {
      // Manager is strictly Cards-only. No user mgmt, no listing/profile shortcuts.
      items = [
        { to: "/", icon: Home, label: "Home" },
        { to: "/admin", icon: Shield, label: "Cards" },
        { to: "/profile", icon: User, label: "Profile" },
      ];
    } else {
      items = [
        { to: "/", icon: Home, label: "Home" },
        { to: "/add", icon: Plus, label: "List" },
        { to: "/rewards", icon: Trophy, label: "Rewards" },
        { to: "/profile", icon: User, label: "Profile" },
      ];
    }
  } else {
    items = [{ to: "/", icon: Home, label: "Home" }];
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md sm:hidden"
      aria-label="Primary mobile navigation"
    >
      <div className="flex items-center justify-around py-2">
        {items.map(({ to, icon: Icon, label }) => {
          const pathname = to.split("?")[0];
          const search = to.includes("?") ? to.split("?")[1] : "";
          const active = location.pathname === pathname && (search ? location.search.includes(search) : true);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
        {!isAuthenticated && (
          <button
            type="button"
            onClick={login}
            aria-label="Sign in"
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] text-muted-foreground"
          >
            <LogIn size={18} aria-hidden="true" />
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
