-- Update storage policies to allow authenticated users to upload into their own folder

-- Drop overly restrictive insert policy
DROP POLICY IF EXISTS "Radio admins can upload images" ON storage.objects;

-- Allow authenticated users to insert into bucket 'radio-images' when first path segment equals their uid
CREATE POLICY "Authenticated users can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'radio-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure SELECT remains public for this bucket (idempotent)
DROP POLICY IF EXISTS "Public can read radio images" ON storage.objects;
CREATE POLICY "Public can read radio images" ON storage.objects
FOR SELECT USING (bucket_id = 'radio-images');

