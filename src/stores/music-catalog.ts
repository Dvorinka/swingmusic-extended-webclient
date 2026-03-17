import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface CatalogItem {
  spotify_id: string
  item_type: 'track' | 'album' | 'artist' | 'playlist'
  title: string
  artist: string
  album?: string
  duration_ms?: number
  popularity?: number
  preview_url?: string
  image_url?: string
  release_date?: string
  explicit: boolean
  data?: any
}

export interface ArtistInfo {
  spotify_id: string
  name: string
  image_url?: string
  followers?: number
  popularity?: number
  genres?: string[]
  top_tracks?: CatalogItem[]
  albums?: CatalogItem[]
  related_artists?: any[]
}

export interface SearchResult {
  tracks: CatalogItem[]
  albums: CatalogItem[]
  artists: CatalogItem[]
  playlists: CatalogItem[]
  total: number
  query: string
}

export interface UserCatalogPreferences {
  user_id: number
  max_search_results: number
  max_top_tracks: number
  max_albums_per_artist: number
  max_trending_results: number
  max_recommendations: number
  show_explicit: boolean
  preferred_markets: string[]
}

export default defineStore('music-catalog', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentArtist = ref<ArtistInfo | null>(null)
  const currentAlbum = ref<CatalogItem | null>(null)
  const searchResults = ref<SearchResult | null>(null)
  const trendingContent = ref<any>(null)
  const recommendations = ref<any>(null)
  const userPreferences = ref<UserCatalogPreferences | null>(null)
  
  // Computed
  const hasSearchResults = computed(() => {
    return searchResults.value && searchResults.value.total > 0
  })
  
  const searchResultCounts = computed(() => {
    if (!searchResults.value) return { tracks: 0, albums: 0, artists: 0, playlists: 0 }
    
    return {
      tracks: searchResults.value.tracks.length,
      albums: searchResults.value.albums.length,
      artists: searchResults.value.artists.length,
      playlists: searchResults.value.playlists.length
    }
  })
  
  // Actions
  const setLoading = (state: boolean) => {
    loading.value = state
    if (state) error.value = null
  }
  
  const setError = (message: string) => {
    error.value = message
    loading.value = false
  }
  
  const clearError = () => {
    error.value = null
  }
  
  // Artist actions
  const fetchArtistInfo = async (artistId: string, userId?: number) => {
    try {
      setLoading(true)
      clearError()
      
      const params = userId ? { user_id: userId } : {}
      const response = await axios.get(`/api/catalog/artist/${artistId}`, { params })
      
      if (response.data.error) {
        setError(response.data.error)
        return null
      }
      
      currentArtist.value = response.data
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch artist information'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }
  
  const fetchArtistTopTracks = async (artistId: string, limit = 15, userId?: number) => {
    try {
      setLoading(true)
      clearError()
      
      const params = { limit, ...(userId && { user_id: userId }) }
      const response = await axios.get(`/api/catalog/artist/${artistId}/top-tracks`, { params })
      
      return response.data.tracks || []
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch artist top tracks'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }
  
  const fetchArtistAlbums = async (artistId: string, limit = 20, userId?: number) => {
    try {
      setLoading(true)
      clearError()
      
      const params = { limit, ...(userId && { user_id: userId }) }
      const response = await axios.get(`/api/catalog/artist/${artistId}/albums`, { params })
      
      return response.data.albums || []
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch artist albums'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }
  
  // Album actions
  const fetchAlbumDetails = async (albumId: string, userId?: number) => {
    try {
      setLoading(true)
      clearError()
      
      const params = userId ? { user_id: userId } : {}
      const response = await axios.get(`/api/catalog/album/${albumId}`, { params })
      
      if (response.data.error) {
        setError(response.data.error)
        return null
      }
      
      currentAlbum.value = response.data
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch album details'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }
  
  // Search actions
  const searchCatalog = async (query: string, type = 'all', limit = 20, userId?: number) => {
    try {
      setLoading(true)
      clearError()
      
      const payload = { query, type, limit, ...(userId && { user_id: userId }) }
      const response = await axios.post('/api/catalog/search', payload)
      
      if (response.data.error) {
        setError(response.data.error)
        return null
      }
      
      searchResults.value = response.data
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to search catalog'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }
  
  // Trending content
  const fetchTrendingContent = async (type = 'tracks', limit = 20, userId?: number) => {
    try {
      setLoading(true)
      clearError()
      
      const params = { type, limit, ...(userId && { user_id: userId }) }
      const response = await axios.get('/api/catalog/trending', { params })
      
      if (response.data.error) {
        setError(response.data.error)
        return null
      }
      
      trendingContent.value = response.data
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch trending content'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }
  
  // Recommendations
  const fetchRecommendations = async (
    seedArtists: string[] = [],
    seedTracks: string[] = [],
    seedGenres: string[] = [],
    limit = 20,
    userId?: number
  ) => {
    try {
      setLoading(true)
      clearError()
      
      const payload = {
        seed_artists: seedArtists,
        seed_tracks: seedTracks,
        seed_genres: seedGenres,
        limit,
        ...(userId && { user_id: userId })
      }
      const response = await axios.post('/api/catalog/recommendations', payload)
      
      if (response.data.error) {
        setError(response.data.error)
        return null
      }
      
      recommendations.value = response.data
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch recommendations'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }
  
  // User preferences
  const fetchUserPreferences = async (userId: number) => {
    try {
      const response = await axios.get(`/api/catalog/preferences/${userId}`)
      
      if (response.data.error) {
        console.warn('Failed to fetch user preferences:', response.data.error)
        return null
      }
      
      userPreferences.value = response.data
      return response.data
    } catch (err: any) {
      console.warn('Failed to fetch user preferences:', err.response?.data?.error || err.message)
      return null
    }
  }
  
  const updateUserPreferences = async (userId: number, preferences: Partial<UserCatalogPreferences>) => {
    try {
      const response = await axios.post(`/api/catalog/preferences/${userId}`, preferences)
      
      if (response.data.error) {
        throw new Error(response.data.error)
      }
      
      // Refresh preferences after update
      await fetchUserPreferences(userId)
      return true
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to update preferences'
      setError(message)
      return false
    }
  }
  
  // Utility functions
  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return '--:--'
    
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  const formatFollowers = (followers?: number) => {
    if (!followers) return '0'
    
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`
    } else if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`
    }
    return followers.toString()
  }
  
  const getSpotifyUrl = (item: CatalogItem) => {
    const baseUrl = 'https://open.spotify.com'
    const type = item.item_type === 'track' ? 'track' : item.item_type
    return `${baseUrl}/${type}/${item.spotify_id}`
  }
  
  const clearSearchResults = () => {
    searchResults.value = null
  }
  
  const clearCurrentArtist = () => {
    currentArtist.value = null
  }
  
  const clearCurrentAlbum = () => {
    currentAlbum.value = null
  }
  
  return {
    // State
    loading,
    error,
    currentArtist,
    currentAlbum,
    searchResults,
    trendingContent,
    recommendations,
    userPreferences,
    
    // Computed
    hasSearchResults,
    searchResultCounts,
    
    // Actions
    setLoading,
    setError,
    clearError,
    
    // Artist methods
    fetchArtistInfo,
    fetchArtistTopTracks,
    fetchArtistAlbums,
    
    // Album methods
    fetchAlbumDetails,
    
    // Search methods
    searchCatalog,
    clearSearchResults,
    
    // Trending methods
    fetchTrendingContent,
    
    // Recommendation methods
    fetchRecommendations,
    
    // User preferences methods
    fetchUserPreferences,
    updateUserPreferences,
    
    // Utility methods
    formatDuration,
    formatFollowers,
    getSpotifyUrl,
    
    // Clear methods
    clearCurrentArtist,
    clearCurrentAlbum
  }
})
