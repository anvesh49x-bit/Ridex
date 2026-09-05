-- RIDEX
-- Migration 002
-- Create application profiles linked to Supabase Auth

-- --------------------------------------------------
-- Profiles
-- --------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  full_name TEXT,

  avatar_url TEXT,

  role TEXT NOT NULL DEFAULT 'passenger'
    CHECK (role IN ('passenger', 'rider', 'admin')),

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------
-- Indexes
-- --------------------------------------------------

CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles(role);

CREATE INDEX IF NOT EXISTS profiles_active_idx
  ON public.profiles(is_active);

-- --------------------------------------------------
-- Updated-at function
-- --------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- --------------------------------------------------
-- Updated-at trigger
-- --------------------------------------------------

DROP TRIGGER IF EXISTS profiles_set_updated_at
ON public.profiles;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------
-- Automatically create a RIDEX profile
-- when a Supabase Auth user is created
-- --------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id
  )
  VALUES (
    NEW.id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- --------------------------------------------------
-- Auth user trigger
-- --------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- --------------------------------------------------
-- Row Level Security
-- --------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- A user can view their own profile.
DROP POLICY IF EXISTS "profiles_select_own"
ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- A user can update their own profile.
DROP POLICY IF EXISTS "profiles_update_own"
ON public.profiles;

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);