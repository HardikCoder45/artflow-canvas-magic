# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/35d6e1f1-1a1d-4d1f-906b-c8f8561f1a1e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/35d6e1f1-1a1d-4d1f-906b-c8f8561f1a1e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/35d6e1f1-1a1d-4d1f-906b-c8f8561f1a1e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# ArtFlow Canvas Magic

A collaborative canvas drawing application with real-time editing capabilities.

## Features

- Real-time collaborative editing
- Persistent user sessions
- Robust error handling and reconnection logic
- Share canvas links with others to collaborate
- Multiple drawing tools and effects

## Setup Instructions

### Supabase Configuration

This application uses Supabase for real-time collaboration features. To set up Supabase:

1. Create a Supabase account at https://supabase.io
2. Create a new project
3. Get your project URL and anon/public key from the API settings page
4. Add the following SQL in the SQL Editor to create required tables and policies:

```sql
-- Create the canvas_sessions table
CREATE TABLE IF NOT EXISTS canvas_sessions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  name TEXT,
  canvas_state JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  max_participants INTEGER DEFAULT 10
);

-- Enable Row Level Security
ALTER TABLE canvas_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for canvas_sessions
CREATE POLICY "Anyone can view active sessions" 
  ON canvas_sessions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create sessions" 
  ON canvas_sessions 
  FOR INSERT 
  USING (true);

CREATE POLICY "Anyone can update sessions" 
  ON canvas_sessions 
  FOR UPDATE 
  USING (true);

-- Enable Realtime for the canvas_sessions table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE canvas_sessions;

-- Add Realtime subscription rules for collaboration channels
INSERT INTO _realtime.subscription_rules
  (type_id, name, topic, claims, claims_role)
VALUES
  (1, 'Allow anonymous canvas collaboration', 'canvas:*', '{}', 'anon'),
  (1, 'Allow authenticated canvas collaboration', 'canvas:*', '{}', 'authenticated'),
  (1, 'Allow system channel for anonymous', 'system', '{}', 'anon'),
  (1, 'Allow system channel for authenticated', 'system', '{}', 'authenticated');
```

5. Update the `src/integrations/supabase/client.ts` file with your Supabase URL and key

### Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Collaboration Usage

1. Create a new canvas or open an existing one
2. The URL will contain a unique canvas ID
3. Share this URL with others to collaborate in real-time
4. Connected users will see a collaborator count in the bottom-right corner
5. Changes are broadcast to all connected users in real-time

## Troubleshooting

If you encounter issues with collaboration:

1. Check the browser console for error messages
2. Make sure your Supabase project has realtime enabled in the project settings
3. Verify that the realtime policies have been applied correctly
4. Try refreshing the page or clicking the connection indicator to force reconnection

## License

MIT
