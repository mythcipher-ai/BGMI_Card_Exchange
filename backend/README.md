# BGMI Backend

A Node.js + Express backend for the BGMI card exchange platform.

## Features

- Auth0-protected API routes
- MongoDB persistence for users, listings, claims, and reports
- Secure AES encryption for card codes
- Atomic claim flow to prevent double claims
- Rate limiting per IP and per user
- Reporting and auto-hiding of abusive listings
- Expiry cleanup job for stale listings

## Getting started

1. Copy `.env.example` to `.env`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/me` — current authenticated user
- `POST /api/listings` — create a new card listing
- `GET /api/listings` — list active cards with search/pagination
- `DELETE /api/listings/:id` — delete your own listing
- `POST /api/claims/:listingId` — claim an active listing
- `POST /api/reports/:listingId` — report a listing

## Environment variables

Required variables:

- `MONGODB_URI`
- `AUTH0_ISSUER`
- `AUTH0_AUDIENCE`
- `ENCRYPTION_KEY`

Optional tuning:

- `CLAIM_COOLDOWN_SECONDS`
- `DAILY_CLAIM_LIMIT`
- `REPORT_THRESHOLD`
