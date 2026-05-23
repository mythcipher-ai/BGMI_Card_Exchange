const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...options?.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Public endpoints (no auth)
export interface EventRef {
  _id: string;
  name: string;
  imageUrl: string;
}

export interface DefinedCard {
  _id: string;
  // eventId is populated as an object on admin endpoints, but the public
  // /api/public/cards endpoint may still return a raw ObjectId string.
  eventId?: EventRef | string;
  type: string;
  name: string;
  imageUrl: string;
  totalCount: number;
  // The user id who created this card. Used by the Admin UI so a manager
  // can only see delete/edit affordances on items they themselves created.
  createdBy?: string;
}

export type EventStatus = "draft" | "active";

export interface EventItem {
  _id: string;
  name: string;
  imageUrl: string;
  status: EventStatus;
  createdBy?: string;
  createdAt: string;
}

export interface CardImage {
  name: string;
  imageUrl: string;
  type: string;
}

export interface Listing {
  id: string;
  // The pool of cards the lister offers (1-3). Buyer picks one in-game.
  offeringCards: string[];
  offeringCardImages: CardImage[];
  // The single card the lister wants back in exchange.
  wantedCard: string;
  wantedCardImage: string;
  wantedCardType: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  claimCount: number;
  // Mongo ObjectId of the lister. Used client-side to hide the Claim button
  // on the user's own listing (defence-in-depth — backend also rejects).
  createdById: string | null;
  trustScore: number;
  maskedCode: string;
}

// Public-side: only returns cards from ACTIVE events. Used by the user-facing
// AddCard form and anywhere else regular players need a card picker.
export function fetchDefinedCards() {
  return request<{ data: DefinedCard[] }>("/api/public/cards");
}

// Public-side: only ACTIVE events. Used by the user-facing AddCard browse flow.
export function fetchPublicEvents() {
  return request<{ data: EventItem[] }>("/api/public/events");
}

// Admin/manager-side: returns ALL cards regardless of event status, with the
// event populated. Used by the Admin page so draft events' categories and
// cards still appear in the management UI.
export function adminFetchAllCards() {
  return request<{ data: DefinedCard[] }>("/api/admin/cards");
}

export function fetchCardTypes() {
  return request<{ data: string[] }>("/api/public/cards/types");
}

export function fetchPublicListings(params?: { search?: string; sort?: string; page?: number; limit?: number; cardId?: string; cardName?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.sort) q.set("sort", params.sort);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.cardId) q.set("cardId", params.cardId);
  if (params?.cardName) q.set("cardName", params.cardName);
  return request<{ data: Listing[]; page: number; limit: number; total: number }>(`/api/public/listings?${q}`);
}

// ---- Catalog (public) ----
// Every admin-created card from an active event, with how many active codes
// (listings) currently exist for it. Used by the home grid.
export interface CatalogCard {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  eventId: string;
  eventName: string;
  availableCount: number;
}

export function fetchCatalog() {
  return request<{ data: CatalogCard[] }>("/api/public/catalog");
}

// Authenticated endpoints
export function createListing(body: { offeringCardIds: string[]; wantedCardId: string; code: string; expiresInHours?: number }) {
  return request<any>("/api/listings", { method: "POST", body: JSON.stringify(body) });
}

export type TradeOutcome = "pending" | "confirmed" | "disputed";

export interface MyListing {
  id: string;
  offeringCards: string[];
  offeringCardImages: CardImage[];
  wantedCard: string;
  wantedCardImage: string;
  wantedCardType: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  claimCount: number;
  tradeOutcome: TradeOutcome | null;
  outcomeAt: string | null;
  disputeReason: string | null;
  claimedBy: { name: string; email?: string } | null;
  claimedAt: string | null;
}

export function fetchMyListings() {
  return request<{ data: MyListing[] }>("/api/listings/mine");
}

export function deleteListing(id: string) {
  return request<any>(`/api/listings/${id}`, { method: "DELETE" });
}

// Owner confirms they received their wanted card from the claimer in-game.
// Increments their successfulTrades counter on the backend (milestone reward).
export function confirmTradeReceived(id: string) {
  return request<{ id: string; tradeOutcome: TradeOutcome; outcomeAt: string }>(
    `/api/listings/${id}/confirm-received`,
    { method: "POST" }
  );
}

// Owner reports the trade didn't happen. Claimer's flagCount is incremented.
export function disputeTrade(id: string, reason?: string) {
  return request<{ id: string; tradeOutcome: TradeOutcome; outcomeAt: string; claimerFlagCount: number }>(
    `/api/listings/${id}/dispute`,
    { method: "POST", body: JSON.stringify({ reason }) }
  );
}

export function claimListing(listingId: string) {
  return request<{ listingId: string; status: string; revealedCode: string; message: string }>(`/api/claims/${listingId}`, { method: "POST" });
}

export function reportListing(listingId: string, reason?: string) {
  return request<any>(`/api/reports/${listingId}`, { method: "POST", body: JSON.stringify({ reason }) });
}

export interface MeProfile {
  id: string;
  role: string;
  status: string;
  auth0Id: string;
  email?: string;
  name?: string;
  picture?: string;
  trustScore: number;
  totalClaims: number;
  successfulClaims: number;
  successfulTrades: number;
  reportsCount: number;
  dailyClaims: number;
  instagramHandle?: string;
  bgmiUid?: string;
  hasActiveListing: boolean;
}

export function fetchMe() {
  return request<MeProfile>("/api/me");
}

export function syncProfile(body: { name?: string; picture?: string }) {
  return request<{ ok: boolean }>("/api/me/sync", { method: "POST", body: JSON.stringify(body) });
}

// Admin endpoints
export async function adminUploadImage(file: File): Promise<{ key: string; url: string }> {
  const token = localStorage.getItem("auth_token");
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}/api/admin/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export function adminCreateCard(body: { eventId: string; type: string; name: string; imageUrl: string }) {
  return request<DefinedCard>("/api/admin/cards", { method: "POST", body: JSON.stringify(body) });
}

export function adminUpdateCard(id: string, body: Partial<{ eventId: string; type: string; name: string; imageKey: string; totalCount: number }>) {
  return request<DefinedCard>(`/api/admin/cards/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function adminDeleteCard(id: string) {
  return request<any>(`/api/admin/cards/${id}`, { method: "DELETE" });
}

// ---- Event admin ----
export function adminGetEvents() {
  return request<{ data: EventItem[] }>("/api/admin/events");
}

export function adminCreateEvent(body: { name: string; imageUrl: string }) {
  return request<EventItem>("/api/admin/events", { method: "POST", body: JSON.stringify(body) });
}

export function adminUpdateEvent(id: string, body: Partial<{ name: string; imageUrl: string }>) {
  return request<EventItem>(`/api/admin/events/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function adminDeleteEvent(id: string) {
  return request<any>(`/api/admin/events/${id}`, { method: "DELETE" });
}

// Admin-only.
export function adminSetEventStatus(id: string, status: EventStatus) {
  return request<EventItem>(`/api/admin/events/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

// Admin user management
export interface AdminUser {
  _id: string;
  auth0Id: string;
  email?: string;
  name?: string;
  picture?: string;
  role: string;
  status: string;
  listingsCount: number;
  claimedCount: number;
  createdAt: string;
  flagged: boolean;
  sharedIps: string[];
  // Trade-dispute flag count: lister reported "not received". Used to flag
  // repeat offenders for suspension decisions.
  flagCount: number;
  successfulTrades: number;
}

export function adminGetUsers() {
  return request<{ data: AdminUser[] }>("/api/admin/users");
}

export function adminGetUserDetail(id: string) {
  return request<any>(`/api/admin/users/${id}`);
}

export function adminBlockUser(id: string) {
  return request<any>(`/api/admin/users/${id}/block`, { method: "POST" });
}

export function adminUnblockUser(id: string) {
  return request<any>(`/api/admin/users/${id}/unblock`, { method: "POST" });
}

export function adminSetUserRole(id: string, role: "user" | "manager") {
  return request<{ message: string; user: AdminUser }>(
    `/api/admin/users/${id}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) }
  );
}

// ---- Rewards & Milestones (user) ----
export type MilestoneState =
  | "locked"
  | "available"
  | "pending"
  | "approved"
  | "delivered"
  | "rejected";

export interface MilestoneEntry {
  threshold: number;
  popularityReward: number;
  state: MilestoneState;
  request: {
    id: string;
    status: "pending" | "approved" | "delivered" | "rejected";
    bgmiUid: string;
    rejectionReason?: string;
    createdAt: string;
    deliveredAt?: string;
  } | null;
}

export interface MyMilestonesPayload {
  successfulTrades: number;
  savedBgmiUid: string | null;
  milestones: MilestoneEntry[];
}

export function fetchMyMilestones() {
  return request<{ data: MyMilestonesPayload }>("/api/rewards/milestones");
}

export function claimMilestone(milestone: number, bgmiUid: string) {
  return request<{ data: { id: string; milestone: number; popularityAmount: number; status: string; bgmiUid: string; createdAt: string } }>(
    "/api/rewards/claim",
    { method: "POST", body: JSON.stringify({ milestone, bgmiUid }) }
  );
}

// ---- Rewards admin ----
export type RewardStatus = "pending" | "approved" | "delivered" | "rejected";

export interface AdminRewardRequest {
  id: string;
  milestone: number;
  popularityAmount: number;
  bgmiUid: string;
  status: RewardStatus;
  successfulTradesAtClaim: number;
  currentTrades: number;
  user: { id: string; name?: string; email?: string } | null;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  deliveredAt?: string;
  rejectedAt?: string;
}

export function adminGetRewards(status?: RewardStatus) {
  const q = status ? `?status=${status}` : "";
  return request<{ data: AdminRewardRequest[] }>(`/api/admin/rewards${q}`);
}

export function adminSetRewardStatus(id: string, status: "approved" | "delivered" | "rejected", rejectionReason?: string) {
  return request<{ data: { id: string; status: RewardStatus } }>(
    `/api/admin/rewards/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status, rejectionReason }) }
  );
}

// ---- Platform stats (public, for hero strip) ----
export interface PlatformStats {
  activeTraders: number;
  activeListings: number;
  totalTrades: number;
  listingsToday: number;
}

export function fetchPlatformStats() {
  return request<{ data: PlatformStats }>("/api/public/stats");
}

// ---- Eligibility (authenticated) ----
export interface Eligibility {
  canCreateListing: boolean;
  canClaim: boolean;
  activeListingId: string | null;
  reason?: "ACTIVE_LISTING_EXISTS" | "DAILY_LIMIT" | "COOLDOWN" | null;
}

export function fetchMyEligibility() {
  return request<{ data: Eligibility }>("/api/me/eligibility");
}

// ---- Gift requests (authenticated) ----
export interface GiftRequestPayload {
  requesterName: string;
  requesterEmail: string;
  message: string;
  popularityOffered: number;
}

export interface GiftRequestRecord {
  id: string;
  listingId: string;
  listingCard: string;
  listingCardImage: string;
  fromUserName: string;
  toUserName: string;
  requesterName: string;
  requesterEmail: string;
  message: string;
  popularityOffered: number;
  status: "pending" | "acknowledged" | "fulfilled" | "declined" | "expired";
  emailSent: boolean;
  createdAt: string;
  expiresAt: string;
}

export function createGiftRequest(listingId: string, payload: GiftRequestPayload) {
  return request<{ data: GiftRequestRecord }>(`/api/gifts/${listingId}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchIncomingGiftRequests() {
  return request<{ data: GiftRequestRecord[] }>("/api/gifts/incoming");
}

export function fetchOutgoingGiftRequests() {
  return request<{ data: GiftRequestRecord[] }>("/api/gifts/outgoing");
}

export function updateGiftRequestStatus(id: string, status: GiftRequestRecord["status"]) {
  return request<{ data: GiftRequestRecord }>(`/api/gifts/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
