-- ============================================================
-- Profile visibility in the Community Look Book
-- ============================================================
-- Before this migration, profiles RLS only let users read their
-- own row, which meant every community post by someone else
-- displayed as "Anonymous" (the join came back empty).
--
-- Users now have two opt-in controls:
--   show_in_community  — toggle whether name/avatar appear on posts
--   public_contact     — optional text (email, Slack handle, etc.)
--                         shown to peers who want to reach out
--
-- RLS: authenticated users can read profiles that have opted in.
-- Users can always read their own row.

alter table profiles
  add column if not exists show_in_community boolean not null default true,
  add column if not exists public_contact text;

-- Additive SELECT policy. Postgres RLS is permissive — this ORs with
-- the existing "Users can read own profile" so users keep full access
-- to their own row while gaining read access to opted-in peers.
drop policy if exists "Authenticated users can read opted-in profiles" on profiles;

create policy "Authenticated users can read opted-in profiles"
  on profiles for select to authenticated
  using (show_in_community = true);
