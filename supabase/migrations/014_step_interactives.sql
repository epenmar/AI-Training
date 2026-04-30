-- Optional embedded interactive on a step (vocab cards, sort/match, sandbox, etc).
-- interactive_type names a renderer the activity detail page knows about;
-- interactive_data is the renderer-specific payload (terms list, options, etc).
alter table activity_guide_steps
  add column if not exists interactive_type text,
  add column if not exists interactive_data jsonb;
