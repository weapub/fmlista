export interface User {
  id: string;
  email: string;
  role: 'listener' | 'radio_admin';
  created_at: string;
}

export interface Radio {
  id: string;
  user_id: string;
  name: string;
  frequency: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  stream_url: string;
  location: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleItem {
  id: string;
  radio_id: string;
  program_name: string;
  day_of_week: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  start_time: string;
  end_time: string;
  description: string | null;
  created_at: string;
}

export interface RadioWithSchedule extends Radio {
  schedule: ScheduleItem[];
}