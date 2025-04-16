-- Enable realtime for all users (including anonymous)
BEGIN;
  -- Drop existing publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create a new publication for realtime
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_sessions;

-- Set up realtime policy for canvas collaboration
-- This is required for Supabase's realtime feature to work properly with anonymous users
INSERT INTO _realtime.subscription_rules
  (type_id, name, topic, claims, claims_role)
VALUES
  (1, 'Allow anonymous canvas collaboration', 'canvas:*', '{}', 'anon'),
  (1, 'Allow authenticated canvas collaboration', 'canvas:*', '{}', 'authenticated');

-- Add system channel access for error monitoring
INSERT INTO _realtime.subscription_rules
  (type_id, name, topic, claims, claims_role)
VALUES
  (1, 'Allow system channel for anonymous', 'system', '{}', 'anon'),
  (1, 'Allow system channel for authenticated', 'system', '{}', 'authenticated');

-- Make sure RLS is enabled for canvas sessions
ALTER TABLE canvas_sessions ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to be more permissive for collaboration
DROP POLICY IF EXISTS "Anyone can view active sessions" ON canvas_sessions;
CREATE POLICY "Anyone can view active sessions" 
  ON canvas_sessions 
  FOR SELECT 
  USING (true);  -- Allow all sessions to be viewed

-- Allow anonymous to create sessions too
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON canvas_sessions;
CREATE POLICY "Anyone can create sessions" 
  ON canvas_sessions 
  FOR INSERT 
  USING (true);

-- Make updates more permissive
DROP POLICY IF EXISTS "Creators can update their sessions" ON canvas_sessions;
CREATE POLICY "Anyone can update sessions" 
  ON canvas_sessions 
  FOR UPDATE 
  USING (true); 