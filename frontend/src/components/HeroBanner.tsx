import { Link } from "react-router-dom";
import { ArrowRight, Plus, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPlatformStats, type PlatformStats } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// Background images: desktop (wide) and mobile (portrait) are shown separately.
// Swap these with your own assets when ready. Use images you have rights to.
const HERO_BG_DESKTOP = "https://i.pinimg.com/1200x/97/3a/da/973ada20ab5cafbac9c3c635146f0ae4.jpg";
const HERO_BG_MOBILE = "https://i.pinimg.com/736x/7d/fe/91/7dfe9105e559710be3e852e427359ebe.jpg";

// Baseline numbers shown on first paint so the page never looks empty.
// Real platform activity is added on top so the number only ever grows.
const BASELINE_ACTIVE_TRADERS = 256;
const BASELINE_TOTAL_TRADES = 1247;

const HeroBanner = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    fetchPlatformStats()
      .then((r: { data: PlatformStats }) => setStats(r.data))
      .catch(() => {});
  }, []);

  // Active traders and cards-exchanged use the baseline-plus-real strategy.
  // Live listings shows the REAL number only (no boost).
  const activeTraders = BASELINE_ACTIVE_TRADERS + (stats?.activeTraders ?? 0);
  const totalTrades = BASELINE_TOTAL_TRADES + (stats?.totalTrades ?? 0);
  const activeListings = stats?.activeListings;

  return (
    <section className="relative overflow-hidden h-screen sm:h-auto">
      {/* Desktop background */}
      <div className="absolute inset-0 hidden md:block" aria-hidden="true">
        <img
          src={HERO_BG_DESKTOP}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/45 to-background" />
      </div>

      {/* Mobile background */}
      <div className="absolute inset-0 block md:hidden" aria-hidden="true">
        <img
          src={HERO_BG_MOBILE}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40
         via-background/70 to-background" />
      </div>

      {/* Blue Lock accent overlays sit above the image so the brand still reads. */}
      <div
        className="absolute inset-0 opacity-60 field-grid pointer-events-none"
        aria-hidden="true"
      />

      {/*
        Layout strategy:
          • Mobile  -> flex-column the full viewport. Title sits in flex-1
            (vertically centered). CTAs + stats live in a second block that
            naturally lands at the bottom of the viewport (above the fixed
            bottom-nav — pb-20 clears it).
          • Desktop -> normal stacked layout, no flex acrobatics.
      */}
      <div className="container h-screen relative  flex flex-col py-6 pb-20 sm:py-24 lg:py-28 text-center">
        {/* Badge: desktop only. */}
        <div className="hidden sm:inline-flex self-center items-center gap-2 rounded-full border border-accent/40 bg-accent/10 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-accent mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Fan Community · Blue Lock Edition
        </div>

        {/* Title wrapper. On mobile, flex-1 lets the title vertically center
            in the available space and pushes the bottom block down. */}
        <div className="pt-40 pb-32 md:pt-0 md:pb-0 sm:flex-none flex flex-col items-center justify-center">
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05] drop-shadow-lg">
            Find Your Missing
            <br />
            <span className="text-primary glow-text-blue">BLUE LOCK</span>{" "}
            <span className="text-foreground">Cards</span>
          </h1>

          {/* Description: desktop only. */}
          <p className="hidden sm:block text-sm sm:text-base text-foreground/85 max-w-xl mx-auto leading-relaxed drop-shadow mt-6">
            Trade smarter. Complete faster. Connect with active collectors and
            finish your BGMI card collection in the Blue Lock community.
          </p>
        </div>

        {/* CTA + Stats block — bottom of viewport on mobile, normal flow on desktop. */}
        <div className="space-y-4 sm:space-y-6 sm:pt-6">
          <div className="flex sm:flex-row items-center justify-center gap-3">
            <a
              href="#listings"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto glow-blue"
            >
              Browse Listings
              <ArrowRight size={16} aria-hidden="true" className="hidden md:block" />
            </a>
            {isStaff ? (
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/40 backdrop-blur px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/60 hover:bg-primary/10 transition-colors w-full sm:w-auto"
              >
                <Shield size={16} aria-hidden="true" />
                Add New Card
              </Link>
            ) : (
              <Link
                to="/add"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/40 backdrop-blur px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/60 hover:bg-primary/10 transition-colors w-full sm:w-auto"
              >
                <Plus size={16} aria-hidden="true" />
                List Your Card
              </Link>
            )}
          </div>

          <dl className="grid grid-cols-3 max-w-md mx-auto gap-3 text-center">
            <Stat label="Active Traders" value={activeTraders} />
            <Stat label="Cards Exchanged" value={totalTrades} />
            <Stat label="Live Listings" value={activeListings} />
          </dl>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: number | undefined }) => (
  <div className="rounded-md border border-border/60 bg-card/60 backdrop-blur px-3 py-2.5">
    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
    <dd className="font-heading text-lg font-semibold text-foreground">
      {typeof value === "number" ? value.toLocaleString() : "..."}
    </dd>
  </div>
);

export default HeroBanner;
