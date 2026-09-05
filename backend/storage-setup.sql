-- ════════════════════════════════════════════════════════════════════
--  STORAGE — image uploads bucket
--  Run ONCE in Supabase → SQL Editor. Creates a public "images" bucket
--  so the dashboard can upload doctor / blog / treatment photos.
--  Public can VIEW images; only logged-in admins can upload/replace.
-- ════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('images','images', true)
on conflict (id) do nothing;

-- anyone may read images in this bucket (they're shown on the public site)
drop policy if exists images_public_read on storage.objects;
create policy images_public_read on storage.objects
  for select using ( bucket_id = 'images' );

-- only admins may upload / change / remove
drop policy if exists images_admin_write on storage.objects;
create policy images_admin_write on storage.objects
  for insert to authenticated with check ( bucket_id = 'images' and public.is_admin() );

drop policy if exists images_admin_update on storage.objects;
create policy images_admin_update on storage.objects
  for update to authenticated using ( bucket_id = 'images' and public.is_admin() );

drop policy if exists images_admin_delete on storage.objects;
create policy images_admin_delete on storage.objects
  for delete to authenticated using ( bucket_id = 'images' and public.is_admin() );
