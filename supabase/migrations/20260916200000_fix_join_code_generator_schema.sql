-- ============================================================
-- Fix: Explicitly qualify gen_random_bytes in _generate_join_code
-- ============================================================
-- pgcrypto IS installed, but in the `extensions` schema.
-- _generate_join_code() has SET search_path = public, so
-- gen_random_bytes(6) fails to resolve (error 42883).
--
-- Fix: call extensions.gen_random_bytes(6) explicitly.
-- No other changes to the generator algorithm.

CREATE OR REPLACE FUNCTION public._generate_join_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  rand_bytes bytea;
  i int;
BEGIN
  rand_bytes := extensions.gen_random_bytes(6);
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
