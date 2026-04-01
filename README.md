# NAO Medical Trainual Dashboard

Executive dashboard for Trainual completion performance across NAO Medical employees and managers.

## What is included

- A branded Next.js dashboard for executive, manager, and employee-level visibility
- Embedded snapshot data for simple static deployment
- Supabase table schema for storing completion snapshots later if needed
- PowerShell import script that joins the Trainual export with the employee roster export
- Vercel-ready app structure with a local fallback dataset

## Local setup

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Run `powershell -ExecutionPolicy Bypass -File .\scripts\build-trainual-seed.ps1`.
4. Run `npm run dev`.

## Supabase setup

1. Create a new Supabase project.
2. Run [`supabase/schema.sql`](C:\Users\Margen\OneDrive\Documents\TRAINUAL\supabase\schema.sql) in the SQL editor.
3. Run the generated `supabase/seed.sql` in the SQL editor whenever you want to refresh the dashboard snapshot.

## GitHub and Vercel

1. Create a new GitHub repository and push this workspace.
2. Import the repository into Vercel.
3. Deploy without extra runtime environment variables.
4. Redeploy after each app or data refresh.

## Cloudflare Workers

This project is also configured for Cloudflare Workers using OpenNext.

1. Run `npm install`.
2. Create two R2 buckets in Cloudflare:
   - `nao-trainual-dashboard`
   - `nao-trainual-dashboard-preview`
3. Set `UPLOAD_ADMIN_PASSWORD` in `.dev.vars` for local preview.
4. Add the same `UPLOAD_ADMIN_PASSWORD` in your Cloudflare Worker settings.
5. Log in to Cloudflare with `npx wrangler login`.
6. Preview locally with `npm run preview`.
7. Deploy to Workers with `npm run deploy:cf`.

## Shared live updates

The live dashboard can now accept a new Trainual CSV and refresh the shared site for everyone.

- `GET /api/shared-snapshot` reads the latest shared snapshot from R2
- `POST /api/upload-report` processes the uploaded Trainual CSV and writes the newest shared snapshot to R2
- uploads require the `UPLOAD_ADMIN_PASSWORD` value

### Local preview variables

```env
NEXTJS_ENV=development
UPLOAD_ADMIN_PASSWORD=your_admin_password
```

Cloudflare's official docs say Next.js runs on Workers via the OpenNext adapter, and Workers Free currently includes `100,000` requests per day with `10 ms` CPU time per invocation. Static asset requests are free and unlimited when they do not invoke Functions.

## Notes

- The app now runs directly from [`lib/demo-snapshot.ts`](C:\Users\Margen\OneDrive\Documents\TRAINUAL\lib\demo-snapshot.ts) for simpler free hosting.
- Supabase files remain in the repo if you want to reconnect a hosted data source later.
- If this should stay internal-only, add Vercel Authentication or put the app behind your SSO before sharing the public link.
