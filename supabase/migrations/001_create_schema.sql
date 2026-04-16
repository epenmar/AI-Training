-- ============================================================
-- ASU AI Skills Training Dashboard — Full Schema
-- ============================================================

-- ── 1. Static Reference Tables ──────────────────────────────

-- Bloom's Taxonomy phases (9 rows: 0-8)
create table bloom_phases (
  id smallint primary key,
  name text not null,
  bloom_levels text not null,
  description text,
  sort_order smallint not null default 0
);

-- 14 Maynard AI skills
create table skills (
  id smallint primary key,
  statement text not null,
  short_name text not null,
  bloom_phase_id smallint not null references bloom_phases(id),
  is_gap boolean not null default false
);

-- Self-assessment questions (14 rows)
create table assessment_questions (
  id smallint primary key,
  skill_id smallint not null references skills(id),
  scenario text not null
);

-- Answer options (56 rows: 14 questions x 4 options)
create table assessment_options (
  id serial primary key,
  question_id smallint not null references assessment_questions(id),
  option_key char(1) not null, -- A, B, C, D
  option_text text not null,
  level_label text not null,   -- "New to this", "Foundational", "Intermediate", "Advanced"
  score smallint not null,     -- 0-3
  unique (question_id, option_key)
);

-- Master content registry (~165 rows)
create table learning_items (
  id serial primary key,
  source text not null,
  topic text,
  summary text,
  learning_level text not null, -- Foundational, Intermediate, Advanced
  direct_link text,
  leveling_rationale text
);

-- Bloom-remapped lesson flow (~107 rows)
create table lesson_flow (
  id serial primary key,
  bloom_phase_id smallint not null references bloom_phases(id),
  original_phase text,
  seq smallint not null,
  topic text,
  learning_level text,
  modality text,
  source text,
  item_title text not null,
  link text,
  purpose text,
  id_guidance text,
  skill_ids smallint[] not null default '{}',
  specific_location text
);

-- Level-up activities (42 rows: 14 skills x 3 bands)
create table level_up_activities (
  id serial primary key,
  skill_id smallint not null references skills(id),
  band text not null,         -- "New → Foundational", "Foundational → Intermediate", "Intermediate → Advanced"
  title text not null,
  description text,
  time_estimate text,
  deliverable text,
  linked_phase_ids smallint[] not null default '{}'
);

-- Step-by-step instructions (~231 rows)
create table activity_guide_steps (
  id serial primary key,
  activity_id integer not null references level_up_activities(id) on delete cascade,
  step_number smallint not null,
  instruction text not null
);

-- ── 2. User-Generated Tables ────────────────────────────────

-- User profiles (auto-created on first sign-in)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Assessment attempts (one row per complete assessment)
create table assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  total_score smallint not null,
  overall_band text not null,
  completed_at timestamptz not null default now()
);

-- Individual responses (14 rows per attempt)
create table assessment_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references assessment_attempts(id) on delete cascade,
  question_id smallint not null references assessment_questions(id),
  selected_option_key char(1) not null,
  score smallint not null,
  level_label text not null
);

-- Activity completion tracking
create table user_activity_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  activity_id integer not null references level_up_activities(id),
  completed_at timestamptz not null default now(),
  deliverable_notes text,
  unique (user_id, activity_id)
);

-- Community Look Book posts
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  media_url text not null,
  media_type text not null default 'image', -- 'image' or 'video'
  skill_id smallint references skills(id),
  activity_id integer references level_up_activities(id),
  created_at timestamptz not null default now()
);

-- ── 3. Auto-create profile on first sign-in ─────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 4. Indexes ──────────────────────────────────────────────

create index idx_lesson_flow_phase on lesson_flow(bloom_phase_id);
create index idx_lesson_flow_skills on lesson_flow using gin(skill_ids);
create index idx_activities_skill on level_up_activities(skill_id);
create index idx_guide_steps_activity on activity_guide_steps(activity_id);
create index idx_attempts_user on assessment_attempts(user_id);
create index idx_responses_attempt on assessment_responses(attempt_id);
create index idx_completions_user on user_activity_completions(user_id);
create index idx_community_created on community_posts(created_at desc);

-- ── 5. Row Level Security ───────────────────────────────────

-- Enable RLS on all tables
alter table bloom_phases enable row level security;
alter table skills enable row level security;
alter table assessment_questions enable row level security;
alter table assessment_options enable row level security;
alter table learning_items enable row level security;
alter table lesson_flow enable row level security;
alter table level_up_activities enable row level security;
alter table activity_guide_steps enable row level security;
alter table profiles enable row level security;
alter table assessment_attempts enable row level security;
alter table assessment_responses enable row level security;
alter table user_activity_completions enable row level security;
alter table community_posts enable row level security;

-- Static tables: any authenticated user can read
create policy "Authenticated users can read bloom_phases"
  on bloom_phases for select to authenticated using (true);

create policy "Authenticated users can read skills"
  on skills for select to authenticated using (true);

create policy "Authenticated users can read assessment_questions"
  on assessment_questions for select to authenticated using (true);

create policy "Authenticated users can read assessment_options"
  on assessment_options for select to authenticated using (true);

create policy "Authenticated users can read learning_items"
  on learning_items for select to authenticated using (true);

create policy "Authenticated users can read lesson_flow"
  on lesson_flow for select to authenticated using (true);

create policy "Authenticated users can read level_up_activities"
  on level_up_activities for select to authenticated using (true);

create policy "Authenticated users can read activity_guide_steps"
  on activity_guide_steps for select to authenticated using (true);

-- Profiles: users can read/update their own; all can see display_name/avatar
create policy "Users can read own profile"
  on profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update to authenticated
  using (auth.uid() = id);

-- Assessment attempts: users own their data
create policy "Users can insert own attempts"
  on assessment_attempts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own attempts"
  on assessment_attempts for select to authenticated
  using (auth.uid() = user_id);

-- Assessment responses: users own their data
create policy "Users can insert own responses"
  on assessment_responses for insert to authenticated
  with check (
    attempt_id in (
      select id from assessment_attempts where user_id = auth.uid()
    )
  );

create policy "Users can read own responses"
  on assessment_responses for select to authenticated
  using (
    attempt_id in (
      select id from assessment_attempts where user_id = auth.uid()
    )
  );

-- Activity completions: users own their data
create policy "Users can insert own completions"
  on user_activity_completions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own completions"
  on user_activity_completions for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own completions"
  on user_activity_completions for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own completions"
  on user_activity_completions for delete to authenticated
  using (auth.uid() = user_id);

-- Community posts: all can read, users own their writes
create policy "Authenticated users can read all community posts"
  on community_posts for select to authenticated using (true);

create policy "Users can insert own posts"
  on community_posts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on community_posts for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on community_posts for delete to authenticated
  using (auth.uid() = user_id);
