-- ============================================================
-- Vetted AI tools catalog
-- ============================================================
-- The grounded source for the "Suggest tools" feature. ASU's public
-- ai.asu.edu/ai-tools page is thin and never lists department-level
-- offerings, so the suggester can't just scrape it. Instead it reads
-- this curated catalog live at request time and injects the matching
-- rows into the model prompt as the ASU-approved candidate set.
--
-- Maintained via seed scripts (service-role). Kept current by editing
-- rows + re-seeding; an in-app admin CRUD surface can be added later.

create table if not exists vetted_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  -- short bucket for display / coarse filtering:
  -- 'platform' | 'image' | 'slides' | 'video' | 'audio' | 'research'
  -- | 'diagram' | 'writing' | 'general' | 'other'
  category text,
  -- free-form tags the suggester matches against the activity/step
  use_cases text[] not null default '{}',
  -- ASU relationship: 'sanctioned' (ASU-built, e.g. Create AI),
  -- 'licensed' (ASU pays, e.g. Adobe), 'enterprise' (available org-wide),
  -- 'external' (public tool, not ASU-vetted).
  asu_status text not null default 'external'
    check (asu_status in ('sanctioned', 'licensed', 'enterprise', 'external')),
  -- 'university-wide' or a specific college / unit name.
  department_scope text not null default 'university-wide',
  -- what data is acceptable: 'public', 'de-identified', 'ferpa-ok', 'unknown'
  data_sensitivity text not null default 'unknown',
  -- one-line "what it's good for" shown to the model and (optionally) users.
  description text,
  active boolean not null default true,
  last_reviewed date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vetted_tools_active_idx
  on vetted_tools (active, asu_status);
create unique index if not exists vetted_tools_name_scope_uniq
  on vetted_tools (lower(name), department_scope);

alter table vetted_tools enable row level security;

-- Non-sensitive reference data: any signed-in user can read the active
-- catalog (the suggest-tools route reads it with the user-scoped client).
drop policy if exists "Authenticated can read active vetted tools" on vetted_tools;
create policy "Authenticated can read active vetted tools"
  on vetted_tools for select to authenticated
  using (active);

-- Writes go through the service-role seed scripts, which bypass RLS.
-- No INSERT/UPDATE/DELETE policies on purpose.
