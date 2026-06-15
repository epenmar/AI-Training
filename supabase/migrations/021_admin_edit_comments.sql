-- ============================================================
-- Admin edit comments (annotations)
-- ============================================================
-- Lets one admin leave a freeform note about any piece of content —
-- including things that aren't inline-editable (widgets, whole steps,
-- structural changes). Another admin reviews open notes from the
-- admin menu and takes them to AI for bigger overhauls.
--
-- Target is (table_name, row_id) with an optional column_name and a
-- human-readable context_label so the review list reads well even
-- when the target is a widget or a whole step.

create table if not exists admin_edit_comments (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id text not null,
  column_name text,                 -- null = the whole row / step / widget
  context_label text,               -- e.g. "Step 4 — Bias Check Pass"
  body text not null,
  status text not null default 'open',  -- 'open' | 'resolved'
  created_by uuid references profiles(id) on delete set null,
  created_by_name text,
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_edit_comments_target_idx
  on admin_edit_comments (table_name, row_id, status);
create index if not exists admin_edit_comments_open_idx
  on admin_edit_comments (status, created_at desc);

alter table admin_edit_comments enable row level security;

-- Admins read everything; nobody else sees notes.
drop policy if exists "Admins can read edit comments" on admin_edit_comments;
create policy "Admins can read edit comments"
  on admin_edit_comments for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin
    )
  );

-- Writes go through the service-role client in server actions (which
-- do their own is_admin check), so no INSERT/UPDATE policies here.
