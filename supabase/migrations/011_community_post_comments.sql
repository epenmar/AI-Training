-- ============================================================
-- Community post comments
-- ============================================================
-- Threaded one level deep: a top-level comment has parent_comment_id
-- NULL; a reply points to a top-level comment. The app does not allow
-- replies-to-replies; a CHECK constraint enforces that by requiring
-- any referenced parent to itself be a top-level comment (enforced in
-- a BEFORE-INSERT trigger so we can reference another row's column).
--
-- Anonymity is per-comment, mirroring community_posts.anonymous. The
-- author's user_id is always stored for admin traceability via the
-- Supabase dashboard (which bypasses RLS); the app hides it when
-- anonymous = true.

create table community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  parent_comment_id uuid references community_post_comments(id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_comments_post on community_post_comments(post_id, created_at);
create index idx_comments_parent on community_post_comments(parent_comment_id);

-- Enforce one level of nesting: a reply's parent must itself be top-level.
create or replace function public.enforce_one_level_comment_nesting()
returns trigger
language plpgsql
as $$
declare
  grandparent uuid;
begin
  if new.parent_comment_id is null then
    return new;
  end if;
  select parent_comment_id into grandparent
    from community_post_comments
    where id = new.parent_comment_id;
  if grandparent is not null then
    raise exception 'comments can only nest one level deep';
  end if;
  return new;
end;
$$;

create trigger enforce_one_level_comment_nesting
  before insert or update on community_post_comments
  for each row execute function public.enforce_one_level_comment_nesting();

alter table community_post_comments enable row level security;

create policy "Authenticated users can read comments"
  on community_post_comments for select to authenticated
  using (true);

create policy "Users can insert own comments"
  on community_post_comments for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on community_post_comments for delete to authenticated
  using (auth.uid() = user_id);

create policy "Admins can delete any comment"
  on community_post_comments for delete to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );
