CREATE TABLE IF NOT EXISTS public.rider_ride_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ride_request_id UUID NOT NULL
    REFERENCES public.ride_requests(id)
    ON DELETE CASCADE,

  rider_id UUID NOT NULL
    REFERENCES public.rider_profiles(id)
    ON DELETE CASCADE,

  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
rider_ride_rejections_unique_idx
ON public.rider_ride_rejections (
  ride_request_id,
  rider_id
);

CREATE INDEX IF NOT EXISTS
rider_ride_rejections_rider_idx
ON public.rider_ride_rejections (
  rider_id,
  rejected_at DESC
);

CREATE INDEX IF NOT EXISTS
rider_ride_rejections_ride_idx
ON public.rider_ride_rejections (
  ride_request_id
);