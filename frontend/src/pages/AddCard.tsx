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
  const [lookingFor, setLookingFor] = useState("");
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

  const selectedCard = cards.find((c) => c._id === offering);

  // Group cards by type
  const grouped = cards.reduce<Record<string, DefinedCard[]>>((acc, card) => {
    (acc[card.type] = acc[card.type] || []).push(card);
    return acc;
  }, {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offering || !lookingFor || !code.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    if (!/^\d+$/.test(code.trim())) {
      toast.error("Code must contain only numbers");
      return;
    }
    setLoading(true);
    try {
      await createListing({
        offeringCardId: offering,
        offeringCount: 1,
        wantedCardIds: [lookingFor],
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
              onChange={(e) => {
                setOffering(e.target.value);
                // Clear wanted card if it was the same as the new offering
                if (e.target.value === lookingFor) setLookingFor("");
              }}
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

          {/* Looking For — single card */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Card You Want</label>
            <div className="space-y-2">
              {Object.entries(grouped).map(([type, typeCards]) => {
                const available = typeCards.filter((c) => c._id !== offering);
                if (available.length === 0) return null;
                return (
                  <div key={type}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{type}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {available.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => setLookingFor(lookingFor === c._id ? "" : c._id)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                            lookingFor === c._id
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Redemption Code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setCode(val);
              }}
              placeholder="Enter numeric code"
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
