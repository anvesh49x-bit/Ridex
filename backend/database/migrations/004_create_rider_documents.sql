-- RIDEX
-- Migration 004
-- Create rider document metadata and verification state

-- ==================================================
-- Rider Documents
-- ==================================================

CREATE TABLE IF NOT EXISTS public.rider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  rider_id UUID NOT NULL
    REFERENCES public.rider_profiles(id)
    ON DELETE CASCADE,

  vehicle_id UUID
    REFERENCES public.vehicles(id)
    ON DELETE SET NULL,

  document_type TEXT NOT NULL
    CHECK (
      document_type IN (
        'driving_licence',
        'registration_certificate',
        'vehicle_insurance'
      )
    ),

  storage_path TEXT NOT NULL,

  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      verification_status IN (
        'pending',
        'approved',
        'rejected'
      )
    ),

  rejection_reason TEXT,

  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One current document of each type per rider.
  CONSTRAINT rider_documents_unique_type
    UNIQUE (rider_id, document_type)
);

-- ==================================================
-- Indexes
-- ==================================================

CREATE INDEX IF NOT EXISTS rider_documents_rider_idx
  ON public.rider_documents(rider_id);

CREATE INDEX IF NOT EXISTS rider_documents_vehicle_idx
  ON public.rider_documents(vehicle_id);

CREATE INDEX IF NOT EXISTS rider_documents_status_idx
  ON public.rider_documents(verification_status);

-- ==================================================
-- Updated-at trigger
-- ==================================================

DROP TRIGGER IF EXISTS rider_documents_set_updated_at
ON public.rider_documents;

CREATE TRIGGER rider_documents_set_updated_at
BEFORE UPDATE ON public.rider_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ==================================================
-- Row Level Security
-- ==================================================

ALTER TABLE public.rider_documents ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- Rider can see their own documents
-- ==================================================

DROP POLICY IF EXISTS "rider_documents_select_own"
ON public.rider_documents;

CREATE POLICY "rider_documents_select_own"
ON public.rider_documents
FOR SELECT
TO authenticated
USING (
  rider_id = auth.uid()
);