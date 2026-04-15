-- Tabla de radios (radios)
CREATE TABLE radios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    frequency VARCHAR(10) NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    description TEXT,
    stream_url TEXT NOT NULL,
    location VARCHAR(100),
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- create index
CREATE INDEX idx_radios_user_id ON radios(user_id);
CREATE INDEX idx_radios_category ON radios(category);
CREATE INDEX idx_radios_location ON radios(location);

-- grant permissions
GRANT SELECT ON radios TO anon;
GRANT ALL PRIVILEGES ON radios TO authenticated;

-- Políticas de seguridad RLS
ALTER TABLE radios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Radios are viewable by everyone" ON radios
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own radios" ON radios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own radios" ON radios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own radios" ON radios
    FOR DELETE USING (auth.uid() = user_id);