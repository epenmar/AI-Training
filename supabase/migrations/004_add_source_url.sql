-- ============================================================
-- Add source_url column to lesson_flow
--
-- `link` is the direct URL for the specific resource (e.g. a YouTube
-- video), and `source_url` is the containing page (e.g. the Foundations
-- hub). The UI links the card title to `link` and shows `source_url`
-- as a small secondary link so learners land on the exact resource.
-- ============================================================

alter table lesson_flow
  add column if not exists source_url text;

-- Backfill the two items where the video URL was buried inside
-- specific_location and link pointed at the source hub.

update lesson_flow
set
  link = 'https://www.youtube.com/watch?v=gqoi5jme188',
  source_url = 'https://lx.asu.edu/ai/foundations',
  specific_location = 'Foundations page, ''Intro to Generative AI'' section'
where id = 5;

update lesson_flow
set
  link = 'https://www.youtube.com/watch?v=tB9evEvq0Ck',
  source_url = 'https://lx.asu.edu/ai/foundations',
  specific_location = 'Foundations page, ''Prompting'' section'
where id = 41;
