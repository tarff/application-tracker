-- Supabase's default privileges also grant these. TRUNCATE ignores row level security.
revoke truncate, references, trigger on public.applications from authenticated;
