-- Sample data for testing the FM Radio application

-- Insert sample users (radio admins)
INSERT INTO users (id, email, password_hash, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@radio1.com', 'hashed_password_1', 'radio_admin'),
('550e8400-e29b-41d4-a716-446655440002', 'admin@radio2.com', 'hashed_password_2', 'radio_admin'),
('550e8400-e29b-41d4-a716-446655440003', 'admin@radio3.com', 'hashed_password_3', 'radio_admin');

-- Insert sample radio stations
INSERT INTO radios (id, user_id, name, frequency, logo_url, cover_url, description, stream_url, location, category) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Radio Nacional', '101.5 FM', 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=RN', 'https://via.placeholder.com/1200x400/1A1A2E/FFFFFF?text=Radio+Nacional', 'La radio pública de Colombia con programación cultural, informativa y musical. Transmitimos las 24 horas del día con el mejor contenido para nuestros oyentes.', 'https://stream.radio.co/example1/stream', 'Bogotá', 'Cultural'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Radio Rock', '98.7 FM', 'https://via.placeholder.com/200x200/DC2626/FFFFFF?text=RR', 'https://via.placeholder.com/1200x400/374151/FFFFFF?text=Radio+Rock', 'La mejor música rock de todos los tiempos. Clásicos del rock, metal alternativo y las novedades del género. ¡Siente la energía del rock!', 'https://stream.radio.co/example2/stream', 'Medellín', 'Rock'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Radio Tropical', '89.3 FM', 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=RT', 'https://via.placeholder.com/1200x400/059669/FFFFFF?text=Radio+Tropical', 'La salsa, merengue, bachata y cumbia que mueven a Colombia. Programación tropical para alegrar tu día con el mejor ritmo caribeño.', 'https://stream.radio.co/example3/stream', 'Cali', 'Tropical'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Radio Noticias', '107.1 FM', 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=RN', 'https://via.placeholder.com/1200x400/1E40AF/FFFFFF?text=Radio+Noticias', 'Información actualizada las 24 horas. Noticias locales, nacionales e internacionales con análisis profundo y periodismo de calidad.', 'https://stream.radio.co/example4/stream', 'Bogotá', 'Noticias'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Radio Juvenil', '95.5 FM', 'https://via.placeholder.com/200x200/EC4899/FFFFFF?text=RJ', 'https://via.placeholder.com/1200x400/BE185D/FFFFFF?text=Radio+Juvenil', 'Música pop, reggaeton y tendencias para la juventud colombiana. Los éxitos más actuales y los artistas que marcan la generación.', 'https://stream.radio.co/example5/stream', 'Barranquilla', 'Pop'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Radio Clásica', '103.9 FM', 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=RC', 'https://via.placeholder.com/1200x400/5B21B6/FFFFFF?text=Radio+Clásica', 'La mejor música clásica y ópera. Beethoven, Mozart, Bach y los grandes compositores en una programación cultural de alto nivel.', 'https://stream.radio.co/example6/stream', 'Manizales', 'Clásica');

-- Insert sample schedule items
INSERT INTO schedule_items (id, radio_id, program_name, day_of_week, start_time, end_time, description) VALUES
-- Radio Nacional schedule
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Noticias de la Mañana', 'Lunes', '06:00:00', '09:00:00', 'Las noticias más importantes del día con análisis profundo'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Café y Cultura', 'Lunes', '09:00:00', '12:00:00', 'Programación cultural con entrevistas y eventos'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Música Andina', 'Martes', '14:00:00', '16:00:00', 'La mejor música andina colombiana'),

-- Radio Rock schedule
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Rock Clásico', 'Lunes', '08:00:00', '12:00:00', 'Los grandes clásicos del rock de los 60s, 70s y 80s'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'Metal Extremo', 'Viernes', '22:00:00', '02:00:00', 'El mejor metal y heavy metal'),

-- Radio Tropical schedule
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440003', 'Salsa Brava', 'Sábado', '20:00:00', '23:00:00', 'La salsa más pegajosa para el sábado por la noche'),
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440003', 'Cumbia Colombiana', 'Domingo', '10:00:00', '13:00:00', 'Los clásicos de la cumbia colombiana');