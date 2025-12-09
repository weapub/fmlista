-- Update storage policies to allow super_admin to upload anywhere in radio-images bucket
-- Specifically for the 'ads/' folder

CREATE POLICY "Super admin can upload anywhere" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'radio-images' AND
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin')
);

CREATE POLICY "Super admin can update anywhere" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'radio-images' AND
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin')
);

CREATE POLICY "Super admin can delete anywhere" ON storage.objects
FOR DELETE USING (
  bucket_id = 'radio-images' AND
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin')
);
