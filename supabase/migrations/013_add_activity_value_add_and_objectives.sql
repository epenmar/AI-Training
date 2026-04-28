-- Per-activity "why" and "what you'll learn" copy.
-- value_add  is a short paragraph answering "why am I doing this".
-- objectives is a bulleted list answering "what is it teaching me".
alter table level_up_activities
  add column if not exists value_add  text,
  add column if not exists objectives text[] not null default '{}';
