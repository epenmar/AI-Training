-- Detailed help text for activity guide steps.
-- Rendered as an accordion on N → F activities, where learners need
-- concrete examples and more hand-holding than the base instruction.
alter table activity_guide_steps
  add column if not exists detailed_help text;
