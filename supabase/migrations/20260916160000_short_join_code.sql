-- ============================================================
-- Triply MVP — Short Join Code
-- ============================================================
-- Adds a human-friendly 6-character join_code to trips.
-- Preserves existing invite_code / join_trip_by_invite behavior.
-- Extracts shared join logic into a private helper.
--
-- Safe to rerun after partial execution:
--   ADD COLUMN IF NOT EXISTS
--   CREATE OR REPLACE FUNCTION
--   DROP TRIGGER IF EXISTS before CREATE TRIGGER
--   CREATE INDEX IF NOT EXISTS
--   Backfill only WHERE join_code IS NULL

-- ── 1. Schema: join_code column ──────────────────────────────

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS join_code text;

-- ── 2. Code generation function ──────────────────────────────
-- Alphabet avoids visually confusing chars: I, O, 0, 1 removed.
-- Uses pgcrypto gen_random_bytes(6) for randomness.
-- 32 chars → each byte mod 32 maps uniformly to the alphabet.

CREATE OR REPLACE FUNCTION public._generate_join_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  rand_bytes bytea;
  i int;
BEGIN
  rand_bytes := gen_random_bytes(6);
  FOR i IN 0..5 LOOP
    code := code || substr(
      alphabet,
      (get_byte(rand_bytes, i) % length(alphabet)) + 1,
      1
    );
  END LOOP;
  RETURN code;
END;
$$;

-- ── 3. Backfill existing trips ────────────────────────────────
-- Only generate codes for rows where join_code IS NULL.
-- Retry loop handles collisions safely.

DO $$
DECLARE
  trip_rec RECORD;
  new_code text;
  attempt int;
BEGIN
  FOR trip_rec IN SELECT id FROM public.trips WHERE join_code IS NULL ORDER BY created_at
  LOOP
    attempt := 0;
    LOOP
      new_code := public._generate_join_code();
      attempt := attempt + 1;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.trips WHERE join_code = new_code
      ) OR attempt > 100;
    END LOOP;
    UPDATE public.trips SET join_code = new_code WHERE id = trip_rec.id;
  END LOOP;
END $$;

-- ── 4. Column constraints ─────────────────────────────────────
-- Backfill complete. Make NOT NULL + unique.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trips'
      AND column_name = 'join_code' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.trips ALTER COLUMN join_code SET NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_join_code
  ON public.trips (join_code);

-- ── 5. Auto-generate join_code for new trips ──────────────────
-- Without this, new trips created by the client (which does not
-- submit join_code) would get NULL → NOT NULL constraint violation.

CREATE OR REPLACE FUNCTION public.set_trip_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := public._generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_trips_join_code ON public.trips;
CREATE TRIGGER set_trips_join_code
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_trip_join_code();

-- ── 6. Restrict internal helper privileges ────────────────────
-- _generate_join_code exists (created in step 2). Revoke access.
-- _join_trip_member does NOT exist yet — its REVOKE is after step 7.

REVOKE EXECUTE ON FUNCTION public._generate_join_code() FROM PUBLIC, anon, authenticated;

-- ── 7. Private join helper ────────────────────────────────────
-- Shared membership join/reactivation logic.
-- Both join_trip_by_invite and join_trip_by_code call this.

CREATE OR REPLACE FUNCTION public._join_trip_member(
  p_trip_id uuid
)
RETURNS TABLE(trip_id uuid, member_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_member RECORD;
  p_name text;
BEGIN
  -- Check for any existing membership (active or left)
  SELECT tm.id, tm.role, tm.status INTO existing_member
  FROM public.trip_members AS tm
  WHERE tm.trip_id = p_trip_id AND tm.user_id = auth.uid()
  LIMIT 1;

  IF existing_member IS NOT NULL THEN
    -- Reactivate if previously left
    IF existing_member.status = 'left' THEN
      UPDATE public.trip_members
      SET status = 'active', left_at = NULL
      WHERE id = existing_member.id;
    END IF;

    trip_id := p_trip_id;
    member_id := existing_member.id;
    role := existing_member.role;
    RETURN NEXT;
    RETURN;
  END IF;

  -- New membership
  SELECT pr.name INTO p_name
  FROM public.profiles AS pr
  WHERE pr.id = auth.uid()
  LIMIT 1;

  IF p_name IS NULL OR p_name = '' THEN
    p_name := 'Member';
  END IF;

  INSERT INTO public.trip_members (trip_id, user_id, name, role)
  VALUES (p_trip_id, auth.uid(), p_name, 'member');

  SELECT tm.id, tm.trip_id, tm.role INTO member_id, trip_id, role
  FROM public.trip_members AS tm
  WHERE tm.trip_id = p_trip_id AND tm.user_id = auth.uid()
  LIMIT 1;

  RETURN NEXT;
END;
$$;

-- Revoke again after CREATE OR REPLACE (re-create resets privileges)
REVOKE EXECUTE ON FUNCTION public._join_trip_member(uuid) FROM PUBLIC, anon, authenticated;

-- ── 8. Refactor join_trip_by_invite to use helper ─────────────
-- Behavior unchanged: invite_code lookup → _join_trip_member.

CREATE OR REPLACE FUNCTION public.join_trip_by_invite(invite_token text)
RETURNS TABLE(trip_id uuid, member_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_trip_id uuid;
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

  RETURN QUERY
  SELECT * FROM public._join_trip_member(target_trip_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_trip_by_invite(text) TO authenticated;

-- ── 9. Join by short code RPC ─────────────────────────────────
-- SECURITY DEFINER: authenticated only, case-insensitive lookup.

CREATE OR REPLACE FUNCTION public.join_trip_by_code(p_join_code text)
RETURNS TABLE(trip_id uuid, member_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_trip_id uuid;
  normalized text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Normalize: trim whitespace, uppercase
  normalized := upper(trim(p_join_code));

  IF length(normalized) <> 6 THEN
    RAISE EXCEPTION 'Join code must be exactly 6 characters';
  END IF;

  SELECT id INTO target_trip_id
  FROM public.trips
  WHERE join_code = normalized
  LIMIT 1;

  IF target_trip_id IS NULL THEN
    RAISE EXCEPTION 'Join code not found';
  END IF;

  RETURN QUERY
  SELECT * FROM public._join_trip_member(target_trip_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_trip_by_code(text) TO authenticated;
