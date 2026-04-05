import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { fetchDefinedCards, createListing, type DefinedCard } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AddCard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [cards, setCards] = useState<DefinedCard[]>([]);
  const [offering, setOffering] = useState("");
  const [offeringCount, setOfferingCount] = useState(1);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      login();
      return;
    }
    fetchDefinedCards()
      .then((res) => setCards(res.data))
      .catch((err) => toast.error(err.message || "Failed to load cards"))
      .finally(() => setCardsLoading(false));
  }, [authLoading, isAuthenticated]);

  const toggleLooking = (cardId: string) => {
    setLookingFor((prev) =>
      prev.includes(cardId) ? prev.filter((c) => c !== cardId) : prev.length < 3 ? [...prev, cardId] : prev
    );
  };

  const selectedCard = cards.find((c) => c._id === offering);
  const maxCount = selectedCard?.totalCount ?? 1;

  // Group cards by type
  const grouped = cards.reduce<Record<string, DefinedCard[]>>((acc, card) => {
    (acc[card.type] = acc[card.type] || []).push(card);
    return acc;
  }, {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offering || lookingFor.length === 0 || !code.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await createListing({
        offeringCardId: offering,
        offeringCount,
        wantedCardIds: lookingFor,
        code: code.trim()
      });
      toast.success("Card listed successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  if (cardsLoading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0">
        <Navbar />
        <main className="container py-16 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar />
      <main className="container py-4 max-w-lg mx-auto flex-1">
        <h1 className="font-heading text-lg font-semibold text-foreground mb-4">List Exchange Offer</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Offering Card */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Card You Have</label>
            <select
              value={offering}
              onChange={(e) => { setOffering(e.target.value); setOfferingCount(1); }}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select card</option>
              {Object.entries(grouped).map(([type, typeCards]) => (
                <optgroup key={type} label={type}>
                  {typeCards.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Preview selected card */}
          {selectedCard && (
            <div className="rounded-md border border-border bg-secondary p-3 flex items-center gap-3">
              <img
                src={selectedCard.imageUrl}
                alt={selectedCard.name}
                className="w-16 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{selectedCard.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCard.type}</p>
              </div>
            </div>
          )}

          {/* Count */}
          {selectedCard && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                How many? (max {maxCount})
              </label>
              <input
                type="number"
                min={1}
                max={maxCount}
                value={offeringCount}
                onChange={(e) => setOfferingCount(Math.min(Number(e.target.value), maxCount))}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Looking For */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Cards You Want (up to 3)</label>
            <div className="space-y-2">
              {Object.entries(grouped).map(([type, typeCards]) => (
                <div key={type}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{type}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {typeCards.filter((c) => c._id !== offering).map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => toggleLooking(c._id)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                          lookingFor.includes(c._id)
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Redemption Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your card code"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              maxLength={30}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Submit Listing
          </button>
        </form>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default AddCard;
