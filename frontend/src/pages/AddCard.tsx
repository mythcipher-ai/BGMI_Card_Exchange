import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
 * Entry point of the listing flow.
 *
 * Per spec: at any time there's typically only one active event, so we render
 * each active event full-width with its categories + cards inline — no
 * click-through to /event/:id. The user picks a card directly and the
 * ListingPopup opens to collect the 8-digit trade code + wanted cards.
 */
const AddCard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, login, refreshUser } = useAuth();
  const { eligibility, loading: eligLoading, refresh: refreshEligibility } = useEligibility();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [allCards, setAllCards] = useState<DefinedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickedCard, setPickedCard] = useState<{ card: DefinedCard; eventId: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      login();
      return;
    }
    Promise.all([fetchPublicEvents(), fetchDefinedCards()])
      .then(([evRes, cardsRes]) => {
        setEvents(evRes.data);
        setAllCards(cardsRes.data);
      })
      .catch((err: any) => toast.error(err.message || "Failed to load events"))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated]);

  const blocked = eligibility?.canCreateListing === false;

  // Cards grouped by event id, then by category (type) within each event.
  const cardsByEvent = useMemo(() => {
    const out: Record<string, Record<string, DefinedCard[]>> = {};
    for (const c of allCards) {
      if (!c.eventId) continue;
      const evId = typeof c.eventId === "string" ? c.eventId : c.eventId._id;
      if (!out[evId]) out[evId] = {};
      (out[evId][c.type] = out[evId][c.type] || []).push(c);
    }
    for (const ev of Object.keys(out)) {
      for (const cat of Object.keys(out[ev])) {
        out[ev][cat].sort((a, b) => a.name.localeCompare(b.name));
      }
    }
    return out;
  }, [allCards]);

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

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar />
      <main className="container py-4 max-w-3xl mx-auto flex-1 space-y-4">
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground">List a card for trade</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick the card you have. You'll enter the 8-digit trade code and the cards you accept in exchange in the next step.
          </p>
        </div>

        <ActiveListingBanner show={blocked} />

        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-1">
            <p className="text-sm text-foreground">No active events right now.</p>
            <p className="text-xs text-muted-foreground">Check back soon. Admins activate events as they go live in BGMI.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {events.map((ev) => {
              const grouped = cardsByEvent[ev._id] || {};
              const categoryNames = Object.keys(grouped).sort();
              return (
                <article key={ev._id} className="space-y-2">
                  {/* Full-width event banner */}
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="aspect-[12/6] w-full bg-secondary overflow-hidden">
                      {ev.imageUrl ? (
                        <img
                          src={ev.imageUrl}
                          alt={ev.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                        />
                      ) : null}
                    </div>
                    {/* <div className="p-3">
                      <h2 className="font-heading text-base font-semibold text-foreground">{ev.name}</h2>
                    </div> */}
                  </div>

                  {/* Inline category sections for this event */}
                  {categoryNames.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <p className="text-xs text-muted-foreground">No cards in this event yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryNames.map((cat, idx) => (
                        <CategorySection
                          key={cat}
                          cat={cat}
                          cards={grouped[cat]}
                          blocked={blocked}
                          onPick={(card) => setPickedCard({ card, eventId: ev._id })}
                          defaultOpen={idx === 0}
                        />
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {pickedCard && (
        <ListingPopup
          offeringCard={pickedCard.card}
          allCards={allCards}
          eventId={pickedCard.eventId}
          onClose={() => setPickedCard(null)}
          onListed={handleListed}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default AddCard;
