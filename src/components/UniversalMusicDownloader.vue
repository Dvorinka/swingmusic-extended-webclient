<template>
  <div class="universal-music-downloader">
    <!-- Header -->
    <div class="downloader-header">
      <h1 class="title">
        <Download /> Music Downloader
      </h1>
      <p class="subtitle">Download music from Spotify, Apple Music, YouTube, and more</p>
    </div>
    
    <!-- URL Input Section -->
    <div class="url-input-section">
      <div class="input-container">
        <div class="url-input-wrapper">
          <Link class="input-icon" />
          <input 
            ref="urlInput"
            v-model="urlInput" 
            @input="handleUrlInput"
            @keydown.enter="validateAndAddUrl"
            @paste="handlePaste"
            placeholder="Paste Spotify, Apple Music, YouTube, or other music service links..."
            class="url-input"
          />
          <div v-if="urlInput" @click="clearUrl" class="clear-button">
            <X />
          </div>
        </div>
        
        <!-- Service Detection -->
        <div v-if="detectedService" class="service-detected">
          <div class="service-badge" :class="detectedService.service.value">
            <component :is="getServiceIcon(detectedService.service.value)" class="service-icon" />
            <span>{{ getServiceName(detectedService.service.value) }}</span>
          </div>
          <span class="item-type">{{ detectedService.item_type }}</span>
        </div>
      </div>
      
      <!-- Quality Selector -->
      <div class="quality-selector">
        <label class="selector-label">Quality:</label>
        <select v-model="selectedQuality" class="quality-select">
          <option value="lossless">Lossless (FLAC)</option>
          <option value="high">High (320kbps)</option>
          <option value="medium">Medium (192kbps)</option>
          <option value="low">Low (128kbps)</option>
        </select>
      </div>
      
      <!-- Add Button -->
      <button 
        @click="validateAndAddUrl" 
        :disabled="!urlInput || addingUrl"
        class="add-button"
      >
        <Plus v-if="!addingUrl" />
        <Loader v-else class="small-loader" />
        {{ addingUrl ? 'Adding...' : 'Add to Queue' }}
      </button>
    </div>
    
    <!-- URL Preview -->
    <div v-if="urlPreview" class="url-preview">
      <div class="preview-card">
        <img 
          :src="urlPreview.image_url || '/icons/album-placeholder.svg'" 
          class="preview-image"
          @error="$event.target.src = '/icons/album-placeholder.svg'"
        />
        <div class="preview-info">
          <h3 class="preview-title">{{ urlPreview.title }}</h3>
          <p class="preview-artist">{{ urlPreview.artist }}</p>
          <p v-if="urlPreview.album" class="preview-album">{{ urlPreview.album }}</p>
          <div class="preview-meta">
            <span class="service-tag">{{ getServiceName(urlPreview.service) }}</span>
            <span v-if="urlPreview.duration_ms" class="duration">
              {{ formatDuration(urlPreview.duration_ms) }}
            </span>
          </div>
        </div>
        <button 
          @click="addToQueue" 
          :disabled="addingToQueue"
          class="preview-add-button"
        >
          <Download v-if="!addingToQueue" />
          <Loader v-else class="small-loader" />
          {{ addingToQueue ? 'Adding...' : 'Download' }}
        </button>
      </div>
    </div>
    
    <!-- Batch URL Input -->
    <div class="batch-section">
      <div class="batch-header">
        <h3>Batch Download</h3>
        <button 
          @click="toggleBatchMode" 
          class="batch-toggle"
        >
          <List />
          {{ showBatchMode ? 'Hide' : 'Show' }} Batch Mode
        </button>
      </div>
      
      <div v-if="showBatchMode" class="batch-input-area">
        <textarea
          v-model="batchUrls"
          @input="parseBatchUrls"
          placeholder="Paste multiple URLs, one per line..."
          class="batch-textarea"
          rows="6"
        ></textarea>
        
        <div class="batch-actions">
          <span class="url-count">
            {{ parsedUrls.length }} URLs detected
          </span>
          <button 
            @click="addBatchToQueue" 
            :disabled="parsedUrls.length === 0 || addingBatch"
            class="batch-add-button"
          >
            <Download v-if="!addingBatch" />
            <Loader v-else class="small-loader" />
            {{ addingBatch ? `Adding ${parsedUrls.length} URLs...` : 'Add All to Queue' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Supported Services -->
    <div class="supported-services">
      <h3>Supported Services</h3>
      <div class="services-grid">
        <div 
          v-for="service in supportedServices" 
          :key="service.id"
          :class="['service-card', { 'disabled': !service.enabled }]"
        >
          <component :is="getServiceIcon(service.id)" class="service-logo" />
          <h4>{{ service.name }}</h4>
          <p>{{ service.display_name }}</p>
          <div class="service-features">
            <span 
              v-for="feature in service.features" 
              :key="feature"
              class="feature-tag"
            >
              {{ feature }}
            </span>
          </div>
          <div class="service-types">
            <span 
              v-for="type in service.supported_types" 
              :key="type"
              class="type-tag"
            >
              {{ type }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Queue Status -->
    <div class="queue-status">
      <div class="status-header">
        <h3>Download Queue</h3>
        <button @click="refreshQueue" class="refresh-button">
          <RefreshCw />
        </button>
      </div>
      
      <div class="queue-stats">
        <div class="stat-item">
          <span class="stat-number">{{ queueStatus.queue_length || 0 }}</span>
          <span class="stat-label">Queued</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ queueStatus.active_downloads || 0 }}</span>
          <span class="stat-label">Active</span>
        </div>
      </div>
      
      <!-- Queue Items -->
      <div v-if="queueStatus.queue && queueStatus.queue.length" class="queue-items">
        <div 
          v-for="item in queueStatus.queue" 
          :key="item.id"
          class="queue-item"
        >
          <img 
            :src="item.image_url || '/icons/album-placeholder.svg'" 
            class="item-image"
            @error="$event.target.src = '/icons/album-placeholder.svg'"
          />
          <div class="item-info">
            <h4 class="item-title">{{ item.title }}</h4>
            <p class="item-artist">{{ item.artist }}</p>
            <div class="item-meta">
              <span class="service-badge small" :class="item.service">
                {{ getServiceName(item.service) }}
              </span>
              <span class="quality-badge">{{ item.quality }}</span>
              <span class="status-badge" :class="item.status">
                {{ item.status }}
              </span>
            </div>
          </div>
          <div class="item-progress">
            <div v-if="item.status === 'downloading'" class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: item.progress + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ item.progress }}%</span>
          </div>
          <div class="item-actions">
            <button 
              v-if="item.status === 'pending'"
              @click="cancelDownload(item.id)"
              class="action-button cancel"
            >
              <X />
            </button>
            <button 
              v-if="item.status === 'failed'"
              @click="retryDownload(item.id)"
              class="action-button retry"
            >
              <RefreshCw />
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="!queueStatus.queue || queueStatus.queue.length === 0" class="empty-queue">
        <Download />
        <p>No downloads in queue</p>
        <p>Add URLs above to get started</p>
      </div>
    </div>
    
    <!-- Recent Downloads -->
    <div class="recent-downloads">
      <h3>Recent Downloads</h3>
      <div v-if="recentDownloads.length" class="recent-grid">
        <div 
          v-for="item in recentDownloads" 
          :key="item.id"
          class="recent-item"
        >
          <img 
            :src="item.image_url || '/icons/album-placeholder.svg'" 
            class="recent-image"
            @error="$event.target.src = '/icons/album-placeholder.svg'"
          />
          <div class="recent-info">
            <h4 class="recent-title">{{ item.title }}</h4>
            <p class="recent-artist">{{ item.artist }}</p>
            <div class="recent-meta">
              <span class="service-badge small" :class="item.service">
                {{ getServiceName(item.service) }}
              </span>
              <span class="completion-time">
                {{ formatTime(item.completed_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-recent">
        <Clock />
        <p>No recent downloads</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useToast } from '@/composables/useToast'
import { 
  Music, 
  Link, 
  Plus, 
  Download, 
  Loader, 
  X, 
  List, 
  RefreshCw,
  Clock
} from 'lucide-vue-next'

// Service icons (these would be actual components or SVGs)
const serviceIcons = {
  spotify: 'SpotifyIcon',
  tidal: 'TidalIcon',
  apple_music: 'AppleMusicIcon',
  youtube_music: 'YouTubeMusicIcon',
  youtube: 'YouTubeIcon',
  soundcloud: 'SoundCloudIcon',
  deezer: 'DeezerIcon',
  bandcamp: 'BandcampIcon'
}

export default {
  name: 'UniversalMusicDownloader',
  components: {
    Music,
    Link,
    Plus,
    Download,
    Loader,
    X,
    List,
    RefreshCw,
    Clock
  },
  
  setup() {
    const { showToast } = useToast()
    
    // State
    const urlInput = ref('')
    const detectedService = ref(null)
    const urlPreview = ref(null)
    const selectedQuality = ref('high')
    const addingUrl = ref(false)
    const addingToQueue = ref(false)
    const showBatchMode = ref(false)
    const batchUrls = ref('')
    const parsedUrls = ref([])
    const addingBatch = ref(false)
    const queueStatus = ref({})
    const recentDownloads = ref([])
    const supportedServices = ref([])
    
    // Methods
    const handleUrlInput = () => {
      const url = urlInput.value.trim()
      if (url.length < 10) {
        detectedService.value = null
        urlPreview.value = null
        return
      }
      
      // Detect service from URL
      fetch('/api/universal/validate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          detectedService.value = data
          // Get metadata preview
          getMetadataPreview(url)
        } else {
          detectedService.value = null
          urlPreview.value = null
        }
      })
      .catch(error => {
        console.error('URL validation error:', error)
        detectedService.value = null
        urlPreview.value = null
      })
    }
    
    const getMetadataPreview = (url) => {
      fetch('/api/universal/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          urlPreview.value = data
        }
      })
      .catch(error => {
        console.error('Metadata error:', error)
      })
    }
    
    const validateAndAddUrl = () => {
      if (!urlInput.value.trim() || addingUrl.value) return
      
      addingUrl.value = true
      
      fetch('/api/universal/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlInput.value.trim(),
          quality: selectedQuality.value
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showToast(`Added to download queue: ${data.item_type} from ${getServiceName(data.service)}`, 'success')
          clearUrl()
          refreshQueue()
        } else {
          showToast(data.error || 'Failed to add to queue', 'error')
        }
      })
      .catch(error => {
        console.error('Download error:', error)
        showToast('Failed to add to download queue', 'error')
      })
      .finally(() => {
        addingUrl.value = false
      })
    }
    
    const addToQueue = () => {
      if (!urlPreview.value || addingToQueue.value) return
      
      addingToQueue.value = true
      
      fetch('/api/universal/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlPreview.value.original_url,
          quality: selectedQuality.value
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showToast(`Added to download queue: ${urlPreview.value.title}`, 'success')
          clearUrl()
          refreshQueue()
        } else {
          showToast(data.error || 'Failed to add to queue', 'error')
        }
      })
      .catch(error => {
        console.error('Download error:', error)
        showToast('Failed to add to download queue', 'error')
      })
      .finally(() => {
        addingToQueue.value = false
      })
    }
    
    const clearUrl = () => {
      urlInput.value = ''
      detectedService.value = null
      urlPreview.value = null
    }
    
    const handlePaste = (event) => {
      // Handle paste event with potential multiple URLs
      const pastedText = event.clipboardData.getData('text')
      const urls = pastedText.split('\n').filter(url => url.trim().length > 10)
      
      if (urls.length > 1) {
        event.preventDefault()
        batchUrls.value = pastedText
        showBatchMode.value = true
        parseBatchUrls()
      }
    }
    
    const toggleBatchMode = () => {
      showBatchMode.value = !showBatchMode.value
    }
    
    const parseBatchUrls = () => {
      const urls = batchUrls.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 10)
      
      parsedUrls.value = urls
    }
    
    const addBatchToQueue = () => {
      if (parsedUrls.value.length === 0 || addingBatch.value) return
      
      addingBatch.value = true
      
      fetch('/api/universal/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: parsedUrls.value,
          quality: selectedQuality.value
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.successful > 0) {
          showToast(`Added ${data.successful} URLs to download queue`, 'success')
        }
        
        if (data.failed > 0) {
          showToast(`${data.failed} URLs failed to add`, 'error')
        }
        
        batchUrls.value = ''
        parsedUrls.value = []
        showBatchMode.value = false
        refreshQueue()
      })
      .catch(error => {
        console.error('Batch download error:', error)
        showToast('Failed to add URLs to queue', 'error')
      })
      .finally(() => {
        addingBatch.value = false
      })
    }
    
    const refreshQueue = () => {
      fetch('/api/universal/queue')
        .then(response => response.json())
        .then(data => {
          queueStatus.value = data
        })
        .catch(error => {
          console.error('Queue refresh error:', error)
        })
    }
    
    const cancelDownload = (itemId) => {
      fetch(`/api/universal/queue/${itemId}/cancel`, {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showToast('Download cancelled', 'success')
          refreshQueue()
        }
      })
      .catch(error => {
        console.error('Cancel error:', error)
        showToast('Failed to cancel download', 'error')
      })
    }
    
    const retryDownload = (itemId) => {
      fetch(`/api/universal/queue/${itemId}/retry`, {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showToast('Download retry added to queue', 'success')
          refreshQueue()
        }
      })
      .catch(error => {
        console.error('Retry error:', error)
        showToast('Failed to retry download', 'error')
      })
    }
    
    const loadSupportedServices = () => {
      fetch('/api/universal/services')
        .then(response => response.json())
        .then(data => {
          supportedServices.value = data.services
        })
        .catch(error => {
          console.error('Services load error:', error)
        })
    }
    
    const getServiceIcon = (serviceId) => {
      // Return appropriate icon component
      return serviceIcons[serviceId] || 'Music'
    }
    
    const getServiceName = (serviceId) => {
      const service = supportedServices.value.find(s => s.id === serviceId)
      return service ? service.name : serviceId
    }
    
    const formatDuration = (ms) => {
      const minutes = Math.floor(ms / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp * 1000)
      return date.toLocaleString()
    }
    
    // Lifecycle
    onMounted(() => {
      loadSupportedServices()
      refreshQueue()
      
      // Focus URL input
      nextTick(() => {
        urlInput.value?.focus()
      })
    })
    
    return {
      // State
      urlInput,
      detectedService,
      urlPreview,
      selectedQuality,
      addingUrl,
      addingToQueue,
      showBatchMode,
      batchUrls,
      parsedUrls,
      addingBatch,
      queueStatus,
      recentDownloads,
      supportedServices,
      
      // Methods
      handleUrlInput,
      validateAndAddUrl,
      addToQueue,
      clearUrl,
      handlePaste,
      toggleBatchMode,
      parseBatchUrls,
      addBatchToQueue,
      refreshQueue,
      cancelDownload,
      retryDownload,
      loadSupportedServices,
      getServiceIcon,
      getServiceName,
      formatDuration,
      formatTime
    }
  }
}
</script>

<style scoped>
.universal-music-downloader {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.downloader-header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.url-input-section {
  background: var(--surface);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.input-container {
  margin-bottom: 1.5rem;
}

.url-input-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.url-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 0.75rem;
  background: var(--background);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.url-input:focus {
  outline: none;
  border-color: var(--accent);
}

.clear-button {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
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

.service-detected {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.service-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.service-badge.spotify {
  background: #1DB954;
  color: white;
}

.service-badge.tidal {
  background: #000000;
  color: white;
}

.service-badge.apple_music {
  background: #FA243C;
  color: white;
}

.service-badge.youtube {
  background: #FF0000;
  color: white;
}

.service-icon {
  width: 16px;
  height: 16px;
}

.item-type {
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: capitalize;
}

.quality-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.selector-label {
  font-weight: 600;
  color: var(--text-primary);
}

.quality-select {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  border-radius: 0.5rem;
  background: var(--background);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.add-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-button:hover:not(:disabled) {
  background: var(--accent-hover);
}

.add-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.small-loader {
  width: 16px;
  height: 16px;
}

.url-preview {
  margin-bottom: 2rem;
}

.preview-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--surface);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  object-fit: cover;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-artist,
.preview-album {
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.service-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.duration {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.preview-add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.preview-add-button:hover:not(:disabled) {
  background: var(--accent-hover);
}

.batch-section {
  background: var(--surface);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.batch-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.batch-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--background);
  border: 2px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.batch-toggle:hover {
  border-color: var(--accent);
}

.batch-input-area {
  margin-bottom: 1rem;
}

.batch-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border);
  border-radius: 0.5rem;
  background: var(--background);
  color: var(--text-primary);
  font-family: monospace;
  resize: vertical;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.url-count {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.batch-add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.batch-add-button:hover:not(:disabled) {
  background: var(--accent-hover);
}

.supported-services {
  margin-bottom: 2rem;
}

.supported-services h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.service-card {
  background: var(--surface);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s;
  border: 2px solid transparent;
}

.service-card:hover:not(.disabled) {
  transform: translateY(-2px);
  border-color: var(--accent);
}

.service-card.disabled {
  opacity: 0.5;
}

.service-logo {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
}

.service-card h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.service-card p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.service-features,
.service-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.feature-tag,
.type-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.feature-tag {
  background: var(--accent);
  color: white;
}

.type-tag {
  background: var(--background);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.queue-status {
  background: var(--surface);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.status-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--background);
  border: 2px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-button:hover {
  border-color: var(--accent);
}

.queue-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.queue-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--background);
  border-radius: 0.75rem;
  border: 1px solid var(--border);
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.service-badge.small {
  padding: 0.125rem 0.5rem;
  font-size: 0.7rem;
}

.quality-badge {
  padding: 0.125rem 0.5rem;
  background: var(--background);
  color: var(--text-secondary);
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #f59e0b;
  color: white;
}

.status-badge.downloading {
  background: #3b82f6;
  color: white;
}

.status-badge.completed {
  background: #10b981;
  color: white;
}

.status-badge.failed {
  background: #ef4444;
  color: white;
}

.item-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 100px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button.cancel {
  background: #ef4444;
  color: white;
}

.action-button.retry {
  background: #f59e0b;
  color: white;
}

.action-button:hover {
  opacity: 0.8;
}

.empty-queue,
.empty-recent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  color: var(--text-secondary);
  text-align: center;
}

.recent-downloads h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.recent-item {
  background: var(--surface);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  transition: transform 0.2s;
}

.recent-item:hover {
  transform: translateY(-2px);
}

.recent-image {
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  object-fit: cover;
  margin-bottom: 0.75rem;
}

.recent-info {
  min-width: 0;
}

.recent-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-artist {
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
}

.completion-time {
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .universal-music-downloader {
    padding: 1rem;
  }
  
  .services-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }
  
  .queue-stats {
    gap: 1rem;
  }
  
  .queue-item {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .item-progress {
    width: 100%;
  }
  
  .recent-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }
}
</style>
