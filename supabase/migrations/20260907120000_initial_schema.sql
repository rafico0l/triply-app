-- ============================================================
-- Triply MVP — Initial Schema + RLS
-- ============================================================

-- ============================================================
-- 1. TABLES (no dependencies on other app tables)
-- ============================================================

CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trips (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  destination  text,
  start_date   date,
  end_date     date,
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'upcoming', 'completed')),
  budget_minor bigint,
  cover_image  text,
  created_by   uuid NOT NULL REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_date_range
    CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE public.trip_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name       text NOT NULL,
  initials   text,
  color      text,
  role       text NOT NULL DEFAULT 'member'
               CHECK (role IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT owner_requires_user
    CHECK (role <> 'owner' OR user_id IS NOT NULL)
);

CREATE TABLE public.expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by      uuid NOT NULL REFERENCES public.trip_members(id),
  added_by     uuid NOT NULL REFERENCES public.trip_members(id),
  title        text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  category     text NOT NULL DEFAULT 'other',
  date_iso     date NOT NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.expense_participants (
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,

  PRIMARY KEY (expense_id, member_id)
);

CREATE TABLE public.settlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_member_id  uuid NOT NULL REFERENCES public.trip_members(id),
  to_member_id    uuid NOT NULL REFERENCES public.trip_members(id),
  recorded_by     uuid NOT NULL REFERENCES public.trip_members(id),
  amount_minor    bigint NOT NULL CHECK (amount_minor > 0),
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT different_members
    CHECK (from_member_id <> to_member_id)
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_trips_created_by ON public.trips (created_by);

CREATE UNIQUE INDEX unique_trip_user
  ON public.trip_members (trip_id, user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_trip_members_trip_id ON public.trip_members (trip_id);
CREATE INDEX idx_trip_members_user_id ON public.trip_members (user_id);

CREATE INDEX idx_expenses_trip_id  ON public.expenses (trip_id);
CREATE INDEX idx_expenses_paid_by  ON public.expenses (paid_by);
CREATE INDEX idx_expenses_added_by ON public.expenses (added_by);

CREATE INDEX idx_expense_participants_member_id
  ON public.expense_participants (member_id);

CREATE INDEX idx_settlements_trip_id        ON public.settlements (trip_id);
CREATE INDEX idx_settlements_from_member_id ON public.settlements (from_member_id);
CREATE INDEX idx_settlements_to_member_id   ON public.settlements (to_member_id);

-- ============================================================
-- 3. HELPER FUNCTIONS (all tables now exist)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_trip_owner(trip_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = trip_uuid AND created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_trip_member(trip_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = trip_uuid AND user_id = auth.uid()
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
  WHERE trip_id = trip_uuid AND user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- 4. TRIGGERS (functions now exist)
-- ============================================================

CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. ENABLE RLS (tables exist)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES (tables + functions all exist)
-- ============================================================

-- ── profiles ────────────────────────────────────────────────

CREATE POLICY "Profiles: owner read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Profiles: trip-shared read"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members tm1
      JOIN public.trip_members tm2 ON tm1.trip_id = tm2.trip_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = profiles.id
    )
  );

CREATE POLICY "Profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── trips ───────────────────────────────────────────────────

CREATE POLICY "Trips: owner all"
  ON public.trips FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Trips: member read"
  ON public.trips FOR SELECT
  USING (is_trip_member(id));

CREATE POLICY "Trips: authenticated insert"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- ── trip_members ────────────────────────────────────────────

CREATE POLICY "TripMembers: owner all"
  ON public.trip_members FOR ALL
  USING (is_trip_owner(trip_id))
  WITH CHECK (is_trip_owner(trip_id));

CREATE POLICY "TripMembers: member read"
  ON public.trip_members FOR SELECT
  USING (is_trip_member(trip_id));

-- ── expenses ────────────────────────────────────────────────

CREATE POLICY "Expenses: owner all"
  ON public.expenses FOR ALL
  USING (is_trip_owner(trip_id))
  WITH CHECK (is_trip_owner(trip_id));

CREATE POLICY "Expenses: member read"
  ON public.expenses FOR SELECT
  USING (is_trip_member(trip_id));

CREATE POLICY "Expenses: member insert"
  ON public.expenses FOR INSERT
  WITH CHECK (
    is_trip_member(trip_id)
    AND added_by = current_trip_member_id(trip_id)
  );

CREATE POLICY "Expenses: member update own"
  ON public.expenses FOR UPDATE
  USING (
    is_trip_member(trip_id)
    AND added_by = current_trip_member_id(trip_id)
  )
  WITH CHECK (
    is_trip_member(trip_id)
    AND added_by = current_trip_member_id(trip_id)
  );

CREATE POLICY "Expenses: member delete own"
  ON public.expenses FOR DELETE
  USING (
    is_trip_member(trip_id)
    AND added_by = current_trip_member_id(trip_id)
  );

-- ── expense_participants ────────────────────────────────────

CREATE POLICY "ExpenseParticipants: owner all"
  ON public.expense_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_participants.expense_id
        AND is_trip_owner(e.trip_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_participants.expense_id
        AND is_trip_owner(e.trip_id)
    )
  );

CREATE POLICY "ExpenseParticipants: member read"
  ON public.expense_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_participants.expense_id
        AND is_trip_member(e.trip_id)
    )
  );

CREATE POLICY "ExpenseParticipants: member insert own expense"
  ON public.expense_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_participants.expense_id
        AND is_trip_member(e.trip_id)
        AND e.added_by = current_trip_member_id(e.trip_id)
    )
  );

CREATE POLICY "ExpenseParticipants: member delete own expense"
  ON public.expense_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_participants.expense_id
        AND is_trip_member(e.trip_id)
        AND e.added_by = current_trip_member_id(e.trip_id)
    )
  );

-- ── settlements ─────────────────────────────────────────────

CREATE POLICY "Settlements: owner all"
  ON public.settlements FOR ALL
  USING (is_trip_owner(trip_id))
  WITH CHECK (is_trip_owner(trip_id));

CREATE POLICY "Settlements: member read"
  ON public.settlements FOR SELECT
  USING (is_trip_member(trip_id));

CREATE POLICY "Settlements: member insert"
  ON public.settlements FOR INSERT
  WITH CHECK (
    is_trip_member(trip_id)
    AND recorded_by = current_trip_member_id(trip_id)
  );

CREATE POLICY "Settlements: member delete own"
  ON public.settlements FOR DELETE
  USING (
    is_trip_member(trip_id)
    AND recorded_by = current_trip_member_id(trip_id)
  );
