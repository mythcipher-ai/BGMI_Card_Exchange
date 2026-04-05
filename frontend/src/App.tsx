import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import AddCard from "./pages/AddCard";
import Admin from "./pages/Admin";
import UserManagement from "./pages/UserManagement";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

const App = () => (
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: `${window.location.origin}/callback`,
      audience,
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/add" element={<AddCard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/login" element={<Login />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Auth0Provider>
);

export default App;
