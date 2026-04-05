import { Link, useLocation } from "react-router-dom";
import { Home, Plus, User, Shield, Users, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated, user, login } = useAuth();
  const isAdmin = user?.role === "admin";

  const items = isAuthenticated
    ? isAdmin
      ? [
          { to: "/", icon: Home, label: "Home" },
          { to: "/admin", icon: Shield, label: "Cards" },
          { to: "/admin/users", icon: Users, label: "Users" },
        ]
      : [
          { to: "/", icon: Home, label: "Home" },
          { to: "/add", icon: Plus, label: "List" },
          { to: "/profile", icon: User, label: "Profile" },
        ]
    : [
        { to: "/", icon: Home, label: "Home" },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md sm:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
        {!isAuthenticated && (
          <button
            onClick={login}
            className="flex flex-col items-center gap-0.5 px-4 py-1 text-xs text-muted-foreground"
          >
            <LogIn size={18} />
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
