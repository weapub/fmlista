import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ListMusic, Plus, Play, Trash2, Music } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { RadioCard } from '@/components/RadioCard'
import { useAuthStore } from '@/stores/authStore'
import { useRadioStore } from '@/stores/radioStore'
import { supabase } from '@/lib/supabase'
import { Radio } from '@/types/database'

interface Playlist {
  id: string
  name: string
  radios: Radio[]
  createdAt: number
}

export const UserLibrary: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setCurrentRadio, setIsPlaying } = useRadioStore()
  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites')
  const [favorites, setFavorites] = useState<Radio[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch Favorites
        const { data: favs } = await supabase
          .from('favorites')
          .select('radio:radios(*)')
          .eq('user_id', user.id)
        
        if (favs) {
            // Type assertion since Supabase returns nested object
            const radioList = favs.map((f: any) => f.radio) as Radio[]
            setFavorites(radioList)
        }

        // Load Playlists from LocalStorage
        const savedPlaylists = localStorage.getItem(`playlists_${user.id}`)
        if (savedPlaylists) {
          setPlaylists(JSON.parse(savedPlaylists))
        }
      } catch (error) {
        console.error('Error fetching library:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, navigate])

  const createPlaylist = () => {
    if (!newPlaylistName.trim() || !user) return

    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name: newPlaylistName.trim(),
      radios: [],
      createdAt: Date.now()
    }

    const updatedPlaylists = [...playlists, newPlaylist]
    setPlaylists(updatedPlaylists)
    localStorage.setItem(`playlists_${user.id}`, JSON.stringify(updatedPlaylists))
    setNewPlaylistName('')
    setShowNewPlaylistModal(false)
  }

  const deletePlaylist = (id: string) => {
    if (!user) return
    const updated = playlists.filter(p => p.id !== id)
    setPlaylists(updated)
    localStorage.setItem(`playlists_${user.id}`, JSON.stringify(updated))
  }

  const playPlaylist = (playlist: Playlist) => {
    if (playlist.radios.length > 0) {
      setCurrentRadio(playlist.radios[0])
      setIsPlaying(true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Mi Biblioteca</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'favorites'
                ? 'text-secondary-600 dark:text-secondary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
              <span>Favoritos</span>
            </div>
            {activeTab === 'favorites' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-600 dark:bg-secondary-400"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('playlists')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'playlists'
                ? 'text-secondary-600 dark:text-secondary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ListMusic className="w-4 h-4" />
              <span>Mis Playlists</span>
            </div>
            {activeTab === 'playlists' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-600 dark:bg-secondary-400"></div>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            {favorites.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tienes favoritos</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Guarda tus emisoras preferidas para acceder a ellas rápidamente.
                </p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-4 text-secondary-600 dark:text-secondary-400 hover:underline"
                >
                  Explorar emisoras
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(radio => (
                  <RadioCard key={radio.id} radio={radio} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mis Listas</h2>
              <button
                onClick={() => setShowNewPlaylistModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Playlist</span>
              </button>
            </div>

            {playlists.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <ListMusic className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Crea tu primera playlist</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Organiza tus emisoras por género, estado de ánimo o momento del día.
                </p>
                <button
                  onClick={() => setShowNewPlaylistModal(true)}
                  className="mt-4 text-secondary-600 dark:text-secondary-400 hover:underline"
                >
                  Crear playlist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map(playlist => (
                  <div key={playlist.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg">
                        <Music className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      <button
                        onClick={() => deletePlaylist(playlist.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{playlist.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {playlist.radios.length} emisoras
                    </p>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => playPlaylist(playlist)}
                        disabled={playlist.radios.length === 0}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="w-4 h-4" />
                        <span>Reproducir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Playlist Modal */}
      {showNewPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nueva Playlist</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Nombre de la lista (ej. Mañanas)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewPlaylistModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default UserLibrary
