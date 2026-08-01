-- Business DNA / Map Marketplace MVP schema
-- Phase 1 simplified schema: accounts, profiles, map presence, buyer requests,
-- seller offers, conversations + messages.
-- Uses PostGIS geography(Point) for accurate radius/distance queries.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- ============ USERS ============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ PROFILES ============
-- A profile is what appears on the map. Owned by a user.
-- profile_kind: 'individual' | 'business'
-- role: 'buyer' | 'seller' | 'both'
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_kind TEXT NOT NULL CHECK (profile_kind IN ('individual','business')),
  role TEXT NOT NULL CHECK (role IN ('buyer','seller','both')),
  display_name TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g. 'contractor', 'manufacturer', 'consulting', 'real_estate'
  headline TEXT,
  description TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============ LOCATION PROFILE (map presence) ============
-- visibility_level: 'exact' | 'approximate' | 'city_only' | 'hidden'
CREATE TABLE IF NOT EXISTS location_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  geom geography(Point, 4326) NOT NULL, -- true stored location
  display_geom geography(Point, 4326) NOT NULL, -- jittered/approx location actually shown on map
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  service_radius_km NUMERIC NOT NULL DEFAULT 25,
  visibility_level TEXT NOT NULL DEFAULT 'approximate'
    CHECK (visibility_level IN ('exact','approximate','city_only','hidden')),
  is_currently_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_geom ON location_profiles USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_location_display_geom ON location_profiles USING GIST (display_geom);
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_profile_unique ON location_profiles(profile_id);

-- ============ BUYER REQUESTS ("I need...") ============
CREATE TABLE IF NOT EXISTS buyer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min NUMERIC,
  budget_max NUMERIC,
  budget_is_public BOOLEAN NOT NULL DEFAULT true,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low','normal','high','urgent')),
  desired_date DATE,
  remote_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed','expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_requests_profile ON buyer_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_category ON buyer_requests(category);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_status ON buyer_requests(status);

-- ============ SELLER OFFERS ("I offer...") ============
CREATE TABLE IF NOT EXISTS seller_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price_min NUMERIC,
  price_max NUMERIC,
  remote_available BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_offers_profile ON seller_offers(profile_id);
CREATE INDEX IF NOT EXISTS idx_seller_offers_category ON seller_offers(category);
CREATE INDEX IF NOT EXISTS idx_seller_offers_status ON seller_offers(status);

-- ============ CONVERSATIONS + MESSAGES ============
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_request_id UUID REFERENCES buyer_requests(id) ON DELETE SET NULL,
  seller_offer_id UUID REFERENCES seller_offers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_initiator ON conversations(initiated_by);
CREATE INDEX IF NOT EXISTS idx_conversations_recipient ON conversations(recipient_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
