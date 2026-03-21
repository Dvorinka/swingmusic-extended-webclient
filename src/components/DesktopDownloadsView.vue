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

<style scoped>
.desktop-downloads {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.downloads-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.downloads-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

.btn-secondary {
  background: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover {
  background: var(--background-tertiary);
}

.active-downloads, .completed-downloads {
  margin-bottom: 32px;
}

.active-downloads h3, .completed-downloads h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.download-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-primary);
}

.download-item.active {
  border-left: 4px solid var(--accent-primary);
}

.download-item.completed {
  border-left: 4px solid var(--accent-success);
}

.download-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.download-cover-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: var(--background-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.download-details {
  flex: 1;
}

.download-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.download-quality {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.download-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 16px;
}

.progress-bar {
  width: 120px;
  height: 6px;
  background: var(--background-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 40px;
}

.download-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background: var(--background-tertiary);
}

.btn-icon.danger:hover {
  background: var(--accent-error);
  color: white;
}

.download-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px;
}

.status-text {
  font-size: 14px;
  color: var(--accent-success);
  font-weight: 500;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: var(--text-tertiary);
}
</style>
