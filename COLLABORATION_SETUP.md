# ArtFlow Canvas Collaboration Setup

This document explains how to set up the real-time collaboration features for ArtFlow Canvas using Supabase.

## Prerequisites

1. A Supabase account and project
2. Basic knowledge of SQL and Supabase config
3. Access to your project's SQL editor

## Step 1: Create the Database Schema

Run the following SQL in your Supabase SQL editor (or use the migration file in `src/integrations/supabase/migrations/artflow_collaboration_schema.sql`):

```sql
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
```

## Step 2: Fix Permissions

Run the SQL in the permission fix migration file (`src/integrations/supabase/migrations/fix_permissions.sql`):

```sql
-- Make sure the realtime channel broadcast is open
INSERT INTO _realtime.subscription_rules
  (type_id, name, topic, claims, claims_role)
VALUES
  (1, 'Allow anonymous canvas collaboration', 'canvas:*', '{}', 'anon'),
  (1, 'Allow authenticated canvas collaboration', 'canvas:*', '{}', 'authenticated')
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

-- Create RLS policies for all tables with anonymous access
CREATE POLICY "Allow anonymous collaborators presence" 
  ON artflow.collaborators 
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous canvas operations" 
  ON artflow.canvas_operations 
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous canvas sessions" 
  ON artflow.canvas_sessions 
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Step 3: Configure Environment Variables

Create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Or update the values directly in `src/integrations/supabase/config.ts`.

## Step 4: Verify Realtime Settings

In your Supabase dashboard:

1. Go to Database → Replication
2. Ensure that `supabase_realtime` publication exists
3. Verify it contains all three tables: `artflow.canvas_sessions`, `artflow.collaborators`, and `artflow.canvas_operations`

## Troubleshooting

If you encounter permission issues (403 errors):

1. Check that Row Level Security (RLS) policies are correctly set up for all tables
2. Verify that the subscription rules in `_realtime.subscription_rules` include entries for the `canvas:*` topic
3. Make sure your anon key has the correct permissions
4. Check browser console for detailed error messages

Common error: `permission error (code 403)` - This usually means the RLS policies are not correctly set up or the realtime subscription rules are missing.

## Testing Collaboration

1. Open the application in two different browsers or incognito windows
2. Make sure both instances share the same `canvasId` URL parameter
3. You should see each other in the "Active Users" panel
4. Changes made in one window should be visible in the other

## Additional Tips

- Enable debug mode in `src/integrations/supabase/config.ts` to see detailed logs
- If collaboration stops working, try refreshing and checking the connection status indicator
- For production, consider implementing proper user authentication 