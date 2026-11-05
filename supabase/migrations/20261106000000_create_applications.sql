create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (company ~ '\S'),
  role text not null check (role ~ '\S'),
  job_url text check (job_url ~* '^https?://'),
  date_applied date,
  status text not null default 'applied'
    check (status in ('applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_date_applied_idx
  on public.applications (user_id, date_applied desc nulls last);

-- The database owns both timestamps, whatever a client sends.
create function public.set_application_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger applications_set_timestamps
  before insert or update on public.applications
  for each row execute function public.set_application_timestamps();

revoke all on function public.set_application_timestamps() from public, anon, authenticated;

alter table public.applications enable row level security;

create policy "Users can view their own applications"
  on public.applications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own applications"
  on public.applications for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- The with check clause stops a row being moved to a different user_id.
create policy "Users can update their own applications"
  on public.applications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own applications"
  on public.applications for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.applications from anon;
grant select, insert, update, delete on public.applications to authenticated;
