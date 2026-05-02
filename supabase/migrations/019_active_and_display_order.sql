-- Skill curriculum restructure (12 active skills derived from Maynard's 14):
-- adds is_active + display_order + derivation_note on the skills table,
-- is_active on activities and assessment_questions so retired items can
-- stay in the database (preserving historical references) without
-- showing up in any user-facing list or recommendation.
alter table skills
  add column if not exists is_active boolean not null default true,
  add column if not exists display_order int,
  add column if not exists derivation_note text;

alter table level_up_activities
  add column if not exists is_active boolean not null default true;

alter table assessment_questions
  add column if not exists is_active boolean not null default true;
