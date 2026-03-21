<template>
  <div class="music-catalog-browser">
    <!-- Header with Search -->
    <div class="catalog-header">
      <div class="search-section">
        <div class="search-bar">
          <Search class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search global catalog..."
            class="search-input"
            :disabled="loading"
            @keyup.enter="performSearch"
            @input="onSearchInput"
          />
          <button
            :disabled="!searchQuery.trim() || loading"
            class="search-button"
            @click="performSearch"
          >
            <Loader v-if="loading" class="small-loader" />
            <span v-else>Search</span>
          </button>
        </div>
        
        <!-- Search Type Filter -->
        <div class="search-filters">
          <label class="filter-label">Search type:</label>
          <select v-model="searchType" class="filter-select">
            <option value="all">All</option>
            <option value="tracks">Tracks</option>
            <option value="albums">Albums</option>
            <option value="artists">Artists</option>
            <option value="playlists">Playlists</option>
          </select>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="quick-actions">
        <button :disabled="loading" class="action-button" @click="fetchTrending">
          <TrendingUp />
          Trending
        </button>
        <button :disabled="loading" class="action-button" @click="showRecommendations">
          <Sparkles />
          For You
        </button>
      </div>
    </div>
    
    <!-- Error Display -->
    <div v-if="error" class="error-message">
      <AlertCircle />
      <span>{{ error }}</span>
      <button class="close-error" @click="clearError">×</button>
    </div>
    
    <!-- Main Content Area -->
    <div class="catalog-content">
      <!-- Search Results -->
      <div v-if="hasSearchResults" class="search-results">
        <div class="results-header">
          <h2>Search Results for "{{ searchResults?.query }}"</h2>
          <div class="result-counts">
            <span v-if="searchResultCounts.tracks" class="count-badge">
              {{ searchResultCounts.tracks }} tracks
            </span>
            <span v-if="searchResultCounts.albums" class="count-badge">
              {{ searchResultCounts.albums }} albums
            </span>
            <span v-if="searchResultCounts.artists" class="count-badge">
              {{ searchResultCounts.artists }} artists
            </span>
            <span v-if="searchResultCounts.playlists" class="count-badge">
              {{ searchResultCounts.playlists }} playlists
            </span>
          </div>
        </div>
        
        <!-- Results Tabs -->
        <div class="results-tabs">
          <button
            v-for="[type, count] in availableResultTabs"
            :key="type"
            :class="['tab-button', { active: activeResultTab === type }]"
            @click="activeResultTab = type"
          >
            {{ type.charAt(0).toUpperCase() + type.slice(1) }}
            <span class="tab-count">{{ count }}</span>
          </button>
        </div>
        
        <!-- Results Content -->
        <div class="results-content">
          <!-- Tracks Results -->
          <div v-if="activeResultTab === 'tracks'" class="tracks-results">
            <div class="track-list">
              <div
                v-for="track in searchResults?.tracks"
                :key="track.spotify_id"
                class="track-item"
                @click="playTrackPreview(track)"
              >
                <img
                  :src="track.image_url || '/icons/album-placeholder.svg'"
                  :alt="track.title"
                  class="track-image"
                  @error="$event.target.src = '/icons/album-placeholder.svg'"
                />
                <div class="track-info">
                  <h4 class="track-title">{{ track.title }}</h4>
                  <p class="track-artist">{{ track.artist }}</p>
                  <p class="track-album">{{ track.album }}</p>
                  <div class="track-meta">
                    <span class="duration">{{ formatDuration(track.duration_ms) }}</span>
                    <span class="popularity">{{ track.popularity }}/100</span>
                    <span v-if="track.explicit" class="explicit-tag">E</span>
                    <span
                      v-if="track.availability?.state"
                      class="availability-tag"
                      :class="`avail-${track.availability.state}`"
                    >
                      {{ track.availability.state }}
                    </span>
                    <span
                      v-if="track.quality_badge"
                      class="quality-tag"
                      :class="`quality-${track.quality_badge.color}`"
                    >
                      {{ track.quality_badge.label }}
                    </span>
                  </div>
                </div>
                <div class="track-actions">
                  <button class="download-btn" title="Download" @click.stop="downloadTrack(track)">
                    <Download />
                  </button>
                  <button class="queue-btn" title="Add to Queue" @click.stop="addToQueue(track)">
                    <Plus />
                  </button>
                  <a
                    :href="getSpotifyUrl(track)"
                    target="_blank"
                    class="spotify-btn"
                    title="Open in Spotify"
                    @click.stop
                  >
                    <ExternalLink />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Albums Results -->
          <div v-if="activeResultTab === 'albums'" class="albums-results">
            <div class="album-grid">
              <div
                v-for="album in searchResults?.albums"
                :key="album.spotify_id"
                class="album-card"
                @click="viewAlbumDetails(album)"
              >
                <img
                  :src="album.image_url || '/icons/album-placeholder.svg'"
                  :alt="album.title"
                  class="album-image"
                  @error="$event.target.src = '/icons/album-placeholder.svg'"
                />
                <div class="album-info">
                  <h4 class="album-title">{{ album.title }}</h4>
                  <p class="album-artist">{{ album.artist }}</p>
                  <p class="album-release">{{ album.release_date }}</p>
                  <div class="album-actions">
                    <button class="download-btn" title="Download" @click.stop="downloadAlbum(album)">
                      <Download />
                    </button>
                    <button class="view-btn" title="View Details" @click.stop="viewAlbumDetails(album)">
                      <Eye />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Artists Results -->
          <div v-if="activeResultTab === 'artists'" class="artists-results">
            <div class="artist-grid">
              <div
                v-for="artist in searchResults?.artists"
                :key="artist.spotify_id"
                class="artist-card"
                @click="viewArtistDetails(artist)"
              >
                <img
                  :src="artist.image_url || '/icons/artist-placeholder.svg'"
                  :alt="artist.title"
                  class="artist-image"
                  @error="$event.target.src = '/icons/artist-placeholder.svg'"
                />
                <div class="artist-info">
                  <h4 class="artist-name">{{ artist.title }}</h4>
                  <p class="artist-followers">{{ formatFollowers(artist.data?.followers) }} followers</p>
                  <p class="artist-popularity">{{ artist.popularity }}/100 popularity</p>
                  <div class="artist-actions">
                    <button class="view-btn" title="View Details" @click.stop="viewArtistDetails(artist)">
                      <Eye />
                    </button>
                    <button class="download-btn" title="Download Top Tracks" @click.stop="downloadArtistTopTracks(artist)">
                      <Download />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Playlists Results -->
          <div v-if="activeResultTab === 'playlists'" class="playlists-results">
            <div class="playlist-grid">
              <div
                v-for="playlist in searchResults?.playlists"
                :key="playlist.spotify_id"
                class="playlist-card"
                @click="viewPlaylistDetails(playlist)"
              >
                <img
                  :src="playlist.image_url || '/icons/playlist-placeholder.svg'"
                  :alt="playlist.title"
                  class="playlist-image"
                  @error="$event.target.src = '/icons/playlist-placeholder.svg'"
                />
                <div class="playlist-info">
                  <h4 class="playlist-title">{{ playlist.title }}</h4>
                  <p class="playlist-owner">By {{ playlist.artist }}</p>
                  <div class="playlist-actions">
                    <button class="download-btn" title="Download" @click.stop="downloadPlaylist(playlist)">
                      <Download />
                    </button>
                    <button class="view-btn" title="View Details" @click.stop="viewPlaylistDetails(playlist)">
                      <Eye />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Trending Content -->
      <div v-else-if="trendingContent" class="trending-content">
        <div class="trending-header">
          <h2>
            <TrendingUp />
            Trending {{ trendingContent.type.charAt(0).toUpperCase() + trendingContent.type.slice(1) }}
          </h2>
        </div>
        
        <!-- Display trending content based on type -->
        <div v-if="trendingContent.type === 'tracks'" class="trending-tracks">
          <div class="track-list">
            <div
              v-for="track in trendingContent.tracks"
              :key="track.spotify_id"
              class="track-item"
              @click="playTrackPreview(track)"
            >
              <!-- Similar track item structure as search results -->
              <img
                :src="track.image_url || '/icons/album-placeholder.svg'"
                :alt="track.title"
                class="track-image"
              />
              <div class="track-info">
                <h4 class="track-title">{{ track.title }}</h4>
                <p class="track-artist">{{ track.artist }}</p>
                <div class="track-meta">
                  <span class="duration">{{ formatDuration(track.duration_ms) }}</span>
                  <span class="popularity">{{ track.popularity }}/100</span>
                </div>
              </div>
              <div class="track-actions">
                <button class="download-btn" @click.stop="downloadTrack(track)">
                  <Download />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Similar structure for albums and artists -->
        <div v-else-if="trendingContent.type === 'albums'" class="trending-albums">
          <div class="album-grid">
            <div
              v-for="album in trendingContent.albums"
              :key="album.spotify_id"
              class="album-card"
              @click="viewAlbumDetails(album)"
            >
              <!-- Similar album card structure -->
            </div>
          </div>
        </div>
        
        <div v-else-if="trendingContent.type === 'artists'" class="trending-artists">
          <div class="artist-grid">
            <div
              v-for="artist in trendingContent.artists"
              :key="artist.spotify_id"
              class="artist-card"
              @click="viewArtistDetails(artist)"
            >
              <!-- Similar artist card structure -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recommendations -->
      <div v-else-if="recommendations" class="recommendations-content">
        <div class="recommendations-header">
          <h2>
            <Sparkles />
            Recommended for You
          </h2>
          <p class="recommendations-subtitle">Based on your listening history</p>
        </div>
        
        <div class="recommendations-tracks">
          <div class="track-list">
            <div
              v-for="track in recommendations.tracks"
              :key="track.spotify_id"
              class="track-item"
              @click="playTrackPreview(track)"
            >
              <!-- Track item structure -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Default State -->
      <div v-else-if="!loading" class="default-state">
        <div class="default-content">
          <Music class="default-icon" />
          <h2>Explore Global Music Catalog</h2>
          <p>Search for artists, albums, tracks, and playlists from around the world</p>
          
          <div class="quick-start-actions">
            <button class="primary-action" @click="fetchTrending">
              <TrendingUp />
              Discover Trending
            </button>
            <button class="secondary-action" @click="showRecommendations">
              <Sparkles />
              Get Recommendations
            </button>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <Loader class="large-loader" />
        <p>Loading catalog content...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import useMusicCatalogStore, { type CatalogItem } from '@/stores/music-catalog'
import useAuthStore from '@/stores/auth'
import { NotifType, Notification } from '@/stores/notification'

// Icons
import {
  Search,
  Loader,
  AlertCircle,
  Download,
  Plus,
  ExternalLink,
  Eye,
  TrendingUp,
  Sparkles,
  Music
} from 'lucide-vue-next'

// Stores
const musicCatalogStore = useMusicCatalogStore()
const authStore = useAuthStore()

// Router
const router = useRouter()

// Local state
const searchQuery = ref('')
const searchType = ref('all')
const activeResultTab = ref('tracks')
const searchDebounceTimer = ref<number | null>(null)
const previewAudio = ref<HTMLAudioElement | null>(null)

// Computed
const loading = computed(() => musicCatalogStore.loading)
const error = computed(() => musicCatalogStore.error)
const hasSearchResults = computed(() => musicCatalogStore.hasSearchResults)
const searchResults = computed(() => musicCatalogStore.searchResults)
const searchResultCounts = computed(() => musicCatalogStore.searchResultCounts)
const availableResultTabs = computed(() => {
  return Object.entries(searchResultCounts.value).filter(([, count]) => count > 0) as Array<
    [string, number]
  >
})
const trendingContent = computed(() => musicCatalogStore.trendingContent)
const recommendations = computed(() => musicCatalogStore.recommendations)

const notify = (message: string, type: NotifType = NotifType.Info) => {
  new Notification(message, type)
}

// Methods
const performSearch = async () => {
  if (!searchQuery.value.trim() || loading.value) return
  
  const userId = authStore.user?.id
  await musicCatalogStore.searchCatalog(
    searchQuery.value.trim(),
    searchType.value,
    20,
    userId
  )
  
  // Set active tab to first available result type
  if (hasSearchResults.value) {
    const counts = searchResultCounts.value
    if (counts.tracks > 0) activeResultTab.value = 'tracks'
    else if (counts.albums > 0) activeResultTab.value = 'albums'
    else if (counts.artists > 0) activeResultTab.value = 'artists'
    else if (counts.playlists > 0) activeResultTab.value = 'playlists'
  }
}

const onSearchInput = () => {
  // Clear search results when typing
  musicCatalogStore.clearSearchResults()
  
  // Debounce search
  clearTimeout(searchDebounceTimer.value)
  searchDebounceTimer.value = setTimeout(() => {
    if (searchQuery.value.trim().length >= 3) {
      performSearch()
    }
  }, 500)
}

const fetchTrending = async () => {
  const userId = authStore.user?.id
  await musicCatalogStore.fetchTrendingContent('tracks', 20, userId)
}

const showRecommendations = async () => {
  const userId = authStore.user?.id
  await musicCatalogStore.fetchRecommendations([], [], [], 20, userId)
}

const playTrackPreview = (track: CatalogItem) => {
  if (track.preview_url) {
    if (previewAudio.value) {
      previewAudio.value.pause()
      previewAudio.value = null
    }

    const audio = new Audio(track.preview_url)
    audio.volume = 0.9
    previewAudio.value = audio
    audio.play().catch(() => {
      notify('Preview playback was blocked by the browser.', NotifType.Warning)
    })
  } else {
    notify('No preview available for this track.', NotifType.Info)
  }
}

const processImportOrDownload = async (track: CatalogItem) => {
  const actionType = track.download_action?.type || track.availability?.download_action?.type
  if (actionType !== 'import_or_download' || !track.trackhash) {
    return false
  }

  try {
    const { data } = await axios.post('/api/downloads/imports/candidates', {
      trackhash: track.trackhash,
    })

    const candidates = data?.candidates || []
    if (!candidates.length) {
      return false
    }

    const shouldImport = window.confirm(
      'This song already exists on the server from another user. Import it into your library?'
    )

    if (shouldImport) {
      await axios.post('/api/downloads/imports/confirm', {
        trackhash: track.trackhash,
        source_userid: candidates[0].user_id,
      })

      notify(`Imported: ${track.title}`, NotifType.Success)
      await performSearch()
      return true
    }
  } catch (error: any) {
    const message = error?.response?.data?.error || 'Failed to load import candidates'
    notify(message, NotifType.Error)
  }

  return false
}

const downloadTrack = async (track: CatalogItem) => {
  const handledByImport = await processImportOrDownload(track)
  if (handledByImport) {
    return
  }

  // Navigate to Spotify downloader with the track URL
  const spotifyUrl = musicCatalogStore.getSpotifyUrl(track)
  router.push({
    name: 'spotify-downloader',
    query: { url: spotifyUrl }
  })
}

const downloadAlbum = async (album: CatalogItem) => {
  const spotifyUrl = musicCatalogStore.getSpotifyUrl(album)
  router.push({
    name: 'spotify-downloader',
    query: { url: spotifyUrl }
  })
}

const downloadArtistTopTracks = async (artist: CatalogItem) => {
  const spotifyUrl = musicCatalogStore.getSpotifyUrl(artist)
  router.push({
    name: 'spotify-downloader',
    query: { url: spotifyUrl }
  })
}

const downloadPlaylist = async (playlist: CatalogItem) => {
  const spotifyUrl = musicCatalogStore.getSpotifyUrl(playlist)
  router.push({
    name: 'spotify-downloader',
    query: { url: spotifyUrl }
  })
}

const addToQueue = (track: CatalogItem) => {
  notify('Global catalog tracks are not streamable yet. Queue a download first.', NotifType.Info)
  downloadTrack(track)
}

const viewAlbumDetails = async (album: CatalogItem) => {
  const userId = authStore.user?.id
  await musicCatalogStore.fetchAlbumDetails(album.spotify_id, userId)
  
  // Navigate to album view or show modal
  router.push({
    name: 'global-album',
    params: { id: album.spotify_id }
  })
}

const viewArtistDetails = async (artist: CatalogItem) => {
  const userId = authStore.user?.id
  await musicCatalogStore.fetchArtistInfo(artist.spotify_id, userId)
  
  // Navigate to artist view
  router.push({
    name: 'global-artist',
    params: { id: artist.spotify_id }
  })
}

const viewPlaylistDetails = (playlist: CatalogItem) => {
  if (!playlist.spotify_id) {
    notify('Missing Spotify playlist ID', NotifType.Error)
    return
  }

  router.push({
    name: 'global-playlist',
    params: { id: playlist.spotify_id }
  })
}

const clearError = () => {
  musicCatalogStore.clearError()
}

const formatDuration = (durationMs?: number) => {
  return musicCatalogStore.formatDuration(durationMs)
}

const formatFollowers = (followers?: number) => {
  return musicCatalogStore.formatFollowers(followers)
}

const getSpotifyUrl = (item: CatalogItem) => {
  return musicCatalogStore.getSpotifyUrl(item)
}

// Lifecycle
onMounted(async () => {
  const userId = authStore.user?.id
  if (userId) {
    // Load user preferences
    await musicCatalogStore.fetchUserPreferences(userId)
  }
})

// Watch for auth changes
watch(() => authStore.user, async (newUser) => {
  if (newUser) {
    await musicCatalogStore.fetchUserPreferences(newUser.id)
  }
})
</script>

<style scoped>
.music-catalog-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.catalog-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--accent-primary);
}

.search-icon {
  color: var(--text-secondary);
  width: 1.2rem;
  height: 1.2rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 1rem;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-button {
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover:not(:disabled) {
  background: var(--accent-hover);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.filter-select {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.9rem;
}

.quick-actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem;
  padding: 1rem;
  background: var(--error-bg);
  color: var(--error-text);
  border-radius: 0.5rem;
}

.close-error {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--error-text);
  font-size: 1.2rem;
  cursor: pointer;
}

.catalog-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.results-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.results-header h2 {
  color: var(--text-primary);
  margin: 0;
}

.result-counts {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.count-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.8rem;
}

.results-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

.tab-count {
  background: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
}

.results-content {
  margin-top: 1rem;
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.track-item:hover {
  background: var(--bg-tertiary);
}

.track-image {
  width: 3rem;
  height: 3rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  color: var(--text-secondary);
  margin: 0 0 0.125rem 0;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-album {
  color: var(--text-tertiary);
  margin: 0 0 0.25rem 0;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.explicit-tag {
  background: var(--error-bg);
  color: var(--error-text);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
}

.availability-tag,
.quality-tag {
  border-radius: 999px;
  padding: 0.1rem 0.42rem;
  font-size: 0.7rem;
  text-transform: capitalize;
}

.avail-available {
  background: rgba(84, 219, 160, 0.18);
  color: #baf9e4;
}

.avail-missing {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.8);
}

.avail-queued {
  background: rgba(105, 169, 255, 0.22);
  color: #d8e8ff;
}

.avail-failed {
  background: rgba(255, 118, 118, 0.2);
  color: #ffd4d4;
}

.quality-green {
  background: rgba(84, 219, 160, 0.2);
  color: #d4ffef;
}

.quality-blue {
  background: rgba(105, 169, 255, 0.22);
  color: #d8e8ff;
}

.quality-orange {
  background: rgba(255, 173, 92, 0.2);
  color: #ffe8cc;
}

.quality-gray {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.82);
}

.track-actions {
  display: flex;
  gap: 0.5rem;
}

.track-actions button {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.25rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.track-actions button:hover {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.album-grid,
.artist-grid,
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.album-card,
.artist-card,
.playlist-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.album-card:hover,
.artist-card:hover,
.playlist-card:hover {
  transform: translateY(-2px);
  background: var(--bg-tertiary);
}

.album-image,
.artist-image,
.playlist-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.album-info,
.artist-info,
.playlist-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.album-title,
.artist-name,
.playlist-title {
  color: var(--text-primary);
  margin: 0;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-artist,
.artist-followers,
.playlist-owner {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-release,
.artist-popularity {
  color: var(--text-tertiary);
  margin: 0;
  font-size: 0.8rem;
}

.album-actions,
.artist-actions,
.playlist-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.album-actions button,
.artist-actions button,
.playlist-actions button {
  flex: 1;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.25rem;
  padding: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.album-actions button:hover,
.artist-actions button:hover,
.playlist-actions button:hover {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.trending-content,
.recommendations-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.trending-header,
.recommendations-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trending-header h2,
.recommendations-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  margin: 0;
}

.recommendations-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.default-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.default-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
}

.default-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-tertiary);
  margin: 0 auto;
}

.default-content h2 {
  color: var(--text-primary);
  margin: 0;
}

.default-content p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.quick-start-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.primary-action,
.secondary-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-action:hover,
.secondary-action:hover {
  background: var(--accent-hover);
}

.secondary-action {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.secondary-action:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: var(--text-secondary);
}

.large-loader {
  width: 2rem;
  height: 2rem;
}

.small-loader {
  width: 1rem;
  height: 1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .catalog-header {
    padding: 1rem;
  }
  
  .search-bar {
    padding: 0.5rem;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .album-grid,
  .artist-grid,
  .playlist-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .track-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .track-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
