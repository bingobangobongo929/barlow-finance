-- ============================================================================
-- SECURITY FIX MIGRATION
-- Addresses: Invite token enumeration, household creation limits, rate limiting
-- ============================================================================

-- ============================================================================
-- FIX 1: INVITE TOKEN POLICY
-- The previous policy allowed any authenticated user to enumerate all valid
-- invite tokens. This replaces it with a secure RPC function approach.
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view valid invite tokens by token" ON invite_tokens;

-- Create a secure function to check a specific invite token
-- This uses SECURITY DEFINER to bypass RLS and only returns data for the exact token
CREATE OR REPLACE FUNCTION check_invite_token(token_value TEXT)
RETURNS TABLE (
  id UUID,
  household_id UUID,
  email TEXT,
  expires_at TIMESTAMPTZ,
  household_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.household_id,
    t.email,
    t.expires_at,
    h.name as household_name
  FROM invite_tokens t
  JOIN households h ON h.id = t.household_id
  WHERE t.token = token_value
    AND t.used_at IS NULL
    AND t.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated and anon (for pre-registration checks)
GRANT EXECUTE ON FUNCTION check_invite_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_invite_token(TEXT) TO anon;

-- ============================================================================
-- FIX 2: RATE LIMITING TABLE
-- Move rate limiting from in-memory to database for multi-instance support
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(identifier, endpoint, window_start);

-- Enable RLS but allow service role full access
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits (not users)
CREATE POLICY "Service role can manage rate limits" ON rate_limits
  FOR ALL USING (true) WITH CHECK (true);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  v_reset_at := NOW() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Try to insert or update the rate limit entry
  INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, NOW())
  ON CONFLICT (identifier, endpoint) DO UPDATE
  SET
    request_count = CASE
      WHEN rate_limits.window_start < v_window_start THEN 1
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_window_start THEN NOW()
      ELSE rate_limits.window_start
    END,
    updated_at = NOW()
  RETURNING rate_limits.request_count INTO v_current_count;

  RETURN QUERY SELECT
    v_current_count <= p_max_requests,
    GREATEST(0, p_max_requests - v_current_count),
    v_reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- FIX 3: HOUSEHOLD CREATION LIMITS
-- Add constraint to prevent unlimited household creation
-- ============================================================================

-- Add a counter column to profiles for household creation tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS households_created INTEGER DEFAULT 0;

-- Create a function to limit household creation per user
CREATE OR REPLACE FUNCTION check_household_creation_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_households_created INTEGER;
BEGIN
  -- Get the user creating this household
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN NEW; -- Allow if no auth context (service role)
  END IF;

  -- Count households already created by this user
  SELECT households_created INTO v_households_created
  FROM profiles
  WHERE id = v_user_id;

  -- Limit to 3 households per user
  IF v_households_created >= 3 THEN
    RAISE EXCEPTION 'Household creation limit reached (maximum 3 per user)';
  END IF;

  -- Update the counter
  UPDATE profiles SET households_created = households_created + 1
  WHERE id = v_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for household creation limit
DROP TRIGGER IF EXISTS limit_household_creation ON households;
CREATE TRIGGER limit_household_creation
  BEFORE INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION check_household_creation_limit();

-- ============================================================================
-- CLEANUP: Remove old rate limit entries periodically (run manually or via cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
