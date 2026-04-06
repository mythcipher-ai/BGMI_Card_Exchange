import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchMe, syncProfile } from "@/lib/api";

interface UserProfile {
  id: string;
  role: "user" | "admin";
  status: string;
  auth0Id: string;
  email?: string;
  name?: string;
  picture?: string;
  trustScore: number;
  totalClaims: number;
  successfulClaims: number;
  reportsCount: number;
  dailyClaims: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    isAuthenticated: auth0Authenticated,
    isLoading: auth0Loading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
    user: auth0User,
    error: auth0Error,
  } = useAuth0();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const token = await getAccessTokenSilently();
      localStorage.setItem("auth_token", token);

      // Sync Auth0 profile data (name, picture) to backend
      if (auth0User?.name || auth0User?.picture) {
        await syncProfile({
          name: auth0User.name,
          picture: auth0User.picture,
        }).catch(() => {}); // non-critical
      }

      const me = await fetchMe();
      setUser(me as UserProfile);
    } catch (err) {
      console.error("Failed to load profile:", err);
      localStorage.removeItem("auth_token");
      setUser(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (auth0Error) {
      console.error("Auth0 error:", auth0Error);
    }
  }, [auth0Error]);

  useEffect(() => {
    if (auth0Authenticated) {
      loadProfile();
    } else if (!auth0Loading) {
      localStorage.removeItem("auth_token");
      setUser(null);
    }
  }, [auth0Authenticated, auth0Loading]);

  const login = () => loginWithRedirect();

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: auth0Authenticated && !!user,
        isLoading: auth0Loading || profileLoading || (auth0Authenticated && !user),
        user,
        login,
        logout,
        refreshUser: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
