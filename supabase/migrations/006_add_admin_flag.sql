-- ============================================================
-- Admin flag on profiles
-- ============================================================
-- Lets designated users delete community posts that aren't theirs
-- (moderation). Regular users still can't touch others' posts.

alter table profiles
  add column if not exists is_admin boolean not null default false;

-- Bootstrap the original owner as admin. Safe to run multiple times.
update profiles set is_admin = true where email = 'epenmar@asu.edu';

-- Replace the delete RLS policy to allow admins to remove any post.
drop policy if exists "Users can delete own posts" on community_posts;

create policy "Users and admins can delete posts"
  on community_posts for delete to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin
    )
  );
