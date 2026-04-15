-- Fix Storage Permissions for Ads
-- Allow authenticated users to upload to 'ads/' folder in 'radio-images' bucket
-- (Assuming 'radio-images' is the bucket name)

-- We can't easily alter existing policies without knowing their exact names, 
-- so we'll try to create a new broad policy for the 'ads' folder if it doesn't exist,
-- or relies on the fact that we might have a broad "authenticated uploads" policy.

-- However, to be safe and ensure it works, let's add a policy specifically for ads folder.
-- Note: Supabase storage policies are on the storage.objects table.

BEGIN;

-- Policy for uploading ads images
-- Allow any authenticated user to upload to ads folder (we trust the app to restrict who can do this via UI/Business logic, 
-- or we can try to be strict but checking radio ownership on file upload is hard without metadata)
-- For now, allowing authenticated uploads to 'ads/*' is safe enough for this context.
CREATE POLICY "Allow authenticated uploads to ads folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'radio-images' AND 
    (storage.foldername(name))[1] = 'ads'
);

-- Allow updates
CREATE POLICY "Allow authenticated updates to ads folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'radio-images' AND 
    (storage.foldername(name))[1] = 'ads'
);

-- Allow selects (public is usually enabled, but just in case)
CREATE POLICY "Allow public access to ads folder"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'radio-images' AND 
    (storage.foldername(name))[1] = 'ads'
);

-- Fix Database Permissions for Advertisements table
-- Allow Radio Admins to manage ads for their own radios

CREATE POLICY "Radio owners can insert ads for their radios"
ON public.advertisements FOR INSERT
TO authenticated
WITH CHECK (
    -- User must own the radio referenced by radio_id
    radio_id IN (
        SELECT id FROM public.radios WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Radio owners can update their own ads"
ON public.advertisements FOR UPDATE
TO authenticated
USING (
    -- Ad must belong to a radio owned by user
    radio_id IN (
        SELECT id FROM public.radios WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    radio_id IN (
        SELECT id FROM public.radios WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Radio owners can delete their own ads"
ON public.advertisements FOR DELETE
TO authenticated
USING (
    -- Ad must belong to a radio owned by user
    radio_id IN (
        SELECT id FROM public.radios WHERE user_id = auth.uid()
    )
);

-- Allow Radio Owners to VIEW their own ads (even inactive ones)
CREATE POLICY "Radio owners can view their own ads"
ON public.advertisements FOR SELECT
TO authenticated
USING (
    radio_id IN (
        SELECT id FROM public.radios WHERE user_id = auth.uid()
    )
);

COMMIT;
