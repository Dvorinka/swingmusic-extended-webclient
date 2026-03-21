<template>
  <div class="global-playlist content-page">
    <div v-if="loading" class="state-box">Loading playlist...</div>
    <div v-else-if="error" class="state-box error">{{ error }}</div>

    <template v-else-if="playlist">
      <section class="hero rounded-lg">
        <img
          class="cover"
          :src="playlist.image_url || '/icons/playlist-placeholder.svg'"
          :alt="playlist.title || 'Playlist'"
          @error="onImageError"
        />
        <div class="copy">
          <p class="eyebrow">Global Playlist</p>
          <h1>{{ playlist.title }}</h1>
          <p class="meta">
            {{ ownerName }}
            <span v-if="playlist.tracks_total">• {{ playlist.tracks_total }} tracks</span>
            <span v-if="playlist.public">• Public</span>
          </p>
          <p v-if="playlist.description" class="sub">{{ playlist.description }}</p>

          <div class="actions">
            <button class="primary" :disabled="playlistDownloading" @click="queuePlaylistDownload">
              {{ playlistDownloading ? 'Queueing...' : 'Download Playlist' }}
            </button>
            <button class="ghost" :disabled="trackBusy || !playlist?.spotify_id" @click="togglePlaylistTracking">
              {{ trackedPlaylist ? 'Untrack Playlist' : 'Track & Auto Sync' }}
            </button>
            <button class="ghost" :disabled="syncBusy || !trackedPlaylistId" @click="syncTrackedPlaylist">
              {{ syncBusy ? 'Syncing...' : 'Sync Now' }}
            </button>
            <button
              v-if="trackedPlaylist"
              class="ghost"
              :disabled="syncBusy || trackBusy"
              @click="toggleAutoSync"
            >
              {{ trackedPlaylist.auto_sync ? 'Pause Auto Sync' : 'Resume Auto Sync' }}
            </button>
            <button class="ghost" @click="openSpotifyPlaylist">Open in Spotify</button>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Tracks</h2>
        </div>
        <div class="track-list">
          <article
            v-for="(track, index) in playlist.tracks || []"
            :key="track.spotify_id || `${track.title}-${index}`"
            :class="['track-row', { missing: !isAvailable(track) }]"
          >
            <div class="track-left">
              <span class="index">{{ track.track_number || index + 1 }}</span>
              <div>
                <div class="title">{{ track.title || 'Unknown title' }}</div>
                <div class="sub">
                  {{ track.artist || 'Unknown artist' }}
                  <span v-if="track.play_count">• {{ formatPlayCount(track.play_count) }}</span>
                </div>
              </div>
            </div>
            <div class="track-right">
              <span class="state" :class="`state-${trackState(track)}`">{{ trackState(track) }}</span>
              <span v-if="track.quality_badge" class="badge" :class="`badge-${track.quality_badge.color}`">
                {{ track.quality_badge.label }}
              </span>
              <button class="ghost" :disabled="isTrackBusy(track)" @click="handleTrackAction(track)">
                {{ actionLabel(track) }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </template>

    <div v-if="importModal.visible" class="import-modal-overlay" @click.self="closeImportModal">
      <div class="import-modal rounded-lg">
        <h3>Import Existing Track?</h3>
        <p>
          This song already exists for another user on this server. Import it instantly, or queue a new download.
        </p>
        <ul>
          <li v-for="candidate in importModal.candidates" :key="`${candidate.user_id}-${candidate.file_id}`">
            {{ candidate.username }}
          </li>
        </ul>
        <div class="modal-actions">
          <button class="primary" :disabled="importModal.busy" @click="importExistingTrack">Import Existing</button>
          <button class="ghost" :disabled="importModal.busy || !importModal.track" @click="downloadFromModal">Download New</button>
          <button class="ghost" :disabled="importModal.busy" @click="closeImportModal">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { NotifType, Notification } from '@/stores/notification'

interface QualityBadge {
  label: string
  color: string
}

interface DownloadAction {
  type: string
  label: string
  enabled: boolean
}

interface TrackAvailability {
  state: string
  candidate_count?: number
  download_action?: DownloadAction
  quality_badge?: QualityBadge
}

interface PlaylistTrack {
  spotify_id?: string
  trackhash?: string
  title?: string
  artist?: string
  album?: string
  track_number?: number
  play_count?: number
  last_played?: number
  availability?: TrackAvailability
  download_action?: DownloadAction
  quality_badge?: QualityBadge
}

interface PlaylistPayload {
  spotify_id: string
  title: string
  image_url?: string
  description?: string
  owner?: {
    display_name?: string
  }
  tracks_total?: number
  public?: boolean
  tracks: PlaylistTrack[]
}

interface TrackedPlaylist {
  id: number
  playlist_id: string
  auto_sync: boolean
  status: string
  last_sync_at?: number
}

interface ImportCandidate {
  user_id: number
  username: string
  file_id: number | null
}

const route = useRoute()

const loading = ref(true)
const error = ref('')
const playlist = ref<PlaylistPayload | null>(null)
const playlistDownloading = ref(false)
const trackedPlaylist = ref<TrackedPlaylist | null>(null)
const trackBusy = ref(false)
const syncBusy = ref(false)
const busyTrackKeys = reactive<Record<string, boolean>>({})

const importModal = reactive<{
  visible: boolean
  busy: boolean
  track: PlaylistTrack | null
  candidates: ImportCandidate[]
}>({
  visible: false,
  busy: false,
  track: null,
  candidates: [],
})

const ownerName = computed(() => {
  return playlist.value?.owner?.display_name || 'Unknown curator'
})

const trackedPlaylistId = computed(() => trackedPlaylist.value?.id || 0)

function notify(message: string, type: NotifType) {
  new Notification(message, type)
}

function onImageError(event: Event) {
  const target = event.target as HTMLImageElement | null
  if (target) {
    target.src = '/icons/playlist-placeholder.svg'
  }
}

function trackKey(track: PlaylistTrack) {
  return track.trackhash || track.spotify_id || `${track.title || 'track'}-${track.artist || ''}`
}

function isTrackBusy(track: PlaylistTrack) {
  return !!busyTrackKeys[trackKey(track)]
}

function trackState(track: PlaylistTrack) {
  return track.availability?.state || 'missing'
}

function isAvailable(track: PlaylistTrack) {
  return trackState(track) === 'available'
}

function formatPlayCount(value?: number) {
  const plays = Number(value || 0)
  if (plays >= 1_000_000) {
    return `${(plays / 1_000_000).toFixed(1)}M plays`
  }
  if (plays >= 1_000) {
    return `${(plays / 1_000).toFixed(1)}K plays`
  }
  return `${plays} play${plays === 1 ? '' : 's'}`
}

function actionLabel(track: PlaylistTrack) {
  if (isTrackBusy(track)) {
    return 'Working...'
  }

  const action = track.download_action || track.availability?.download_action
  if (action?.label) {
    return action.label
  }

  return isAvailable(track) ? 'Available' : 'Download'
}

function spotifyTrackUrl(track: PlaylistTrack) {
  return track.spotify_id ? `https://open.spotify.com/track/${track.spotify_id}` : ''
}

function spotifyPlaylistUrl() {
  return playlist.value?.spotify_id ? `https://open.spotify.com/playlist/${playlist.value.spotify_id}` : ''
}

async function fetchPlaylist() {
  const playlistId = String(route.params.id || '').trim()
  if (!playlistId) {
    loading.value = false
    error.value = 'Playlist ID is missing.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data } = await axios.get(`/api/catalog/playlist/${playlistId}`)
    playlist.value = data
    await refreshTrackedPlaylistState()
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Failed to load playlist information.'
    trackedPlaylist.value = null
  } finally {
    loading.value = false
  }
}

async function refreshTrackedPlaylistState() {
  const spotifyId = playlist.value?.spotify_id
  if (!spotifyId) {
    trackedPlaylist.value = null
    return
  }

  try {
    const { data } = await axios.get('/api/downloads/playlists/tracked', {
      params: { playlist_id: spotifyId },
    })
    trackedPlaylist.value = data?.tracked_playlists?.[0] || null
  } catch {
    trackedPlaylist.value = null
  }
}

async function queueTrackDownload(track: PlaylistTrack) {
  if (!track.spotify_id) {
    notify('Missing Spotify track ID.', NotifType.Error)
    return false
  }

  const key = trackKey(track)
  busyTrackKeys[key] = true

  try {
    await axios.post('/api/downloads/jobs', {
      source_url: spotifyTrackUrl(track),
      source: 'spotify',
      quality: 'lossless',
      codec: 'flac',
      trackhash: track.trackhash,
      title: track.title,
      artist: track.artist,
      album: track.album,
      item_type: 'track',
      payload: {
        spotify_id: track.spotify_id,
        item_type: 'track',
      },
    })

    notify(`Queued: ${track.title || 'Track'}`, NotifType.Success)
    return true
  } catch (err: any) {
    const message = err?.response?.data?.error || 'Failed to queue download.'
    notify(message, NotifType.Error)
    return false
  } finally {
    busyTrackKeys[key] = false
  }
}

async function openImportModal(track: PlaylistTrack) {
  if (!track.trackhash) {
    await queueTrackDownload(track)
    await fetchPlaylist()
    return
  }

  const key = trackKey(track)
  busyTrackKeys[key] = true
  try {
    const { data } = await axios.post('/api/downloads/imports/candidates', {
      trackhash: track.trackhash,
    })

    if (!data?.candidates?.length) {
      await queueTrackDownload(track)
      await fetchPlaylist()
      return
    }

    importModal.visible = true
    importModal.track = track
    importModal.candidates = data.candidates
  } catch (err: any) {
    const message = err?.response?.data?.error || 'Failed to fetch import candidates.'
    notify(message, NotifType.Error)
  } finally {
    busyTrackKeys[key] = false
  }
}

async function handleTrackAction(track: PlaylistTrack) {
  const state = trackState(track)
  const actionType = (track.download_action || track.availability?.download_action)?.type || 'download'

  if (state === 'available') {
    const url = spotifyTrackUrl(track)
    if (url) {
      window.open(url, '_blank')
    }
    return
  }

  if (actionType === 'import_or_download') {
    await openImportModal(track)
    return
  }

  if (actionType === 'queued') {
    notify('Track is already queued.', NotifType.Info)
    return
  }

  const queued = await queueTrackDownload(track)
  if (queued) {
    await fetchPlaylist()
  }
}

async function queuePlaylistDownload() {
  if (!playlist.value?.spotify_id) {
    return
  }

  playlistDownloading.value = true
  try {
    await axios.post('/api/downloads/jobs', {
      source_url: `https://open.spotify.com/playlist/${playlist.value.spotify_id}`,
      source: 'spotify',
      quality: 'lossless',
      codec: 'flac',
      title: playlist.value.title,
      artist: ownerName.value,
      item_type: 'playlist',
      payload: {
        spotify_id: playlist.value.spotify_id,
        item_type: 'playlist',
      },
    })

    notify(`Queued playlist: ${playlist.value.title}`, NotifType.Success)
  } catch (err: any) {
    const message = err?.response?.data?.error || 'Failed to queue playlist download.'
    notify(message, NotifType.Error)
  } finally {
    playlistDownloading.value = false
  }
}

async function togglePlaylistTracking() {
  if (!playlist.value?.spotify_id || trackBusy.value) {
    return
  }

  trackBusy.value = true
  try {
    if (trackedPlaylist.value?.id) {
      await axios.delete(`/api/downloads/playlists/${trackedPlaylist.value.id}`)
      trackedPlaylist.value = null
      notify('Playlist tracking removed.', NotifType.Info)
      return
    }

    const { data } = await axios.post('/api/downloads/playlists/track', {
      source_url: spotifyPlaylistUrl(),
      quality: 'lossless',
      codec: 'flac',
      auto_sync: true,
      sync_interval_seconds: 900,
      sync_now: true,
    })

    trackedPlaylist.value = data?.tracked || null
    const queued = Number(data?.sync?.queued_tracks || 0)
    notify(
      queued > 0
        ? `Playlist tracking enabled (${queued} tracks queued)`
        : 'Playlist tracking enabled.',
      NotifType.Success
    )
    await fetchPlaylist()
  } catch (err: any) {
    const message = err?.response?.data?.error || 'Failed to update playlist tracking.'
    notify(message, NotifType.Error)
  } finally {
    trackBusy.value = false
  }
}

async function syncTrackedPlaylist() {
  const id = trackedPlaylistId.value
  if (!id || syncBusy.value) {
    return
  }

  syncBusy.value = true
  try {
    const { data } = await axios.post(`/api/downloads/playlists/${id}/sync`)
    if (data?.success) {
      const queued = Number(data?.result?.queued_tracks || 0)
      notify(
        queued > 0 ? `Playlist synced (${queued} tracks queued)` : 'Playlist synced.',
        NotifType.Success
      )
      trackedPlaylist.value = data?.tracked || trackedPlaylist.value
      await fetchPlaylist()
      return
    }
    notify(data?.error || 'Failed to sync tracked playlist.', NotifType.Error)
  } catch (err: any) {
    const message = err?.response?.data?.error || 'Failed to sync tracked playlist.'
    notify(message, NotifType.Error)
  } finally {
    syncBusy.value = false
  }
}

async function toggleAutoSync() {
  const id = trackedPlaylistId.value
  if (!id || !trackedPlaylist.value || syncBusy.value || trackBusy.value) {
    return
  }

  syncBusy.value = true
  try {
    const { data } = await axios.post(`/api/downloads/playlists/${id}/auto-sync`, {
      enabled: !trackedPlaylist.value.auto_sync,
    })
    if (data?.success) {
      trackedPlaylist.value = data?.tracked || trackedPlaylist.value
      notify(
        trackedPlaylist.value.auto_sync ? 'Auto sync resumed.' : 'Auto sync paused.',
        NotifType.Info
      )
      return
    }
    notify(data?.error || 'Failed to update auto sync.', NotifType.Error)
  } catch (err: any) {
    const message = err?.response?.data?.error || 'Failed to update auto sync.'
    notify(message, NotifType.Error)
  } finally {
    syncBusy.value = false
  }
}

async function importExistingTrack() {
  if (!importModal.track?.trackhash) {
    return
  }

  importModal.busy = true
  try {
    const sourceUserId = importModal.candidates[0]?.user_id
    await axios.post('/api/downloads/imports/confirm', {
      trackhash: importModal.track.trackhash,
      source_userid: sourceUserId,
    })

    notify('Track imported into your library.', NotifType.Success)
    closeImportModal()
    await fetchPlaylist()
  } catch (err: any) {
    const message = err?.response?.data?.error || 'Failed to import track.'
    notify(message, NotifType.Error)
  } finally {
    importModal.busy = false
  }
}

async function downloadFromModal() {
  if (!importModal.track) {
    return
  }

  const track = importModal.track
  closeImportModal()
  const queued = await queueTrackDownload(track)
  if (queued) {
    await fetchPlaylist()
  }
}

function closeImportModal() {
  importModal.visible = false
  importModal.track = null
  importModal.candidates = []
  importModal.busy = false
}

function openSpotifyPlaylist() {
  const url = spotifyPlaylistUrl()
  if (url) {
    window.open(url, '_blank')
  }
}

watch(
  () => route.params.id,
  () => {
    fetchPlaylist()
  }
)

onMounted(() => {
  fetchPlaylist()
})
</script>

<style scoped>
.global-playlist {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.state-box {
  padding: 1.5rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
}

.state-box.error {
  background: rgba(255, 120, 120, 0.16);
  color: #ffd3d3;
}

.hero {
  display: grid;
  grid-template-columns: 12rem 1fr;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(132deg, rgba(14, 24, 36, 0.94), rgba(10, 10, 16, 0.92));
}

.cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.65rem;
}

.copy h1 {
  margin: 0.35rem 0;
  font-size: clamp(1.45rem, 2vw, 2.4rem);
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.meta,
.sub {
  margin: 0.25rem 0;
  color: rgba(255, 255, 255, 0.72);
}

.actions {
  margin-top: 0.8rem;
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

button {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
}

button.primary {
  background: linear-gradient(136deg, #69e2ff, #5dc29d);
  border-color: rgba(0, 0, 0, 0.25);
  color: #061018;
  font-weight: 700;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.section {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.section-head h2 {
  margin: 0 0 0.75rem;
}

.track-list {
  display: grid;
  gap: 0.55rem;
}

.track-row {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  padding: 0.65rem 0.75rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.24);
}

.track-row.missing {
  opacity: 0.8;
  filter: grayscale(0.35);
}

.track-left {
  display: flex;
  gap: 0.7rem;
  min-width: 0;
  align-items: center;
}

.index {
  width: 1.25rem;
  text-align: right;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.82rem;
}

.title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.84rem;
}

.track-right {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.state,
.badge {
  font-size: 0.72rem;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  text-transform: capitalize;
}

.state-available {
  background: rgba(84, 219, 160, 0.22);
  color: #d7ffef;
}

.state-missing {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.82);
}

.state-queued {
  background: rgba(108, 170, 255, 0.22);
  color: #d9e9ff;
}

.state-failed {
  background: rgba(255, 119, 119, 0.2);
  color: #ffd6d6;
}

.badge-green {
  background: rgba(84, 219, 160, 0.2);
  color: #d9ffef;
}

.badge-blue {
  background: rgba(109, 170, 255, 0.22);
  color: #ddecff;
}

.badge-orange {
  background: rgba(255, 170, 92, 0.22);
  color: #ffe8cf;
}

.badge-gray {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.82);
}

.import-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  z-index: 60;
}

.import-modal {
  width: min(92vw, 28rem);
  padding: 1rem;
  background: #111624;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.import-modal h3 {
  margin: 0 0 0.35rem;
}

.import-modal p {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
}

.import-modal ul {
  margin: 0.7rem 0;
  padding-left: 1.2rem;
}

.modal-actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .cover {
    max-width: 14rem;
  }
}
</style>
