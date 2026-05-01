-- Per-step toggle for the external-tool suggester. Some steps surface the
-- ASU platform callouts (Compare AI, Build in Create AI) without wanting the
-- generic external-tool suggestion panel below them.
alter table activity_guide_steps
  add column if not exists show_external_tools boolean not null default false;
