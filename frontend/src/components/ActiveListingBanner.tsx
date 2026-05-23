import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ActiveListingBannerProps {
  show: boolean;
}

/**
 * Shown above the AddCard form when the user already has an active listing.
 * Blue Lock rule: one active card listing per user.
 */
const ActiveListingBanner = ({ show }: ActiveListingBannerProps) => {
  if (!show) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-accent/40 bg-accent/5 p-4 space-y-2"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="text-accent mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-heading text-sm font-semibold text-foreground">
            You already have an active card listing.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Each player may keep only one active card listing at a time. Delete or
            update your existing listing first to free up your slot.
          </p>
        </div>
      </div>
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
      >
        Manage my listing
        <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </div>
  );
};

export default ActiveListingBanner;
