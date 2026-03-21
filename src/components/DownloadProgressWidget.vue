<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { downloadApi } from '../requests/downloads';

interface DownloadProgress {
  download_id: string;
  trackhash: string;
  title: string;
  artist: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  bytes_downloaded: number;
  total_bytes: number;
  speed_bps: number;
  eta_seconds: number;
  started_at: number;
  updated_at: number;
  error_message?: string;
}

const downloads = ref<DownloadProgress[]>([]);
const loading = ref(true);
const expanded = ref(true);
const refreshInterval = ref<number | null>(null);

const activeDownloads = computed(() => 
  downloads.value.filter(d => d.status === 'downloading' || d.status === 'queued')
);

const completedDownloads = computed(() => 
  downloads.value.filter(d => d.status === 'completed')
);

const failedDownloads = computed(() => 
  downloads.value.filter(d => d.status === 'failed')
);

const totalProgress = computed(() => {
  const active = activeDownloads.value;
  if (active.length === 0) return 0;
  
  const totalPercent = active.reduce((sum, d) => sum + d.progress_percent, 0);
  return totalPercent / active.length;
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSpeed(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatETA(seconds: number): string {
  if (seconds <= 0) return '—';
  return formatTime(seconds);
}

async function fetchDownloads() {
  try {
    const response = await downloadApi.getActiveDownloads();
    downloads.value = response.downloads || [];
  } catch (e) {
    console.error('Failed to fetch downloads:', e);
  } finally {
    loading.value = false;
  }
}

async function cancelDownload(downloadId: string) {
  try {
    await downloadApi.cancelDownload(downloadId);
    await fetchDownloads();
  } catch (e) {
    console.error('Failed to cancel download:', e);
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'queued': return 'yellow';
    case 'downloading': return 'blue';
    case 'completed': return 'green';
    case 'failed': return 'red';
    case 'cancelled': return 'gray';
    default: return 'gray';
  }
}

onMounted(() => {
  fetchDownloads();
  refreshInterval.value = window.setInterval(fetchDownloads, 2000);
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<template>
  <div v-if="activeDownloads.length > 0" class="download-progress-widget">
    <div class="widget-header" @click="expanded = !expanded">
      <div class="header-left">
        <svg 
          class="chevron" 
          :class="{ expanded }" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span class="title">Downloads</span>
        <span class="count">{{ activeDownloads.length }}</span>
      </div>
      <div class="header-right">
        <div class="overall-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${totalProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ totalProgress.toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <div v-if="expanded" class="download-list">
      <div 
        v-for="download in activeDownloads" 
        :key="download.download_id" 
        class="download-item"
      >
        <div class="download-info">
          <span class="download-title">{{ download.title }}</span>
          <span class="download-artist">{{ download.artist }}</span>
        </div>
        
        <div class="download-status">
          <span class="status-badge" :class="getStatusColor(download.status)">
            {{ download.status }}
          </span>
        </div>

        <div class="download-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${download.progress_percent}%` }"
            ></div>
          </div>
          <div class="progress-details">
            <span>{{ formatBytes(download.bytes_downloaded) }} / {{ formatBytes(download.total_bytes) }}</span>
            <span v-if="download.speed_bps > 0">{{ formatSpeed(download.speed_bps) }}</span>
            <span v-if="download.eta_seconds > 0">ETA: {{ formatETA(download.eta_seconds) }}</span>
          </div>
        </div>

        <button 
          v-if="download.status === 'downloading'" 
          class="cancel-btn"
          @click="cancelDownload(download.download_id)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.download-progress-widget {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.widget-header:hover {
  background: var(--bg-tertiary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chevron {
  transition: transform 0.2s;
  color: #9ca3af;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.title {
  font-weight: 500;
  color: var(--text-primary);
}

.count {
  padding: 2px 8px;
  background: var(--accent-color);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.overall-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #22c55e);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  color: #9ca3af;
  min-width: 32px;
  text-align: right;
}

.download-list {
  border-top: 1px solid var(--border-color);
  max-height: 300px;
  overflow-y: auto;
}

.download-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.download-item:last-child {
  border-bottom: none;
}

.download-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.download-title {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.download-artist {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.blue {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.status-badge.yellow {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.status-badge.green {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge.red {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-badge.gray {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.download-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 150px;
}

.download-progress .progress-bar {
  width: 100%;
}

.progress-details {
  display: flex;
  gap: 8px;
  font-size: 0.625rem;
  color: #6b7280;
}

.cancel-btn {
  padding: 6px;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
</style>
