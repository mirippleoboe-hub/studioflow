insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']),
('materials','materials',false,20971520,null) on conflict(id) do nothing;
create policy "Upload own studio files" on storage.objects for insert to authenticated with check (
 bucket_id in ('avatars','materials') and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Delete own studio files" on storage.objects for delete to authenticated using (
 bucket_id in ('avatars','materials') and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Read authorized studio files" on storage.objects for select to authenticated using (
 (bucket_id in ('avatars','materials') and (storage.foldername(name))[1]=auth.uid()::text)
 or (bucket_id='avatars' and exists(select 1 from public.profiles p where p.avatar_path=storage.objects.name))
 or (bucket_id='materials' and exists(select 1 from public.materials m where m.storage_path=storage.objects.name)));
