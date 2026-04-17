-- ============================================================
-- Expand community-media bucket to accept audio files
-- ============================================================
-- The bucket's allowed_mime_types allowlist was rejecting audio/mpeg
-- and other audio types. Sync it with the upload form's allowlist.

update storage.buckets
set allowed_mime_types = array[
  -- images (everything under image/*)
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  -- video
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  -- audio
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/x-m4a',
  -- documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
]
where id = 'community-media';
