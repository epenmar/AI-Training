-- ============================================================
-- Admin roles
-- ============================================================
-- Tiered admin access:
--   user        - normal learner (default)
--   commenter   - can leave reviewer notes only
--   editor      - reviewer notes + direct inline page editing
--   superadmin  - everything, including managing other users
--
-- The existing is_admin boolean (community-post moderation) is left
-- alone; this `role` column drives the content-editing toolbox.

alter table profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'commenter', 'editor', 'superadmin'));

-- Existing admins (currently just the owner) become superadmins.
update profiles set role = 'superadmin'
  where is_admin = true and role = 'user';

-- ------------------------------------------------------------
-- Pending role invites
-- ------------------------------------------------------------
-- Lets a superadmin grant a role to someone by email before they've
-- ever signed in. On their first authenticated page load the app
-- claims the pending role (sets profiles.role, deletes the pending
-- row). Email is stored lower-cased.

create table if not exists pending_admin_roles (
  email text primary key,
  role text not null check (role in ('commenter', 'editor', 'superadmin')),
  invited_by uuid references profiles(id) on delete set null,
  invited_by_name text,
  created_at timestamptz not null default now()
);

alter table pending_admin_roles enable row level security;

-- Superadmins can read pending invites (for the toolbox list). Writes
-- go through the service-role client in server actions.
drop policy if exists "Superadmins read pending roles" on pending_admin_roles;
create policy "Superadmins read pending roles"
  on pending_admin_roles for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'superadmin'
    )
  );
