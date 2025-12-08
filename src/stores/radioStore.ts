import { create } from 'zustand'
import { Radio, ScheduleItem } from '@/types/database'

interface RadioStore {
  radios: Radio[]
  currentRadio: Radio | null
  isPlaying: boolean
  volume: number
  isPlayerExpanded: boolean
  isLoading: boolean
  selectedCategory: string | null
  selectedLocation: string | null
  
  // Actions
  setRadios: (radios: Radio[]) => void
  setCurrentRadio: (radio: Radio | null) => void
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setIsPlayerExpanded: (expanded: boolean) => void
  setIsLoading: (loading: boolean) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedLocation: (location: string | null) => void
  
  // Computed
  filteredRadios: () => Radio[]
}

export const useRadioStore = create<RadioStore>((set, get) => ({
  radios: [],
  currentRadio: null,
  isPlaying: false,
  volume: 1,
  isPlayerExpanded: false,
  isLoading: false,
  selectedCategory: null,
  selectedLocation: null,
  
  setRadios: (radios) => set({ radios }),
  setCurrentRadio: (radio) => set({ currentRadio: radio }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  setIsPlayerExpanded: (expanded) => set({ isPlayerExpanded: expanded }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  
  filteredRadios: () => {
    const { radios, selectedCategory, selectedLocation } = get()
    return radios.filter(radio => {
      const categoryMatch = !selectedCategory || radio.category === selectedCategory
      const locationMatch = !selectedLocation || radio.location === selectedLocation
      return categoryMatch && locationMatch
    })
  }
}))