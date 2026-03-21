<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { recentlyPlayedApi } from '../requests/recentlyPlayed';

interface RecentlyPlayedTrack {
  trackhash: string;
  title: string;
  artist: string;
  album: string;
  albumhash: string;
  duration: number;
  image: string;
  played_at: number;
}

const tracks = ref<RecentlyPlayedTrack[]>([]);
const loading = ref(true);
const expanded = ref(true);
const refreshInterval = ref<number | null>(null);

const router = useRouter();

const displayTracks = computed(() => tracks.value.slice(0, 10));

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function fetchRecentlyPlayed() {
  try {
    const response = await recentlyPlayedApi.getRecentlyPlayed(20);
    tracks.value = response.tracks || [];
  } catch (e) {
    console.error('Failed to fetch recently played:', e);
  } finally {
    loading.value = false;
  }
}

function playTrack(track: RecentlyPlayedTrack) {
  // Emit event or call store to play track
  router.push({ name: 'AlbumView', params: { albumhash: track.albumhash } });
}

onMounted(() => {
  fetchRecentlyPlayed();
  refreshInterval.value = window.setInterval(fetchRecentlyPlayed, 30000);
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<template>
  <div v-if="tracks.length > 0" class="recently-played-widget">
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
        <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <span class="title">Recently Played</span>
      </div>
      <span class="count">{{ tracks.length }} tracks</span>
    </div>

    <div v-if="expanded" class="tracks-list">
      <div 
        v-for="(track, index) in displayTracks" 
        :key="`${track.trackhash}-${index}`"
        class="track-item"
        @click="playTrack(track)"
      >
        <div class="track-index">{{ index + 1 }}</div>
        
        <div class="track-image">
          <img v-if="track.image" :src="track.image" :alt="track.title" />
          <div v-else class="placeholder-image">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
        </div>

        <div class="track-info">
          <span class="track-title">{{ track.title }}</span>
          <span class="track-artist">{{ track.artist }}</span>
        </div>

        <div class="track-meta">
          <span class="track-duration">{{ formatDuration(track.duration) }}</span>
          <span class="track-time-ago">{{ formatTimeAgo(track.played_at) }}</span>
        </div>

        <button class="play-btn" @click.stop="playTrack(track)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recently-played-widget {
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

.icon {
  color: var(--accent-color);
}

.title {
  font-weight: 500;
  color: var(--text-primary);
}

.count {
  font-size: 0.75rem;
  color: #9ca3af;
}

.tracks-list {
  border-top: 1px solid var(--border-color);
  max-height: 400px;
  overflow-y: auto;
}

.track-item {
  display: grid;
  grid-template-columns: 32px 48px 1fr auto 32px;
  gap: 12px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
}

.track-item:last-child {
  border-bottom: none;
}

.track-item:hover {
  background: var(--bg-tertiary);
}

.track-index {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

.track-image {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.track-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.track-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.track-title {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.track-duration {
  font-size: 0.75rem;
  color: #6b7280;
}

.track-time-ago {
  font-size: 0.625rem;
  color: #9ca3af;
}

.play-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-color);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.track-item:hover .play-btn {
  opacity: 1;
}

.play-btn:hover {
  transform: scale(1.1);
}
</style>
