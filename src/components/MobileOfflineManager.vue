<!--
MobileOfflineManager Component

This component provides comprehensive mobile offline management including:
- Device registration and management
- Offline library management
- Sync progress tracking
- Storage management and cleanup
- Quality settings and preferences
-->

<template>
  <div class="mobile-offline-manager">
    <!-- Header -->
    <div class="offline-header">
      <div class="header-content">
        <h1 class="offline-title">
          <Icon name="smartphone" class="title-icon" />
          Mobile Offline Mode
        </h1>
        <p class="offline-subtitle">Manage your mobile devices and offline music library</p>
      </div>
      
      <!-- Device Selector -->
      <div class="device-selector" v-if="devices.length > 0">
        <label class="selector-label">Device:</label>
        <select v-model="selectedDeviceId" @change="loadDeviceData" class="device-select">
          <option v-for="device in devices" :key="device.device_id" :value="device.device_id">
            {{ device.name }} ({{ device.type }})
          </option>
        </select>
        <button @click="showAddDeviceModal = true" class="add-device-btn">
          <Icon name="plus" />
          Add Device
        </button>
      </div>
    </div>

    <!-- No Devices State -->
    <div v-if="devices.length === 0" class="no-devices-state">
      <div class="no-devices-content">
        <Icon name="smartphone" class="no-devices-icon" />
        <h2>No Mobile Devices Registered</h2>
        <p>Register your mobile device to start building your offline music library</p>
        <button @click="showAddDeviceModal = true" class="add-device-primary-btn">
          <Icon name="plus" />
          Register Mobile Device
        </button>
      </div>
    </div>

    <!-- Device Content -->
    <div v-else-if="selectedDevice" class="device-content">
      <!-- Device Overview -->
      <section class="device-overview">
        <div class="device-header">
          <div class="device-info">
            <h2 class="device-name">{{ selectedDevice.name }}</h2>
            <div class="device-meta">
              <span class="device-type">{{ selectedDevice.type }}</span>
              <span class="sync-status" :class="selectedDevice.sync_status">
                {{ formatSyncStatus(selectedDevice.sync_status) }}
              </span>
              <span v-if="selectedDevice.last_sync" class="last-sync">
                Last sync: {{ formatDate(selectedDevice.last_sync) }}
              </span>
            </div>
          </div>
          <div class="device-actions">
            <button @click="forceSyncNow" :disabled="syncing" class="sync-btn">
              <Icon name="refresh-cw" :class="{ 'animate-spin': syncing }" />
              {{ syncing ? 'Syncing...' : 'Force Sync' }}
            </button>
            <button @click="showDeviceSettings = true" class="settings-btn">
              <Icon name="settings" />
              Settings
            </button>
          </div>
        </div>

        <!-- Storage Overview -->
        <div class="storage-overview">
          <div class="storage-header">
            <h3>Storage Usage</h3>
            <div class="storage-stats">
              <span class="usage-percentage">{{ storageUsage.usage_percentage }}%</span>
              <span class="storage-size">{{ formatBytes(storageUsage.used_space) }} / {{ formatBytes(storageUsage.total_capacity) }}</span>
            </div>
          </div>
          <div class="storage-bar">
            <div class="storage-fill" :style="{ width: storageUsage.usage_percentage + '%' }"></div>
          </div>
          <div class="storage-details">
            <div class="storage-item">
              <Icon name="music" />
              <span>Offline Tracks</span>
              <span>{{ formatBytes(storageUsage.offline_tracks_size) }} ({{ storageUsage.offline_tracks_count }} tracks)</span>
            </div>
            <div class="storage-item">
              <Icon name="database" />
              <span>Other Data</span>
              <span>{{ formatBytes(storageUsage.other_data_size) }}</span>
            </div>
            <div class="storage-item">
              <Icon name="hard-drive" />
              <span>Available</span>
              <span>{{ formatBytes(storageUsage.available_space) }}</span>
            </div>
          </div>
          <div v-if="storageUsage.needs_cleanup" class="storage-warning">
            <Icon name="alert-triangle" />
            <span>Storage nearly full. Consider cleaning up old content.</span>
            <button @click="showCleanupModal = true" class="cleanup-btn">Cleanup</button>
          </div>
        </div>
      </section>

      <!-- Sync Progress -->
      <section v-if="syncProgress.total_items > 0" class="sync-progress-section">
        <div class="progress-header">
          <h3>Sync Progress</h3>
          <div class="progress-stats">
            <span>{{ syncProgress.completed_items }} / {{ syncProgress.total_items }} completed</span>
            <span>{{ syncProgress.overall_progress }}%</span>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: syncProgress.overall_progress + '%' }"></div>
        </div>
        <div v-if="syncProgress.current_downloads.length > 0" class="current-downloads">
          <h4>Currently Downloading:</h4>
          <div class="download-list">
            <div v-for="download in syncProgress.current_downloads" :key="download.track_id" class="download-item">
              <div class="download-info">
                <span class="track-title">{{ getTrackTitle(download.track_id) }}</span>
                <span class="download-quality">{{ download.quality }}</span>
              </div>
              <div class="download-progress">
                <div class="progress-bar-small">
                  <div class="progress-fill-small" :style="{ width: download.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ Math.round(download.progress) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Offline Library -->
      <section class="offline-library-section">
        <div class="library-header">
          <h3>Offline Library</h3>
          <div class="library-stats">
            <span>{{ offlineLibrary.offline_tracks.length }} tracks</span>
            <span>{{ formatBytes(offlineLibrary.storage_usage.offline_tracks_size) }}</span>
          </div>
        </div>
        
        <!-- Library Actions -->
        <div class="library-actions">
          <div class="action-group">
            <input 
              v-model="searchQuery" 
              @input="filterOfflineTracks"
              type="text" 
              placeholder="Search offline tracks..." 
              class="search-input"
            />
            <select v-model="sortBy" @change="sortOfflineTracks" class="sort-select">
              <option value="title">Sort by Title</option>
              <option value="artist">Sort by Artist</option>
              <option value="date_added">Sort by Date Added</option>
              <option value="play_count">Sort by Play Count</option>
            </select>
          </div>
          <div class="action-group">
            <button @click="showAddTracksModal = true" class="add-tracks-btn">
              <Icon name="plus" />
              Add Tracks
            </button>
            <button @click="showSyncPlaylistModal = true" class="sync-playlist-btn">
              <Icon name="list" />
              Sync Playlist
            </button>
            <button v-if="selectedTracks.length > 0" @click="removeSelectedTracks" class="remove-btn">
              <Icon name="trash-2" />
              Remove Selected ({{ selectedTracks.length }})
            </button>
          </div>
        </div>

        <!-- Tracks List -->
        <div class="tracks-list">
          <div 
            v-for="track in filteredTracks" 
            :key="track.track_id"
            class="track-item"
            :class="{ 'selected': selectedTracks.includes(track.track_id) }"
            @click="toggleTrackSelection(track.track_id)"
          >
            <div class="track-checkbox">
              <input 
                type="checkbox" 
                :checked="selectedTracks.includes(track.track_id)"
                @click.stop="toggleTrackSelection(track.track_id)"
              />
            </div>
            <div class="track-info">
              <div class="track-main">
                <h4 class="track-title">{{ track.title || 'Unknown Track' }}</h4>
                <p class="track-artist">{{ track.artist || 'Unknown Artist' }}</p>
                <p class="track-album">{{ track.album || 'Unknown Album' }}</p>
              </div>
              <div class="track-meta">
                <span class="track-quality">{{ track.quality }}</span>
                <span class="track-size">{{ formatBytes(track.file_size) }}</span>
                <span class="track-date">Added {{ formatDate(track.download_date) }}</span>
                <span v-if="track.play_count > 0" class="play-count">
                  <Icon name="play" />
                  {{ track.play_count }}
                </span>
              </div>
            </div>
            <div class="track-actions">
              <button @click.stop="playTrack(track)" class="play-btn">
                <Icon name="play" />
              </button>
              <button @click.stop="removeTrack(track.track_id)" class="remove-track-btn">
                <Icon name="x" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="offlineLibrary.offline_tracks.length === 0" class="empty-library">
          <Icon name="music" class="empty-icon" />
          <h3>No Offline Tracks</h3>
          <p>Add tracks to your offline library to enjoy music without internet connection</p>
          <button @click="showAddTracksModal = true" class="add-tracks-primary-btn">
            <Icon name="plus" />
            Add First Track
          </button>
        </div>
      </section>
    </div>

    <!-- Add Device Modal -->
    <div v-if="showAddDeviceModal" class="modal-overlay" @click="showAddDeviceModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Register Mobile Device</h3>
          <button @click="showAddDeviceModal = false" class="close-btn">
            <Icon name="x" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="registerDevice" class="device-form">
            <div class="form-group">
              <label>Device Name</label>
              <input v-model="newDevice.name" type="text" required class="form-input" />
            </div>
            <div class="form-group">
              <label>Device Type</label>
              <select v-model="newDevice.type" required class="form-select">
                <option value="">Select device type</option>
                <option value="android">Android</option>
                <option value="ios">iOS</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Storage Capacity (GB)</label>
              <input v-model="newDevice.storage_capacity" type="number" required class="form-input" />
            </div>
            <div class="form-group">
              <label>Available Storage (GB)</label>
              <input v-model="newDevice.available_storage" type="number" required class="form-input" />
            </div>
            <div class="form-group">
              <label>Default Quality</label>
              <select v-model="newDevice.offline_quality" class="form-select">
                <option value="space_saver">Space Saver</option>
                <option value="balanced">Balanced</option>
                <option value="high_quality">High Quality</option>
                <option value="lossless">Lossless</option>
              </select>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newDevice.auto_sync_enabled" />
                Enable automatic sync
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="showAddDeviceModal = false" class="cancel-btn">Cancel</button>
          <button @click="registerDevice" :disabled="registeringDevice" class="primary-btn">
            {{ registeringDevice ? 'Registering...' : 'Register Device' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Tracks Modal -->
    <div v-if="showAddTracksModal" class="modal-overlay" @click="showAddTracksModal = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>Add Tracks to Offline Library</h3>
          <button @click="showAddTracksModal = false" class="close-btn">
            <Icon name="x" />
          </button>
        </div>
        <div class="modal-body">
          <div class="add-tracks-content">
            <div class="quality-selector">
              <label>Download Quality:</label>
              <select v-model="addTracksQuality" class="quality-select">
                <option value="space_saver">Space Saver (~3MB/track)</option>
                <option value="balanced">Balanced (~6MB/track)</option>
                <option value="high_quality">High Quality (~12MB/track)</option>
                <option value="lossless">Lossless (~30MB/track)</option>
              </select>
            </div>
            
            <!-- Track Selection -->
            <div class="track-selection">
              <div class="selection-header">
                <h4>Select Tracks</h4>
                <div class="selection-actions">
                  <button @click="selectAllTracks" class="select-all-btn">Select All</button>
                  <button @click="clearTrackSelection" class="clear-btn">Clear Selection</button>
                </div>
              </div>
              
              <!-- This would integrate with the main music library -->
              <div class="library-browser">
                <p>Browse your music library to select tracks for offline download...</p>
                <!-- Placeholder for track browser -->
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddTracksModal = false" class="cancel-btn">Cancel</button>
          <button @click="addSelectedTracks" :disabled="selectedLibraryTracks.length === 0" class="primary-btn">
            Add {{ selectedLibraryTracks.length }} Tracks
          </button>
        </div>
      </div>
    </div>

    <!-- Device Settings Modal -->
    <div v-if="showDeviceSettings" class="modal-overlay" @click="showDeviceSettings = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Device Settings</h3>
          <button @click="showDeviceSettings = false" class="close-btn">
            <Icon name="x" />
          </button>
        </div>
        <div class="modal-body">
          <div class="settings-form">
            <div class="form-group">
              <label>Device Name</label>
              <input v-model="deviceSettings.name" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Default Quality</label>
              <select v-model="deviceSettings.offline_quality" class="form-select">
                <option value="space_saver">Space Saver</option>
                <option value="balanced">Balanced</option>
                <option value="high_quality">High Quality</option>
                <option value="lossless">Lossless</option>
              </select>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="deviceSettings.auto_sync_enabled" />
                Enable automatic sync
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="deviceSettings.wifi_only" />
                Sync over WiFi only
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="deviceSettings.auto_cleanup" />
                Automatic cleanup when storage is full
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDeviceSettings = false" class="cancel-btn">Cancel</button>
          <button @click="updateDeviceSettings" :disabled="updatingSettings" class="primary-btn">
            {{ updatingSettings ? 'Updating...' : 'Update Settings' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cleanup Modal -->
    <div v-if="showCleanupModal" class="modal-overlay" @click="showCleanupModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Cleanup Storage</h3>
          <button @click="showCleanupModal = false" class="close-btn">
            <Icon name="x" />
          </button>
        </div>
        <div class="modal-body">
          <div class="cleanup-options">
            <div class="cleanup-info">
              <p>Free up space by removing old or rarely played tracks from your offline library.</p>
              <div class="space-info">
                <span>Current usage: {{ storageUsage.usage_percentage }}%</span>
                <span>Available: {{ formatBytes(storageUsage.available_space) }}</span>
              </div>
            </div>
            
            <div class="cleanup-strategies">
              <h4>Cleanup Strategy</h4>
              <label class="strategy-option">
                <input type="radio" v-model="cleanupStrategy" value="least_played" />
                <div class="strategy-details">
                  <strong>Least Played</strong>
                  <p>Remove tracks with lowest play count</p>
                </div>
              </label>
              <label class="strategy-option">
                <input type="radio" v-model="cleanupStrategy" value="oldest" />
                <div class="strategy-details">
                  <strong>Oldest First</strong>
                  <p>Remove tracks added longest ago</p>
                </div>
              </label>
              <label class="strategy-option">
                <input type="radio" v-model="cleanupStrategy" value="all" />
                <div class="strategy-details">
                  <strong>Clear All</strong>
                  <p>Remove all offline tracks</p>
                </div>
              </label>
            </div>
            
            <div class="cleanup-target">
              <label>Target free space:</label>
              <select v-model="cleanupTarget" class="target-select">
                <option :value="1000000000">1 GB</option>
                <option :value="2000000000">2 GB</option>
                <option :value="5000000000">5 GB</option>
                <option :value="10000000000">10 GB</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCleanupModal = false" class="cancel-btn">Cancel</button>
          <button @click="performCleanup" :disabled="cleaningUp" class="danger-btn">
            {{ cleaningUp ? 'Cleaning...' : 'Cleanup Storage' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMobileOfflineStore } from '@/stores/mobileOffline'

// Store
const mobileOfflineStore = useMobileOfflineStore()

// State
const devices = ref([])
const selectedDeviceId = ref('')
const selectedDevice = computed(() => devices.value.find(d => d.device_id === selectedDeviceId.value))
const offlineLibrary = ref({ offline_tracks: [], storage_usage: {} })
const syncProgress = ref({ total_items: 0, completed_items: 0, overall_progress: 0, current_downloads: [] })
const storageUsage = ref({ usage_percentage: 0, used_space: 0, total_capacity: 0, offline_tracks_count: 0, offline_tracks_size: 0, other_data_size: 0, available_space: 0, needs_cleanup: false })

// Modal states
const showAddDeviceModal = ref(false)
const showAddTracksModal = ref(false)
const showDeviceSettings = ref(false)
const showCleanupModal = ref(false)
const showSyncPlaylistModal = ref(false)

// Form states
const newDevice = ref({
  name: '',
  type: '',
  storage_capacity: 0,
  available_storage: 0,
  offline_quality: 'balanced',
  auto_sync_enabled: true
})

const deviceSettings = ref({
  name: '',
  offline_quality: 'balanced',
  auto_sync_enabled: true,
  wifi_only: true,
  auto_cleanup: true
})

// UI states
const registeringDevice = ref(false)
const syncing = ref(false)
const updatingSettings = ref(false)
const cleaningUp = ref(false)

// Track management
const searchQuery = ref('')
const sortBy = ref('title')
const selectedTracks = ref([])
const selectedLibraryTracks = ref([])
const filteredTracks = computed(() => {
  let tracks = [...offlineLibrary.value.offline_tracks]
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tracks = tracks.filter(track => 
      track.title?.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query) ||
      track.album?.toLowerCase().includes(query)
    )
  }
  
  // Sort
  tracks.sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return (a.title || '').localeCompare(b.title || '')
      case 'artist':
        return (a.artist || '').localeCompare(b.artist || '')
      case 'date_added':
        return new Date(a.download_date).getTime() - new Date(b.download_date).getTime()
      case 'play_count':
        return b.play_count - a.play_count
      default:
        return 0
    }
  })
  
  return tracks
})

// Add tracks modal
const addTracksQuality = ref('balanced')

// Cleanup modal
const cleanupStrategy = ref('least_played')
const cleanupTarget = ref(1000000000) // 1GB

// Methods
const loadDevices = async () => {
  try {
    const response = await mobileOfflineStore.getUserDevices()
    devices.value = response.devices
    if (devices.value.length > 0 && !selectedDeviceId.value) {
      selectedDeviceId.value = devices.value[0].device_id
    }
  } catch (error) {
    console.error('Error loading devices:', error)
  }
}

const loadDeviceData = async () => {
  if (!selectedDeviceId.value) return
  
  try {
    // Load offline library
    const libraryResponse = await mobileOfflineStore.getOfflineLibrary(selectedDeviceId.value)
    offlineLibrary.value = libraryResponse.offline_library
    storageUsage.value = libraryResponse.offline_library.storage_usage
    
    // Load sync progress
    const progressResponse = await mobileOfflineStore.getSyncProgress(selectedDeviceId.value)
    syncProgress.value = progressResponse.sync_progress
    
    // Load device settings
    const deviceResponse = await mobileOfflineStore.getDeviceInfo(selectedDeviceId.value)
    deviceSettings.value = {
      name: deviceResponse.device.name,
      offline_quality: deviceResponse.device.offline_quality,
      auto_sync_enabled: deviceResponse.device.auto_sync_enabled,
      wifi_only: deviceResponse.device.sync_preferences?.wifi_only || true,
      auto_cleanup: deviceResponse.device.sync_preferences?.auto_cleanup || true
    }
    
  } catch (error) {
    console.error('Error loading device data:', error)
  }
}

const registerDevice = async () => {
  registeringDevice.value = true
  
  try {
    const deviceData = {
      ...newDevice.value,
      storage_capacity: newDevice.value.storage_capacity * 1024 * 1024 * 1024, // Convert GB to bytes
      available_storage: newDevice.value.available_storage * 1024 * 1024 * 1024
    }
    
    await mobileOfflineStore.registerDevice(deviceData)
    
    // Reset form and close modal
    newDevice.value = {
      name: '',
      type: '',
      storage_capacity: 0,
      available_storage: 0,
      offline_quality: 'balanced',
      auto_sync_enabled: true
    }
    showAddDeviceModal.value = false
    
    // Reload devices
    await loadDevices()
    
  } catch (error) {
    console.error('Error registering device:', error)
  } finally {
    registeringDevice.value = false
  }
}

const updateDeviceSettings = async () => {
  updatingSettings.value = true
  
  try {
    const settings = {
      ...deviceSettings.value,
      sync_preferences: {
        wifi_only: deviceSettings.value.wifi_only,
        auto_cleanup: deviceSettings.value.auto_cleanup
      }
    }
    
    await mobileOfflineStore.updateDeviceSettings(selectedDeviceId.value, settings)
    showDeviceSettings.value = false
    
    // Reload device data
    await loadDeviceData()
    
  } catch (error) {
    console.error('Error updating device settings:', error)
  } finally {
    updatingSettings.value = false
  }
}

const forceSyncNow = async () => {
  syncing.value = true
  
  try {
    await mobileOfflineStore.forceSyncNow(selectedDeviceId.value)
    
    // Reload progress
    setTimeout(() => {
      loadDeviceData()
      syncing.value = false
    }, 2000)
    
  } catch (error) {
    console.error('Error forcing sync:', error)
    syncing.value = false
  }
}

const toggleTrackSelection = (trackId: string) => {
  const index = selectedTracks.value.indexOf(trackId)
  if (index > -1) {
    selectedTracks.value.splice(index, 1)
  } else {
    selectedTracks.value.push(trackId)
  }
}

const selectAllTracks = () => {
  selectedTracks.value = filteredTracks.value.map(track => track.track_id)
}

const clearTrackSelection = () => {
  selectedTracks.value = []
}

const removeSelectedTracks = async () => {
  if (selectedTracks.value.length === 0) return
  
  try {
    await mobileOfflineStore.removeTracksFromOffline(selectedDeviceId.value, selectedTracks.value)
    selectedTracks.value = []
    
    // Reload data
    await loadDeviceData()
    
  } catch (error) {
    console.error('Error removing tracks:', error)
  }
}

const removeTrack = async (trackId: string) => {
  try {
    await mobileOfflineStore.removeTracksFromOffline(selectedDeviceId.value, [trackId])
    
    // Reload data
    await loadDeviceData()
    
  } catch (error) {
    console.error('Error removing track:', error)
  }
}

const addSelectedTracks = async () => {
  if (selectedLibraryTracks.value.length === 0) return
  
  try {
    await mobileOfflineStore.addTracksToOffline(selectedDeviceId.value, selectedLibraryTracks.value, addTracksQuality.value)
    
    // Close modal and reload data
    showAddTracksModal.value = false
    selectedLibraryTracks.value = []
    await loadDeviceData()
    
  } catch (error) {
    console.error('Error adding tracks:', error)
  }
}

const performCleanup = async () => {
  cleaningUp.value = true
  
  try {
    const cleanupData = {
      strategy: cleanupStrategy.value,
      free_space_bytes: cleanupTarget.value
    }
    
    await mobileOfflineStore.cleanupStorage(selectedDeviceId.value, cleanupData)
    
    // Close modal and reload data
    showCleanupModal.value = false
    await loadDeviceData()
    
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    cleaningUp.value = false
  }
}

const playTrack = (track: any) => {
  // This would integrate with the main music player
  console.log('Play track:', track.track_id)
}

// Utility functions
const formatSyncStatus = (status: string) => {
  const statusMap = {
    'not_synced': 'Not Synced',
    'syncing': 'Syncing',
    'synced': 'Synced',
    'sync_error': 'Sync Error',
    'conflict': 'Conflict'
  }
  return statusMap[status] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getTrackTitle = (trackId: string) => {
  const track = offlineLibrary.value.offline_tracks.find(t => t.track_id === trackId)
  return track?.title || 'Unknown Track'
}

const filterOfflineTracks = () => {
  // This is handled by the computed property
}

const sortOfflineTracks = () => {
  // This is handled by the computed property
}

// Lifecycle
onMounted(() => {
  loadDevices()
  if (selectedDeviceId.value) {
    loadDeviceData()
  }
})
</script>

<style scoped>
.mobile-offline-manager {
  min-height: 100vh;
  background: #f8f9fa;
  color: #333;
}

.offline-header {
  background: white;
  padding: 2rem;
  border-bottom: 1px solid #e9ecef;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.offline-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  width: 2rem;
  height: 2rem;
  color: #6366f1;
}

.offline-subtitle {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.device-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.device-select {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
  min-width: 200px;
}

.add-device-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: #6366f1;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.add-device-btn:hover {
  background: #4f46e5;
}

.no-devices-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.no-devices-content {
  max-width: 400px;
}

.no-devices-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.add-device-primary-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.5rem;
  background: #6366f1;
  color: white;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  transition: background-color 0.2s;
}

.add-device-primary-btn:hover {
  background: #4f46e5;
}

.device-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.device-overview {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.device-name {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.device-type {
  text-transform: capitalize;
}

.sync-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: bold;
}

.sync-status.not_synced {
  background: #f8d7da;
  color: #721c24;
}

.sync-status.syncing {
  background: #fff3cd;
  color: #856404;
}

.sync-status.synced {
  background: #d4edda;
  color: #155724;
}

.sync-status.sync_error {
  background: #f8d7da;
  color: #721c24;
}

.device-actions {
  display: flex;
  gap: 0.5rem;
}

.sync-btn, .settings-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.sync-btn:hover, .settings-btn:hover {
  background: #f8f9fa;
}

.storage-overview {
  border-top: 1px solid #e9ecef;
  padding-top: 1.5rem;
}

.storage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.storage-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.usage-percentage {
  font-size: 1.25rem;
  font-weight: bold;
  color: #6366f1;
}

.storage-size {
  font-size: 0.9rem;
  color: #6c757d;
}

.storage-bar {
  width: 100%;
  height: 0.5rem;
  background: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.storage-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.3s ease;
}

.storage-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.storage-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.storage-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 0.375rem;
  color: #856404;
}

.cleanup-btn {
  margin-left: auto;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 0.25rem;
  background: #856404;
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
}

.sync-progress-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 0.3s ease;
}

.current-downloads {
  margin-top: 1rem;
}

.current-downloads h4 {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #495057;
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.download-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 0.25rem;
}

.download-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.track-title {
  font-weight: 500;
}

.download-quality {
  font-size: 0.8rem;
  color: #6c757d;
}

.download-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar-small {
  width: 100px;
  height: 0.25rem;
  background: #e9ecef;
  border-radius: 0.125rem;
  overflow: hidden;
}

.progress-fill-small {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #6c757d;
  min-width: 35px;
}

.offline-library-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.library-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.library-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input, .sort-select {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
}

.search-input {
  min-width: 200px;
}

.add-tracks-btn, .sync-playlist-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: #6366f1;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.add-tracks-btn:hover, .sync-playlist-btn:hover {
  background: #4f46e5;
}

.remove-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dc3545;
  border-radius: 0.375rem;
  background: white;
  color: #dc3545;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #dc3545;
  color: white;
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.track-item:hover {
  background: #f8f9fa;
}

.track-item.selected {
  background: #e3f2fd;
  border-color: #6366f1;
}

.track-checkbox {
  display: flex;
  align-items: center;
}

.track-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.track-main h4 {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.track-main p {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.track-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #6c757d;
}

.track-quality {
  padding: 0.125rem 0.375rem;
  background: #e9ecef;
  border-radius: 0.25rem;
  font-weight: 500;
}

.play-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.track-actions {
  display: flex;
  gap: 0.5rem;
}

.play-btn, .remove-track-btn {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.play-btn:hover {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.remove-track-btn:hover {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

.empty-library {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.add-tracks-primary-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.5rem;
  background: #6366f1;
  color: white;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  transition: background-color 0.2s;
}

.add-tracks-primary-btn:hover {
  background: #4f46e5;
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
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  margin-bottom: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.device-form, .settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-input, .form-select {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
}

.primary-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: #6366f1;
  color: white;
  cursor: pointer;
}

.primary-btn:hover {
  background: #4f46e5;
}

.danger-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: #dc3545;
  color: white;
  cursor: pointer;
}

.danger-btn:hover {
  background: #c82333;
}

.add-tracks-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quality-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quality-select {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
  min-width: 200px;
}

.track-selection {
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  padding: 1rem;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selection-actions {
  display: flex;
  gap: 0.5rem;
}

.select-all-btn, .clear-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
}

.library-browser {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  border: 1px dashed #dee2e6;
  border-radius: 0.375rem;
  padding: 2rem;
}

.cleanup-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cleanup-info p {
  margin-bottom: 1rem;
  color: #495057;
}

.space-info {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.cleanup-strategies {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.strategy-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
}

.strategy-option:hover {
  background: #f8f9fa;
}

.strategy-details strong {
  display: block;
  margin-bottom: 0.25rem;
}

.strategy-details p {
  font-size: 0.9rem;
  color: #6c757d;
}

.cleanup-target {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.target-select {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
}

/* Responsive Design */
@media (max-width: 768px) {
  .device-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .library-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-group {
    justify-content: center;
  }
  
  .track-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .track-meta {
    align-items: flex-start;
  }
  
  .modal-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .offline-title {
    font-size: 1.5rem;
  }
  
  .device-selector {
    flex-direction: column;
    align-items: stretch;
  }
  
  .storage-details {
    grid-template-columns: 1fr;
  }
  
  .track-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .track-actions {
    align-self: flex-end;
  }
}
</style>
