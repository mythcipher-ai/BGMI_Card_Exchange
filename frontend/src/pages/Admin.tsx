import { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import {
  adminFetchAllCards,
  adminCreateCard,
  adminDeleteCard,
  adminUploadImage,
  adminGetEvents,
  adminCreateEvent,
  adminDeleteEvent,
  adminSetEventStatus,
  type DefinedCard,
  type EventItem,
  type EventRef
} from "@/lib/api";
import {
  Trash2, Plus, Loader2, Upload, X, CheckCircle, Calendar, ChevronLeft, Power, PowerOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Extract the eventId from a card whether it was populated as an object or
// returned as a raw string (public vs admin endpoints differ).
function cardEventId(card: DefinedCard): string | null {
  if (!card.eventId) return null;
  if (typeof card.eventId === "string") return card.eventId;
  return card.eventId._id;
}

const Admin = () => {
  const { user: me, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = me?.role === "admin";
  const isManager = me?.role === "manager";

  // Manager can only delete/edit items they created. Admin can always.
  // Pre-migration items (no createdBy) are treated as admin-only.
  const canModify = (ownerId: string | undefined) => {
    if (isAdmin) return true;
    if (!isManager) return false;
    return !!ownerId && !!me?.id && ownerId === me.id;
  };

  // Permission gate. Server enforces too, but bounce early on the client.
  useEffect(() => {
    if (!authLoading && me?.role !== "admin" && me?.role !== "manager") {
      navigate("/");
    }
  }, [authLoading, me, navigate]);

  // ----- Data -----
  const [events, setEvents] = useState<EventItem[]>([]);
  const [cards, setCards] = useState<DefinedCard[]>([]);
  const [loading, setLoading] = useState(true);

  // ----- Active drill-in -----
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // ----- New event form -----
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const eventFileRef = useRef<HTMLInputElement>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState("");
  const [eventUploadedUrl, setEventUploadedUrl] = useState("");
  const [uploadingEventImage, setUploadingEventImage] = useState(false);

  // ----- Card form state (inside an event) -----
  const [selectedType, setSelectedType] = useState("");
  const [newType, setNewType] = useState("");
  const [showNewType, setShowNewType] = useState(false);
  const [cardName, setCardName] = useState("");
  const [creatingCard, setCreatingCard] = useState(false);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const cardNameInputRef = useRef<HTMLInputElement>(null);
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState("");
  const [cardUploadedUrl, setCardUploadedUrl] = useState("");
  const [uploadingCardImage, setUploadingCardImage] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [evRes, cdRes] = await Promise.all([
        adminGetEvents(),
        adminFetchAllCards()
      ]);
      setEvents(evRes.data);
      setCards(cdRes.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (me?.role === "admin" || me?.role === "manager")) {
      loadAll();
    }
  }, [authLoading, me]);

  // ----- Derived -----
  const cardsByEvent = useMemo(() => {
    const m = new Map<string, DefinedCard[]>();
    for (const c of cards) {
      const eid = cardEventId(c);
      if (!eid) continue;
      if (!m.has(eid)) m.set(eid, []);
      m.get(eid)!.push(c);
    }
    return m;
  }, [cards]);

  const activeEvent = events.find((e) => e._id === activeEventId) || null;
  const activeEventCards = activeEventId ? (cardsByEvent.get(activeEventId) ?? []) : [];
  const existingTypes = [...new Set(activeEventCards.map((c) => c.type))].sort();

  const activeType = showNewType ? newType.trim() : selectedType;

  // Auto-pick a category when entering an event with existing cards.
  useEffect(() => {
    if (activeEventId && !selectedType && existingTypes.length > 0 && !showNewType) {
      setSelectedType(existingTypes[0]);
    }
  }, [activeEventId, existingTypes.length]);

  // Reset card form when leaving / switching event.
  useEffect(() => {
    setSelectedType("");
    setShowNewType(false);
    setNewType("");
    setCardName("");
    clearCardImage();
  }, [activeEventId]);

  // ----- Event image helpers -----
  const handleEventFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setEventImageFile(file);
    setEventUploadedUrl("");
    const reader = new FileReader();
    reader.onload = (ev) => setEventImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadEventImage = async () => {
    if (!eventImageFile) return;
    setUploadingEventImage(true);
    try {
      const { url } = await adminUploadImage(eventImageFile);
      setEventUploadedUrl(url);
      toast.success("Event image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingEventImage(false);
    }
  };

  const clearEventImage = () => {
    setEventImageFile(null);
    setEventImagePreview("");
    setEventUploadedUrl("");
    if (eventFileRef.current) eventFileRef.current.value = "";
  };

  const handleCreateEvent = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newEventName.trim()) return toast.error("Enter an event name");
    if (!eventUploadedUrl) return toast.error("Upload an event image first");
    setCreatingEvent(true);
    try {
      const created = await adminCreateEvent({ name: newEventName.trim(), imageUrl: eventUploadedUrl });
      toast.success(`Event "${created.name}" created`);
      setShowNewEvent(false);
      setNewEventName("");
      clearEventImage();
      await loadAll();
      setActiveEventId(created._id);
    } catch (err: any) {
      toast.error(err.message || "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(`Delete event "${name}"? Only allowed if it has no cards.`)) return;
    try {
      await adminDeleteEvent(id);
      toast.success("Event deleted");
      if (activeEventId === id) setActiveEventId(null);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  // Admin-only. Flips an event between draft and active. Managers don't see
  // this button in the UI, and the backend rejects them with 403 if they try.
  const handleToggleEventStatus = async (ev: EventItem) => {
    const next = ev.status === "active" ? "draft" : "active";
    try {
      await adminSetEventStatus(ev._id, next);
      toast.success(next === "active" ? `"${ev.name}" is now active` : `"${ev.name}" moved to draft`);
      setEvents((prev) => prev.map((e) => e._id === ev._id ? { ...e, status: next } : e));
    } catch (err: any) {
      toast.error(err.message || "Failed to change status");
    }
  };

  // ----- Card image helpers -----
  const handleCardFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setCardImageFile(file);
    setCardUploadedUrl("");
    const reader = new FileReader();
    reader.onload = (ev) => setCardImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadCardImage = async () => {
    if (!cardImageFile) return;
    setUploadingCardImage(true);
    try {
      const { url } = await adminUploadImage(cardImageFile);
      setCardUploadedUrl(url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingCardImage(false);
    }
  };

  function clearCardImage() {
    setCardImageFile(null);
    setCardImagePreview("");
    setCardUploadedUrl("");
    if (cardFileRef.current) cardFileRef.current.value = "";
  }

  const handleCreateCard = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeEvent) return toast.error("Pick an event first");
    if (!activeType) return toast.error("Select or create a category first");
    if (!cardName.trim()) return toast.error("Enter a card name");
    if (!cardUploadedUrl) return toast.error("Upload a card image first");
    setCreatingCard(true);
    try {
      await adminCreateCard({
        eventId: activeEvent._id,
        type: activeType,
        name: cardName.trim(),
        imageUrl: cardUploadedUrl
      });
      toast.success(`Card "${cardName.trim()}" added to ${activeType}`);
      setCardName("");
      clearCardImage();
      if (showNewType) {
        setSelectedType(activeType);
        setShowNewType(false);
        setNewType("");
      }
      loadAll();
      setTimeout(() => cardNameInputRef.current?.focus(), 100);
    } catch (err: any) {
      toast.error(err.message || "Failed to create card");
    } finally {
      setCreatingCard(false);
    }
  };

  const handleDeleteCard = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await adminDeleteCard(id);
      toast.success("Card deleted");
      setCards((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  // ----- Render -----
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-4 flex-1 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">
            {activeEvent ? `Event: ${activeEvent.name}` : "Card Management"}
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-destructive/20 text-destructive border border-destructive/30 rounded">
            {me?.role === "manager" ? "Manager" : "Admin"}
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={24} aria-label="Loading" />
          </div>
        ) : !activeEvent ? (
          // ====== EVENT GRID ======
          <>
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar size={14} className="text-primary" aria-hidden="true" />
                  Events
                </h2>
                {!showNewEvent && (
                  <button
                    type="button"
                    onClick={() => setShowNewEvent(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus size={12} aria-hidden="true" /> New Event
                  </button>
                )}
              </div>

              {showNewEvent && (
                <form onSubmit={handleCreateEvent} className="space-y-3 border-t border-border pt-3">
                  <div className="space-y-1">
                    <label htmlFor="event-name" className="text-xs text-muted-foreground">Event Name</label>
                    <input
                      id="event-name"
                      autoFocus
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      placeholder="e.g. Blue Lock S1"
                      maxLength={80}
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Event Image</label>
                    {!eventImageFile ? (
                      <button
                        type="button"
                        onClick={() => eventFileRef.current?.click()}
                        className="w-full rounded-md border-2 border-dashed border-border bg-secondary/50 py-6 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors"
                      >
                        <Upload size={18} className="text-muted-foreground" aria-hidden="true" />
                        <span className="text-xs text-muted-foreground">Click to select image (max 5MB)</span>
                      </button>
                    ) : (
                      <div className="rounded-md border border-border bg-secondary p-3 space-y-3">
                        <div className="flex items-start gap-3">
                          <img src={eventImagePreview} alt="" className="w-16 h-12 rounded object-cover bg-background" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate">{eventImageFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(eventImageFile.size / 1024).toFixed(0)} KB</p>
                            {eventUploadedUrl && (
                              <p className="text-[10px] text-primary flex items-center gap-1 mt-1">
                                <CheckCircle size={10} aria-hidden="true" /> Uploaded
                              </p>
                            )}
                          </div>
                          <button type="button" onClick={clearEventImage} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Clear image">
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                        {!eventUploadedUrl && (
                          <button
                            type="button"
                            onClick={handleUploadEventImage}
                            disabled={uploadingEventImage}
                            className="w-full rounded-md bg-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {uploadingEventImage ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Upload size={12} aria-hidden="true" />}
                            {uploadingEventImage ? "Uploading..." : "Upload Image"}
                          </button>
                        )}
                      </div>
                    )}
                    <input ref={eventFileRef} type="file" accept="image/*" onChange={handleEventFile} className="hidden" />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={creatingEvent || !eventUploadedUrl || !newEventName.trim()}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {creatingEvent && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                      Create Event
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewEvent(false); clearEventImage(); setNewEventName(""); }}
                      className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {events.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No events yet. Create one above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {events.map((ev) => {
                  const evCards = cardsByEvent.get(ev._id) ?? [];
                  const categories = new Set(evCards.map((c) => c.type)).size;
                  return (
                    <div
                      key={ev._id}
                      className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/40 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveEventId(ev._id)}
                        className="block w-full text-left"
                        aria-label={`Open event ${ev.name}`}
                      >
                        <div className="aspect-[9/9] w-full bg-secondary overflow-hidden">
                          <img
                            src={ev.imageUrl}
                            alt={ev.name}
                            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                          />
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-heading text-sm font-semibold text-foreground truncate">{ev.name}</p>
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border shrink-0 ${
                                ev.status === "active"
                                  ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/40"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                              aria-label={`Status: ${ev.status}`}
                            >
                              {ev.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {categories} categor{categories === 1 ? "y" : "ies"}, {evCards.length} card{evCards.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </button>
                      <div className="px-3 pb-3 flex items-center justify-between gap-2 flex-wrap">
                        {canModify(ev.createdBy) ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev._id, ev.name)}
                            className="text-[10px] text-destructive/80 hover:text-destructive inline-flex items-center gap-1"
                            aria-label={`Delete event ${ev.name}`}
                          >
                            <Trash2 size={10} aria-hidden="true" /> Delete event
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {isManager ? "Created by someone else" : ""}
                          </span>
                        )}

                        {/* Admin-only status toggle. Managers never see this. */}
                        {isAdmin && (
                          ev.status === "active" ? (
                            <button
                              type="button"
                              onClick={() => handleToggleEventStatus(ev)}
                              className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                              aria-label={`Move ${ev.name} to draft`}
                              title="Move to draft (hides from regular users)"
                            >
                              <PowerOff size={10} aria-hidden="true" /> Move to draft
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleEventStatus(ev)}
                              className="text-[10px] text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1"
                              aria-label={`Activate ${ev.name}`}
                              title="Activate (makes cards visible to regular users)"
                            >
                              <Power size={10} aria-hidden="true" /> Activate
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          // ====== EVENT DETAIL: categories + cards inside ======
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveEventId(null)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={14} aria-hidden="true" /> All events
              </button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <img src={activeEvent.imageUrl} alt="" className="w-8 h-6 rounded object-cover" />
                <span className="text-foreground font-medium">{activeEvent.name}</span>
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${
                    activeEvent.status === "active"
                      ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/40"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {activeEvent.status}
                </span>
                {isAdmin && (
                  activeEvent.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => handleToggleEventStatus(activeEvent)}
                      className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      title="Move to draft"
                    >
                      <PowerOff size={10} aria-hidden="true" /> Move to draft
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleEventStatus(activeEvent)}
                      className="text-[10px] text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1"
                      title="Activate"
                    >
                      <Power size={10} aria-hidden="true" /> Activate
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus size={14} className="text-primary" aria-hidden="true" />
                Add Cards
              </h2>

              {/* Category picker */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Category</label>
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
                      <Plus size={10} aria-hidden="true" /> New Category
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      placeholder="e.g. Striker"
                      className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

              {/* Card form */}
              {activeType && (
                <form onSubmit={handleCreateCard} className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Adding cards to <span className="text-primary font-semibold">{activeEvent.name}</span> / <span className="text-primary font-semibold">{activeType}</span>
                  </p>

                  <div className="space-y-1">
                    <label htmlFor="card-name" className="text-xs text-muted-foreground">Card Name</label>
                    <input
                      id="card-name"
                      ref={cardNameInputRef}
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Striker (Isagi)"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Card Image</label>
                    {!cardImageFile ? (
                      <button
                        type="button"
                        onClick={() => cardFileRef.current?.click()}
                        className="w-full rounded-md border-2 border-dashed border-border bg-secondary/50 py-6 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors"
                      >
                        <Upload size={18} className="text-muted-foreground" aria-hidden="true" />
                        <span className="text-xs text-muted-foreground">Click to select image (max 5MB)</span>
                      </button>
                    ) : (
                      <div className="rounded-md border border-border bg-secondary p-3 space-y-3">
                        <div className="flex items-start gap-3">
                          <img src={cardImagePreview} alt="" className="w-16 h-12 rounded object-cover bg-background" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate">{cardImageFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(cardImageFile.size / 1024).toFixed(0)} KB</p>
                            {cardUploadedUrl && (
                              <p className="text-[10px] text-primary flex items-center gap-1 mt-1">
                                <CheckCircle size={10} aria-hidden="true" /> Uploaded
                              </p>
                            )}
                          </div>
                          <button type="button" onClick={clearCardImage} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Clear image">
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                        {!cardUploadedUrl && (
                          <button
                            type="button"
                            onClick={handleUploadCardImage}
                            disabled={uploadingCardImage}
                            className="w-full rounded-md bg-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {uploadingCardImage ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Upload size={12} aria-hidden="true" />}
                            {uploadingCardImage ? "Uploading..." : "Upload Image"}
                          </button>
                        )}
                      </div>
                    )}
                    <input ref={cardFileRef} type="file" accept="image/*" onChange={handleCardFile} className="hidden" />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingCard || !cardUploadedUrl || !cardName.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {creatingCard && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                    Add Card
                  </button>
                </form>
              )}
            </div>

            {/* Existing cards in this event, grouped by category */}
            {activeEventCards.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No cards in this event yet. Add the first one above.
              </div>
            ) : (
              existingTypes.map((typeName) => {
                const typeCards = activeEventCards.filter((c) => c.type === typeName);
                return (
                  <section key={typeName} className="space-y-2">
                    <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                      {typeName}
                      <span className="text-xs text-muted-foreground font-normal">({typeCards.length} card{typeCards.length === 1 ? "" : "s"})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {typeCards.map((card) => {
                        const mine = canModify(card.createdBy);
                        return (
                          <div key={card._id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-14 h-10 rounded object-cover bg-secondary"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{card.name}</p>
                              {card.eventId && typeof card.eventId !== "string" && (
                                <p className="text-[10px] text-muted-foreground truncate">{(card.eventId as EventRef).name}</p>
                              )}
                            </div>
                            {mine ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteCard(card._id, card.name)}
                                aria-label={`Delete card ${card.name}`}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            ) : (
                              <span
                                className="text-[10px] text-muted-foreground shrink-0"
                                title="Only the creator (or an admin) can delete this card"
                              >
                                read-only
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
