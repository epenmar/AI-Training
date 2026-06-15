-- ============================================================
-- Admin revision history
-- ============================================================
-- Records every admin content edit (inline edits now; admin-bot
-- edits later) so changes can be reviewed and rolled back from the
-- admin menu. One row per field change.
--
-- Writes happen through the service-role client inside server
-- actions (which do their own is_admin check), so the table doesn't
-- strictly need write RLS for the app to function — but we add
-- admin-only read RLS so a future revisions UI can query it with the
-- normal authenticated client.

create table if not exists admin_revision_history (
  id uuid primary key default gen_random_uuid(),
  -- What was edited.
  table_name text not null,
  row_id text not null,          -- text so it works for int + uuid PKs
  column_name text not null,
  -- Old / new values stored as jsonb so this handles plain text AND
  -- jsonb columns (e.g. extra_sources) uniformly.
  old_value jsonb,
  new_value jsonb,
  -- Who + when + how.
  changed_by uuid references profiles(id) on delete set null,
  changed_by_name text,          -- snapshot of display_name / email at edit time
  change_source text not null default 'inline_edit', -- 'inline_edit' | 'admin_bot' | 'rollback'
  -- When this revision is itself a rollback, point at the revision it undid.
  rolled_back_from uuid references admin_revision_history(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admin_revision_history_target_idx
  on admin_revision_history (table_name, row_id, column_name, created_at desc);

create index if not exists admin_revision_history_created_idx
  on admin_revision_history (created_at desc);

alter table admin_revision_history enable row level security;

-- Admins can read the full history; nobody else can see it.
drop policy if exists "Admins can read revision history" on admin_revision_history;
create policy "Admins can read revision history"
  on admin_revision_history for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin
    )
  );

-- No INSERT/UPDATE/DELETE policies for the anon/authenticated roles:
-- all writes go through the service-role client in server actions,
-- which bypasses RLS. This keeps the write path single-sourced and
-- auditable.
