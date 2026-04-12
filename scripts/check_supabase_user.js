import { createClient } from '@supabase/supabase-js'

// Supabase project from src/lib/supabase.ts
const SUPABASE_URL = 'https://jfztzmfywnmitrcsuzca.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenR6bWZ5d25taXRyY3N1emNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzA5ODYsImV4cCI6MjA4MDc0Njk4Nn0.npXWMVy41SFsOk5h0Sl0BI4ltvX4MLO3bg1yKsfoAT8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node check_supabase_user.js you@example.com')
    process.exit(1)
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) {
      console.error('Supabase error:', error)
      process.exit(2)
    }

    if (!data || data.length === 0) {
      console.log(JSON.stringify({ found: false }))
      return
    }

    console.log(JSON.stringify({ found: true, user: data[0] }, null, 2))
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(3)
  }
}

main()
