-- RIDEX
-- Migration 007
-- Ride negotiation + ride verification

-- =========================================================
-- RIDER OFFERS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ride_request_id UUID NOT NULL
    REFERENCES public.ride_requests(id)
    ON DELETE CASCADE,

  rider_id UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  offer_amount NUMERIC(10,2) NOT NULL
    CHECK (offer_amount > 0),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'accepted',
        'rejected',
        'withdrawn',
        'expired',
        'superseded'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One rider should not create duplicate active offers
CREATE UNIQUE INDEX IF NOT EXISTS
ride_offers_active_rider_unique_idx
ON public.ride_offers(ride_request_id, rider_id)
WHERE status = 'pending';


-- =========================================================
-- RIDE REQUEST NEGOTIATION
-- =========================================================

ALTER TABLE public.ride_requests
ADD COLUMN IF NOT EXISTS agreed_fare NUMERIC(10,2);

ALTER TABLE public.ride_requests
ADD COLUMN IF NOT EXISTS accepted_offer_id UUID
  REFERENCES public.ride_offers(id)
  ON DELETE SET NULL;


-- =========================================================
-- PASSENGER RIDE OTP
-- =========================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ride_otp_hash TEXT;


-- =========================================================
-- RIDE VERIFICATION
-- =========================================================

ALTER TABLE public.ride_requests
ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

ALTER TABLE public.ride_requests
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.ride_requests
ADD COLUMN IF NOT EXISTS ride_started_at TIMESTAMPTZ;

ALTER TABLE public.ride_requests
ADD COLUMN IF NOT EXISTS ride_completed_at TIMESTAMPTZ;


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS
ride_offers_ride_request_idx
ON public.ride_offers(ride_request_id);

CREATE INDEX IF NOT EXISTS
ride_offers_rider_idx
ON public.ride_offers(rider_id);

CREATE INDEX IF NOT EXISTS
ride_offers_status_idx
ON public.ride_offers(status);


-- =========================================================
-- UPDATED AT
-- =========================================================

DROP TRIGGER IF EXISTS ride_offers_set_updated_at
ON public.ride_offers;

CREATE TRIGGER ride_offers_set_updated_at
BEFORE UPDATE ON public.ride_offers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();