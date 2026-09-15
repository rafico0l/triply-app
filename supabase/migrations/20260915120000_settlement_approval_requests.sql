-- ============================================================
-- Settlement Approval Requests (Phase 2: Atomic Finalization)
-- ============================================================
-- Complete settlement edit/delete approval workflow.
-- Final approval + settlement mutation + request resolution
-- occur in ONE PostgreSQL transaction.

-- ── settlement_requests ─────────────────────────────────────

CREATE TYPE public.settlement_request_type AS ENUM ('edit', 'delete');
CREATE TYPE public.settlement_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE public.settlement_requests (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  settlement_id          uuid REFERENCES public.settlements(id) ON DELETE SET NULL,
  request_type           public.settlement_request_type NOT NULL,
  requester_id           uuid NOT NULL REFERENCES public.trip_members(id),
  original_amount_minor  bigint NOT NULL,
  proposed_amount_minor  bigint,
  status                 public.settlement_request_status NOT NULL DEFAULT 'pending',
  created_at             timestamptz NOT NULL DEFAULT now(),
  resolved_at            timestamptz,

  CONSTRAINT edit_requires_proposed_amount
    CHECK (request_type <> 'edit' OR proposed_amount_minor IS NOT NULL),
  CONSTRAINT proposed_amount_positive
    CHECK (proposed_amount_minor IS NULL OR proposed_amount_minor > 0),
  CONSTRAINT original_amount_positive
    CHECK (original_amount_minor > 0)
);

CREATE INDEX idx_settlement_requests_trip_id       ON public.settlement_requests (trip_id);
CREATE INDEX idx_settlement_requests_settlement_id ON public.settlement_requests (settlement_id);
CREATE INDEX idx_settlement_requests_status        ON public.settlement_requests (status);

-- At most one pending request per settlement (partial unique index)
CREATE UNIQUE INDEX unique_pending_request_per_settlement
  ON public.settlement_requests (settlement_id)
  WHERE status = 'pending';

-- ── settlement_request_approvals ─────────────────────────────

CREATE TYPE public.settlement_approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.settlement_request_approvals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       uuid NOT NULL REFERENCES public.settlement_requests(id) ON DELETE CASCADE,
  approver_id      uuid NOT NULL REFERENCES public.trip_members(id),
  status           public.settlement_approval_status NOT NULL DEFAULT 'pending',
  responded_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_settlement_request_approvals_request_id  ON public.settlement_request_approvals (request_id);
CREATE INDEX idx_settlement_request_approvals_approver_id ON public.settlement_request_approvals (approver_id);

-- One approval row per approver per request
CREATE UNIQUE INDEX unique_approval_per_approver_per_request
  ON public.settlement_request_approvals (request_id, approver_id);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.settlement_requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_request_approvals ENABLE ROW LEVEL SECURITY;

-- settlement_requests: trip members can read
CREATE POLICY "Settlement requests: member read"
  ON public.settlement_requests FOR SELECT
  USING (is_trip_member(trip_id));

-- settlement_requests: owner may delete (for admin cleanup)
CREATE POLICY "Settlement requests: owner delete"
  ON public.settlement_requests FOR DELETE
  USING (is_trip_owner(trip_id));

-- settlement_requests: insert via RPC only (no direct client insert)
CREATE POLICY "Settlement requests: insert via RPC only"
  ON public.settlement_requests FOR INSERT
  WITH CHECK (false);

-- settlement_requests: no direct UPDATE — all status changes via RPC
-- (respond_to_settlement_request, cancel_settlement_request)
-- SECURITY DEFINER RPCs bypass RLS for trusted mutations.

-- settlement_request_approvals: trip members can read
CREATE POLICY "Settlement request approvals: member read"
  ON public.settlement_request_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.settlement_requests sr
      WHERE sr.id = request_id AND is_trip_member(sr.trip_id)
    )
  );

-- settlement_request_approvals: insert via RPC only
CREATE POLICY "Settlement request approvals: insert via RPC only"
  ON public.settlement_request_approvals FOR INSERT
  WITH CHECK (false);

-- settlement_request_approvals: no direct UPDATE — all responses via RPC
-- SECURITY DEFINER RPCs bypass RLS for trusted mutations.

-- ── RPC: create_settlement_request ───────────────────────────
-- Creates request + required approval rows atomically.
-- Snapshots original_amount_minor from target settlement.
-- Client does NOT decide who must approve.

CREATE OR REPLACE FUNCTION public.create_settlement_request(
  p_settlement_id uuid,
  p_request_type  text,
  p_proposed_amount_minor bigint DEFAULT NULL
)
RETURNS TABLE (
  id                     uuid,
  trip_id                uuid,
  settlement_id          uuid,
  request_type           text,
  requester_id           uuid,
  original_amount_minor  bigint,
  proposed_amount_minor  bigint,
  status                 text,
  created_at             timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_member_id uuid;
  v_settlement       RECORD;
  v_trip_id          uuid;
  v_is_participant   boolean;
  v_is_owner         boolean;
  v_other_member_id  uuid;
  v_request_id       uuid;
  v_request_type     public.settlement_request_type;
  v_approver_ids     uuid[];
  v_approver_id      uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_trip_id := (SELECT trip_id FROM public.settlements WHERE id = p_settlement_id);
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Settlement not found';
  END IF;

  v_caller_member_id := public.current_trip_member_id(v_trip_id);
  IF v_caller_member_id IS NULL THEN
    RAISE EXCEPTION 'Not a member of this trip';
  END IF;

  IF p_request_type NOT IN ('edit', 'delete') THEN
    RAISE EXCEPTION 'Invalid request type: %', p_request_type;
  END IF;

  v_request_type := p_request_type::public.settlement_request_type;

  SELECT from_member_id, to_member_id, amount_minor INTO v_settlement
  FROM public.settlements WHERE id = p_settlement_id;

  v_is_participant := (
    v_caller_member_id = v_settlement.from_member_id
    OR v_caller_member_id = v_settlement.to_member_id
  );

  v_is_owner := public.is_trip_owner(v_trip_id);

  IF NOT v_is_participant AND NOT v_is_owner THEN
    RAISE EXCEPTION 'Only settlement participants or the trip owner may create a request';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.settlement_requests
    WHERE settlement_id = p_settlement_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending request already exists for this settlement';
  END IF;

  INSERT INTO public.settlement_requests (
    trip_id, settlement_id, request_type, requester_id,
    original_amount_minor, proposed_amount_minor
  )
  VALUES (
    v_trip_id, p_settlement_id, v_request_type, v_caller_member_id,
    v_settlement.amount_minor, p_proposed_amount_minor
  )
  RETURNING id INTO v_request_id;

  IF v_is_participant THEN
    v_other_member_id := CASE
      WHEN v_caller_member_id = v_settlement.from_member_id THEN v_settlement.to_member_id
      ELSE v_settlement.from_member_id
    END;
    v_approver_ids := ARRAY[v_other_member_id];
  ELSE
    v_approver_ids := ARRAY[v_settlement.from_member_id, v_settlement.to_member_id];
  END IF;

  FOREACH v_approver_id IN ARRAY v_approver_ids LOOP
    INSERT INTO public.settlement_request_approvals (request_id, approver_id)
    VALUES (v_request_id, v_approver_id);
  END LOOP;

  RETURN QUERY
  SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
         sr.requester_id, sr.original_amount_minor, sr.proposed_amount_minor,
         sr.status::text, sr.created_at
  FROM public.settlement_requests sr
  WHERE sr.id = v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_settlement_request(uuid, text, bigint) TO authenticated;

-- ── RPC: respond_to_settlement_request ───────────────────────
-- SINGLE AUTHORITATIVE FINALIZATION PATH.
-- Records approval/rejection, applies settlement mutation on
-- final approval, all within ONE transaction.

CREATE OR REPLACE FUNCTION public.respond_to_settlement_request(
  p_request_id uuid,
  p_response   text
)
RETURNS TABLE (
  id              uuid,
  trip_id         uuid,
  settlement_id   uuid,
  request_type    text,
  requester_id    uuid,
  original_amount_minor  bigint,
  proposed_amount_minor  bigint,
  status          text,
  created_at      timestamptz,
  resolved_at     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request          RECORD;
  v_member_id        uuid;
  v_approval_id      uuid;
  v_response         public.settlement_approval_status;
  v_remaining        bigint;
  v_settlement       RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock and read the request
  SELECT id, trip_id, settlement_id, request_type, requester_id,
         original_amount_minor, proposed_amount_minor, status
  INTO v_request
  FROM public.settlement_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending (current status: %)', v_request.status;
  END IF;

  v_member_id := public.current_trip_member_id(v_request.trip_id);
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Not a member of this trip';
  END IF;

  IF p_response NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid response: %', p_response;
  END IF;

  v_response := p_response::public.settlement_approval_status;

  -- Find caller's pending approval
  SELECT id INTO v_approval_id
  FROM public.settlement_request_approvals
  WHERE request_id = p_request_id
    AND approver_id = v_member_id
    AND status = 'pending';

  IF v_approval_id IS NULL THEN
    RAISE EXCEPTION 'No pending approval found for this member on this request';
  END IF;

  -- Record the response
  UPDATE public.settlement_request_approvals
  SET status = v_response, responded_at = now()
  WHERE id = v_approval_id;

  -- ── REJECTION ────────────────────────────────────────────
  IF v_response = 'rejected' THEN
    UPDATE public.settlement_requests
    SET status = 'rejected', resolved_at = now()
    WHERE id = p_request_id AND status = 'pending';

    RETURN QUERY
    SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
           sr.requester_id, sr.original_amount_minor, sr.proposed_amount_minor,
           sr.status::text, sr.created_at, sr.resolved_at
    FROM public.settlement_requests sr
    WHERE sr.id = p_request_id;
    RETURN;
  END IF;

  -- ── APPROVAL: check remaining pending ────────────────────
  SELECT count(*) INTO v_remaining
  FROM public.settlement_request_approvals
  WHERE request_id = p_request_id AND status = 'pending';

  -- Approvals remain → request stays pending
  IF v_remaining > 0 THEN
    RETURN QUERY
    SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
           sr.requester_id, sr.original_amount_minor, sr.proposed_amount_minor,
           sr.status::text, sr.created_at, sr.resolved_at
    FROM public.settlement_requests sr
    WHERE sr.id = p_request_id;
    RETURN;
  END IF;

  -- ── FINAL APPROVAL: apply settlement mutation ────────────

  IF v_request.settlement_id IS NULL THEN
    RAISE EXCEPTION 'Target settlement no longer exists';
  END IF;

  -- Lock and verify the settlement
  SELECT id, trip_id, from_member_id, to_member_id, amount_minor
  INTO v_settlement
  FROM public.settlements
  WHERE id = v_request.settlement_id
  FOR UPDATE;

  IF v_settlement IS NULL THEN
    RAISE EXCEPTION 'Target settlement has been deleted';
  END IF;

  IF v_settlement.trip_id <> v_request.trip_id THEN
    RAISE EXCEPTION 'Settlement trip mismatch';
  END IF;

  -- ── EDIT: update amount ─────────────────────────────────
  IF v_request.request_type = 'edit' THEN
    IF v_request.proposed_amount_minor IS NULL THEN
      RAISE EXCEPTION 'Edit request missing proposed amount';
    END IF;

    UPDATE public.settlements
    SET amount_minor = v_request.proposed_amount_minor
    WHERE id = v_request.settlement_id;

  -- ── DELETE: remove settlement ────────────────────────────
  ELSIF v_request.request_type = 'delete' THEN
    DELETE FROM public.settlements
    WHERE id = v_request.settlement_id;
    -- settlement_id on request becomes NULL via ON DELETE SET NULL
  END IF;

  -- Mark request approved
  UPDATE public.settlement_requests
  SET status = 'approved', resolved_at = now()
  WHERE id = p_request_id AND status = 'pending';

  RETURN QUERY
  SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
         sr.requester_id, sr.original_amount_minor, sr.proposed_amount_minor,
         sr.status::text, sr.created_at, sr.resolved_at
  FROM public.settlement_requests sr
  WHERE sr.id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_settlement_request(uuid, text) TO authenticated;

-- ── RPC: cancel_settlement_request ───────────────────────────
-- Requester cancels their own pending request.

CREATE OR REPLACE FUNCTION public.cancel_settlement_request(
  p_request_id uuid
)
RETURNS TABLE (
  id              uuid,
  trip_id         uuid,
  settlement_id   uuid,
  request_type    text,
  requester_id    uuid,
  status          text,
  created_at      timestamptz,
  resolved_at     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request   RECORD;
  v_member_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, trip_id, requester_id, status
  INTO v_request
  FROM public.settlement_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending (current status: %)', v_request.status;
  END IF;

  v_member_id := public.current_trip_member_id(v_request.trip_id);
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Not a member of this trip';
  END IF;

  IF v_request.requester_id <> v_member_id THEN
    RAISE EXCEPTION 'Only the requester may cancel this request';
  END IF;

  UPDATE public.settlement_requests
  SET status = 'cancelled', resolved_at = now()
  WHERE id = p_request_id AND status = 'pending';

  RETURN QUERY
  SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
         sr.requester_id, sr.status::text, sr.created_at, sr.resolved_at
  FROM public.settlement_requests sr
  WHERE sr.id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_settlement_request(uuid) TO authenticated;
