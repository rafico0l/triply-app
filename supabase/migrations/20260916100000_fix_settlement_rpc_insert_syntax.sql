-- ============================================================
-- Corrective 2: Fix INSERT alias syntax + RETURNS TABLE ambiguity
-- ============================================================
-- Fix 1 (20260916080000) incorrectly qualified INSERT target
-- columns with table aliases → error 42703.
-- Fix 2 resolves the original 42702 by ensuring ALL non-INSERT
-- SQL expressions use explicit table aliases, avoiding collision
-- with implicit PL/pgSQL output variables from RETURNS TABLE.

-- ── create_settlement_request ────────────────────────────────

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

  v_trip_id := (SELECT s.trip_id FROM public.settlements s WHERE s.id = p_settlement_id);
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

  SELECT s.from_member_id, s.to_member_id, s.amount_minor INTO v_settlement
  FROM public.settlements s WHERE s.id = p_settlement_id;

  v_is_participant := (
    v_caller_member_id = v_settlement.from_member_id
    OR v_caller_member_id = v_settlement.to_member_id
  );

  v_is_owner := public.is_trip_owner(v_trip_id);

  IF NOT v_is_participant AND NOT v_is_owner THEN
    RAISE EXCEPTION 'Only settlement participants or the trip owner may create a request';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.settlement_requests sr
    WHERE sr.settlement_id = p_settlement_id AND sr.status = 'pending'
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

-- ── respond_to_settlement_request ─────────────────────────────

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

  SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type, sr.requester_id,
         sr.original_amount_minor, sr.proposed_amount_minor, sr.status
  INTO v_request
  FROM public.settlement_requests sr
  WHERE sr.id = p_request_id
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

  SELECT ra.id INTO v_approval_id
  FROM public.settlement_request_approvals ra
  WHERE ra.request_id = p_request_id
    AND ra.approver_id = v_member_id
    AND ra.status = 'pending';

  IF v_approval_id IS NULL THEN
    RAISE EXCEPTION 'No pending approval found for this member on this request';
  END IF;

  UPDATE public.settlement_request_approvals ra
  SET ra.status = v_response, ra.responded_at = now()
  WHERE ra.id = v_approval_id;

  IF v_response = 'rejected' THEN
    UPDATE public.settlement_requests sr
    SET sr.status = 'rejected', sr.resolved_at = now()
    WHERE sr.id = p_request_id AND sr.status = 'pending';

    RETURN QUERY
    SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
           sr.requester_id, sr.original_amount_minor, sr.proposed_amount_minor,
           sr.status::text, sr.created_at, sr.resolved_at
    FROM public.settlement_requests sr
    WHERE sr.id = p_request_id;
    RETURN;
  END IF;

  SELECT count(*) INTO v_remaining
  FROM public.settlement_request_approvals ra
  WHERE ra.request_id = p_request_id AND ra.status = 'pending';

  IF v_remaining > 0 THEN
    RETURN QUERY
    SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
           sr.requester_id, sr.original_amount_minor, sr.proposed_amount_minor,
           sr.status::text, sr.created_at, sr.resolved_at
    FROM public.settlement_requests sr
    WHERE sr.id = p_request_id;
    RETURN;
  END IF;

  IF v_request.settlement_id IS NULL THEN
    RAISE EXCEPTION 'Target settlement no longer exists';
  END IF;

  SELECT s.id, s.trip_id, s.from_member_id, s.to_member_id, s.amount_minor
  INTO v_settlement
  FROM public.settlements s
  WHERE s.id = v_request.settlement_id
  FOR UPDATE;

  IF v_settlement IS NULL THEN
    RAISE EXCEPTION 'Target settlement has been deleted';
  END IF;

  IF v_settlement.trip_id <> v_request.trip_id THEN
    RAISE EXCEPTION 'Settlement trip mismatch';
  END IF;

  IF v_request.request_type = 'edit' THEN
    IF v_request.proposed_amount_minor IS NULL THEN
      RAISE EXCEPTION 'Edit request missing proposed amount';
    END IF;

    UPDATE public.settlements s
    SET s.amount_minor = v_request.proposed_amount_minor
    WHERE s.id = v_request.settlement_id;

  ELSIF v_request.request_type = 'delete' THEN
    DELETE FROM public.settlements s
    USING (SELECT v_request.settlement_id AS sid) AS d
    WHERE s.id = d.sid;
  END IF;

  UPDATE public.settlement_requests sr
  SET sr.status = 'approved', sr.resolved_at = now()
  WHERE sr.id = p_request_id AND sr.status = 'pending';

  RETURN QUERY
  SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
         sr.requester_id, sr.original_amount_minor, sr.proposed_amount_minor,
         sr.status::text, sr.created_at, sr.resolved_at
  FROM public.settlement_requests sr
  WHERE sr.id = p_request_id;
END;
$$;

-- ── cancel_settlement_request ─────────────────────────────────

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

  SELECT sr.id, sr.trip_id, sr.requester_id, sr.status
  INTO v_request
  FROM public.settlement_requests sr
  WHERE sr.id = p_request_id
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

  UPDATE public.settlement_requests sr
  SET sr.status = 'cancelled', sr.resolved_at = now()
  WHERE sr.id = p_request_id AND sr.status = 'pending';

  RETURN QUERY
  SELECT sr.id, sr.trip_id, sr.settlement_id, sr.request_type::text,
         sr.requester_id, sr.status::text, sr.created_at, sr.resolved_at
  FROM public.settlement_requests sr
  WHERE sr.id = p_request_id;
END;
$$;
