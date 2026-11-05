# Daymark

A calm, deliberately designed self-improvement workspace. Daymark brings together daily habits, focus sessions, personal priorities, journaling, and progress insights without turning life into a game.

## Stack

- React + Vite
- Supabase Auth and Postgres
- Row Level Security on every user-owned table
- Vercel for hosting and Git-based deployments

## Local setup

1. Install dependencies with \`npm install\`.
2. Copy \`.env.example\` to \`.env.local\`.
3. Add the Supabase project URL and anon/publishable key.
4. Apply \`supabase/migrations/202611050001_initial_schema.sql\` in the Supabase SQL editor or through the Supabase migration workflow.
5. Run \`npm run dev\`.

Without Supabase credentials, the app opens in a clearly labeled local preview with example data. Preview changes are held in memory and are not synced. With credentials configured, users must sign in and their data is stored in their own account.

## Environment variables

- \`VITE_SUPABASE_URL\`
- \`VITE_SUPABASE_ANON_KEY\` (Supabase anon/publishable key only; never use a service-role key in the browser)

## Product areas

- Today: daily momentum, habits, priorities, and focus
- Habits: create and complete recurring habits
- Focus: timer and completed focus sessions
- Journal: daily reflection, mood, and energy
- Insights: completion trends and focus totals
- Settings: account and session controls

## Security

All user-owned tables have RLS enabled. Policies scope reads and writes to \`auth.uid()\`. The browser uses only the Supabase public anon/publishable key. Do not add a service-role key to Vercel's public environment variables.