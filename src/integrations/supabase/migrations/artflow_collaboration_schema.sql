-- Create the artflow schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS artflow;

-- Define the schema for canvas_sessions table
CREATE TABLE IF NOT EXISTS artflow.canvas_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  created_by TEXT,
  canvas_state JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  max_collaborators INTEGER DEFAULT 20
);

-- Define the schema for collaborators table
CREATE TABLE IF NOT EXISTS artflow.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID REFERENCES artflow.canvas_sessions(id),
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_color TEXT,
  cursor_position JSONB,
  active_tool TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Define the schema for canvas operations table
CREATE TABLE IF NOT EXISTS artflow.canvas_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID REFERENCES artflow.canvas_sessions(id),
  user_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  operation_data JSONB NOT NULL,
  client_timestamp BIGINT,
  server_timestamp TIMESTAMPTZ DEFAULT now()
);

-- Define the schema for templates table
CREATE TABLE IF NOT EXISTS artflow.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  canvas_state JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE artflow.canvas_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artflow.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE artflow.canvas_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE artflow.templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for canvas_sessions
CREATE POLICY "Anyone can view public canvas sessions" 
  ON artflow.canvas_sessions 
  FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Anyone can create canvas sessions" 
  ON artflow.canvas_sessions 
  FOR INSERT 
  USING (true);

CREATE POLICY "Anyone can update canvas sessions" 
  ON artflow.canvas_sessions 
  FOR UPDATE 
  USING (true);

-- Create RLS policies for collaborators
CREATE POLICY "Anyone can view collaborators" 
  ON artflow.collaborators 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create or update collaborators" 
  ON artflow.collaborators 
  FOR ALL
  USING (true);

-- Create RLS policies for canvas operations
CREATE POLICY "Anyone can view canvas operations" 
  ON artflow.canvas_operations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create canvas operations" 
  ON artflow.canvas_operations 
  FOR INSERT 
  USING (true);

-- Create RLS policies for templates
CREATE POLICY "Anyone can view public templates" 
  ON artflow.templates 
  FOR SELECT 
  USING (is_public = true);

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

-- Set up realtime policy for canvas collaboration
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

-- Add some default templates for testing
INSERT INTO artflow.templates (name, description, canvas_state, is_public)
VALUES 
  ('Blank Canvas', 'Start with a clean slate', '{"width": 800, "height": 600, "objects": []}', true),
  ('Basic Shapes', 'A collection of common shapes to get started', '{"width": 800, "height": 600, "objects": [{"type": "rect", "top": 100, "left": 100, "width": 100, "height": 100, "fill": "#f55"}, {"type": "circle", "top": 300, "left": 300, "radius": 50, "fill": "#5f5"}]}', true),
  ('Wireframe Template', 'Start with a basic wireframe layout', '{"width": 800, "height": 600, "objects": [{"type": "rect", "top": 50, "left": 50, "width": 700, "height": 100, "fill": "#eee"}, {"type": "rect", "top": 200, "left": 50, "width": 400, "height": 300, "fill": "#ddd"}, {"type": "rect", "top": 200, "left": 500, "width": 250, "height": 300, "fill": "#ccc"}]}', true)
ON CONFLICT (id) DO NOTHING; 