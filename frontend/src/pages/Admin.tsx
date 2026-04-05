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
import { Trash2, Plus, Loader2, Upload, X, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { user: me, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cards, setCards] = useState<DefinedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [totalCount, setTotalCount] = useState(10);

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
      toast.success("Image uploaded to S3");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !name) {
      toast.error("Fill type and name");
      return;
    }
    if (!uploadedUrl) {
      toast.error("Upload an image first");
      return;
    }
    setCreating(true);
    try {
      await adminCreateCard({ type, name, imageUrl: uploadedUrl, totalCount });
      toast.success(`Card "${name}" created`);
      setType("");
      setName("");
      setTotalCount(10);
      clearImage();
      loadCards();
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

        {/* Create card form */}
        <form onSubmit={handleCreate} className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus size={14} className="text-primary" />
            Define New Card
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Card Type</label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Domain Expansion"
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Card Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gojo Satoru"
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Total Count</label>
              <input
                type="number"
                min={1}
                value={totalCount}
                onChange={(e) => setTotalCount(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="w-full rounded-md border-2 border-dashed border-border bg-secondary/50 py-8 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors"
              >
                <Upload size={20} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to select image (max 5MB)</span>
              </button>
            ) : (
              <div className="rounded-md border border-border bg-secondary p-3 space-y-3">
                {/* Preview */}
                <div className="flex items-start gap-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-14 rounded object-cover bg-background"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{imageFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(imageFile.size / 1024).toFixed(0)} KB
                    </p>
                    {uploadedUrl && (
                      <p className="text-[10px] text-primary flex items-center gap-1 mt-1">
                        <CheckCircle size={10} /> Uploaded to S3
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

                {/* Upload button */}
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
                        Uploading to S3...
                      </>
                    ) : (
                      <>
                        <Upload size={12} />
                        Upload to S3
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
            disabled={creating || !uploadedUrl}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {creating && <Loader2 size={14} className="animate-spin" />}
            Create Card
          </button>
        </form>

        {/* Existing cards by type */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No cards defined yet. Create your first card above.
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
                      <p className="text-[10px] text-muted-foreground">Count: {card.totalCount}</p>
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
