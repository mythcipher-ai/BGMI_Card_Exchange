import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const Login = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary glow-text-green">
            JJK EXCHANGE
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            BGMI x Jujutsu Kaisen Card Trading
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <p className="text-sm text-foreground">
            Sign in to list your cards, claim exchange offers, and manage your collection.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <button
              onClick={() => login()}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign In / Sign Up
            </button>
          )}

          <p className="text-[10px] text-muted-foreground">
            Powered by Auth0. Your credentials are never stored on our servers.
          </p>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-4">
            <span>5 claims per day</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>Secure exchange</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>Trust system</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
