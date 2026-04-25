-- Ensure weapublicidad@gmail.com is always super_admin.
-- Idempotent: safe to run multiple times.

INSERT INTO public.users (id, email, role)
SELECT
  au.id,
  au.email,
  'super_admin'
FROM auth.users au
WHERE lower(au.email) = 'weapublicidad@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  role = 'super_admin';
