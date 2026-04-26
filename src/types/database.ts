// Shared types used across the app

export type ID = string;

export interface Radio {
  id: ID;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  frequency?: string | null;
  location?: string | null;
  category?: string | null;
  description?: string | null;
  is_featured?: boolean;
  plan_name?: string | null;
  stream_url?: string | null;
  video_stream_url?: string | null;
  created_at?: string | null;
}

export interface ScheduleItem {
  id: ID;
  radio_id: ID;
  title: string;
  program_name?: string | null;
  description?: string | null;
  host?: string | null;
  day_of_week?: string | null;
  days_of_week?: string[] | null;
  start_time: string; // ISO time or datetime
  end_time?: string | null;
  order?: number | null;
  created_at?: string | null;
}

export interface RadioWithSchedule extends Radio {
  schedule?: ScheduleItem[];
}

export interface Advertisement {
  id: ID;
  title: string;
  image_url?: string | null;
  link?: string | null;
  link_url?: string | null;
  position?: string | null;
  display_order?: number | null;
  order?: number | null;
  active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  clicks?: number | null;
}

export interface Plan {
  id: ID;
  name: string;
  type?: string;
  price?: number | string | null;
  price_cents?: number | null;
  currency?: string | null;
  is_featured?: boolean;
  interval?: 'monthly' | 'yearly' | string | null;
  description?: string | null;
  features?: string[];
  active?: boolean;
}

export interface RadioCatalogEntry {
  id: ID;
  name: string;
  frequency?: string | null;
  city?: string | null;
  province: string;
  category?: string | null;
  stream_url?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  logo_url?: string | null;
  description?: string | null;
  status: 'draft' | 'verified' | 'published';
  notes?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StreamingProgram {
  id: ID;
  title: string;
  description?: string | null;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url?: string | null;
  category?: string | null;
  channel_name?: string | null;
  is_featured?: boolean;
  display_order?: number | null;
  active?: boolean;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Json {
  [key: string]: any;
}
