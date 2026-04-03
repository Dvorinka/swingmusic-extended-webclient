<template>
  <div class="desktop-downloads">
    <!-- Download Queue -->
    <div class="downloads-header">
      <h2>Downloads</h2>
      <div class="header-actions">
        <button class="btn-secondary" @click="clearCompleted">
          🗑️ Clear Completed
        </button>
        <button class="btn-primary" @click="openDownloadsFolder">
          📁 Open Folder
        </button>
      </div>
    </div>
    
    <!-- Active Downloads -->
    <div v-if="activeDownloads.length > 0" class="active-downloads">
      <h3>Active Downloads</h3>
      <div class="download-list">
        <div 
          v-for="download in activeDownloads" 
          :key="download.id"
          class="download-item active"
        >
          <div class="download-info">
            <div class="download-cover-placeholder">🎵</div>
            <div class="download-details">
              <h4 class="download-title">{{ download.id }}</h4>
              <p class="download-quality">High Quality</p>
            </div>
          </div>
          
          <div class="download-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: download.progress + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(download.progress) }}%</span>
          </div>
          
          <div class="download-actions">
            <button 
              v-if="download.status === 'paused'"
              class="btn-icon"
              @click="resumeDownload(download.id)"
            >
              ▶️
            </button>
            <button 
              v-else
              class="btn-icon"
              @click="pauseDownload(download.id)"
            >
              ⏸️
            </button>
            <button 
              class="btn-icon danger"
              @click="cancelDownload(download.id)"
            >
              ❌
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Completed Downloads -->
    <div v-if="completedDownloads.length > 0" class="completed-downloads">
      <h3>Completed Downloads</h3>
      <div class="download-list">
        <div 
          v-for="download in completedDownloads" 
          :key="download.id"
          class="download-item completed"
        >
          <div class="download-info">
            <div class="download-cover-placeholder">✅</div>
            <div class="download-details">
              <h4 class="download-title">{{ download.id }}</h4>
              <p class="download-quality">High Quality</p>
            </div>
          </div>
          
          <div class="download-status">
            <span class="status-text">Completed</span>
          </div>
          
          <div class="download-actions">
            <button 
              class="btn-icon"
              @click="openFileLocation(download.file_path || '')"
            >
              📁
            </button>
            <button 
              class="btn-icon"
              @click="removeDownload(download.id)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="activeDownloads.length === 0 && completedDownloads.length === 0" class="empty-state">
      <div class="empty-icon">⬇️</div>
      <h3>No downloads yet</h3>
      <p>Start downloading music from Universal sources to see it here</p>
      <button class="btn-primary" @click="openUniversalDownloader">
        ⬇️ Start Downloading
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeDownloads = ref<any[]>([])
const completedDownloads = ref<any[]>([])

onMounted(async () => {
  await loadDownloads()
  setupProgressListener()
})

const loadDownloads = async () => {
  try {
    if ((window as any).__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/tauri')
      const history = await invoke('get_download_history')
      
      // Separate active and completed downloads
      activeDownloads.value = (history as any[]).filter((d: any) => 
        d.status === 'downloading' || d.status === 'paused'
      )
      completedDownloads.value = (history as any[]).filter((d: any) => 
        d.status === 'completed'
      )
    }
  } catch (error) {
    console.error('Failed to load downloads:', error)
  }
}

const setupProgressListener = async () => {
  if ((window as any).__TAURI__) {
    try {
      const { listen } = await import('@tauri-apps/api/event')
      
      await listen('download-progress', (event: any) => {
        const progress = event.payload
        const index = activeDownloads.value.findIndex(d => d.id === progress.id)
        if (index !== -1) {
          activeDownloads.value[index] = progress
          
          // Move to completed if done
          if (progress.status === 'completed') {
            activeDownloads.value.splice(index, 1)
            completedDownloads.value.unshift(progress)
          }
        }
      })
    } catch (error) {
      console.error('Failed to setup progress listener:', error)
    }
  }
}

const pauseDownload = async (downloadId: string) => {
  try {
    if ((window as any).__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/tauri')
      await invoke('pause_download', { downloadId })
      await loadDownloads()
    }
  } catch (error) {
    console.error('Failed to pause download:', error)
  }
}

const resumeDownload = async (downloadId: string) => {
  try {
    if ((window as any).__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/tauri')
      await invoke('resume_download', { downloadId })
      await loadDownloads()
    }
  } catch (error) {
    console.error('Failed to resume download:', error)
  }
}

const cancelDownload = async (downloadId: string) => {
  try {
    if ((window as any).__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/tauri')
      await invoke('cancel_download', { downloadId })
      await loadDownloads()
    }
  } catch (error) {
    console.error('Failed to cancel download:', error)
  }
}

const openFileLocation = async (filePath: string) => {
  try {
    if ((window as any).__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/tauri')
      await invoke('open_in_file_manager', { filePath })
    }
  } catch (error) {
    console.error('Failed to open file location:', error)
  }
}

const clearCompleted = async () => {
  try {
    if ((window as any).__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/tauri')
      await invoke('clear_completed_downloads')
      await loadDownloads()
    }
  } catch (error) {
    console.error('Failed to clear completed downloads:', error)
  }
}

const openDownloadsFolder = async () => {
  try {
    if ((window as any).__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/tauri')
      const settings = await invoke('get_app_settings')
      await invoke('open_in_file_manager', { filePath: (settings as any).download_dir })
    }
  } catch (error) {
    console.error('Failed to open downloads folder:', error)
  }
}

const openUniversalDownloader = () => {
  router.push({ name: 'spotify-downloader' })
}

const removeDownload = async (downloadId: string) => {
  // Remove from completed list
  const index = completedDownloads.value.findIndex(d => d.id === downloadId)
  if (index !== -1) {
    completedDownloads.value.splice(index, 1)
  }
}
</script>

<style lang="scss" scoped>
.desktop-downloads {
  @include modal-base;
  padding: 1.25rem;
  height: 100%;
  overflow-y: auto;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

// Header
.downloads-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.96);
    letter-spacing: -0.02em;
  }
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

// Buttons
.btn-primary {
  @include modal-button-primary;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-secondary {
  @include modal-button-secondary;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

// Sections
.active-downloads,
.completed-downloads {
  margin-bottom: 2rem;

  h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

// Download Item
.download-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &.active {
    border-left: 3px solid $highlight-blue;
    background: rgba(0, 110, 255, 0.04);
  }

  &.completed {
    border-left: 3px solid #4ade80;
    background: rgba(74, 222, 128, 0.03);
  }
}

.download-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.download-cover-placeholder {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.download-details {
  flex: 1;
  min-width: 0;
}

.download-title {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-quality {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

// Progress
.download-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 1rem;

  .progress-bar {
    @include modal-progress-bar;
    width: 6rem;
    height: 0.375rem;
  }

  .progress-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    min-width: 2.5rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}

// Actions
.download-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.6);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  &.danger:hover {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }
}

// Status
.download-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 1rem;

  .status-text {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4ade80;
  }
}

// Empty State
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
  padding: 4rem 1.25rem;

  .empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    height: 5rem;
    margin-bottom: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1.25rem;
    font-size: 2rem;
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
    max-width: 20rem;
  }
}

// Responsive
@include allPhones {
  .desktop-downloads {
    padding: 1rem;
  }

  .downloads-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;

    .header-actions {
      width: 100%;

      .btn-primary,
      .btn-secondary {
        flex: 1;
      }
    }
  }

  .download-item {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .download-progress {
    width: 100%;
    margin: 0.5rem 0 0;

    .progress-bar {
      flex: 1;
    }
  }

  .download-actions {
    margin-left: auto;
  }
}
</style>
