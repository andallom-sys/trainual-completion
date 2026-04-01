create extension if not exists "pgcrypto";

create table if not exists public.employee_completion_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  employee_id text,
  employee_name text not null,
  employee_email text not null,
  job_title text,
  completion_score numeric(5,2) not null check (completion_score >= 0 and completion_score <= 100),
  trainual_manager_name text,
  roster_manager_name text,
  manager_name text,
  manager_email text,
  employee_status text,
  last_active text,
  groups text[] not null default '{}',
  inserted_at timestamptz not null default now()
);

create index if not exists idx_employee_completion_snapshots_date
  on public.employee_completion_snapshots (snapshot_date desc);

create index if not exists idx_employee_completion_snapshots_email
  on public.employee_completion_snapshots (lower(employee_email));

alter table public.employee_completion_snapshots enable row level security;

drop policy if exists "Public read dashboard snapshots" on public.employee_completion_snapshots;
create policy "Public read dashboard snapshots"
  on public.employee_completion_snapshots
  for select
  using (true);
