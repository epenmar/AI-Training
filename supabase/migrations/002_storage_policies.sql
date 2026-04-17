-- ============================================================
-- Storage policies for community-media bucket
-- ============================================================

-- Authenticated users can upload to their own folder (prefix = user id)
create policy "Users can upload own media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read all community media
create policy "Authenticated can read community media"
  on storage.objects for select to authenticated
  using (bucket_id = 'community-media');

-- Users can delete their own uploads
create policy "Users can delete own media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
