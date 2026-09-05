-- RIDEX
-- Migration 003
-- Create rider profiles and vehicles

-- ==================================================
-- Rider Profiles
-- ==================================================

CREATE TABLE IF NOT EXISTS public.rider_profiles (
  id UUID PRIMARY KEY
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      verification_status IN (
        'pending',
        'approved',
        'rejected',
        'suspended'
      )
    ),

  date_of_birth DATE,

  gender TEXT
    CHECK (
      gender IS NULL
      OR gender IN ('male', 'female', 'other')
    ),

  address TEXT,

  emergency_contact_name TEXT,

  emergency_contact_phone TEXT,

  is_online BOOLEAN NOT NULL DEFAULT FALSE,

  -- Rider's latest GPS position.
  -- PostGIS is already enabled in the database.
  last_location geography(Point, 4326),

  last_location_at TIMESTAMPTZ,

  service_radius_m INTEGER NOT NULL DEFAULT 5000
    CHECK (service_radius_m > 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- Rider Profile Indexes
-- ==================================================

CREATE INDEX IF NOT EXISTS rider_profiles_verification_idx
  ON public.rider_profiles(verification_status);

CREATE INDEX IF NOT EXISTS rider_profiles_online_idx
  ON public.rider_profiles(is_online);

CREATE INDEX IF NOT EXISTS rider_profiles_location_idx
  ON public.rider_profiles
  USING GIST(last_location);

-- ==================================================
-- Vehicles
-- ==================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  rider_id UUID NOT NULL
    REFERENCES public.rider_profiles(id)
    ON DELETE CASCADE,

  vehicle_type TEXT NOT NULL
    CHECK (
      vehicle_type IN (
        'bike',
        'scooter',
        'auto',
        'car'
      )
    ),

  make TEXT,

  model TEXT,

  color TEXT,

  registration_number TEXT NOT NULL UNIQUE,

  registration_year INTEGER
    CHECK (
      registration_year IS NULL
      OR registration_year BETWEEN 1900 AND 2100
    ),

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- Vehicle Indexes
-- ==================================================

CREATE INDEX IF NOT EXISTS vehicles_rider_idx
  ON public.vehicles(rider_id);

CREATE INDEX IF NOT EXISTS vehicles_active_idx
  ON public.vehicles(is_active);

-- ==================================================
-- Updated-at triggers
-- ==================================================

DROP TRIGGER IF EXISTS rider_profiles_set_updated_at
ON public.rider_profiles;

CREATE TRIGGER rider_profiles_set_updated_at
BEFORE UPDATE ON public.rider_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS vehicles_set_updated_at
ON public.vehicles;

CREATE TRIGGER vehicles_set_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ==================================================
-- Row Level Security
-- ==================================================

ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- Rider profile policies
-- ==================================================

DROP POLICY IF EXISTS "rider_profiles_select_own"
ON public.rider_profiles;

CREATE POLICY "rider_profiles_select_own"
ON public.rider_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- ==================================================
-- Vehicle policies
-- ==================================================

DROP POLICY IF EXISTS "vehicles_select_own"
ON public.vehicles;

CREATE POLICY "vehicles_select_own"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  rider_id = auth.uid()
);