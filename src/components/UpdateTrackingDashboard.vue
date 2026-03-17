<!--
Update Tracking Dashboard Component

This component provides a comprehensive dashboard for managing artist update tracking,
including followed artists, recent releases, settings, and notifications.
-->

<template>
  <div class="update-tracking-dashboard">
    <!-- Header with stats -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2 class="dashboard-title">
          <Icon name="bell" class="title-icon" />
          Music Updates
        </h2>
        <div class="header-actions">
          <button 
            @click="refreshData" 
            :disabled="loading"
            class="refresh-btn"
            title="Refresh updates"
          >
            <Icon name="refresh-cw" :class="{ 'animate-spin': loading }" />
          </button>
          <button 
            @click="showSettings = true"
            class="settings-btn"
            title="Update settings"
          >
            <Icon name="settings" />
          </button>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ stats.followedArtists }}</div>
          <div class="stat-label">Followed Artists</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.newReleases }}</div>
          <div class="stat-label">New Releases</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.pendingDownloads }}</div>
          <div class="stat-label">Pending Downloads</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.unreadNotifications }}</div>
          <div class="stat-label">Unread Updates</div>
        </div>
      </div>
    </div>
    
    <!-- Update settings -->
    <div v-if="showSettings" class="settings-section">
      <div class="settings-header">
        <h3>Update Settings</h3>
        <button @click="showSettings = false" class="close-btn">
          <Icon name="x" />
        </button>
      </div>
      
      <div class="settings-grid">
        <div class="setting-item">
          <label class="setting-label">
            <input 
              type="checkbox" 
              v-model="settings.enableArtistMonitoring"
              @change="updateSettings"
              class="setting-checkbox"
            />
            Enable artist monitoring
          </label>
          <p class="setting-description">Automatically check for new releases from followed artists</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input 
              type="checkbox" 
              v-model="settings.autoDownloadFavorites"
              @change="updateSettings"
              class="setting-checkbox"
            />
            Auto-download favorite artists' releases
          </label>
          <p class="setting-description">Automatically download new releases from favorite artists</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input 
              type="checkbox" 
              v-model="settings.enableNotifications"
              @change="updateSettings"
              class="setting-checkbox"
            />
            Enable update notifications
          </label>
          <p class="setting-description">Receive notifications when new releases are discovered</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Check Frequency</label>
          <select 
            v-model="settings.checkFrequency" 
            @change="updateSettings"
            class="setting-select"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <p class="setting-description">How often to check for new releases</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Preferred Quality</label>
          <select 
            v-model="settings.qualityPreference" 
            @change="updateSettings"
            class="setting-select"
          >
            <option value="flac">FLAC (Lossless)</option>
            <option value="mp3_320">MP3 320kbps</option>
            <option value="mp3_256">MP3 256kbps</option>
            <option value="aac">AAC</option>
          </select>
          <p class="setting-description">Default quality for auto-downloads</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input 
              type="checkbox" 
              v-model="settings.excludeExplicit"
              @change="updateSettings"
              class="setting-checkbox"
            />
            Exclude explicit content
          </label>
          <p class="setting-description">Don't show or download explicit releases</p>
        </div>
      </div>
    </div>
    
    <!-- Recent updates -->
    <div class="recent-updates">
      <div class="section-header">
        <h3>Recent Updates</h3>
        <div class="section-actions">
          <select v-model="updatesFilter" @change="loadUpdates" class="filter-select">
            <option value="all">All Updates</option>
            <option value="unread">Unread Only</option>
            <option value="album">Albums</option>
            <option value="single">Singles</option>
            <option value="ep">EPs</option>
          </select>
          <button @click="markAllRead" class="mark-read-btn">
            Mark All Read
          </button>
        </div>
      </div>
      
      <div v-if="updatesLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading updates...</p>
      </div>
      
      <div v-else-if="recentUpdates.length === 0" class="empty-state">
        <Icon name="music" class="empty-icon" />
        <h3>No new updates</h3>
        <p>Follow artists to see their new releases here</p>
        <button @click="showArtistSearch = true" class="primary-btn">
          Find Artists to Follow
        </button>
      </div>
      
      <div v-else class="update-list">
        <div 
          v-for="update in recentUpdates" 
          :key="update.id"
          class="update-item"
          :class="{ 'unread': !update.read }"
        >
          <img 
            :src="update.coverImage || '/default-album-art.png'" 
            class="release-cover" 
            :alt="update.releaseTitle"
            @error="handleImageError"
          />
          
          <div class="update-info">
            <div class="release-header">
              <h4 class="release-title">{{ update.releaseTitle }}</h4>
              <span class="release-type" :class="update.releaseType">
                {{ update.releaseType.toUpperCase() }}
              </span>
            </div>
            
            <p class="artist-name">{{ update.artistName }}</p>
            <p class="release-meta">
              {{ formatDate(update.releaseDate) }} • {{ update.totalTracks }} tracks
              <span v-if="update.explicit" class="explicit-badge">E</span>
            </p>
            
            <div v-if="update.downloadStatus" class="download-status">
              <Icon :name="getDownloadStatusIcon(update.downloadStatus)" />
              <span>{{ getDownloadStatusText(update.downloadStatus) }}</span>
            </div>
          </div>
          
          <div class="update-actions">
            <button 
              v-if="!update.downloaded"
              @click="downloadRelease(update)"
              :disabled="update.downloadStatus === 'downloading'"
              class="download-btn primary"
              title="Download release"
            >
              <Icon name="download" />
              Download
            </button>
            
            <button 
              @click="playPreview(update)"
              class="preview-btn"
              title="Play preview"
            >
              <Icon name="play" />
              Preview
            </button>
            
            <button 
              @click="openSpotify(update.spotifyUrl)"
              class="spotify-btn"
              title="Open in Spotify"
            >
              <Icon name="external-link" />
            </button>
            
            <button 
              v-if="!update.read"
              @click="markAsRead(update)"
              class="mark-read-btn"
              title="Mark as read"
            >
              <Icon name="check" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Followed artists management -->
    <div class="followed-artists">
      <div class="section-header">
        <h3>Followed Artists</h3>
        <div class="section-actions">
          <button @click="showArtistSearch = true" class="primary-btn">
            <Icon name="plus" />
            Follow Artists
          </button>
          <button @click="exportFollowedArtists" class="secondary-btn">
            <Icon name="download" />
            Export
          </button>
        </div>
      </div>
      
      <div v-if="artistsLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading followed artists...</p>
      </div>
      
      <div v-else-if="followedArtists.length === 0" class="empty-state">
        <Icon name="users" class="empty-icon" />
        <h3>No followed artists</h3>
        <p>Start following artists to get updates about their new releases</p>
        <button @click="showArtistSearch = true" class="primary-btn">
          Find Artists to Follow
        </button>
      </div>
      
      <div v-else class="artist-grid">
        <div 
          v-for="artist in followedArtists" 
          :key="artist.id"
          class="artist-card"
        >
          <img 
            :src="artist.image || '/default-artist.png'" 
            class="artist-image" 
            :alt="artist.name"
            @error="handleImageError"
          />
          
          <div class="artist-info">
            <h4 class="artist-name">{{ artist.name }}</h4>
            <span class="follow-level" :class="artist.followLevel">
              {{ formatFollowLevel(artist.followLevel) }}
            </span>
            <p class="follow-date">Followed {{ formatDate(artist.followDate) }}</p>
          </div>
          
          <div class="artist-actions">
            <button 
              @click="toggleAutoDownload(artist)"
              :class="{ 'active': artist.autoDownload }"
              class="auto-download-toggle"
              :title="artist.autoDownload ? 'Disable auto-download' : 'Enable auto-download'"
            >
              <Icon name="download" />
            </button>
            
            <button 
              @click="showArtistOptions(artist)"
              class="options-btn"
              title="Artist options"
            >
              <Icon name="more-vertical" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Artist search modal -->
    <div v-if="showArtistSearch" class="modal-overlay" @click="showArtistSearch = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Find Artists to Follow</h3>
          <button @click="showArtistSearch = false" class="close-btn">
            <Icon name="x" />
          </button>
        </div>
        
        <div class="search-section">
          <div class="search-input">
            <Icon name="search" class="search-icon" />
            <input 
              v-model="artistSearchQuery"
              @input="searchArtists"
              @keyup.enter="searchArtists"
              placeholder="Search for artists..."
              class="search-field"
            />
            <button 
              @click="searchArtists"
              :disabled="!artistSearchQuery || artistSearching"
              class="search-btn"
            >
              Search
            </button>
          </div>
          
          <div v-if="artistSearching" class="search-loading">
            <div class="loading-spinner"></div>
            <p>Searching artists...</p>
          </div>
          
          <div v-else-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="artist in searchResults" 
              :key="artist.id"
              class="search-result-item"
            >
              <img 
                :src="artist.image || '/default-artist.png'" 
                class="result-image" 
                :alt="artist.name"
                @error="handleImageError"
              />
              
              <div class="result-info">
                <h4>{{ artist.name }}</h4>
                <p>{{ artist.followers.toLocaleString() }} followers</p>
                <p>{{ artist.genres.slice(0, 3).join(', ') }}</p>
              </div>
              
              <button 
                @click="followArtist(artist)"
                :disabled="artist.following"
                class="follow-btn primary"
              >
                {{ artist.following ? 'Following' : 'Follow' }}
              </button>
            </div>
          </div>
          
          <div v-else-if="artistSearchQuery && !artistSearching" class="no-results">
            <Icon name="search" class="no-results-icon" />
            <p>No artists found for "{{ artistSearchQuery }}"</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Artist options modal -->
    <div v-if="showOptionsModal" class="modal-overlay" @click="showOptionsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedArtist?.name }} - Options</h3>
          <button @click="showOptionsModal = false" class="close-btn">
            <Icon name="x" />
          </button>
        </div>
        
        <div class="options-section">
          <div class="option-item">
            <label class="option-label">Follow Level</label>
            <select 
              v-model="selectedArtistFollowLevel" 
              @change="updateArtistFollowLevel"
              class="option-select"
            >
              <option value="casual">Casual</option>
              <option value="followed">Followed</option>
              <option value="favorite">Favorite</option>
            </select>
          </div>
          
          <div class="option-item">
            <label class="option-label">
              <input 
                type="checkbox" 
                v-model="selectedArtistAutoDownload"
                @change="updateArtistAutoDownload"
                class="option-checkbox"
              />
              Auto-download new releases
            </label>
          </div>
          
          <div class="option-item">
            <label class="option-label">Preferred Quality</label>
            <select 
              v-model="selectedArtistQuality" 
              @change="updateArtistQuality"
              class="option-select"
            >
              <option value="flac">FLAC (Lossless)</option>
              <option value="mp3_320">MP3 320kbps</option>
              <option value="mp3_256">MP3 256kbps</option>
              <option value="aac">AAC</option>
            </select>
          </div>
          
          <div class="option-actions">
            <button @click="unfollowArtist" class="danger-btn">
              <Icon name="user-x" />
              Unfollow Artist
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useFetch } from '@/composables/useFetch'
import Icon from '@/components/shared/Icon.vue'

const router = useRouter()
const toast = useToast()
const { $get, $post } = useFetch()

// Reactive state
const loading = ref(false)
const updatesLoading = ref(false)
const artistsLoading = ref(false)
const artistSearching = ref(false)

// UI state
const showSettings = ref(false)
const showArtistSearch = ref(false)
const showOptionsModal = ref(false)

// Data
const stats = ref({
  followedArtists: 0,
  newReleases: 0,
  pendingDownloads: 0,
  unreadNotifications: 0
})

const settings = ref({
  enableArtistMonitoring: true,
  autoDownloadFavorites: false,
  enableNotifications: true,
  checkFrequency: 'daily',
  qualityPreference: 'flac',
  excludeExplicit: false
})

const recentUpdates = ref([])
const followedArtists = ref([])
const updatesFilter = ref('all')

// Artist search
const artistSearchQuery = ref('')
const searchResults = ref([])

// Selected artist for options
const selectedArtist = ref(null)
const selectedArtistFollowLevel = ref('followed')
const selectedArtistAutoDownload = ref(false)
const selectedArtistQuality = ref('flac')

// WebSocket connection for real-time updates
let wsConnection = null

// Methods
const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // Load stats
    const statsResponse = await $get('/api/updates/stats')
    stats.value = statsResponse.data.stats
    
    // Load updates
    await loadUpdates()
    
    // Load followed artists
    await loadFollowedArtists()
    
    // Load settings
    await loadSettings()
    
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    toast.error('Failed to load dashboard data')
  } finally {
    loading.value = false
  }
}

const loadUpdates = async () => {
  try {
    updatesLoading.value = true
    
    const params = new URLSearchParams()
    if (updatesFilter.value !== 'all') {
      if (updatesFilter.value === 'unread') {
        params.append('unread_only', 'true')
      } else {
        params.append('release_type', updatesFilter.value)
      }
    }
    
    const response = await $get(`/api/updates/recent?${params}`)
    recentUpdates.value = response.data.updates || []
    
  } catch (error) {
    console.error('Error loading updates:', error)
    toast.error('Failed to load updates')
  } finally {
    updatesLoading.value = false
  }
}

const loadFollowedArtists = async () => {
  try {
    artistsLoading.value = true
    
    const response = await $get('/api/updates/followed-artists')
    followedArtists.value = response.data.artists || []
    
  } catch (error) {
    console.error('Error loading followed artists:', error)
    toast.error('Failed to load followed artists')
  } finally {
    artistsLoading.value = false
  }
}

const loadSettings = async () => {
  try {
    const response = await $get('/api/updates/settings')
    settings.value = { ...settings.value, ...response.data }
    
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const updateSettings = async () => {
  try {
    await $post('/api/updates/settings', settings.value)
    toast.success('Settings updated successfully')
    
  } catch (error) {
    console.error('Error updating settings:', error)
    toast.error('Failed to update settings')
  }
}

const searchArtists = async () => {
  if (!artistSearchQuery.value.trim()) return
  
  try {
    artistSearching.value = true
    
    const response = await $get(`/api/updates/search/artists?q=${encodeURIComponent(artistSearchQuery.value)}`)
    searchResults.value = response.data.artists || []
    
  } catch (error) {
    console.error('Error searching artists:', error)
    toast.error('Failed to search artists')
  } finally {
    artistSearching.value = false
  }
}

const followArtist = async (artist) => {
  try {
    await $post('/api/updates/follow-artist', {
      artist_id: artist.id,
      artist_name: artist.name,
      follow_level: 'followed',
      auto_download: false,
      preferred_quality: settings.value.qualityPreference
    })
    
    // Update UI
    artist.following = true
    toast.success(`Now following ${artist.name}`)
    
    // Refresh data
    await loadDashboardData()
    
  } catch (error) {
    console.error('Error following artist:', error)
    toast.error('Failed to follow artist')
  }
}

const unfollowArtist = async () => {
  if (!selectedArtist.value) return
  
  try {
    await $post('/api/updates/unfollow-artist', {
      artist_id: selectedArtist.value.id
    })
    
    toast.success(`Unfollowed ${selectedArtist.value.name}`)
    showOptionsModal.value = false
    
    // Refresh data
    await loadDashboardData()
    
  } catch (error) {
    console.error('Error unfollowing artist:', error)
    toast.error('Failed to unfollow artist')
  }
}

const downloadRelease = async (update) => {
  try {
    await $post(`/api/updates/auto-download/${update.releaseId}`)
    toast.success('Download queued successfully')
    
    // Update local state
    update.downloadStatus = 'queued'
    
  } catch (error) {
    console.error('Error downloading release:', error)
    toast.error('Failed to queue download')
  }
}

const markAsRead = async (update) => {
  try {
    await $post(`/api/updates/release/${update.releaseId}/mark-read`)
    update.read = true
    
    // Update stats
    stats.value.unreadNotifications = Math.max(0, stats.value.unreadNotifications - 1)
    
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

const markAllRead = async () => {
  try {
    await $post('/api/updates/notifications/mark-all-read')
    
    // Update all updates as read
    recentUpdates.value.forEach(update => {
      update.read = true
    })
    
    stats.value.unreadNotifications = 0
    toast.success('All updates marked as read')
    
  } catch (error) {
    console.error('Error marking all as read:', error)
    toast.error('Failed to mark all as read')
  }
}

const toggleAutoDownload = async (artist) => {
  try {
    const newAutoDownload = !artist.autoDownload
    await $post('/api/updates/artist/' + artist.id, {
      auto_download: newAutoDownload
    })
    
    artist.autoDownload = newAutoDownload
    toast.success(`${newAutoDownload ? 'Enabled' : 'Disabled'} auto-download for ${artist.name}`)
    
  } catch (error) {
    console.error('Error toggling auto-download:', error)
    toast.error('Failed to update auto-download setting')
  }
}

const showArtistOptions = async (artist) => {
  selectedArtist.value = artist
  selectedArtistFollowLevel.value = artist.followLevel
  selectedArtistAutoDownload.value = artist.autoDownload
  selectedArtistQuality.value = artist.preferredQuality || settings.value.qualityPreference
  showOptionsModal.value = true
}

const updateArtistFollowLevel = async () => {
  if (!selectedArtist.value) return
  
  try {
    await $post(`/api/updates/artist/${selectedArtist.value.id}`, {
      follow_level: selectedArtistFollowLevel.value
    })
    
    selectedArtist.value.followLevel = selectedArtistFollowLevel.value
    toast.success('Follow level updated')
    
  } catch (error) {
    console.error('Error updating follow level:', error)
    toast.error('Failed to update follow level')
  }
}

const updateArtistAutoDownload = async () => {
  if (!selectedArtist.value) return
  
  try {
    await $post(`/api/updates/artist/${selectedArtist.value.id}`, {
      auto_download: selectedArtistAutoDownload.value
    })
    
    selectedArtist.value.autoDownload = selectedArtistAutoDownload.value
    toast.success('Auto-download setting updated')
    
  } catch (error) {
    console.error('Error updating auto-download:', error)
    toast.error('Failed to update auto-download setting')
  }
}

const updateArtistQuality = async () => {
  if (!selectedArtist.value) return
  
  try {
    await $post(`/api/updates/artist/${selectedArtist.value.id}`, {
      preferred_quality: selectedArtistQuality.value
    })
    
    selectedArtist.value.preferredQuality = selectedArtistQuality.value
    toast.success('Quality preference updated')
    
  } catch (error) {
    console.error('Error updating quality preference:', error)
    toast.error('Failed to update quality preference')
  }
}

const exportFollowedArtists = async () => {
  try {
    const response = await $get('/api/updates/export/followed-artists?format=json')
    const data = JSON.stringify(response.data.followed_artists, null, 2)
    
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'followed_artists.json'
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Followed artists exported successfully')
    
  } catch (error) {
    console.error('Error exporting followed artists:', error)
    toast.error('Failed to export followed artists')
  }
}

const playPreview = (update) => {
  // This would integrate with the music player
  toast.info('Preview feature coming soon')
}

const openSpotify = (url) => {
  window.open(url, '_blank')
}

const refreshData = async () => {
  await loadDashboardData()
  toast.success('Dashboard refreshed')
}

const handleImageError = (event) => {
  event.target.src = '/default-album-art.png'
}

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const formatFollowLevel = (level) => {
  const levelMap = {
    'casual': 'Casual',
    'followed': 'Following',
    'favorite': '⭐ Favorite'
  }
  return levelMap[level] || level
}

const getDownloadStatusIcon = (status) => {
  const iconMap = {
    'pending': 'clock',
    'queued': 'list',
    'downloading': 'download',
    'completed': 'check-circle',
    'failed': 'x-circle'
  }
  return iconMap[status] || 'clock'
}

const getDownloadStatusText = (status) => {
  const textMap = {
    'pending': 'Pending',
    'queued': 'Queued',
    'downloading': 'Downloading',
    'completed': 'Completed',
    'failed': 'Failed'
  }
  return textMap[status] || status
}

// WebSocket connection for real-time updates
const connectWebSocket = () => {
  try {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/updates`
    wsConnection = new WebSocket(wsUrl)
    
    wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'new_update') {
        // Add new update to the list
        recentUpdates.value.unshift(data.update)
        stats.value.newReleases++
        stats.value.unreadNotifications++
        
        toast.info(`New release: ${data.update.releaseTitle} by ${data.update.artistName}`)
      } else if (data.type === 'download_progress') {
        // Update download progress
        const update = recentUpdates.value.find(u => u.releaseId === data.releaseId)
        if (update) {
          update.downloadStatus = data.status
          update.progress = data.progress
        }
      }
    }
    
    wsConnection.onclose = () => {
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000)
    }
    
  } catch (error) {
    console.error('WebSocket connection error:', error)
  }
}

// Lifecycle hooks
onMounted(async () => {
  await loadDashboardData()
  connectWebSocket()
})

onUnmounted(() => {
  if (wsConnection) {
    wsConnection.close()
  }
})
</script>

<style scoped>
.update-tracking-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Styles */
.dashboard-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.title-icon {
  width: 2rem;
  height: 2rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn,
.settings-btn {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--background-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover,
.settings-btn:hover {
  background: var(--background-hover);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent-color);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Settings Section */
.settings-section {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.settings-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.close-btn:hover {
  background: var(--background-hover);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

.setting-checkbox {
  width: 1rem;
  height: 1rem;
}

.setting-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-primary);
  color: var(--text-primary);
}

.setting-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Section Styles */
.recent-updates,
.followed-artists {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.section-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-primary);
  color: var(--text-primary);
}

.mark-read-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
}

/* Loading and Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-icon,
.no-results-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
}

/* Update List */
.update-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.update-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.update-item:hover {
  border-color: var(--accent-color);
}

.update-item.unread {
  border-left: 4px solid var(--accent-color);
}

.release-cover {
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  object-fit: cover;
}

.update-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.release-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.release-title {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.release-type {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.release-type.album {
  background: var(--accent-color);
  color: white;
}

.release-type.single {
  background: var(--success-color);
  color: white;
}

.release-type.ep {
  background: var(--warning-color);
  color: white;
}

.artist-name {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.release-meta {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.explicit-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: var(--error-color);
  color: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.download-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.update-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.update-actions button {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.update-actions button:hover {
  background: var(--background-hover);
}

.download-btn.primary {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.download-btn.primary:hover {
  background: var(--accent-hover);
}

/* Artist Grid */
.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.artist-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.artist-card:hover {
  border-color: var(--accent-color);
}

.artist-image {
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  object-fit: cover;
}

.artist-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.artist-info .artist-name {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.follow-level {
  font-size: 0.875rem;
  font-weight: 500;
}

.follow-level.favorite {
  color: var(--accent-color);
}

.follow-date {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.artist-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.auto-download-toggle {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.auto-download-toggle.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.options-btn {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-primary);
  color: var(--text-primary);
  cursor: pointer;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

/* Search Section */
.search-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--background-secondary);
}

.search-icon {
  color: var(--text-secondary);
}

.search-field {
  flex: 1;
  border: none;
  background: none;
  color: var(--text-primary);
  outline: none;
}

.search-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--accent-color);
  border-radius: 0.375rem;
  background: var(--accent-color);
  color: white;
  cursor: pointer;
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  align-items: center;
}

.result-image {
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  object-fit: cover;
}

.result-info {
  flex: 1;
}

.result-info h4 {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
}

.result-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.follow-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--accent-color);
  border-radius: 0.375rem;
  background: var(--accent-color);
  color: white;
  cursor: pointer;
  font-weight: 500;
}

.follow-btn:disabled {
  background: var(--background-secondary);
  color: var(--text-secondary);
  border-color: var(--border-color);
  cursor: not-allowed;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.no-results-icon {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

/* Options Section */
.options-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

.option-checkbox {
  width: 1rem;
  height: 1rem;
}

.option-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-primary);
  color: var(--text-primary);
}

.option-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.danger-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--error-color);
  border-radius: 0.375rem;
  background: var(--error-color);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.danger-btn:hover {
  background: #dc2626;
}

/* Button Styles */
.primary-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--accent-color);
  border-radius: 0.375rem;
  background: var(--accent-color);
  color: white;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.secondary-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .update-tracking-dashboard {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .update-item {
    flex-direction: column;
  }
  
  .update-actions {
    justify-content: flex-start;
  }
  
  .artist-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
