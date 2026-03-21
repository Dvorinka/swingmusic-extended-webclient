<template>
  <div class="download-shell">
    <section class="intro-panel panel rounded-lg">
      <div class="intro-copy">
        <p class="kicker">Download Center</p>
        <h1>Universal Music Downloader</h1>
        <p class="lead">
          Paste a music URL, choose quality, and track progress in one place. Queue and history refresh automatically.
        </p>
      </div>
      <div class="intro-stats">
        <article class="mini-stat">
          <span class="label">Queued</span>
          <span class="value">{{ queueStatus.queue_length || 0 }}</span>
        </article>
        <article class="mini-stat">
          <span class="label">Active</span>
          <span class="value">{{ queueStatus.active_downloads || 0 }}</span>
        </article>
        <article class="mini-stat">
          <span class="label">Updated</span>
          <span class="value small">{{ lastUpdatedLabel }}</span>
        </article>
      </div>
    </section>

    <section class="action-grid">
      <div class="panel rounded-lg url-panel">
        <label class="field-label">Music URL</label>
        <div class="url-row">
          <input
            v-model="urlInput"
            type="text"
            placeholder="https://open.spotify.com/track/... or any supported service URL"
            :disabled="adding"
            @keydown.enter.prevent="addToQueue"
          />
          <button class="primary" :disabled="adding || !urlInput.trim()" @click="addToQueue">
            <Loader2 v-if="adding" class="spin" />
            <Plus v-else />
            {{ adding ? "Adding..." : "Queue" }}
          </button>
        </div>

        <div class="controls-row">
          <div class="quality-group">
            <span>Quality</span>
            <select v-model="selectedQuality" :disabled="adding || addingBatch">
              <option value="lossless">Lossless</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button class="ghost" :disabled="refreshing" @click="refreshQueue">
            <RefreshCw :class="{ spin: refreshing }" />
            Refresh
          </button>
        </div>

        <label v-if="isTrackablePlaylist" class="track-playlist-toggle">
          <input v-model="trackPlaylistAfterAdd" type="checkbox" />
          Auto-track this playlist and sync new changes
        </label>

        <div v-if="detectedService" class="detected-service">
          <span class="service-pill">{{ formatServiceName(detectedService.service) }}</span>
          <span class="item-pill">{{ detectedService.item_type }}</span>
        </div>

        <article v-if="metadataPreview" class="metadata-preview rounded-md">
          <div class="meta-title">{{ metadataPreview.title }}</div>
          <div class="meta-subtitle">
            {{ metadataPreview.artist || "Unknown Artist" }}
            <span v-if="metadataPreview.album">• {{ metadataPreview.album }}</span>
          </div>
          <div class="meta-foot">
            <span>{{ formatServiceName(metadataPreview.service) }}</span>
            <span v-if="metadataPreview.duration_ms">{{ formatDuration(metadataPreview.duration_ms) }}</span>
          </div>
        </article>
      </div>

      <div class="panel rounded-lg batch-panel">
        <label class="field-label">Batch Queue</label>
        <textarea
          v-model="batchUrls"
          rows="8"
          placeholder="Paste one URL per line..."
          :disabled="addingBatch"
        />
        <div class="batch-actions">
          <span>{{ parsedBatchUrls.length }} URL{{ parsedBatchUrls.length === 1 ? "" : "s" }}</span>
          <button class="primary" :disabled="addingBatch || parsedBatchUrls.length === 0" @click="addBatchToQueue">
            <Loader2 v-if="addingBatch" class="spin" />
            <Download v-else />
            {{ addingBatch ? "Adding..." : "Add Batch" }}
          </button>
        </div>
      </div>
    </section>

    <section class="panel rounded-lg queue-panel">
      <div class="panel-head">
        <h2>Queue</h2>
        <span>{{ queueItems.length }} item{{ queueItems.length === 1 ? "" : "s" }}</span>
      </div>

      <div v-if="queueItems.length" class="queue-list">
        <article v-for="item in queueItems" :key="item.id" class="queue-item rounded-md">
          <div class="item-main">
            <div class="title">{{ item.title || "Untitled" }}</div>
            <div class="subtitle">
              {{ item.artist || "Unknown Artist" }} • {{ formatServiceName(item.service) }} •
              {{ item.quality }}
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${Math.max(0, Math.min(100, item.progress || 0))}%` }" />
            </div>
          </div>
          <div class="item-state">
            <span class="status-badge" :class="`status-${item.status}`">{{ item.status }}</span>
            <button
              v-if="item.status === 'queued' || item.status === 'downloading'"
              class="danger"
              @click="cancelItem(item.id)"
            >
              <X />
            </button>
            <button v-if="item.status === 'failed'" class="ghost" @click="retryItem(item.id)">
              <RotateCw />
            </button>
          </div>
        </article>
      </div>

      <div v-else class="empty">No queued downloads yet.</div>
    </section>

    <section class="panel rounded-lg history-panel">
      <div class="panel-head">
        <h2>History</h2>
        <span>{{ historyItems.length }} item{{ historyItems.length === 1 ? "" : "s" }}</span>
      </div>

      <div v-if="historyItems.length" class="history-list">
        <article v-for="item in historyItems" :key="item.id" class="history-item rounded-md">
          <div>
            <div class="title">{{ item.title || "Untitled" }}</div>
            <div class="subtitle">
              {{ formatServiceName(item.service) }} • {{ item.status }} • {{ formatTimestamp(item.finished_at || item.created_at) }}
            </div>
          </div>
          <span class="quality">{{ item.quality }}</span>
        </article>
      </div>

      <div v-else class="empty">No completed or failed downloads yet.</div>
    </section>

    <section class="panel rounded-lg tracked-panel">
      <div class="panel-head">
        <h2>Tracked Playlists</h2>
        <span>{{ trackedPlaylists.length }}</span>
      </div>

      <div v-if="trackedPlaylists.length" class="history-list">
        <article v-for="playlist in trackedPlaylists" :key="playlist.id" class="history-item rounded-md">
          <div>
            <div class="title">{{ playlist.title || `Playlist ${playlist.playlist_id}` }}</div>
            <div class="subtitle">
              {{ playlist.auto_sync ? "Auto-sync on" : "Auto-sync off" }} •
              Last sync {{ formatTimestamp(playlist.last_sync_at || playlist.updated_at) }}
            </div>
          </div>
          <div class="tracked-actions">
            <span class="status-badge" :class="`status-${playlist.status}`">{{ playlist.status }}</span>
            <button
              class="ghost"
              :disabled="trackedBusy[playlist.id]"
              @click="syncTrackedPlaylist(playlist.id)"
            >
              Sync now
            </button>
            <button
              class="ghost"
              :disabled="trackedBusy[playlist.id]"
              @click="toggleTrackedSync(playlist)"
            >
              {{ playlist.auto_sync ? "Pause" : "Resume" }}
            </button>
          </div>
        </article>
      </div>

      <div v-else class="empty">No tracked playlists yet.</div>
    </section>

    <section class="panel rounded-lg services-panel">
      <div class="panel-head">
        <h2>Supported Services</h2>
      </div>
      <div class="service-grid">
        <div v-for="service in services" :key="service.id" class="service-card rounded-md">
          <div class="service-name">{{ service.name }}</div>
          <div class="service-types">{{ service.supported_types?.join(", ") }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, Loader2, Plus, RefreshCw, RotateCw, X } from "lucide-vue-next";
import { useRoute } from "vue-router";

import { NotifType, Notification } from "@/stores/notification";

interface DetectedService {
  valid: boolean;
  service: string;
  item_type: string;
  id: string;
}

interface MetadataPreview {
  service: string;
  title: string;
  artist: string;
  album?: string;
  duration_ms?: number;
}

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  service: string;
  quality: string;
  status: "queued" | "downloading" | "completed" | "failed" | "cancelled";
  progress: number;
  created_at: number;
  finished_at?: number;
}

interface QueueState {
  queue_length: number;
  active_downloads: number;
  queue: QueueItem[];
  history: QueueItem[];
}

interface SupportedService {
  id: string;
  name: string;
  supported_types: string[];
}

interface TrackedPlaylist {
  id: number;
  playlist_id: string;
  title?: string;
  status: string;
  auto_sync: boolean;
  last_sync_at?: number;
  updated_at?: number;
}

const urlInput = ref("");
const selectedQuality = ref("high");
const trackPlaylistAfterAdd = ref(true);
const batchUrls = ref("");
const route = useRoute();

const adding = ref(false);
const addingBatch = ref(false);
const refreshing = ref(false);

const detectedService = ref<DetectedService | null>(null);
const metadataPreview = ref<MetadataPreview | null>(null);
const services = ref<SupportedService[]>([]);
const trackedPlaylists = ref<TrackedPlaylist[]>([]);
const trackedBusy = ref<Record<number, boolean>>({});
const lastUpdated = ref<number | null>(null);

const queueStatus = ref<QueueState>({
  queue_length: 0,
  active_downloads: 0,
  queue: [],
  history: [],
});

const queueItems = computed(() => queueStatus.value.queue || []);
const historyItems = computed(() => queueStatus.value.history || []);
const parsedBatchUrls = computed(() =>
  batchUrls.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 8)
);
const isTrackablePlaylist = computed(() => detectedService.value?.item_type === "playlist");

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) {
    return "never";
  }
  return new Date(lastUpdated.value).toLocaleTimeString();
});

let refreshTimer: number | null = null;
let validationTimer: number | null = null;

function formatServiceName(service: string) {
  return service.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatTimestamp(timestamp?: number) {
  if (!timestamp) {
    return "unknown time";
  }
  return new Date(timestamp * 1000).toLocaleString();
}

async function loadSupportedServices() {
  try {
    const { data } = await axios.get("/api/universal/services");
    services.value = data?.services || [];
  } catch {
    new Notification("Failed to load supported services", NotifType.Error);
  }
}

async function refreshQueue() {
  try {
    refreshing.value = true;
    const { data } = await axios.get("/api/downloads/queue");
    queueStatus.value = {
      queue_length: data?.queue_length || 0,
      active_downloads: data?.active_downloads || 0,
      queue: data?.queue || [],
      history: data?.history || [],
    };
    lastUpdated.value = Date.now();
    await loadTrackedPlaylists();
  } catch {
    new Notification("Failed to refresh queue", NotifType.Error);
  } finally {
    refreshing.value = false;
  }
}

async function loadTrackedPlaylists() {
  try {
    const { data } = await axios.get("/api/downloads/playlists/tracked");
    trackedPlaylists.value = data?.tracked_playlists || [];
  } catch {
    trackedPlaylists.value = [];
  }
}

async function addToQueue() {
  const trimmedUrl = urlInput.value.trim();
  if (!trimmedUrl || adding.value) {
    return;
  }

  try {
    adding.value = true;
    let data: any = null;

    if (isTrackablePlaylist.value && trackPlaylistAfterAdd.value) {
      const tracked = await axios.post("/api/downloads/playlists/track", {
        source_url: trimmedUrl,
        quality: selectedQuality.value,
        codec: selectedQuality.value === "lossless" ? "flac" : "mp3",
        auto_sync: true,
        sync_interval_seconds: 900,
        sync_now: true,
      });
      data = tracked.data;
    } else {
      const queued = await axios.post("/api/universal/download", {
        url: trimmedUrl,
        quality: selectedQuality.value,
      });
      data = queued.data;
    }

    if (data?.success) {
      if (isTrackablePlaylist.value && trackPlaylistAfterAdd.value) {
        const queuedTracks = Number(data?.sync?.queued_tracks || 0);
        new Notification(
          queuedTracks > 0
            ? `Playlist tracking enabled (${queuedTracks} download jobs queued)`
            : "Playlist tracking enabled",
          NotifType.Success
        );
      } else {
        new Notification("Download added to queue", NotifType.Success);
      }
      urlInput.value = "";
      detectedService.value = null;
      metadataPreview.value = null;
      await refreshQueue();
      return;
    }

    new Notification(data?.error || "Failed to add download", NotifType.Error);
  } catch (error: any) {
    const message = error?.response?.data?.error || "Failed to add download";
    new Notification(message, NotifType.Error);
  } finally {
    adding.value = false;
  }
}

async function syncTrackedPlaylist(trackedId: number) {
  if (trackedBusy.value[trackedId]) {
    return;
  }

  trackedBusy.value = { ...trackedBusy.value, [trackedId]: true };
  try {
    const { data } = await axios.post(`/api/downloads/playlists/${trackedId}/sync`);
    if (data?.success) {
      const queued = Number(data?.result?.queued_tracks || 0);
      new Notification(
        queued > 0 ? `Playlist synced (${queued} new track downloads queued)` : "Playlist synced",
        NotifType.Success
      );
      await refreshQueue();
      return;
    }
    new Notification(data?.error || data?.message || "Failed to sync playlist", NotifType.Error);
  } catch (error: any) {
    const message = error?.response?.data?.error || "Failed to sync playlist";
    new Notification(message, NotifType.Error);
  } finally {
    trackedBusy.value = { ...trackedBusy.value, [trackedId]: false };
  }
}

async function toggleTrackedSync(playlist: TrackedPlaylist) {
  const id = Number(playlist.id);
  if (!id || trackedBusy.value[id]) {
    return;
  }

  trackedBusy.value = { ...trackedBusy.value, [id]: true };
  try {
    const { data } = await axios.post(`/api/downloads/playlists/${id}/auto-sync`, {
      enabled: !playlist.auto_sync,
    });
    if (data?.success) {
      new Notification(
        !playlist.auto_sync ? "Playlist auto-sync resumed" : "Playlist auto-sync paused",
        NotifType.Info
      );
      await loadTrackedPlaylists();
      return;
    }
    new Notification(data?.error || "Failed to update playlist sync state", NotifType.Error);
  } catch (error: any) {
    const message = error?.response?.data?.error || "Failed to update playlist sync state";
    new Notification(message, NotifType.Error);
  } finally {
    trackedBusy.value = { ...trackedBusy.value, [id]: false };
  }
}

async function addBatchToQueue() {
  if (!parsedBatchUrls.value.length || addingBatch.value) {
    return;
  }

  try {
    addingBatch.value = true;
    const { data } = await axios.post("/api/universal/batch", {
      urls: parsedBatchUrls.value,
      quality: selectedQuality.value,
    });

    const successful = Number(data?.successful || 0);
    const failed = Number(data?.failed || 0);

    if (successful > 0) {
      new Notification(`Added ${successful} URL(s) to queue`, NotifType.Success);
    }

    if (failed > 0) {
      new Notification(`${failed} URL(s) failed`, NotifType.Error);
    }

    batchUrls.value = "";
    await refreshQueue();
  } catch (error: any) {
    const message = error?.response?.data?.error || "Batch queue failed";
    new Notification(message, NotifType.Error);
  } finally {
    addingBatch.value = false;
  }
}

async function cancelItem(itemId: string) {
  try {
    const { data } = await axios.post(`/api/downloads/jobs/${itemId}/cancel`);
    if (data?.success) {
      new Notification("Download cancelled", NotifType.Info);
      await refreshQueue();
    }
  } catch {
    new Notification("Failed to cancel download", NotifType.Error);
  }
}

async function retryItem(itemId: string) {
  try {
    const { data } = await axios.post(`/api/downloads/jobs/${itemId}/retry`);
    if (data?.success) {
      new Notification("Retry queued", NotifType.Success);
      await refreshQueue();
    }
  } catch {
    new Notification("Failed to retry download", NotifType.Error);
  }
}

async function detectUrlMetadata() {
  const trimmedUrl = urlInput.value.trim();
  if (trimmedUrl.length < 9) {
    detectedService.value = null;
    metadataPreview.value = null;
    return;
  }

  try {
    const { data: validateData } = await axios.post("/api/universal/validate-url", {
      url: trimmedUrl,
    });

    if (!validateData?.valid) {
      detectedService.value = null;
      metadataPreview.value = null;
      return;
    }

    detectedService.value = validateData;

    const { data: metadataData } = await axios.post("/api/universal/metadata", {
      url: trimmedUrl,
    });

    if (metadataData?.success) {
      metadataPreview.value = metadataData;
    }
  } catch {
    detectedService.value = null;
    metadataPreview.value = null;
  }
}

function getRoutePrefillUrl() {
  const queryUrl = typeof route.query.url === "string" ? route.query.url.trim() : "";
  if (queryUrl) {
    return queryUrl;
  }

  const routeName = String(route.name || "");
  const routeId = typeof route.params.id === "string" ? route.params.id.trim() : "";
  if (!routeId) {
    return "";
  }

  if (routeName === "spotify-track") {
    return `https://open.spotify.com/track/${routeId}`;
  }
  if (routeName === "spotify-playlist") {
    return `https://open.spotify.com/playlist/${routeId}`;
  }
  if (routeName === "global-playlist") {
    return `https://open.spotify.com/playlist/${routeId}`;
  }

  return "";
}

async function applyRoutePrefill() {
  const prefillUrl = getRoutePrefillUrl();
  if (!prefillUrl || prefillUrl === urlInput.value) {
    return;
  }

  urlInput.value = prefillUrl;
  await detectUrlMetadata();
}

watch(urlInput, () => {
  if (validationTimer) {
    clearTimeout(validationTimer);
  }

  validationTimer = window.setTimeout(() => {
    detectUrlMetadata();
  }, 350);
});

watch(
  () => [route.name, route.params.id, route.query.url],
  () => {
    applyRoutePrefill();
  }
);

onMounted(async () => {
  await applyRoutePrefill();
  await Promise.all([loadSupportedServices(), refreshQueue(), loadTrackedPlaylists()]);
  refreshTimer = window.setInterval(() => {
    refreshQueue();
  }, 4000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  if (validationTimer) {
    clearTimeout(validationTimer);
  }
});
</script>

<style lang="scss" scoped>
.download-shell {
  --down-panel: linear-gradient(141deg, rgba(9, 18, 33, 0.93), rgba(15, 9, 25, 0.9) 54%, rgba(10, 17, 19, 0.93));
  --down-border: rgba(143, 224, 251, 0.25);
  --down-accent: #68f2ca;
  --down-accent-deep: #66b2ff;

  padding: 1.25rem $medium 2rem;
  display: grid;
  gap: 0.95rem;
  font-family: "SFCompactDisplay-Regular", "Avenir Next", "Segoe UI", sans-serif;

  .panel {
    background: var(--down-panel);
    border: 1px solid var(--down-border);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 18px 36px rgba(0, 0, 0, 0.28);
    padding: 1rem;
  }

  .intro-panel {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 1rem;
    background:
      radial-gradient(circle at 88% 10%, rgba(104, 242, 202, 0.2), rgba(104, 242, 202, 0)),
      linear-gradient(145deg, rgba(16, 32, 57, 0.95), rgba(10, 13, 24, 0.93));
  }

  .kicker {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.56);
  }

  h1 {
    margin: 0.45rem 0 0.35rem;
    font-family: "SFCompactDisplay-Bold", "Avenir Next", "Segoe UI", sans-serif;
    font-size: clamp(1.45rem, 2vw, 2.25rem);
    letter-spacing: -0.03em;
  }

  .lead {
    margin: 0;
    color: rgba(255, 255, 255, 0.77);
    line-height: 1.45;
    max-width: 42ch;
  }

  .intro-stats {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }

  .mini-stat {
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 0.75rem;
    padding: 0.7rem 0.8rem;
    background: rgba(0, 0, 0, 0.25);
    display: grid;
    gap: 0.25rem;
  }

  .mini-stat .label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(255, 255, 255, 0.55);
  }

  .mini-stat .value {
    font-size: 1.3rem;
    font-family: "SFCompactDisplay-Semibold", "Avenir Next", "Segoe UI", sans-serif;
    letter-spacing: -0.02em;
  }

  .mini-stat .value.small {
    font-size: 0.95rem;
    letter-spacing: 0;
  }

  .action-grid {
    display: grid;
    gap: 0.9rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field-label {
    display: inline-block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(255, 255, 255, 0.62);
    margin-bottom: 0.5rem;
  }

  .url-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.65rem;
    margin-bottom: 0.7rem;
  }

  input,
  select,
  textarea,
  button {
    font-family: inherit;
    border-radius: 0.72rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #f2f8ff;
    background: rgba(8, 14, 26, 0.85);
    min-height: 2.6rem;
  }

  input,
  textarea,
  select {
    padding: 0.65rem 0.78rem;
    transition: border-color 0.2s ease;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: rgba(102, 178, 255, 0.7);
  }

  textarea {
    min-height: 10rem;
    resize: vertical;
  }

  button {
    padding: 0 0.9rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    transition: transform 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  }

  button:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  .primary {
    background: linear-gradient(139deg, var(--down-accent), var(--down-accent-deep));
    color: #07121f;
    border-color: rgba(0, 0, 0, 0.25);
  }

  .ghost {
    background: rgba(255, 255, 255, 0.05);
  }

  .danger {
    background: rgba(242, 90, 103, 0.16);
    border-color: rgba(242, 90, 103, 0.5);
    color: #ffd8dc;
  }

  .controls-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    align-items: center;
    justify-content: space-between;
  }

  .track-playlist-toggle {
    margin-top: 0.65rem;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.82rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .track-playlist-toggle input {
    width: 1rem;
    height: 1rem;
    min-height: 1rem;
    accent-color: #66b2ff;
  }

  .quality-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.87rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .detected-service {
    margin-top: 0.8rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .service-pill,
  .item-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.24rem 0.62rem;
    font-size: 0.76rem;
    letter-spacing: 0.02em;
  }

  .service-pill {
    background: rgba(104, 242, 202, 0.2);
    border: 1px solid rgba(104, 242, 202, 0.5);
    color: #d7fff4;
  }

  .item-pill {
    background: rgba(102, 178, 255, 0.2);
    border: 1px solid rgba(102, 178, 255, 0.5);
    color: #e5f2ff;
  }

  .metadata-preview {
    margin-top: 0.8rem;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.25);
  }

  .meta-title {
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .meta-subtitle,
  .meta-foot {
    margin-top: 0.25rem;
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.83rem;
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .batch-actions {
    margin-top: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.85rem;
  }

  .panel-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .panel-head h2 {
    margin: 0;
    font-size: 1.05rem;
    letter-spacing: -0.015em;
  }

  .panel-head span {
    color: rgba(255, 255, 255, 0.65);
    font-size: 0.84rem;
  }

  .queue-list,
  .history-list {
    display: grid;
    gap: 0.55rem;
  }

  .queue-item,
  .history-item {
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.24);
    padding: 0.72rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
  }

  .item-main {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-weight: 700;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle {
    margin-top: 0.2rem;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.68);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .progress-track {
    margin-top: 0.48rem;
    height: 0.28rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #66b2ff, #68f2ca);
  }

  .item-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tracked-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .status-badge {
    border-radius: 999px;
    padding: 0.22rem 0.58rem;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .status-pending {
    background: rgba(255, 255, 255, 0.15);
  }

  .status-downloading {
    background: rgba(102, 178, 255, 0.22);
    color: #d9ebff;
  }

  .status-syncing {
    background: rgba(102, 178, 255, 0.22);
    color: #d9ebff;
  }

  .status-completed {
    background: rgba(104, 242, 202, 0.22);
    color: #d8fff5;
  }

  .status-active {
    background: rgba(104, 242, 202, 0.2);
    color: #d8fff5;
  }

  .status-failed {
    background: rgba(242, 90, 103, 0.2);
    color: #ffd8dc;
  }

  .status-paused {
    background: rgba(255, 182, 86, 0.2);
    color: #ffe8c7;
  }

  .quality {
    border-radius: 999px;
    padding: 0.22rem 0.55rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 0.72rem;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
  }

  .empty {
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.9rem;
    padding: 0.25rem 0;
  }

  .service-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
    gap: 0.55rem;
  }

  .service-card {
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.22);
    padding: 0.62rem;
  }

  .service-name {
    font-size: 0.88rem;
    font-weight: 700;
  }

  .service-types {
    margin-top: 0.26rem;
    font-size: 0.74rem;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.35;
  }

  .spin {
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @include for-desktop-down {
    .intro-panel {
      grid-template-columns: 1fr;
    }

    .action-grid {
      grid-template-columns: 1fr;
    }
  }

  @include allPhones {
    .url-row {
      grid-template-columns: 1fr;
    }

    .controls-row {
      align-items: stretch;
      flex-direction: column;
    }

    .batch-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
