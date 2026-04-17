-- ============================================================
-- Per-post anonymity (supersedes global show_in_community)
-- ============================================================
-- Migration 009 added a global "show_in_community" toggle on profiles,
-- but that control lives on /account — too far from the act of posting
-- for users to find reliably. Anonymity now lives on the post itself.
--
-- This migration is self-contained: idempotent whether or not 009 was
-- previously applied.
--
-- Changes:
--   1. community_posts.anonymous — per-post flag, default false
--   2. profiles.public_contact — optional contact string (idempotent add)
--   3. profiles SELECT is loosened to all authenticated users since
--      anonymity is now enforced post-side (the old opt-in policy would
--      suppress names even when a user chose "show name" on a post)
--
-- The profiles.show_in_community column, if present from 009, is left
-- in place but unused by the app.

alter table community_posts
  add column if not exists anonymous boolean not null default false;

alter table profiles
  add column if not exists public_contact text;

drop policy if exists "Authenticated users can read opted-in profiles" on profiles;
drop policy if exists "Authenticated users can read profiles" on profiles;

create policy "Authenticated users can read profiles"
  on profiles for select to authenticated
  using (true);
