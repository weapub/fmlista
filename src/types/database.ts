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
  slug: string | null
  frequency: string
  logo_url: string | null
  cover_url: string | null
  description: string | null
  stream_url: string
  video_stream_url: string | null
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

export interface Advertisement {
  id: string
  title: string
  image_url: string
  link_url: string | null
  position: 'home_top' | 'home_middle' | 'microsite_top' | 'microsite_sidebar'
  active: boolean
  clicks: number
  created_at: string
  display_order?: number
  radio_id?: string
}

export interface Plan {
  id: string
  name: string
  type: 'streaming' | 'ads' | 'premium_feature'
  price: number
  currency: string
  description: string | null
  features: string[]
  interval: 'monthly' | 'yearly' | 'one_time'
  active: boolean
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_end: string
  plan?: Plan
}

export interface AppSetting {
  key: string
  value: string
  created_at: string
}