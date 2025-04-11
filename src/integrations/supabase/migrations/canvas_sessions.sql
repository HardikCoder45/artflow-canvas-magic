-- Define the schema for canvas_sessions table
CREATE TABLE IF NOT EXISTS canvas_sessions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL,
  name TEXT,
  canvas_state JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  max_participants INTEGER DEFAULT 10
);

-- Create RLS policies for canvas_sessions
ALTER TABLE canvas_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active sessions
CREATE POLICY "Anyone can view active sessions" 
  ON canvas_sessions 
  FOR SELECT 
  USING (is_active = true);

-- Allow authenticated users to create sessions
CREATE POLICY "Authenticated users can create sessions" 
  ON canvas_sessions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Allow creators to update their own sessions
CREATE POLICY "Creators can update their sessions" 
  ON canvas_sessions 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Create a realtime subscription for canvas_sessions
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add the canvas_sessions table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_sessions; 