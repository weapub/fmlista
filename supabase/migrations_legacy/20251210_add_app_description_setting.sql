-- Insert default app_description setting
INSERT INTO public.app_settings (key, value)
VALUES ('app_description', 'Todas las radios de Formosa en un solo lugar. Escucha tu música y programas favoritos donde quieras.')
ON CONFLICT (key) DO NOTHING;
