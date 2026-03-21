<template>
  <div class="enhanced-search">
    <!-- Search Header -->
    <div class="search-header">
      <div class="search-container">
        <div class="search-input-wrapper">
          <Search class="search-icon" />
          <input 
            ref="searchInput"
            v-model="searchQuery" 
            placeholder="Search tracks, artists, albums, playlists..."
            class="search-input"
            @input="handleSearchInput"
            @keydown.enter="performSearch"
            @keydown.down="navigateSuggestions('down')"
            @keydown.up="navigateSuggestions('up')"
            @keydown.escape="clearSuggestions"
          />
          <div v-if="searchQuery" class="clear-button" @click="clearSearch">
            <X />
          </div>
        </div>
        
        <!-- Search Type Selector -->
        <div class="search-type-selector">
          <select v-model="searchType" class="search-type" @change="performSearch">
            <option value="all">All</option>
            <option value="tracks">Tracks</option>
            <option value="albums">Albums</option>
            <option value="artists">Artists</option>
            <option value="playlists">Playlists</option>
          </select>
        </div>
      </div>
      
      <!-- Search Suggestions Dropdown -->
      <div v-if="showSuggestions && suggestions.length" class="suggestions-dropdown">
        <div 
          v-for="(suggestion, index) in suggestions" 
          :key="suggestion.id"
          :class="['suggestion-item', { 'active': index === selectedSuggestionIndex }]"
          @click="selectSuggestion(suggestion)"
          @mouseenter="selectedSuggestionIndex = index"
        >
          <img 
            :src="suggestion.image_url || '/icons/album-placeholder.svg'" 
            class="suggestion-image"
            @error="$event.target.src = '/icons/album-placeholder.svg'"
          />
          <div class="suggestion-info">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-subtitle">{{ suggestion.artist }}</div>
          </div>
          <div class="suggestion-type">{{ suggestion.type }}</div>
          <button 
            v-if="!isLocalContent(suggestion)"
            class="download-button"
            @click.stop="downloadItem(suggestion)"
          >
            <Download />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Search Options -->
    <div class="search-options">
      <label class="checkbox-label">
        <input 
          v-model="includeLocal" 
          type="checkbox" 
          @change="performSearch"
        />
        Include Local Library
      </label>
      <label class="checkbox-label">
        <input 
          v-model="includeGlobal" 
          type="checkbox" 
          @change="performSearch"
        />
        Include Global Catalog
      </label>
      <div class="limit-selector">
        <label>Results per type:</label>
        <select v-model.number="resultLimit" @change="performSearch">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Loader />
      <p>Searching...</p>
    </div>
    
    <!-- Search Results -->
    <div v-if="!loading && hasResults" class="search-results">
      <!-- Results Tabs -->
      <div class="results-tabs">
        <button 
          v-for="tab in availableTabs" 
          :key="tab"
          :class="['tab-button', { 'active': activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
          <span class="tab-count">({{ getTabCount(tab) }})</span>
        </button>
      </div>
      
      <!-- Results Content -->
      <div class="results-content">
        <!-- Tracks Tab -->
        <div v-if="activeTab === 'tracks'" class="tracks-results">
          <TrackList 
            :tracks="allTracks"
            :show-download="true"
            :show-popularity="true"
            :source-indicator="true"
            @download="downloadItem"
            @play="playTrack"
          />
        </div>
        
        <!-- Albums Tab -->
        <div v-if="activeTab === 'albums'" class="albums-results">
          <div class="albums-grid">
            <div 
              v-for="album in allAlbums" 
              :key="album.id"
              class="album-card"
              @click="viewAlbum(album)"
            >
              <div class="album-cover">
                <img 
                  :src="album.image_url || '/icons/album-placeholder.svg'"
                  :alt="album.title"
                  @error="$event.target.src = '/icons/album-placeholder.svg'"
                />
                <div class="album-overlay">
                  <button class="play-button" @click.stop="playAlbum(album)">
                    <Play />
                  </button>
                  <button 
                    v-if="!isLocalContent(album)"
                    class="download-overlay-button"
                    @click.stop="downloadItem(album)"
                  >
                    <Download />
                  </button>
                </div>
              </div>
              <div class="album-info">
                <h3 class="album-title">{{ album.title }}</h3>
                <p class="album-artist">{{ album.artist }}</p>
                <p class="album-meta">{{ album.release_date }} • {{ album.data?.total_tracks || 0 }} tracks</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Artists Tab -->
        <div v-if="activeTab === 'artists'" class="artists-results">
          <div class="artists-grid">
            <div 
              v-for="artist in allArtists" 
              :key="artist.id"
              class="artist-card"
              @click="viewArtist(artist)"
            >
              <div class="artist-image">
                <img 
                  :src="artist.image_url || '/icons/artist-placeholder.svg'"
                  :alt="artist.title"
                  @error="$event.target.src = '/icons/artist-placeholder.svg'"
                />
                <div class="artist-overlay">
                  <button class="follow-button">
                    <Heart />
                  </button>
                </div>
              </div>
              <div class="artist-info">
                <h3 class="artist-name">{{ artist.title }}</h3>
                <p class="artist-meta">{{ formatFollowers(artist.data?.followers) }} followers</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Playlists Tab -->
        <div v-if="activeTab === 'playlists'" class="playlists-results">
          <div class="playlists-grid">
            <div 
              v-for="playlist in allPlaylists" 
              :key="playlist.id"
              class="playlist-card"
              @click="viewPlaylist(playlist)"
            >
              <div class="playlist-cover">
                <img 
                  :src="playlist.image_url || '/icons/playlist-placeholder.svg'"
                  :alt="playlist.title"
                  @error="$event.target.src = '/icons/playlist-placeholder.svg'"
                />
                <div class="playlist-overlay">
                  <button class="play-button" @click.stop="playPlaylist(playlist)">
                    <Play />
                  </button>
                </div>
              </div>
              <div class="playlist-info">
                <h3 class="playlist-title">{{ playlist.title }}</h3>
                <p class="playlist-owner">By {{ playlist.artist }}</p>
                <p class="playlist-meta">{{ playlist.data?.tracks?.total || 0 }} tracks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Results -->
    <div v-if="!loading && !hasResults && searchQuery" class="no-results">
      <Search />
      <h3>No results found</h3>
      <p>Try different keywords or check your spelling</p>
    </div>
    
    <!-- Initial State -->
    <div v-if="!loading && !searchQuery" class="initial-state">
      <Search />
      <h3>Search Global Music Catalog</h3>
      <p>Find tracks, artists, albums, and playlists from around the world</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { usePlayer } from '@/composables/usePlayer'
import { useAuthStore } from '@/stores/auth'
import { Search, X, Download, Play, Heart, Loader } from 'lucide-vue-next'
import TrackList from '@/components/shared/TrackList.vue'

export default {
  name: 'EnhancedSearch',
  components: {
    Search,
    X,
    Download,
    Play,
    Heart,
    Loader,
    TrackList
  },
  
  setup() {
    const router = useRouter()
    const { showToast } = useToast()
    const { playTrack: playTrackInPlayer, playAlbum: playAlbumInPlayer } = usePlayer()
    const authStore = useAuthStore()
    
    // State
    const searchQuery = ref('')
    const searchType = ref('all')
    const includeLocal = ref(true)
    const includeGlobal = ref(true)
    const resultLimit = ref(20)
    const loading = ref(false)
    const searchResults = ref({ local: {}, global: {} })
    const suggestions = ref([])
    const showSuggestions = ref(false)
    const selectedSuggestionIndex = ref(-1)
    const activeTab = ref('tracks')
    const searchInput = ref(null)
    
    // Computed
    const hasResults = computed(() => {
      const localResults = searchResults.value.local || {}
      const globalResults = searchResults.value.global || {}
      
      return (
        (localResults.tracks?.length || 0) +
        (localResults.albums?.length || 0) +
        (localResults.artists?.length || 0) +
        (globalResults.tracks?.length || 0) +
        (globalResults.albums?.length || 0) +
        (globalResults.artists?.length || 0) +
        (globalResults.playlists?.length || 0)
      ) > 0
    })
    
    const availableTabs = computed(() => {
      const tabs = ['tracks']
      
      if (hasContentType('albums')) tabs.push('albums')
      if (hasContentType('artists')) tabs.push('artists')
      if (hasContentType('playlists')) tabs.push('playlists')
      
      return tabs
    })
    
    const allTracks = computed(() => {
      const tracks = []
      if (includeLocal.value && searchResults.value.local?.tracks) {
        tracks.push(...searchResults.value.local.tracks.map(track => ({ ...track, source: 'local' })))
      }
      if (includeGlobal.value && searchResults.value.global?.tracks) {
        tracks.push(...searchResults.value.global.tracks.map(track => ({ ...track, source: 'global' })))
      }
      return tracks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    })
    
    const allAlbums = computed(() => {
      const albums = []
      if (includeLocal.value && searchResults.value.local?.albums) {
        albums.push(...searchResults.value.local.albums.map(album => ({ ...album, source: 'local' })))
      }
      if (includeGlobal.value && searchResults.value.global?.albums) {
        albums.push(...searchResults.value.global.albums.map(album => ({ ...album, source: 'global' })))
      }
      return albums.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    })
    
    const allArtists = computed(() => {
      const artists = []
      if (includeLocal.value && searchResults.value.local?.artists) {
        artists.push(...searchResults.value.local.artists.map(artist => ({ ...artist, source: 'local' })))
      }
      if (includeGlobal.value && searchResults.value.global?.artists) {
        artists.push(...searchResults.value.global.artists.map(artist => ({ ...artist, source: 'global' })))
      }
      return artists.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    })
    
    const allPlaylists = computed(() => {
      const playlists = []
      if (includeLocal.value && searchResults.value.local?.playlists) {
        playlists.push(...searchResults.value.local.playlists.map(playlist => ({ ...playlist, source: 'local' })))
      }
      if (includeGlobal.value && searchResults.value.global?.playlists) {
        playlists.push(...searchResults.value.global.playlists.map(playlist => ({ ...playlist, source: 'global' })))
      }
      return playlists
    })
    
    // Methods
    const handleSearchInput = async () => {
      if (searchQuery.value.length < 2) {
        clearSuggestions()
        return
      }
      
      showSuggestions.value = true
      await fetchSuggestions()
    }
    
    const performSearch = async () => {
      if (!searchQuery.value.trim()) return
      
      loading.value = true
      clearSuggestions()
      
      try {
        const searchPromises = []
        
        if (includeGlobal.value) {
          searchPromises.push(performGlobalSearch())
        }
        
        if (includeLocal.value) {
          searchPromises.push(performLocalSearch())
        }
        
        const results = await Promise.all(searchPromises)
        
        // Combine results
        searchResults.value = {
          local: results.find(r => r?.source === 'local')?.data || {},
          global: results.find(r => r?.source === 'global')?.data || {}
        }
        
        // Set active tab based on available results
        if (allTracks.value.length > 0) {
          activeTab.value = 'tracks'
        } else if (allAlbums.value.length > 0) {
          activeTab.value = 'albums'
        } else if (allArtists.value.length > 0) {
          activeTab.value = 'artists'
        } else if (allPlaylists.value.length > 0) {
          activeTab.value = 'playlists'
        }
        
      } catch (error) {
        console.error('Search error:', error)
        showToast('Search failed. Please try again.', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const performGlobalSearch = async () => {
      try {
        const response = await fetch('/api/search/global', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery.value,
            type: searchType.value,
            limit: resultLimit.value,
            user_id: authStore.user?.id
          })
        })
        
        if (!response.ok) throw new Error('Global search failed')
        
        const data = await response.json()
        return { source: 'global', data }
      } catch (error) {
        console.error('Global search error:', error)
        return { source: 'global', data: {} }
      }
    }
    
    const performLocalSearch = async () => {
      try {
        const response = await fetch('/api/search/combined', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery.value,
            include_local: true,
            include_global: false,
            type: searchType.value,
          })
        })
        
        if (!response.ok) throw new Error('Local search failed')
        
        const data = await response.json()
        return { source: 'local', data: data.local || {} }
      } catch (error) {
        console.error('Local search error:', error)
        return { source: 'local', data: {} }
      }
    }
    
    const fetchSuggestions = async () => {
      try {
        const params = new URLSearchParams({
          q: searchQuery.value,
          type: searchType.value,
          limit: '10',
          user_id: authStore.user?.id || ''
        })
        
        const response = await fetch(`/api/search/suggestions?${params}`)
        if (!response.ok) return
        
        const data = await response.json()
        suggestions.value = data.suggestions || []
      } catch (error) {
        console.error('Suggestions error:', error)
      }
    }
    
    const selectSuggestion = (suggestion) => {
      searchQuery.value = suggestion.title
      clearSuggestions()
      performSearch()
    }
    
    const navigateSuggestions = (direction) => {
      if (!showSuggestions.value || suggestions.value.length === 0) return
      
      if (direction === 'down') {
        selectedSuggestionIndex.value = Math.min(selectedSuggestionIndex.value + 1, suggestions.value.length - 1)
      } else {
        selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
      }
      
      if (selectedSuggestionIndex.value >= 0) {
        searchQuery.value = suggestions.value[selectedSuggestionIndex.value].title
      }
    }
    
    const clearSuggestions = () => {
      showSuggestions.value = false
      suggestions.value = []
      selectedSuggestionIndex.value = -1
    }
    
    const clearSearch = () => {
      searchQuery.value = ''
      clearSuggestions()
      searchResults.value = { local: {}, global: {} }
    }
    
    const hasContentType = (type) => {
      const localResults = searchResults.value.local || {}
      const globalResults = searchResults.value.global || {}
      
      return (
        (localResults[type]?.length || 0) + (globalResults[type]?.length || 0)
      ) > 0
    }
    
    const getTabCount = (tab) => {
      switch (tab) {
        case 'tracks': return allTracks.value.length
        case 'albums': return allAlbums.value.length
        case 'artists': return allArtists.value.length
        case 'playlists': return allPlaylists.value.length
        default: return 0
      }
    }
    
    const isLocalContent = (item) => {
      return item.source === 'local' || (item.id && !item.spotify_id)
    }
    
    const downloadItem = async (item) => {
      if (isLocalContent(item)) {
        showToast('Item is already in your library', 'info')
        return
      }
      
      try {
        const response = await fetch('/api/spotify/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://open.spotify.com/${item.type}/${item.spotify_id}`,
            quality: 'flac'
          })
        })
        
        if (!response.ok) throw new Error('Download failed')
        
        const data = await response.json()
        showToast(`Added to download queue: ${item.title}`, 'success')
      } catch (error) {
        console.error('Download error:', error)
        showToast('Failed to add to download queue', 'error')
      }
    }
    
    const playTrack = (track) => {
      if (isLocalContent(track)) {
        playTrackInPlayer(track)
      } else {
        showToast('Download track to play it', 'info')
      }
    }
    
    const playAlbum = (album) => {
      if (isLocalContent(album)) {
        playAlbumInPlayer(album)
      } else {
        showToast('Download album to play it', 'info')
      }
    }
    
    const playPlaylist = (playlist) => {
      if (isLocalContent(playlist)) {
        // Handle local playlist playback
        showToast('Playing playlist', 'success')
      } else {
        showToast('Download playlist to play it', 'info')
      }
    }
    
    const viewAlbum = (album) => {
      if (isLocalContent(album)) {
        router.push({
          name: 'AlbumView',
          params: { albumhash: album.id }
        })
      } else {
        router.push({
          name: 'global-album',
          params: { id: album.spotify_id }
        })
      }
    }
    
    const viewArtist = (artist) => {
      if (isLocalContent(artist)) {
        router.push({
          name: 'ArtistView',
          params: { hash: artist.id }
        })
      } else {
        router.push({
          name: 'global-artist',
          params: { id: artist.spotify_id }
        })
      }
    }
    
    const viewPlaylist = (playlist) => {
      if (isLocalContent(playlist)) {
        router.push({
          name: 'PlaylistView',
          params: { pid: playlist.id }
        })
      } else {
        router.push({
          name: 'global-playlist',
          params: { id: playlist.spotify_id }
        })
      }
    }
    
    const formatFollowers = (followers) => {
      if (!followers) return '0'
      if (followers >= 1000000) return `${(followers / 1000000).toFixed(1)}M`
      if (followers >= 1000) return `${(followers / 1000).toFixed(1)}K`
      return followers.toString()
    }
    
    // Lifecycle
    onMounted(() => {
      // Focus search input
      nextTick(() => {
        searchInput.value?.focus()
      })
    })
    
    // Watch for search query changes
    watch(searchQuery, (newQuery) => {
      if (newQuery.length === 0) {
        clearSuggestions()
      }
    })
    
    return {
      // State
      searchQuery,
      searchType,
      includeLocal,
      includeGlobal,
      resultLimit,
      loading,
      searchResults,
      suggestions,
      showSuggestions,
      selectedSuggestionIndex,
      activeTab,
      searchInput,
      
      // Computed
      hasResults,
      availableTabs,
      allTracks,
      allAlbums,
      allArtists,
      allPlaylists,
      
      // Methods
      handleSearchInput,
      performSearch,
      selectSuggestion,
      navigateSuggestions,
      clearSuggestions,
      clearSearch,
      getTabCount,
      isLocalContent,
      downloadItem,
      playTrack,
      playAlbum,
      playPlaylist,
      viewAlbum,
      viewArtist,
      viewPlaylist,
      formatFollowers
    }
  }
}
</script>

<style scoped>
.enhanced-search {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-header {
  position: relative;
  margin-bottom: 2rem;
}

.search-container {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 2rem;
  background: var(--background);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.clear-button {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.clear-button:hover {
  background: var(--hover);
}

.search-type-selector {
  select {
    padding: 0.75rem 1rem;
    border: 2px solid var(--border);
    border-radius: 0.5rem;
    background: var(--background);
    color: var(--text-primary);
    font-size: 0.9rem;
  }
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 0.75rem;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: var(--hover);
}

.suggestion-image {
  width: 40px;
  height: 40px;
  border-radius: 0.25rem;
  object-fit: cover;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-type {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: capitalize;
  background: var(--background);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.download-button {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.download-button:hover {
  background: var(--hover);
}

.search-options {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-primary);
}

.limit-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  
  select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    background: var(--background);
    color: var(--text-primary);
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.results-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--border);
}

.tab-button {
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button:hover {
  color: var(--text-primary);
}

.tab-button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab-count {
  font-size: 0.8rem;
  opacity: 0.7;
}

.results-content {
  min-height: 400px;
}

.albums-grid,
.artists-grid,
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.album-card,
.artist-card,
.playlist-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.album-card:hover,
.artist-card:hover,
.playlist-card:hover {
  transform: translateY(-4px);
}

.album-cover,
.artist-image,
.playlist-cover {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.album-cover img,
.artist-image img,
.playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-overlay,
.artist-overlay,
.playlist-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.album-card:hover .album-overlay,
.artist-card:hover .artist-overlay,
.playlist-card:hover .playlist-overlay {
  opacity: 1;
}

.play-button,
.download-overlay-button,
.follow-button {
  background: var(--accent);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.play-button:hover,
.download-overlay-button:hover,
.follow-button:hover {
  background: var(--accent-hover);
}

.album-info,
.artist-info,
.playlist-info {
  text-align: center;
}

.album-title,
.artist-name,
.playlist-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-artist,
.playlist-owner {
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-meta,
.artist-meta,
.playlist-meta {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.no-results,
.initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  text-align: center;
}

.no-results h3,
.initial-state h3 {
  color: var(--text-primary);
  margin: 0;
}

@media (max-width: 768px) {
  .enhanced-search {
    padding: 1rem;
  }
  
  .search-container {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .search-options {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .albums-grid,
  .artists-grid,
  .playlists-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .results-tabs {
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>
