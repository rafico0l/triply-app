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
  p_name text;
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

  SELECT tm.id, tm.role INTO existing_member_id, existing_role
  FROM public.trip_members AS tm
  WHERE tm.trip_id = target_trip_id AND tm.user_id = auth.uid()
  LIMIT 1;

  IF existing_member_id IS NOT NULL THEN
    trip_id := target_trip_id;
    member_id := existing_member_id;
    role := existing_role;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT pr.name INTO p_name
  FROM public.profiles AS pr
  WHERE pr.id = auth.uid()
  LIMIT 1;

  IF p_name IS NULL OR p_name = '' THEN
    p_name := 'Member';
  END IF;

  INSERT INTO public.trip_members (trip_id, user_id, name, role)
  VALUES (target_trip_id, auth.uid(), p_name, 'member');

  SELECT tm.id, tm.trip_id, tm.role INTO member_id, trip_id, role
  FROM public.trip_members AS tm
  WHERE tm.trip_id = target_trip_id AND tm.user_id = auth.uid()
  LIMIT 1;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_trip_by_invite(text) TO authenticated;
