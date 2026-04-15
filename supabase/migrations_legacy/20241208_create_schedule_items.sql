-- Tabla de programación (schedule_items)
CREATE TABLE schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    radio_id UUID REFERENCES radios(id) ON DELETE CASCADE,
    program_name VARCHAR(100) NOT NULL,
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- create index
CREATE INDEX idx_schedule_radio_id ON schedule_items(radio_id);
CREATE INDEX idx_schedule_day ON schedule_items(day_of_week);

-- grant permissions
GRANT SELECT ON schedule_items TO anon;
GRANT ALL PRIVILEGES ON schedule_items TO authenticated;

-- Políticas de seguridad RLS
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedule items are viewable by everyone" ON schedule_items
    FOR SELECT USING (true);

CREATE POLICY "Users can manage schedule for their radios" ON schedule_items
    FOR ALL USING (auth.uid() = (SELECT user_id FROM radios WHERE id = radio_id));