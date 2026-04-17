-- ============================================================
-- Avatars bucket for user profile pictures
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Users can upload/replace/delete files under their own folder (prefix = user id)
create policy "Users can upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatars are publicly readable so <img src> works without a signed URL
create policy "Public can read avatars"
  on storage.objects for select to public
  using (bucket_id = 'avatars');
