-- Curated per-activity source list. Lives alongside the auto-generated
-- "Explore the Sources" content (which is filtered from lesson_flow by
-- skill). The activity detail page merges auto + extras when rendering
-- the Explore the Sources accordion.
alter table level_up_activities
  add column if not exists extra_sources jsonb not null default '[]'::jsonb;
