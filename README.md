# NAO Medical Trainual Dashboard

Executive dashboard for Trainual completion performance across NAO Medical employees and managers.

## What is included

- A branded Next.js dashboard for executive, manager, and employee-level visibility
- Supabase table schema for storing completion snapshots
- PowerShell import script that joins the Trainual export with the employee roster export
- Vercel-ready app structure with a local fallback dataset

## Local setup

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase URL and anon key.
4. Run `powershell -ExecutionPolicy Bypass -File .\scripts\build-trainual-seed.ps1`.
5. Run `npm run dev`.

## Supabase setup

1. Create a new Supabase project.
2. Run [`supabase/schema.sql`](C:\Users\Margen\OneDrive\Documents\TRAINUAL\supabase\schema.sql) in the SQL editor.
3. Run the generated `supabase/seed.sql` in the SQL editor whenever you want to refresh the dashboard snapshot.

## GitHub and Vercel

1. Create a new GitHub repository and push this workspace.
2. Import the repository into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
4. Redeploy after each Supabase data refresh or app change.

## Notes

- The page falls back to [`lib/demo-snapshot.ts`](C:\Users\Margen\OneDrive\Documents\TRAINUAL\lib\demo-snapshot.ts) if Supabase is not configured.
- If this should stay internal-only, add Vercel Authentication or put the app behind your SSO before sharing the public link.
