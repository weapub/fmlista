-- Update the user with email 'weapublicidad@gmail.com' to be super_admin
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'weapublicidad@gmail.com';
