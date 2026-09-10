/*
|--------------------------------------------------------------------------
| 010 - Rider Applications
|--------------------------------------------------------------------------
|
| A rider capability and a rider application are different concepts.
|
| rider_profiles
|   -> represents the rider capability/account
|
| rider_applications
|   -> represents the onboarding + verification process
|
| Only the Admin/Operations system is allowed to approve an application.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS public.rider_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  rider_id UUID NOT NULL
    REFERENCES public.rider_profiles(id)
    ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (
      status IN (
        'draft',
        'submitted',
        'under_review',
        'correction_required',
        'approved',
        'rejected'
      )
    ),

  submitted_at TIMESTAMPTZ,

  reviewed_at TIMESTAMPTZ,

  reviewed_by UUID
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  rejection_reason TEXT,

  correction_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


/*
|--------------------------------------------------------------------------
| One active application per rider
|--------------------------------------------------------------------------
|
| Historical applications can exist, but only one application may be
| active at a time.
|
|--------------------------------------------------------------------------
*/

CREATE UNIQUE INDEX IF NOT EXISTS rider_applications_one_active_idx
ON public.rider_applications (rider_id)
WHERE status IN (
  'draft',
  'submitted',
  'under_review',
  'correction_required'
);


/*
|--------------------------------------------------------------------------
| Lookup indexes
|--------------------------------------------------------------------------
*/

CREATE INDEX IF NOT EXISTS rider_applications_status_idx
ON public.rider_applications (status);

CREATE INDEX IF NOT EXISTS rider_applications_rider_id_idx
ON public.rider_applications (rider_id);

CREATE INDEX IF NOT EXISTS rider_applications_submitted_at_idx
ON public.rider_applications (submitted_at);


/*
|--------------------------------------------------------------------------
| Updated timestamp trigger
|--------------------------------------------------------------------------
*/

CREATE OR REPLACE FUNCTION public.update_rider_applications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS rider_applications_updated_at
ON public.rider_applications;


CREATE TRIGGER rider_applications_updated_at
BEFORE UPDATE ON public.rider_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_rider_applications_updated_at();