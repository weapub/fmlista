import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfztzmfywnmitrcsuzca.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenR6bWZ5d25taXRyY3N1emNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzA5ODYsImV4cCI6MjA4MDc0Njk4Nn0.npXWMVy41SFsOk5h0Sl0BI4ltvX4MLO3bg1yKsfoAT8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)