-- ============================================================
-- Admin collaboration on reviewer notes + user feedback
-- ============================================================
-- Lets admins work items together: assign an owner, set status
-- (open / in_progress / resolved), upvote, and discuss in a thread.
--
-- Assignment + status live on each source row (admin_edit_comments and
-- user_feedback). Votes and discussion are generic, keyed by
-- (item_type, item_id) where item_type is 'note' or 'feedback'.
--
-- Writes go through the service-role admin server actions (which gate on
-- is_admin); the RLS policies below are admin-read defense-in-depth.

-- ---- assignment on the source rows ----
alter table admin_edit_comments
  add column if not exists assigned_to uuid references profiles(id) on delete set null;
alter table admin_edit_comments
  add column if not exists assigned_name text;

alter table user_feedback
  add column if not exists assigned_to uuid references profiles(id) on delete set null;
alter table user_feedback
  add column if not exists assigned_name text;

-- (status already exists on both tables; the app now uses
--  'open' | 'in_progress' | 'resolved'. Both columns are free text, so no
--  constraint change is needed.)

-- ---- generic upvotes ----
create table if not exists admin_collab_votes (
  item_type text not null check (item_type in ('note', 'feedback')),
  item_id text not null,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_type, item_id, user_id)
);
create index if not exists admin_collab_votes_item_idx
  on admin_collab_votes (item_type, item_id);

-- ---- generic discussion thread ----
create table if not exists admin_collab_comments (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('note', 'feedback')),
  item_id text not null,
  author_id uuid references profiles(id) on delete set null,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_collab_comments_item_idx
  on admin_collab_comments (item_type, item_id, created_at);

alter table admin_collab_votes enable row level security;
alter table admin_collab_comments enable row level security;

drop policy if exists "Admins read collab votes" on admin_collab_votes;
create policy "Admins read collab votes"
  on admin_collab_votes for select to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin));

drop policy if exists "Admins read collab comments" on admin_collab_comments;
create policy "Admins read collab comments"
  on admin_collab_comments for select to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin));
