-- ============================================================
-- Triply MVP — Leave Trip (Soft Lifecycle)
-- ============================================================
-- Adds membership lifecycle fields, updates RLS helpers to
-- enforce active-only access, updates join RPC for reactivation,
-- and creates the leave_trip RPC with full eligibility checks.

-- ── 1. Schema: membership lifecycle fields ───────────────────

ALTER TABLE public.trip_members
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'left')),
  ADD COLUMN left_at timestamptz;

-- Existing rows default to 'active'. No backfill needed.

-- ── 2. Index: active membership lookup ───────────────────────
-- Used by loadTrips discovery and RLS helper queries.

CREATE INDEX idx_trip_members_status
  ON public.trip_members (trip_id, status)
  WHERE status = 'active';

-- ── 3. RLS helpers: active-membership enforcement ───────────
-- A left member must immediately fail normal trip-member authorization.

CREATE OR REPLACE FUNCTION public.is_trip_member(trip_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = trip_uuid
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_trip_member_id(trip_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.trip_members
  WHERE trip_id = trip_uuid
    AND user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- ── 4. Join invite: reactivate left memberships ─────────────
-- When a user who previously left follows the invite link,
-- reactivate their existing row instead of creating a duplicate.

CREATE OR REPLACE FUNCTION public.join_trip_by_invite(invite_token text)
RETURNS TABLE(trip_id uuid, member_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_trip_id uuid;
  existing_member RECORD;
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

  -- Check for any existing membership (active or left)
  SELECT tm.id, tm.role, tm.status INTO existing_member
  FROM public.trip_members AS tm
  WHERE tm.trip_id = target_trip_id AND tm.user_id = auth.uid()
  LIMIT 1;

  IF existing_member IS NOT NULL THEN
    -- Reactivate if previously left
    IF existing_member.status = 'left' THEN
      UPDATE public.trip_members
      SET status = 'active', left_at = NULL
      WHERE id = existing_member.id;
    END IF;

    trip_id := target_trip_id;
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
  VALUES (target_trip_id, auth.uid(), p_name, 'member');

  SELECT tm.id, tm.trip_id, tm.role INTO member_id, trip_id, role
  FROM public.trip_members AS tm
  WHERE tm.trip_id = target_trip_id AND tm.user_id = auth.uid()
  LIMIT 1;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_trip_by_invite(text) TO authenticated;

-- ── 5. Leave trip RPC ───────────────────────────────────────
-- SECURITY DEFINER: all eligibility checks + state transition
-- happen atomically server-side. Client never sends member_id.
--
-- Balance calculation:
--   paid = SUM(expenses.amount_minor) WHERE paid_by = member_id
--   share = SUM over each expense the member participates in:
--           floor(expense.amount_minor / participant_count)
--           + 1 for first (expense.amount_minor % participant_count) participants
--   settlements_paid = SUM(settlements.amount_minor) WHERE from_member_id = member_id
--   settlements_received = SUM(settlements.amount_minor) WHERE to_member_id = member_id
--   balance = paid - share + settlements_paid - settlements_received
--
-- Remainder distribution matches finance.ts computeExpenseShares():
--   Participants ordered by member_id ASC (lexicographic UUID sort).
--   The first (amount % n) participants each receive 1 extra minor unit.
--   This is deterministic and identical to the frontend algorithm,
--   which sorts splitIds lexicographically before distributing remainder.

CREATE OR REPLACE FUNCTION public.leave_trip(p_trip_id uuid)
RETURNS TABLE (
  member_id   uuid,
  trip_id     uuid,
  left_at     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id     uuid;
  v_balance       bigint;
  v_paid          bigint;
  v_share         bigint;
  v_settle_paid   bigint;
  v_settle_recv   bigint;
  v_expense       RECORD;
  v_n             bigint;
  v_base          bigint;
  v_remainder     bigint;
  v_participant   RECORD;
  v_idx           bigint;
  v_pending_count bigint;
BEGIN
  -- ── Auth check ──────────────────────────────────────────
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ── Resolve caller's active membership ──────────────────
  SELECT tm.id INTO v_member_id
  FROM public.trip_members tm
  WHERE tm.trip_id = p_trip_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  LIMIT 1;

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active membership found for this trip';
  END IF;

  -- ── Owner cannot leave ──────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = p_trip_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Trip owner cannot leave. Transfer ownership or delete the trip.';
  END IF;

  -- ── Pending settlement workflow check ───────────────────
  -- Reject if member is involved in ANY pending settlement request as:
  --   A. requester
  --   B. pending approver
  --   C. settlement participant (from/to)
  SELECT count(*) INTO v_pending_count
  FROM public.settlement_requests sr
  WHERE sr.trip_id = p_trip_id
    AND sr.status = 'pending'
    AND (
      sr.requester_id = v_member_id
      OR EXISTS (
        SELECT 1 FROM public.settlement_request_approvals sra
        WHERE sra.request_id = sr.id
          AND sra.approver_id = v_member_id
          AND sra.status = 'pending'
      )
      OR EXISTS (
        SELECT 1 FROM public.settlements s
        WHERE s.id = sr.settlement_id
          AND (s.from_member_id = v_member_id OR s.to_member_id = v_member_id)
      )
    );

  IF v_pending_count > 0 THEN
    RAISE EXCEPTION 'Cannot leave while involved in pending settlement workflows. Resolve or cancel them first.';
  END IF;

  -- ── Balance calculation (integer minor units) ───────────
  -- Formula: balance = paid - share + settlements_paid - settlements_received

  -- 1. Total paid
  SELECT COALESCE(SUM(e.amount_minor), 0) INTO v_paid
  FROM public.expenses e
  WHERE e.paid_by = v_member_id;

    -- 2. Total share (equal split with deterministic remainder)
    -- Remainder distribution matches finance.ts computeExpenseShares():
    --   participants ordered by member_id ASC (lexicographic UUID sort)
    --   first (amount % n) participants get +1 minor unit each
  v_share := 0;

  FOR v_expense IN
    SELECT e.id AS expense_id, e.amount_minor
    FROM public.expenses e
    WHERE e.trip_id = p_trip_id
      AND EXISTS (
        SELECT 1 FROM public.expense_participants ep
        WHERE ep.expense_id = e.id AND ep.member_id = v_member_id
      )
  LOOP
    -- Count participants for this expense
    SELECT count(*) INTO v_n
    FROM public.expense_participants ep
    WHERE ep.expense_id = v_expense.expense_id;

    IF v_n = 0 THEN
      CONTINUE;
    END IF;

    v_base := v_expense.amount_minor / v_n;
    v_remainder := v_expense.amount_minor % v_n;

    -- Sum shares for this expense across all participants
    -- Remainder distributed to first v_remainder participants by member_id ASC
    v_idx := 0;
    FOR v_participant IN
      SELECT ep.member_id
      FROM public.expense_participants ep
      WHERE ep.expense_id = v_expense.expense_id
      ORDER BY ep.member_id
    LOOP
      IF v_participant.member_id = v_member_id THEN
        v_share := v_share + v_base + (CASE WHEN v_idx < v_remainder THEN 1 ELSE 0 END);
        EXIT;
      END IF;
      v_idx := v_idx + 1;
    END LOOP;
  END LOOP;

  -- 3. Settlements paid (member is from_member)
  SELECT COALESCE(SUM(s.amount_minor), 0) INTO v_settle_paid
  FROM public.settlements s
  WHERE s.from_member_id = v_member_id;

  -- 4. Settlements received (member is to_member)
  SELECT COALESCE(SUM(s.amount_minor), 0) INTO v_settle_recv
  FROM public.settlements s
  WHERE s.to_member_id = v_member_id;

  -- 5. Final balance
  v_balance := v_paid - v_share + v_settle_paid - v_settle_recv;

  IF v_balance <> 0 THEN
    RAISE EXCEPTION 'Cannot leave with outstanding balance of % minor units. Settle all debts first.', v_balance;
  END IF;

  -- ── All checks passed: transition to left ───────────────
  UPDATE public.trip_members
  SET status = 'left', left_at = now()
  WHERE id = v_member_id;

  -- ── Return result ───────────────────────────────────────
  RETURN QUERY
  SELECT tm.id, tm.trip_id, tm.left_at
  FROM public.trip_members tm
  WHERE tm.id = v_member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_trip(uuid) TO authenticated;
