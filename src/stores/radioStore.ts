import { create } from 'zustand'
import { Radio } from '@/types/database'

interface PersistedRadioState {
  currentRadio: Radio | null
  isPlaying: boolean
  volume: number
  isPlayerExpanded: boolean
}

interface RadioStore extends PersistedRadioState {
  radios: Radio[]
  isLoading: boolean
  selectedCategory: string | null
  selectedLocation: string | null

  setRadios: (radios: Radio[] | ((prev: Radio[]) => Radio[])) => void
  setCurrentRadio: (radio: Radio | null) => void
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setIsPlayerExpanded: (expanded: boolean) => void
  setIsLoading: (loading: boolean) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedLocation: (location: string | null) => void

  filteredRadios: () => Radio[]
}

const STORAGE_KEY = 'radio-player-state-v1'

const getInitialPersistedState = (): PersistedRadioState => {
  if (typeof window === 'undefined') {
    return {
      currentRadio: null,
      isPlaying: false,
      volume: 1,
      isPlayerExpanded: false,
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        currentRadio: null,
        isPlaying: false,
        volume: 1,
        isPlayerExpanded: false,
      }
    }

    const parsed = JSON.parse(raw) as Partial<PersistedRadioState>
    return {
      currentRadio: parsed.currentRadio ?? null,
      isPlaying: !!parsed.currentRadio && !!parsed.isPlaying,
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 1,
      isPlayerExpanded: !!parsed.isPlayerExpanded,
    }
  } catch {
    return {
      currentRadio: null,
      isPlaying: false,
      volume: 1,
      isPlayerExpanded: false,
    }
  }
}

const persistState = (state: PersistedRadioState) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      currentRadio: state.currentRadio,
      isPlaying: state.currentRadio ? state.isPlaying : false,
      volume: Math.max(0, Math.min(1, state.volume)),
      isPlayerExpanded: state.currentRadio ? state.isPlayerExpanded : false,
    })
  )
}

const initialPersistedState = getInitialPersistedState()

export const useRadioStore = create<RadioStore>((set, get) => ({
  radios: [],
  currentRadio: initialPersistedState.currentRadio,
  isPlaying: initialPersistedState.isPlaying,
  volume: initialPersistedState.volume,
  isPlayerExpanded: initialPersistedState.isPlayerExpanded,
  isLoading: false,
  selectedCategory: null,
  selectedLocation: null,

  setRadios: (input) =>
    set((state) => {
      const radios = typeof input === 'function' ? input(state.radios) : input
      const reconciledCurrentRadio =
        state.currentRadio && radios.length
          ? radios.find((radio) => radio.id === state.currentRadio?.id) ?? state.currentRadio
          : state.currentRadio

      const nextState = {
        radios,
        currentRadio: reconciledCurrentRadio,
      }

      persistState({
        currentRadio: reconciledCurrentRadio,
        isPlaying: state.isPlaying,
        volume: state.volume,
        isPlayerExpanded: state.isPlayerExpanded,
      })

      return nextState
    }),

  setCurrentRadio: (radio) =>
    set((state) => {
      persistState({
        currentRadio: radio,
        isPlaying: radio ? state.isPlaying : false,
        volume: state.volume,
        isPlayerExpanded: radio ? state.isPlayerExpanded : false,
      })

      return { currentRadio: radio }
    }),

  setIsPlaying: (playing) =>
    set((state) => {
      const nextIsPlaying = !!state.currentRadio && playing

      persistState({
        currentRadio: state.currentRadio,
        isPlaying: nextIsPlaying,
        volume: state.volume,
        isPlayerExpanded: state.isPlayerExpanded,
      })

      return { isPlaying: nextIsPlaying }
    }),

  setVolume: (volume) =>
    set((state) => {
      const nextVolume = Math.max(0, Math.min(1, volume))

      persistState({
        currentRadio: state.currentRadio,
        isPlaying: state.isPlaying,
        volume: nextVolume,
        isPlayerExpanded: state.isPlayerExpanded,
      })

      return { volume: nextVolume }
    }),

  setIsPlayerExpanded: (expanded) =>
    set((state) => {
      persistState({
        currentRadio: state.currentRadio,
        isPlaying: state.isPlaying,
        volume: state.volume,
        isPlayerExpanded: state.currentRadio ? expanded : false,
      })

      return { isPlayerExpanded: state.currentRadio ? expanded : false }
    }),

  setIsLoading: (loading) => set({ isLoading: loading }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedLocation: (location) => set({ selectedLocation: location }),

  filteredRadios: () => {
    const { radios, selectedCategory, selectedLocation } = get()
    return radios.filter((radio) => {
      const categoryMatch = !selectedCategory || radio.category === selectedCategory
      const locationMatch = !selectedLocation || radio.location === selectedLocation
      return categoryMatch && locationMatch
    })
  },
}))
