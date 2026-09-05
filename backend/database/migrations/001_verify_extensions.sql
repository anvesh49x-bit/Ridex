-- RIDEX
-- Migration 001
-- Verify required PostgreSQL extensions

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'postgis'
  ) THEN
    RAISE EXCEPTION
      'PostGIS extension is not enabled. Enable PostGIS in Supabase first.';
  END IF;
END
$$;