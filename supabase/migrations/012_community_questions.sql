-- ============================================================
-- Community questions: reuse community_posts as polymorphic store
-- ============================================================
-- Questions live alongside projects in community_posts, discriminated
-- by post_type. Questions have no media, so media_url / media_type
-- become nullable. Existing rows are backfilled to 'project'.
--
-- Rationale for a discriminator column (vs a separate table):
--   * Comment thread reuses community_post_comments unchanged.
--   * Delete / edit / anonymity / skill tag logic is already built.
--   * Queries filter by post_type on the listing pages.

alter table community_posts
  add column post_type text not null default 'project'
  check (post_type in ('project', 'question'));

alter table community_posts alter column media_url drop not null;
alter table community_posts alter column media_type drop not null;

-- A question has no media; a project must have a media_url.
alter table community_posts
  add constraint community_posts_media_matches_type
  check (
    (post_type = 'question' and media_url is null and media_type is null)
    or
    (post_type = 'project' and media_url is not null and media_type is not null)
  );

create index idx_community_posts_post_type on community_posts(post_type, created_at desc);
