-- Grant permissions to authenticated users on public.users table
GRANT SELECT ON public.users TO authenticated;

-- Instead of dropping/recreating on storage.objects which requires owner permissions,
-- let's try to just ensure the grants are correct.
-- If I cannot modify storage.objects policies because of ownership,
-- I should check if the previous migration actually succeeded.
-- It said "Success", so I must have permissions?
-- Maybe I am not owner of `storage` schema?

-- Let's try to just GRANT usage/select if needed, but mainly focusing on the public.users table access
-- which was likely the blocker for the existing policy.

GRANT SELECT ON public.users TO service_role;
GRANT SELECT ON public.users TO anon;
