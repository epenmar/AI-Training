-- Per-step flag for whether the ASU resources panel renders inside this step's
-- expandable section, and per-activity choice of community CTA on the
-- completion panel.
alter table activity_guide_steps
  add column if not exists show_asu_resources boolean not null default false;

alter table level_up_activities
  add column if not exists community_action text not null default 'lookbook';
