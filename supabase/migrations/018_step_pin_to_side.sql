-- Per-step flag for "pin this step's interactive to a sticky sidebar".
-- When any step in an activity has pin_to_side=true the activity detail
-- page renders in a two-column layout: steps scroll on the left, the
-- pinned step's interactive stays visible on the right. Useful for
-- workspace-style activities where every step references the same
-- pasted artifact.
alter table activity_guide_steps
  add column if not exists pin_to_side boolean not null default false;
