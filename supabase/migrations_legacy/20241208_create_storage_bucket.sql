-- Create storage bucket for radio images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('radio-images', 'radio-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Create storage policies for radio images
CREATE POLICY "Public can read radio images" ON storage.objects
FOR SELECT USING (bucket_id = 'radio-images');

CREATE POLICY "Radio admins can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'radio-images' AND
  auth.uid() IN (SELECT user_id FROM radios WHERE user_id = auth.uid())
);

CREATE POLICY "Radio admins can update their images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'radio-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Radio admins can delete their images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'radio-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);