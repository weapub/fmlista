-- Grant permissions to authenticated users on public.users table
-- This is necessary for RLS policies that query this table (like the storage policy)
GRANT SELECT ON public.users TO authenticated;

-- Ensure RLS is enabled on storage.objects (usually is, but good to check)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Re-apply the storage policy to be sure (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Super admin can upload anywhere" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can update anywhere" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can delete anywhere" ON storage.objects;

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
