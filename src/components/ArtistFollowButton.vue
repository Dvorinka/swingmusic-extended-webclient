<!--
Artist Follow Button Component

A compact component for following/unfollowing artists with options
for follow level, auto-download, and quality preferences.
-->

<template>
  <div class="artist-follow-container">
    <button 
      v-if="!isFollowing"
      @click="followArtist"
      :disabled="loading"
      class="follow-btn primary"
    >
      <Icon name="plus" v-if="!loading" />
      <div v-else class="loading-spinner"></div>
      {{ loading ? 'Following...' : 'Follow' }}
    </button>
    
    <div v-else class="follow-controls">
      <div class="follow-status">
        <span class="status-text">{{ followStatusText }}</span>
        <button 
          @click="showFollowOptions = !showFollowOptions"
          class="options-btn"
          title="Follow options"
        >
          <Icon name="settings" />
        </button>
      </div>
      
      <div v-if="showFollowOptions" class="follow-options">
        <div class="option-item">
          <label class="option-label">Follow Level</label>
          <select 
            v-model="followLevel" 
            @change="updateFollowLevel"
            class="option-select"
          >
            <option value="casual">Casual</option>
            <option value="followed">Following</option>
            <option value="favorite">⭐ Favorite</option>
          </select>
        </div>
        
        <div class="option-item">
          <label class="option-label">
            <input 
              type="checkbox" 
              v-model="autoDownload"
              @change="updateAutoDownload"
              class="option-checkbox"
            />
            Auto-download new releases
          </label>
        </div>
        
        <div class="option-item">
          <label class="option-label">Preferred Quality</label>
          <select 
            v-model="preferredQuality" 
            @change="updateQuality"
            class="option-select"
          >
            <option value="flac">FLAC (Lossless)</option>
            <option value="mp3_320">MP3 320kbps</option>
            <option value="mp3_256">MP3 256kbps</option>
            <option value="aac">AAC</option>
          </select>
        </div>
        
        <div class="option-actions">
          <button @click="unfollowArtist" class="unfollow-btn">
            <Icon name="x" />
            Unfollow
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { useFetch } from '@/composables/useFetch'
import Icon from '@/components/shared/Icon.vue'

interface Props {
  artistId: string
  artistName: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const toast = useToast()
const { $get, $post } = useFetch()

// Reactive state
const loading = ref(false)
const isFollowing = ref(false)
const showFollowOptions = ref(false)
const followLevel = ref('followed')
const autoDownload = ref(false)
const preferredQuality = ref('flac')

// Computed properties
const followStatusText = computed(() => {
  const statusMap = {
    'casual': 'Following',
    'followed': 'Following',
    'favorite': '⭐ Favorite'
  }
  return statusMap[followLevel.value] || 'Following'
})

// Methods
const loadFollowStatus = async () => {
  try {
    const response = await $get(`/api/updates/artist/${props.artistId}/follow-status`)
    const status = response.data
    
    if (status.is_following) {
      isFollowing.value = true
      followLevel.value = status.follow_level
      autoDownload.value = status.auto_download_new_releases
      preferredQuality.value = status.preferred_quality
    } else {
      isFollowing.value = false
    }
    
  } catch (error) {
    console.error('Error loading follow status:', error)
    // Don't show error toast for this, it's not critical
  }
}

const followArtist = async () => {
  try {
    loading.value = true
    
    await $post('/api/updates/follow-artist', {
      artist_id: props.artistId,
      artist_name: props.artistName,
      follow_level: followLevel.value,
      auto_download: autoDownload.value,
      preferred_quality: preferredQuality.value
    })
    
    isFollowing.value = true
    toast.success(`Now following ${props.artistName}`)
    
  } catch (error) {
    console.error('Error following artist:', error)
    toast.error('Failed to follow artist')
  } finally {
    loading.value = false
  }
}

const unfollowArtist = async () => {
  try {
    await $post('/api/updates/unfollow-artist', {
      artist_id: props.artistId
    })
    
    isFollowing.value = false
    showFollowOptions.value = false
    toast.success(`Unfollowed ${props.artistName}`)
    
  } catch (error) {
    console.error('Error unfollowing artist:', error)
    toast.error('Failed to unfollow artist')
  }
}

const updateFollowLevel = async () => {
  try {
    await $post(`/api/updates/artist/${props.artistId}`, {
      follow_level: followLevel.value
    })
    
    toast.success('Follow level updated')
    
  } catch (error) {
    console.error('Error updating follow level:', error)
    toast.error('Failed to update follow level')
  }
}

const updateAutoDownload = async () => {
  try {
    await $post(`/api/updates/artist/${props.artistId}`, {
      auto_download: autoDownload.value
    })
    
    toast.success(`Auto-download ${autoDownload.value ? 'enabled' : 'disabled'}`)
    
  } catch (error) {
    console.error('Error updating auto-download:', error)
    toast.error('Failed to update auto-download setting')
  }
}

const updateQuality = async () => {
  try {
    await $post(`/api/updates/artist/${props.artistId}`, {
      preferred_quality: preferredQuality.value
    })
    
    toast.success('Quality preference updated')
    
  } catch (error) {
    console.error('Error updating quality preference:', error)
    toast.error('Failed to update quality preference')
  }
}

// Watch for artist ID changes
watch(() => props.artistId, () => {
  if (props.artistId) {
    loadFollowStatus()
  }
})

// Lifecycle
onMounted(() => {
  if (props.artistId) {
    loadFollowStatus()
  }
})
</script>

<style scoped>
.artist-follow-container {
  position: relative;
  display: inline-block;
}

/* Follow Button */
.follow-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--accent-color);
  border-radius: 0.375rem;
  background: var(--accent-color);
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.follow-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.follow-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Follow Controls */
.follow-controls {
  position: relative;
}

.follow-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-secondary);
}

.status-text {
  font-weight: 500;
  color: var(--text-primary);
}

.options-btn {
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.options-btn:hover {
  background: var(--background-hover);
  color: var(--text-primary);
}

/* Follow Options Dropdown */
.follow-options {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  min-width: 250px;
  padding: 1rem;
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.option-item:last-child {
  margin-bottom: 0;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.875rem;
}

.option-checkbox {
  width: 1rem;
  height: 1rem;
}

.option-select {
  padding: 0.375rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: var(--background-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.option-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.unfollow-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--error-color);
  border-radius: 0.25rem;
  background: var(--error-color);
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.unfollow-btn:hover {
  background: #dc2626;
}

/* Compact variant */
.artist-follow-container.compact .follow-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.artist-follow-container.compact .follow-status {
  padding: 0.375rem;
}

.artist-follow-container.compact .status-text {
  font-size: 0.875rem;
}

.artist-follow-container.compact .options-btn {
  padding: 0.125rem;
}

.artist-follow-container.compact .follow-options {
  min-width: 200px;
  padding: 0.75rem;
}

.artist-follow-container.compact .option-label {
  font-size: 0.75rem;
}

.artist-follow-container.compact .option-select {
  padding: 0.25rem;
  font-size: 0.75rem;
}

.artist-follow-container.compact .unfollow-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
