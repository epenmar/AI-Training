-- ============================================================
-- Let admins edit community posts
-- ============================================================
-- Owners could already update their own posts; this extends the
-- policy so admins can moderate (fix title/description/tags) too.

drop policy if exists "Users can update own posts" on community_posts;

create policy "Users and admins can update posts"
  on community_posts for update to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin
    )
  );
