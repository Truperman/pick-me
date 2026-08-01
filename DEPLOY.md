# Deploying Pick Me

This app needs two things in production: a Node host that can run `next start`,
and a **PostgreSQL database with the PostGIS extension enabled** (the map
queries depend on PostGIS functions like `ST_MakeEnvelope`/`ST_Intersects`).
That combination isn't available on purely static/serverless-only hosts
without an add-on, so pick a path below.

## Option A — Render (recommended, simplest single-provider path)

Render can host both the web service and a managed Postgres instance with
PostGIS in one place.

1. Push this code to a GitHub repo (`git init && git add -A && git commit -m "Pick Me MVP" && git remote add origin <your-repo-url> && git push -u origin main`).
2. In the Render dashboard: **New → PostgreSQL**. Create it, then open its
   **Connect** tab and copy the "External Database URL."
3. Once the database is up, open its **Shell** tab (or connect with `psql`
   from your machine) and enable PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. In the Render dashboard: **New → Web Service** → connect your GitHub repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Add environment variables:
     - `DATABASE_URL` = the connection string from step 2
     - `JWT_SECRET` = any long random string (e.g. `openssl rand -hex 32`)
5. After the first deploy succeeds, run the schema (and optional seed data)
   against the production database from your own machine:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   psql "$DATABASE_URL" -f db/seed.sql   # optional demo data
   ```
6. Render gives you a public URL like `https://pick-me.onrender.com` —
   that's your live site.

## Option B — Vercel (web) + Supabase or Neon (database)

Vercel doesn't host Postgres itself, but both Supabase and Neon offer managed
Postgres with PostGIS available as an extension, and both work well with
Vercel.

1. Create a project on [Supabase](https://supabase.com) or
   [Neon](https://neon.tech).
   - Supabase: PostGIS is enabled via **Database → Extensions → postgis**
     (toggle it on).
   - Neon: run `CREATE EXTENSION IF NOT EXISTS postgis;` in the SQL editor.
2. Copy the connection string it gives you (use the "pooled"/"transaction
   mode" connection string if offered — Vercel's serverless functions open a
   lot of short-lived connections).
3. Run the schema and seed against it locally:
   ```bash
   psql "<connection string>" -f db/schema.sql
   psql "<connection string>" -f db/seed.sql
   ```
4. Push this code to GitHub, then import the repo into
   [Vercel](https://vercel.com/new).
5. In the Vercel project's **Settings → Environment Variables**, add:
   - `DATABASE_URL` = the connection string from step 2
   - `JWT_SECRET` = any long random string
6. Deploy. Vercel gives you a URL like `https://pick-me.vercel.app`.

## Option C — Railway

Similar to Render: **New Project → Provision PostgreSQL**, enable PostGIS
with `CREATE EXTENSION IF NOT EXISTS postgis;` in Railway's query console,
then **New → GitHub Repo** for the app itself with the same `DATABASE_URL` /
`JWT_SECRET` environment variables and `npm run build` / `npm start` commands.

## After it's live, sanity-check these

- Sign up a new account and complete onboarding (confirms DB writes + auth
  cookie work over HTTPS — cookies are set `secure: true` in production, so
  this only works once you're on `https://`)
- Load `/map` and confirm pins render (confirms PostGIS + the pins API)
- Send a message from a pin's preview drawer (confirms the full write path)

## Notes specific to this codebase

- Auth cookies are marked `secure` automatically when `NODE_ENV=production`
  (see `src/lib/auth.ts`), which every host above sets for you — just make
  sure you're accessing the site over `https://`, not `http://`.
- There's no build-time dependency on the database, so `npm run build` will
  succeed even before the schema is loaded — just don't hit any page before
  running `db/schema.sql`, or you'll see 500s from the API routes.
- If you rename the project on GitHub, the Postgres role/database name in
  `.env.example` is just a placeholder — use whatever your host generates.
