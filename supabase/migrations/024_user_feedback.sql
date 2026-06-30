-- ============================================================
-- User feedback
-- ============================================================
-- Lightweight "Leave feedback" capture from the account menu. Three
-- paths: praise (I like something), problem (something's wrong / outdated
-- / broken), feature (suggest an idea). Stored with the page the user
-- was on for context.
--
-- Writes go through the user-scoped client (RLS insert policy below), so
-- this works without the service-role key. Admins read everything.

create table if not exists user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  kind text not null check (kind in ('praise', 'problem', 'feature')),
  message text not null,
  page_path text,
  status text not null default 'open',   -- 'open' | 'reviewed' | 'resolved'
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_status_idx
  on user_feedback (status, created_at desc);
create index if not exists user_feedback_kind_idx
  on user_feedback (kind, created_at desc);

alter table user_feedback enable row level security;

-- Any signed-in user can submit feedback as themselves.
drop policy if exists "Users can submit their own feedback" on user_feedback;
create policy "Users can submit their own feedback"
  on user_feedback for insert to authenticated
  with check (user_id = auth.uid());

-- Admins can read all feedback (for review).
drop policy if exists "Admins can read feedback" on user_feedback;
create policy "Admins can read feedback"
  on user_feedback for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin
    )
  );
