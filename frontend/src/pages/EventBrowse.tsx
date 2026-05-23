import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import ActiveListingBanner from "@/components/ActiveListingBanner";
import CategorySection from "@/components/CategorySection";
import ListingPopup from "@/components/ListingPopup";
import {
  fetchDefinedCards,
  fetchPublicEvents,
  type DefinedCard,
  type EventItem
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useEligibility } from "@/hooks/useEligibility";

/**
 * Event detail / browse page — reached via direct URL (/event/:id).
 * Mirror of the inline browser on /add but scoped to one event. Header is a
 * breadcrumb so users can navigate back to the events list.
 */
const EventBrowse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, login, refreshUser } = useAuth();
  const { eligibility, loading: eligLoading, refresh: refreshEligibility } = useEligibility();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [allCards, setAllCards] = useState<DefinedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickedCard, setPickedCard] = useState<DefinedCard | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      login();
      return;
    }
    if (!id) return;
    Promise.all([fetchPublicEvents(), fetchDefinedCards()])
      .then(([evRes, cardsRes]) => {
        const ev = evRes.data.find((e) => e._id === id) ?? null;
        setEvent(ev);
        setAllCards(cardsRes.data);
      })
      .catch((err: any) => toast.error(err.message || "Failed to load event"))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, id]);

  const blocked = eligibility?.canCreateListing === false;

  const eventCards = useMemo(() => {
    return allCards.filter((c) => {
      if (!c.eventId) return false;
      const evId = typeof c.eventId === "string" ? c.eventId : c.eventId._id;
      return evId === id;
    });
  }, [allCards, id]);

  const grouped = useMemo(() => {
    const map: Record<string, DefinedCard[]> = {};
    for (const c of eventCards) {
      (map[c.type] = map[c.type] || []).push(c);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [eventCards]);

  const categoryNames = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const handleListed = async () => {
    setPickedCard(null);
    await Promise.all([refreshUser(), refreshEligibility()]);
    navigate("/");
  };

  if (authLoading || eligLoading || loading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
        <Navbar />
        <main className="container flex-1 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} aria-label="Loading" />
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
        <Navbar />
        <main className="container flex-1 py-8 text-center space-y-2">
          <p className="text-sm text-foreground">Event not found or not active.</p>
          <Link to="/add" className="text-xs text-primary hover:underline">Back to events</Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar />
      <main className="container py-4 max-w-3xl mx-auto flex-1 space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            to="/add"
            aria-label="Back to events"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            Events
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="font-medium text-foreground truncate">{event.name}</span>
        </nav>

        <ActiveListingBanner show={blocked} />

        {categoryNames.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-1">
            <p className="text-sm text-foreground">No cards in this event yet.</p>
            <p className="text-xs text-muted-foreground">Check back later.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categoryNames.map((cat, idx) => (
              <CategorySection
                key={cat}
                cat={cat}
                cards={grouped[cat]}
                blocked={blocked}
                onPick={setPickedCard}
                defaultOpen={idx === 0}
              />
            ))}
          </div>
        )}
      </main>

      {pickedCard && (
        <ListingPopup
          offeringCard={pickedCard}
          allCards={allCards}
          eventId={id!}
          onClose={() => setPickedCard(null)}
          onListed={handleListed}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default EventBrowse;
