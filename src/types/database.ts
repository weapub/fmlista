export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'listener' | 'radio_admin' | 'super_admin'
  created_at: string
}

export interface Radio {
  id: string
  user_id: string
  name: string
  frequency: string
  logo_url: string | null
  cover_url: string | null
  description: string | null
  stream_url: string
  location: string | null
  category: string | null
  whatsapp: string | null
  social_facebook: string | null
  social_instagram: string | null
  social_twitter: string | null
  address: string | null
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  radio_id: string
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  radio_id: string
  rating: number
  comment: string | null
  created_at: string
  user?: {
    full_name: string
    avatar_url: string
  }
}

export interface ChatMessage {
  id: string
  user_id: string
  radio_id: string
  message: string
  created_at: string
  user?: {
    full_name: string
    avatar_url: string
  }
}

export interface ScheduleItem {
  id: string
  radio_id: string
  program_name: string
  day_of_week: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'
  start_time: string
  end_time: string
  description: string | null
  created_at: string
}

export interface RadioWithSchedule extends Radio {
  schedule?: ScheduleItem[]
}