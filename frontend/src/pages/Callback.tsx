import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Callback = () => {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (error) {
        console.error("Auth0 callback error:", error);
      }
      navigate("/", { replace: true });
    }
  }, [isLoading, isAuthenticated, error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin text-primary mx-auto" size={32} />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
};

export default Callback;
