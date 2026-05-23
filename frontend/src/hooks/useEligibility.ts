import { useEffect, useState, useCallback } from "react";
import { fetchMyEligibility, type Eligibility } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface UseEligibilityResult {
  eligibility: Eligibility | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Reads the authenticated user's listing/claim eligibility from the backend.
 * Used to gate UI such as the "List your card" form (one active listing per user).
 */
export function useEligibility(): UseEligibilityResult {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setEligibility(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchMyEligibility();
      setEligibility(res.data);
    } catch {
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return { eligibility, loading, refresh };
}
