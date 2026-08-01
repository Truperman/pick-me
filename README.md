# Pick Me — Map-Based Business Marketplace (MVP)

See `DEPLOY.md` for step-by-step instructions on putting this online
(Render, Vercel+Supabase/Neon, or Railway).

This is a working, simplified first version of the "map-based business marketplace"
concept from the original brief: any business or buyer can drop a pin on a map,
say what they need or offer, and message each other directly. It intentionally
**leaves out** the AI brain, matchmaking engine, contracts/negotiation AI, billing,
video, and the AI employee marketplace — those are Phase 2+ (see bottom).

## What's actually working right now

- Email/password signup & login (JWT session cookie)
- Onboarding: create a profile as an individual or business, buyer/seller/both,
  category, description, location (browser geolocation or manual lat/lng),
  service radius, and a **privacy-preserving visibility level** (exact /
  approximate / city-only / hidden)
- Interactive map (Leaflet + OpenStreetMap tiles, no API key needed):
  - Search-as-you-move (fetches pins for the current viewport)
  - Filters: buyer/seller/both, category, keyword
  - Grid-based pin clustering that breaks apart as you zoom in
  - Visually distinct pins for buyers (🔍 orange) vs sellers (🏢 indigo) vs
    both (🔁 purple), plus a green "verified" badge dot
  - Click a pin → profile preview drawer (open requests, active offers,
    "View full profile", inline "send a message" box)
  - Map / List / Split view toggle
- Buyers can post a **request** ("need a concrete contractor"); sellers can
  post an **offer** ("concrete crew available") — both show up as map pins
- Full public profile page (`/profile/[id]`)
- Direct messaging: starting a conversation from a pin, a conversation list,
  and a simple chat thread
- Demo data: 8 seeded businesses/buyers around the Denver–Boulder metro so the
  map isn't empty on first load

## Tech stack

- **Next.js 16** (App Router, TypeScript, Tailwind) — this environment ships a
  patched Next.js build; see `AGENTS.md` in the repo root, which points at
  `node_modules/next/dist/docs/` for the current API surface (e.g. `ssr:false`
  dynamic imports now require the importing file itself to be a Client
  Component, route handler `params`/cookies are async, etc.)
- **PostgreSQL 16 + PostGIS 3.4** — real geospatial storage
  (`geography(Point,4326)`), bounding-box queries via
  `ST_MakeEnvelope` / `ST_Intersects`, ready for radius search with
  `ST_DWithin`
- **`pg`** (node-postgres) with hand-written SQL — **not Prisma**. Prisma's
  engine binaries could not be downloaded in this sandbox (network-restricted
  to `binaries.prisma.sh`), so the data layer is raw SQL behind small
  `query()`/`queryOne()` helpers in `src/lib/db.ts`. This is a deliberate,
  reversible choice — swapping in Prisma or Drizzle later is straightforward
  since the schema is already in `db/schema.sql`.
- **bcryptjs + jsonwebtoken** for auth (httpOnly cookie session — no NextAuth,
  kept intentionally minimal)
- **Leaflet + react-leaflet** for the map (no Mapbox/Google Maps key required
  for this MVP; swapping tile providers later is a one-line change)
- **Zod** for API input validation

## Project structure

```
db/
  schema.sql        -- full Postgres/PostGIS schema (run this first)
  seed.sql           -- demo data (Denver-metro businesses & buyers)
src/
  app/
    api/              -- route handlers (auth, profile, map, requests, offers, conversations)
    map/               -- the map page
    profile/[id]/      -- public "about" page for a profile
    messages/          -- conversation list + thread
    post/request|offer/ -- forms to publish a buyer request / seller offer
    onboarding/         -- profile creation wizard
    signup/ login/
  components/
    MapView.tsx        -- the actual Leaflet map, clustering, filters, preview drawer
    NavBar.tsx
  lib/
    db.ts               -- pg Pool + query helpers
    auth.ts              -- password hashing, JWT session cookie
    geo.ts               -- privacy-offset jitter + haversine distance
    constants.ts          -- shared category list
```

## Running it yourself

```bash
# 1. Postgres + PostGIS must be running and reachable at DATABASE_URL
#    (this sandbox already has a local instance seeded — see .env.local)
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql   # optional demo data

npm install
npm run dev
# → http://localhost:3000
```

Seeded demo accounts (all use password `password123`):
`concrete@demo.bizdna.app`, `staffing@demo.bizdna.app`, `devshop@demo.bizdna.app`,
`wholesale@demo.bizdna.app`, `buyer.retail@demo.bizdna.app`,
`buyer.startup@demo.bizdna.app`, `landscaping@demo.bizdna.app`,
`investor@demo.bizdna.app`.

## Known simplifications (on purpose, for a first working version)

- No geocoding service wired up — onboarding uses the browser's geolocation
  API or manual lat/lng entry rather than "type an address."
- No radius search yet on the API (bounding-box only); `ST_DWithin` for a true
  "within X km" query is a small addition to `src/app/api/map/pins/route.ts`.
- Clustering is a lightweight client-side grid algorithm, not a proper
  supercluster/marker-cluster library — good enough for a demo, would want
  a real clustering library at scale.
- No file uploads (portfolios, photos, licenses), no reputation/trust scoring,
  no verification pipeline (`isVerified` is just a boolean seeded manually).
- No email verification, password reset, or rate limiting on auth endpoints.
- A handful of ESLint `no-explicit-any` warnings remain in API row-mapping
  code — functional but worth typing properly before this goes further.

## Roadmap (Phase 2+, from the original brief)

1. **Trust & verification** — identity/business verification, reputation
   score, dispute history
2. **Business DNA + AI matchmaking** — structured DNA profile, vector
   embeddings, proactive "3 buyers near you need what you sell" recommendations
3. **Company AI brain** — knowledge base ingestion, a public Q&A assistant
   per business profile
4. **Negotiation AI** — contract/quote upload, clause analysis, redlining
5. **Video/voice, file sharing, proposal builder, e-signature**
6. **AI employee marketplace, partnership engine, billing (Stripe Connect)**
7. Swap the raw-SQL data layer for Prisma/Drizzle once engine downloads are
   available in the target deployment environment, and move from a single
   Postgres instance to a managed one with connection pooling (PgBouncer) at
   scale.
