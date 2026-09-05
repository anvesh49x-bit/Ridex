-- RIDEX
-- Migration 005
-- Create ride requests
--
-- This table represents the passenger's request for a ride.
-- The backend will become the source of truth for creating
-- and changing ride requests.

CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  passenger_id UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,

  pickup_location geography(Point, 4326) NOT NULL,

  drop_location geography(Point, 4326) NOT NULL,

  pickup_name TEXT,

  pickup_address TEXT,

  drop_name TEXT,

  drop_address TEXT,

  vehicle_type TEXT NOT NULL
    CHECK (
      vehicle_type IN (
        'bike',
        'scooter',
        'auto',
        'car'
      )
    ),

  distance_m INTEGER
    CHECK (
      distance_m IS NULL
      OR distance_m > 0
    ),

  duration_seconds INTEGER
    CHECK (
      duration_seconds IS NULL
      OR duration_seconds > 0
    ),

  min_fare NUMERIC(10, 2)
    CHECK (
      min_fare IS NULL
      OR min_fare >= 0
    ),

  suggested_fare NUMERIC(10, 2)
    CHECK (
      suggested_fare IS NULL
      OR suggested_fare >= 0
    ),

  max_fare NUMERIC(10, 2)
    CHECK (
      max_fare IS NULL
      OR max_fare >= 0
    ),

  passenger_offer NUMERIC(10, 2) NOT NULL
    CHECK (passenger_offer > 0),

  payment_method TEXT NOT NULL
    CHECK (
      payment_method IN (
        'cash',
        'upi'
      )
    ),

  note TEXT,

  status TEXT NOT NULL DEFAULT 'searching'
    CHECK (
      status IN (
        'searching',
        'negotiating',
        'matched',
        'driver_arriving',
        'driver_arrived',
        'in_progress',
        'completed',
        'cancelled',
        'expired'
      )
    ),

  assigned_rider_id UUID
    REFERENCES public.rider_profiles(id)
    ON DELETE SET NULL,

  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  expires_at TIMESTAMPTZ,

  matched_at TIMESTAMPTZ,

  started_at TIMESTAMPTZ,

  completed_at TIMESTAMPTZ,

  cancelled_at TIMESTAMPTZ,

  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ride_requests_fare_order_check
    CHECK (
      (
        min_fare IS NULL
        OR suggested_fare IS NULL
        OR min_fare <= suggested_fare
      )
      AND
      (
        suggested_fare IS NULL
        OR max_fare IS NULL
        OR suggested_fare <= max_fare
      )
    )
);

-- Passenger lookup
CREATE INDEX IF NOT EXISTS ride_requests_passenger_idx
  ON public.ride_requests(passenger_id);

-- Ride status lookup
CREATE INDEX IF NOT EXISTS ride_requests_status_idx
  ON public.ride_requests(status);

-- Rider assignment lookup
CREATE INDEX IF NOT EXISTS ride_requests_rider_idx
  ON public.ride_requests(assigned_rider_id);

-- Newest requests first
CREATE INDEX IF NOT EXISTS ride_requests_requested_at_idx
  ON public.ride_requests(requested_at DESC);

-- Spatial indexes for future rider matching
CREATE INDEX IF NOT EXISTS ride_requests_pickup_location_idx
  ON public.ride_requests
  USING GIST(pickup_location);

CREATE INDEX IF NOT EXISTS ride_requests_drop_location_idx
  ON public.ride_requests
  USING GIST(drop_location);

-- Automatically update updated_at
DROP TRIGGER IF EXISTS ride_requests_set_updated_at
ON public.ride_requests;

CREATE TRIGGER ride_requests_set_updated_at
BEFORE UPDATE ON public.ride_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- Passenger can see their own ride requests.
DROP POLICY IF EXISTS "ride_requests_select_own"
ON public.ride_requests;

CREATE POLICY "ride_requests_select_own"
ON public.ride_requests
FOR SELECT
TO authenticated
USING (passenger_id = auth.uid());