import { supabase } from './supabase'
import { Radio, ScheduleItem, RadioWithSchedule } from '@/types/database'

export const api = {
  // Radio operations
  async getRadios(): Promise<Radio[]> {
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data, error } = await supabase
        .from('radios')
        .select('*')
        .order('name', { ascending: true })
      if (!error) return data || []
      const msg = (error as any)?.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('AbortError')) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)))
        continue
      }
      break
    }
    return []
  },
  
  async getRadioById(id: string): Promise<RadioWithSchedule | null> {
    const { data: radioData, error: radioError } = await supabase
      .from('radios')
      .select('*')
      .eq('id', id)
      .single()
    
    if (radioError) throw radioError
    if (!radioData) return null
    
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('radio_id', id)
      .order('start_time', { ascending: true })
    
    if (scheduleError) throw scheduleError
    
    return {
      ...radioData,
      schedule: scheduleData || []
    }
  },

  async getRadioBySlug(slug: string): Promise<RadioWithSchedule | null> {
    const { data: radioData, error: radioError } = await supabase
      .from('radios')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (radioError) {
        // If not found, return null instead of throwing, to handle gracefully
        if (radioError.code === 'PGRST116') return null;
        throw radioError;
    }
    if (!radioData) return null
    
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('radio_id', radioData.id)
      .order('start_time', { ascending: true })
    
    if (scheduleError) throw scheduleError
    
    return {
      ...radioData,
      schedule: scheduleData || []
    }
  },
  
  async createRadio(radio: Omit<Radio, 'id' | 'created_at' | 'updated_at'>): Promise<Radio> {
    const { data, error } = await supabase
      .from('radios')
      .insert([radio])
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  async updateRadio(id: string, updates: Partial<Radio>): Promise<Radio> {
    const { data, error } = await supabase
      .from('radios')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  async deleteRadio(id: string): Promise<void> {
    const { error } = await supabase
      .from('radios')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
  
  // Schedule operations
  async getScheduleByRadioId(radioId: string): Promise<ScheduleItem[]> {
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('radio_id', radioId)
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data || []
  },
  
  async createScheduleItem(item: Omit<ScheduleItem, 'id' | 'created_at'>): Promise<ScheduleItem> {
    const { data, error } = await supabase
      .from('schedule_items')
      .insert([item])
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  async updateScheduleItem(id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const { data, error } = await supabase
      .from('schedule_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  async deleteScheduleItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
  
  // Categories and locations for filters
  async getCategories(): Promise<string[]> {
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data, error } = await supabase
        .from('radios')
        .select('category')
        .not('category', 'is', null)
      
      if (!error) return [...new Set(data?.map(item => item.category) || [])] as string[]
      
      // If it's a network error or abort, we might want to retry or just return empty
      // ERR_ABORTED usually means client cancelled, so maybe retrying isn't helpful if unmounted,
      // but if it's a network blip, it helps.
      const msg = (error as any)?.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('AbortError')) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)))
        continue
      }
      throw error
    }
    return []
  },
  
  async getLocations(): Promise<string[]> {
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data, error } = await supabase
        .from('radios')
        .select('location')
        .not('location', 'is', null)
      
      if (!error) return [...new Set(data?.map(item => item.location) || [])] as string[]
      
      const msg = (error as any)?.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('AbortError')) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)))
        continue
      }
      throw error
    }
    return []
  }
}
