-- Add super_admin role to check constraint
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('listener', 'radio_admin', 'super_admin'));

-- Add social fields to radios
ALTER TABLE radios 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS social_facebook TEXT,
ADD COLUMN IF NOT EXISTS social_instagram TEXT,
ADD COLUMN IF NOT EXISTS social_twitter TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    radio_id UUID REFERENCES radios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, radio_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    radio_id UUID REFERENCES radios(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    radio_id UUID REFERENCES radios(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Favorites
CREATE POLICY "Favorites are viewable by owner" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add reviews" ON reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Chat Messages
CREATE POLICY "Chat messages are viewable by everyone" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update Radios Policy for Super Admin
DROP POLICY IF EXISTS "Users can update their own radios" ON radios;
CREATE POLICY "Users and Super Admins can update radios" ON radios
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

DROP POLICY IF EXISTS "Users can delete their own radios" ON radios;
CREATE POLICY "Users and Super Admins can delete radios" ON radios
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );
