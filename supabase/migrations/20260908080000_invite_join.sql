-- ============================================================
-- Triply MVP — Invite / Join
-- ============================================================

-- 1. Add invite_code to trips
ALTER TABLE public.trips
  ADD COLUMN invite_code text NOT NULL DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_invite_code
  ON public.trips (invite_code);

-- 2. Join RPC
CREATE OR REPLACE FUNCTION public.join_trip_by_invite(invite_token text)
RETURNS TABLE(trip_id uuid, member_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_trip_id uuid;
  existing_member_id uuid;
  existing_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target_trip_id
  FROM public.trips
  WHERE invite_code = invite_token
  LIMIT 1;

  IF target_trip_id IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  SELECT id, role INTO existing_member_id, existing_role
  FROM public.trip_members
  WHERE trip_id = target_trip_id AND user_id = auth.uid()
  LIMIT 1;

  IF existing_member_id IS NOT NULL THEN
    trip_id := target_trip_id;
    member_id := existing_member_id;
    role := existing_role;
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO public.trip_members (trip_id, user_id, role)
  VALUES (target_trip_id, auth.uid(), 'member')
  RETURNING id, trip_id, role
  INTO member_id, trip_id, role;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_trip_by_invite(text) TO authenticated;
