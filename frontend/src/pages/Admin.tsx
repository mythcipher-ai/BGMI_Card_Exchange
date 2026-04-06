import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  fetchDefinedCards,
  adminCreateCard,
  adminDeleteCard,
  adminUploadImage,
  type DefinedCard
} from "@/lib/api";
import { Trash2, Plus, Loader2, Upload, X, CheckCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { user: me, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [cards, setCards] = useState<DefinedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Category (type) state
  const [selectedType, setSelectedType] = useState("");
  const [newType, setNewType] = useState("");
  const [showNewType, setShowNewType] = useState(false);

  // Card form state
  const [name, setName] = useState("");

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadCards = async () => {
    try {
      const res = await fetchDefinedCards();
      setCards(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && me?.role !== "admin") {
      navigate("/");
      return;
    }
    loadCards();
  }, [authLoading, me]);

  // Derive unique types from existing cards
  const existingTypes = [...new Set(cards.map((c) => c.type))].sort();

  // Active type is either selected existing or new
  const activeType = showNewType ? newType.trim() : selectedType;

  // Auto-select first type if none selected
  useEffect(() => {
    if (!selectedType && existingTypes.length > 0 && !showNewType) {
      setSelectedType(existingTypes[0]);
    }
  }, [existingTypes.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setImageFile(file);
    setUploadedUrl("");
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const { url } = await adminUploadImage(imageFile);
      setUploadedUrl(url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    setUploadedUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeType) {
      toast.error("Select or create a category first");
      return;
    }
    if (!name.trim()) {
      toast.error("Enter a card name");
      return;
    }
    if (!uploadedUrl) {
      toast.error("Upload an image first");
      return;
    }
    setCreating(true);
    try {
      await adminCreateCard({ type: activeType, name: name.trim(), imageUrl: uploadedUrl });
      toast.success(`Card "${name.trim()}" added to ${activeType}`);
      setName("");
      clearImage();

      // If we created with a new type, switch to selecting it
      if (showNewType) {
        setSelectedType(activeType);
        setShowNewType(false);
        setNewType("");
      }

      loadCards();
      // Focus back on name input for quick next add
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } catch (err: any) {
      toast.error(err.message || "Failed to create card");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, cardName: string) => {
    if (!confirm(`Delete "${cardName}"?`)) return;
    try {
      await adminDeleteCard(id);
      toast.success("Card deleted");
      setCards((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  // Group by type
  const grouped = cards.reduce<Record<string, DefinedCard[]>>((acc, card) => {
    (acc[card.type] = acc[card.type] || []).push(card);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-4 flex-1 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">Admin - Card Definitions</h1>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-destructive/20 text-destructive border border-destructive/30 rounded">
            Admin Only
          </span>
        </div>

        {/* Category selector */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus size={14} className="text-primary" />
            Add Cards
          </h2>

          {/* Step 1: Pick category */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Category (Card Type)</label>
            {!showNewType ? (
              <div className="flex gap-2 flex-wrap">
                {existingTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedType === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowNewType(true)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium bg-secondary text-primary hover:bg-primary/10 transition-colors border border-dashed border-primary/30 flex items-center gap-1"
                >
                  <Plus size={10} /> New Category
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="e.g. Domain Expansion"
                  className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => { setShowNewType(false); setNewType(""); }}
                  className="rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground bg-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Add card under selected category */}
          {activeType && (
            <form onSubmit={handleCreate} className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Adding cards to <span className="text-primary font-semibold">{activeType}</span>
              </p>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Card Name</label>
                  <input
                    ref={nameInputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gojo Satoru"
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Card Image</label>

                {!imageFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-md border-2 border-dashed border-border bg-secondary/50 py-6 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors"
                  >
                    <Upload size={18} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to select image (max 5MB)</span>
                  </button>
                ) : (
                  <div className="rounded-md border border-border bg-secondary p-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-12 rounded object-cover bg-background"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{imageFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(imageFile.size / 1024).toFixed(0)} KB
                        </p>
                        {uploadedUrl && (
                          <p className="text-[10px] text-primary flex items-center gap-1 mt-1">
                            <CheckCircle size={10} /> Uploaded
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {!uploadedUrl && (
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full rounded-md bg-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={12} />
                            Upload Image
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !uploadedUrl || !name.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Add Card
              </button>
            </form>
          )}
        </div>

        {/* Existing cards by type */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No cards defined yet. Create your first category and card above.
          </div>
        ) : (
          Object.entries(grouped).map(([typeName, typeCards]) => (
            <section key={typeName} className="space-y-2">
              <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {typeName}
                <span className="text-xs text-muted-foreground font-normal">({typeCards.length} cards)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {typeCards.map((card) => (
                  <div
                    key={card._id}
                    className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-14 h-10 rounded object-cover bg-secondary"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{card.name}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(card._id, card.name)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
