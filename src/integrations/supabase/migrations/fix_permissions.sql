-- Fix permissions for Supabase realtime collaboration
-- This migration adds policies to allow anonymous access to realtime channels
-- and ensures that the realtime publication includes required tables

-- Make sure the realtime channel broadcast is open
INSERT INTO _realtime.subscription_rules
  (type_id, name, topic, claims, claims_role)
VALUES
  (1, 'Allow anonymous canvas collaboration', 'canvas:*', '{}', 'anon'),
  (1, 'Allow authenticated canvas collaboration', 'canvas:*', '{}', 'authenticated')
ON CONFLICT DO NOTHING;

-- Add system channel access for error monitoring
INSERT INTO _realtime.subscription_rules
  (type_id, name, topic, claims, claims_role)
VALUES
  (1, 'Allow system channel for anonymous', 'system', '{}', 'anon'),
  (1, 'Allow system channel for authenticated', 'system', '{}', 'authenticated')
ON CONFLICT DO NOTHING;

-- Set up realtime for collaboration
BEGIN;
  -- Drop existing publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create a new publication for realtime
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE artflow.canvas_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE artflow.collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE artflow.canvas_operations;

-- Create RLS policies for collaborators table to explicitly allow anonymous updates
DROP POLICY IF EXISTS "Allow anonymous collaborators presence" ON artflow.collaborators;
CREATE POLICY "Allow anonymous collaborators presence" 
  ON artflow.collaborators 
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for canvas operations to explicitly allow anonymous presence
DROP POLICY IF EXISTS "Allow anonymous canvas operations" ON artflow.canvas_operations;
CREATE POLICY "Allow anonymous canvas operations" 
  ON artflow.canvas_operations 
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for canvas_sessions to explicitly allow anonymous presence
DROP POLICY IF EXISTS "Allow anonymous canvas sessions" ON artflow.canvas_sessions;
CREATE POLICY "Allow anonymous canvas sessions" 
  ON artflow.canvas_sessions 
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Set up custom claims handler for realtime connections
CREATE OR REPLACE FUNCTION artflow.handle_auth_claims() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow all realtime connections
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_claims_check ON auth.users;
CREATE TRIGGER on_auth_claims_check
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION artflow.handle_auth_claims(); 