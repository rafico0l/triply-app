-- ============================================================
-- Fix: set_trip_join_code trigger must be SECURITY DEFINER
-- ============================================================
-- The trigger function calls _generate_join_code() which has
-- EXECUTE revoked from authenticated. A non-SECURITY DEFINER
-- trigger runs as the calling user → permission denied.
--
-- Recreate with SECURITY DEFINER so it executes with the
-- function owner's privileges (postgres/supabase_admin).

CREATE OR REPLACE FUNCTION public.set_trip_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := public._generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;
