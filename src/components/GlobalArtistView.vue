<template>
  <div class="global-artist content-page">
    <div v-if="loading" class="state-box">Loading artist...</div>
    <div v-else-if="error" class="state-box error">{{ error }}</div>

    <template v-else-if="artist">
      <section class="hero rounded-lg">
        <img
          class="hero-image"
          :src="artist.image_url || '/icons/artist-placeholder.svg'"
          :alt="artist.name"
          @error="onImageError"
        />
        <div class="hero-copy">
          <p class="eyebrow">Global Artist</p>
          <h1>{{ artist.name }}</h1>
          <p class="meta">
            {{ formatFollowers(artist.followers) }} followers
            <span v-if="artist.popularity">• {{ artist.popularity }}/100 popularity</span>
          </p>
          <p v-if="artist.genres?.length" class="genres">{{ artist.genres.slice(0, 4).join(', ') }}</p>

          <div class="hero-actions">
            <button class="primary" :disabled="batchDownloading" @click="downloadMissingTopTracks">
              {{ batchDownloading ? 'Queueing...' : 'Download Missing Top Tracks' }}
            </button>
            <button class="ghost" @click="openSpotifyArtist">Open in Spotify</button>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Top 15 Tracks</h2>
        </div>
        <div class="track-list">
          <article v-for="(track, index) in topTracks" :key="track.spotify_id || `${track.title}-${index}`" :class="['track-row', { missing: !isAvailable(track) }]">
            <div class="track-left">
              <span class="index">{{ index + 1 }}</span>
              <div>
                <div class="title">{{ track.title || 'Unknown title' }}</div>
                <div class="sub">
                  {{ track.artist || artist.name }}
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

      <section v-if="artist.this_is_artist?.length" class="section">
        <div class="section-head">
          <h2>This Is {{ artist.name }}</h2>
        </div>
        <div class="track-list compact">
          <article
            v-for="(track, index) in artist.this_is_artist.slice(0, 20)"
            :key="`this-is-${track.spotify_id || index}`"
            :class="['track-row', { missing: !isAvailable(track) }]"
          >
            <div class="track-left">
              <span class="index">{{ index + 1 }}</span>
              <div>
                <div class="title">{{ track.title || 'Unknown title' }}</div>
                <div class="sub">
                  {{ track.artist || artist.name }}
                  <span v-if="track.play_count">• {{ formatPlayCount(track.play_count) }}</span>
                </div>
              </div>
            </div>
            <div class="track-right">
              <span class="state" :class="`state-${trackState(track)}`">{{ trackState(track) }}</span>
              <button class="ghost" :disabled="isTrackBusy(track)" @click="handleTrackAction(track)">
                {{ actionLabel(track) }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="artist.artist_radio?.length" class="section">
        <div class="section-head">
          <h2>Artist Radio</h2>
        </div>
        <div class="track-list compact">
          <article
            v-for="(track, index) in artist.artist_radio.slice(0, 24)"
            :key="`radio-${track.spotify_id || index}`"
            :class="['track-row', { missing: !isAvailable(track) }]"
          >
            <div class="track-left">
              <span class="index">{{ index + 1 }}</span>
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
              <button class="ghost" :disabled="isTrackBusy(track)" @click="handleTrackAction(track)">
                {{ actionLabel(track) }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="artist.discography_sections" class="section">
        <div class="section-head">
          <h2>Discography</h2>
        </div>
        <div class="album-groups">
          <div v-for="group in discographyGroups" v-show="group.items.length" :key="group.key" class="album-group">
            <h3>{{ group.label }}</h3>
            <div class="album-grid">
              <article
                v-for="album in group.items"
                :key="album.spotify_id"
                class="album-card"
              >
                <button class="album-open" @click="openAlbum(album.spotify_id)">
                  <img :src="album.image_url || '/icons/album-placeholder.svg'" :alt="album.title" @error="onImageError" />
                  <div class="album-title">{{ album.title }}</div>
                  <div class="album-sub">{{ album.release_date || 'Unknown year' }}</div>
                </button>
                <div class="album-actions">
                  <span class="state" :class="`state-${albumState(album)}`">{{ albumState(album) }}</span>
                  <button class="ghost" :disabled="isAlbumBusy(album)" @click="queueAlbumDownload(album)">
                    {{ isAlbumBusy(album) ? 'Queueing...' : albumActionLabel(album) }}
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section v-if="artist.related_artists?.length" class="section">
        <div class="section-head">
          <h2>Related Artists</h2>
        </div>
        <div class="related-grid">
          <button
            v-for="related in artist.related_artists"
            :key="related.id"
            class="related-card"
            @click="openArtist(related.id)"
          >
            <img :src="related.image_url || '/icons/artist-placeholder.svg'" :alt="related.name" @error="onImageError" />
            <div class="related-name">{{ related.name }}</div>
            <div class="related-sub">{{ related.popularity || 0 }}/100 popularity</div>
          </button>
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
import { useRoute, useRouter } from 'vue-router'

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

interface CatalogTrack {
  spotify_id?: string
  trackhash?: string
  title?: string
  artist?: string
  album?: string
  play_count?: number
  last_played?: number
  availability?: TrackAvailability
  download_action?: DownloadAction
  quality_badge?: QualityBadge
}

interface CatalogAlbum {
  spotify_id: string
  title: string
  image_url?: string
  release_date?: string
  availability?: {
    state?: string
    download_action?: DownloadAction
    available_tracks?: number
  }
}

interface RelatedArtist {
  id: string
  name: string
  image_url?: string
  popularity?: number
}

interface ArtistPayload {
  spotify_id: string
  name: string
  image_url?: string
  followers?: number
  popularity?: number
  genres?: string[]
  top_tracks: CatalogTrack[]
  this_is_artist: CatalogTrack[]
  artist_radio: CatalogTrack[]
  related_artists: RelatedArtist[]
  discography_sections?: {
    albums: CatalogAlbum[]
    singles: CatalogAlbum[]
    compilations: CatalogAlbum[]
    other: CatalogAlbum[]
  }
}

interface ImportCandidate {
  user_id: number
  username: string
  file_id: number | null
}

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const artist = ref<ArtistPayload | null>(null)
const batchDownloading = ref(false)
const busyTrackKeys = reactive<Record<string, boolean>>({})
const busyAlbumKeys = reactive<Record<string, boolean>>({})

const importModal = reactive<{
  visible: boolean
  busy: boolean
  track: CatalogTrack | null
  candidates: ImportCandidate[]
}>({
  visible: false,
  busy: false,
  track: null,
  candidates: [],
})

const topTracks = computed(() => (artist.value?.top_tracks || []).slice(0, 15))

const discographyGroups = computed(() => {
  const sections = artist.value?.discography_sections
  if (!sections) {
    return []
  }

  return [
    { key: 'albums', label: 'Albums', items: sections.albums || [] },
    { key: 'singles', label: 'Singles & EPs', items: sections.singles || [] },
    { key: 'compilations', label: 'Compilations', items: sections.compilations || [] },
    { key: 'other', label: 'Other Releases', items: sections.other || [] },
  ]
})

function notify(message: string, type: NotifType) {
  new Notification(message, type)
}

function onImageError(event: Event) {
  const target = event.target as HTMLImageElement | null
  if (target) {
    target.src = '/icons/artist-placeholder.svg'
  }
}

function trackKey(track: CatalogTrack) {
  return track.trackhash || track.spotify_id || `${track.title || 'track'}-${track.artist || ''}`
}

function isTrackBusy(track: CatalogTrack) {
  return !!busyTrackKeys[trackKey(track)]
}

function trackState(track: CatalogTrack) {
  return track.availability?.state || 'missing'
}

function isAvailable(track: CatalogTrack) {
  return trackState(track) === 'available'
}

function actionLabel(track: CatalogTrack) {
  if (isTrackBusy(track)) {
    return 'Working...'
  }

  const action = track.download_action || track.availability?.download_action
  if (action?.label) {
    return action.label
  }

  return isAvailable(track) ? 'Available' : 'Download'
}

function formatFollowers(value?: number) {
  const followers = Number(value || 0)
  if (followers >= 1_000_000) {
    return `${(followers / 1_000_000).toFixed(1)}M`
  }
  if (followers >= 1_000) {
    return `${(followers / 1_000).toFixed(1)}K`
  }
  return String(followers)
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

function spotifyTrackUrl(track: CatalogTrack) {
  if (!track.spotify_id) {
    return ''
  }
  return `https://open.spotify.com/track/${track.spotify_id}`
}

function spotifyArtistUrl() {
  return artist.value?.spotify_id ? `https://open.spotify.com/artist/${artist.value.spotify_id}` : ''
}

async function fetchArtist() {
  const artistId = String(route.params.id || '').trim()
  if (!artistId) {
    error.value = 'Artist ID is missing.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data } = await axios.get(`/api/catalog/artist/${artistId}`)
    artist.value = data
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Failed to load artist information.'
  } finally {
    loading.value = false
  }
}

async function queueTrackDownload(track: CatalogTrack) {
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

function albumKey(album: CatalogAlbum) {
  return album.spotify_id || album.title || 'album'
}

function isAlbumBusy(album: CatalogAlbum) {
  return !!busyAlbumKeys[albumKey(album)]
}

function albumState(album: CatalogAlbum) {
  return album.availability?.state || 'missing'
}

function albumActionLabel(album: CatalogAlbum) {
  return album.availability?.download_action?.label || 'Download Album'
}

async function queueAlbumDownload(albumEntry: CatalogAlbum) {
  if (!albumEntry.spotify_id) {
    notify('Missing Spotify album ID.', NotifType.Error)
    return
  }

  const key = albumKey(albumEntry)
  busyAlbumKeys[key] = true
  try {
    await axios.post('/api/downloads/jobs', {
      source_url: `https://open.spotify.com/album/${albumEntry.spotify_id}`,
      source: 'spotify',
      quality: 'lossless',
      codec: 'flac',
      title: albumEntry.title,
      artist: artist.value?.name,
      album: albumEntry.title,
      item_type: 'album',
      payload: {
        spotify_id: albumEntry.spotify_id,
        item_type: 'album',
      },
    })
    notify(`Queued album: ${albumEntry.title || 'Album'}`, NotifType.Success)
  } catch (err: any) {
    const message = err?.response?.data?.error || 'Failed to queue album download.'
    notify(message, NotifType.Error)
  } finally {
    busyAlbumKeys[key] = false
  }
}

async function openImportModal(track: CatalogTrack) {
  if (!track.trackhash) {
    await queueTrackDownload(track)
    await fetchArtist()
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
      await fetchArtist()
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

async function handleTrackAction(track: CatalogTrack) {
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
    await fetchArtist()
  }
}

async function downloadMissingTopTracks() {
  const missing = topTracks.value.filter(track => trackState(track) !== 'available')
  if (!missing.length) {
    notify('All top tracks are already available.', NotifType.Info)
    return
  }

  batchDownloading.value = true
  try {
    let queued = 0
    for (const track of missing) {
      const ok = await queueTrackDownload(track)
      if (ok) {
        queued += 1
      }
    }

    notify(`Queued ${queued} track(s).`, NotifType.Success)
    await fetchArtist()
  } finally {
    batchDownloading.value = false
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
    await fetchArtist()
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
    await fetchArtist()
  }
}

function closeImportModal() {
  importModal.visible = false
  importModal.track = null
  importModal.candidates = []
  importModal.busy = false
}

function openAlbum(albumId: string) {
  router.push({ name: 'global-album', params: { id: albumId } })
}

function openArtist(artistId: string) {
  router.push({ name: 'global-artist', params: { id: artistId } })
}

function openSpotifyArtist() {
  const url = spotifyArtistUrl()
  if (url) {
    window.open(url, '_blank')
  }
}

watch(
  () => route.params.id,
  () => {
    fetchArtist()
  }
)

onMounted(() => {
  fetchArtist()
})
</script>

<style scoped>
.global-artist {
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
  grid-template-columns: 14rem 1fr;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(132deg, rgba(15, 20, 33, 0.95), rgba(8, 10, 16, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.hero-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.7rem;
}

.hero-copy h1 {
  margin: 0.35rem 0;
  font-size: clamp(1.6rem, 2.2vw, 2.6rem);
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.meta,
.genres {
  margin: 0.25rem 0;
  color: rgba(255, 255, 255, 0.74);
}

.hero-actions {
  margin-top: 0.85rem;
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
  background: linear-gradient(136deg, #64e1b5, #4e98f2);
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

.track-list.compact .track-row {
  padding: 0.55rem 0.65rem;
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

.album-groups {
  display: grid;
  gap: 1rem;
}

.album-group h3 {
  margin: 0 0 0.55rem;
}

.album-grid {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
}

.album-card,
.related-card {
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(0, 0, 0, 0.22);
  border-radius: 0.65rem;
  padding: 0.45rem;
  text-align: left;
}

.album-card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.album-open {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
  width: 100%;
  text-align: left;
}

.album-card img,
.related-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 0.45rem;
}

.album-title,
.related-name {
  font-weight: 600;
  font-size: 0.88rem;
}

.album-sub,
.related-sub {
  margin-top: 0.15rem;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.76rem;
}

.album-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.45rem;
}

.related-grid {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(auto-fill, minmax(8.25rem, 1fr));
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

  .hero-image {
    max-width: 14rem;
  }
}
</style>
