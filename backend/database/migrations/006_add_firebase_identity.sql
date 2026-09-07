-- RIDEX
-- Migration 006
-- Add Firebase identity mapping to RIDEX profiles

-- --------------------------------------------------
-- Firebase UID
-- --------------------------------------------------

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

-- Each Firebase account can map to only one RIDEX profile.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_firebase_uid_unique_idx
ON public.profiles(firebase_uid)
WHERE firebase_uid IS NOT NULL;

-- --------------------------------------------------
-- Remove the Supabase Auth foreign-key dependency
-- --------------------------------------------------

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;