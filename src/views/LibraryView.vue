<template>
  <div class="library-view content-page">
    <section class="hero-strip">
      <RouterLink class="hero-liked card-shell rounded-lg" :to="{ name: Routes.favoriteTracks }">
        <div class="eyebrow">Collection</div>
        <h1>Liked Songs</h1>
        <p>Your most-loved tracks, ready for instant shuffle.</p>
        <div class="metric">{{ favoriteStats.tracks }} tracks</div>
      </RouterLink>

      <div class="hero-metrics">
        <RouterLink class="metric-card card-shell rounded-lg" :to="{ name: Routes.playlists }">
          <div class="eyebrow">Playlists</div>
          <div class="value">{{ playlists.playlists.length }}</div>
          <div class="caption">Your playlists</div>
        </RouterLink>
        <RouterLink class="metric-card card-shell rounded-lg" :to="{ name: Routes.favoriteArtists }">
          <div class="eyebrow">Artists</div>
          <div class="value">{{ favoriteStats.artists }}</div>
          <div class="caption">Liked artists</div>
        </RouterLink>
        <RouterLink class="metric-card card-shell rounded-lg" :to="{ name: Routes.folder, params: { path: '$home' } }">
          <div class="eyebrow">Folders</div>
          <div class="value">{{ rootFolders.length }}</div>
          <div class="caption">Indexed roots</div>
        </RouterLink>
      </div>
    </section>

    <section class="upload-station card-shell rounded-lg">
      <div class="upload-header">
        <div>
          <h2>Upload Into Library</h2>
          <p>
            Upload right from your library hub. You can target any configured folder and trigger a rescan without
            leaving this page.
          </p>
        </div>
        <div v-if="uploading" class="upload-status">Uploading...</div>
      </div>

      <div class="upload-actions">
        <select v-model="selectedUploadTarget">
          <option v-for="folder in rootFolders" :key="folder.uploadTarget" :value="folder.uploadTarget">
            {{ folder.label }}
          </option>
        </select>
        <button class="primary" :disabled="uploading || !selectedUploadTarget" @click="triggerUploadSelect">
          Choose files
        </button>
        <button class="ghost" :disabled="uploading" @click="triggerLibraryScan">Rescan library</button>
      </div>

      <p v-if="uploadMessage" class="upload-result">{{ uploadMessage }}</p>

      <input
        ref="uploadInput"
        type="file"
        accept="audio/*"
        multiple
        class="hidden-upload-input"
        @change="handleUploadInputChange"
      />
    </section>

    <CardScroller
      :items="playlistItems"
      title="Playlists"
      route="/playlists"
      see-all-text="See all playlists"
    />

    <CardScroller
      v-if="favoriteArtistItems.length"
      :items="favoriteArtistItems"
      title="Liked Artists"
      route="/favorites/artists"
      see-all-text="See all artists"
    />

    <CardScroller
      v-if="favoriteAlbumItems.length"
      :items="favoriteAlbumItems"
      title="Favorite Albums"
      route="/favorites/albums"
      see-all-text="See all albums"
    />

    <section class="folder-section">
      <div class="section-head">
        <h3>Folders</h3>
        <RouterLink :to="{ name: Routes.folder, params: { path: '$home' } }">Open full folder browser</RouterLink>
      </div>

      <div v-if="rootFolders.length" class="folder-grid">
        <article v-for="folder in rootFolders" :key="folder.path" class="folder-card card-shell rounded-lg">
          <RouterLink class="folder-main" :to="{ name: Routes.folder, params: { path: folder.path } }">
            <div class="folder-name">{{ folder.label }}</div>
            <div class="folder-path">{{ folder.pathDisplay }}</div>
          </RouterLink>
          <button class="folder-upload" :disabled="uploading" @click="startUploadForFolder(folder.uploadTarget)">
            Upload here
          </button>
        </article>
      </div>

      <div v-else class="empty-folders card-shell rounded-lg">
        No root folders configured yet. Open Settings and add at least one library folder.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref } from "vue";

import CardScroller from "@/components/shared/CardScroller.vue";
import { NotifType, Notification } from "@/stores/notification";
import { getAllFavs, getFavArtists } from "@/requests/favorite";
import { getRootDirs, triggerScan } from "@/requests/settings/rootdirs";
import { Routes } from "@/router";
import usePlaylistsStore from "@/stores/pages/playlists";
import useSettingsStore from "@/stores/settings";
import updatePageTitle from "@/utils/updatePageTitle";
import { Album, Artist } from "@/interfaces";

const playlists = usePlaylistsStore();
const settings = useSettingsStore();

const uploadInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const uploadMessage = ref("");
const selectedUploadTarget = ref("");
const defaultUploadDirectory = ref("");

const favoriteStats = ref({
  tracks: 0,
  albums: 0,
  artists: 0,
});

const favoriteArtists = ref<Artist[]>([]);
const favoriteAlbums = ref<Album[]>([]);

const rootFolders = computed(() => {
  const homeMusic = defaultUploadDirectory.value || "$home";

  return settings.root_dirs.map((folderPath) => {
    const isHomeShortcut = folderPath === "$home";
    const normalized = folderPath.replace(/\/+$/, "");
    const labels = normalized.split(/[\\/]/).filter(Boolean);
    const fallbackLabel = isHomeShortcut ? "Home Music" : normalized || folderPath;

    return {
      path: folderPath,
      label: labels[labels.length - 1] || fallbackLabel,
      pathDisplay: isHomeShortcut ? "Home shortcut" : folderPath,
      uploadTarget: isHomeShortcut ? homeMusic : folderPath,
    };
  });
});

const playlistItems = computed(() =>
  playlists.playlists.map((playlist) => ({
    type: "playlist",
    item: playlist,
  }))
);

const favoriteArtistItems = computed(() =>
  favoriteArtists.value.map((artist) => ({
    type: "artist",
    item: artist,
  }))
);

const favoriteAlbumItems = computed(() =>
  favoriteAlbums.value.map((album) => ({
    type: "album",
    item: album,
  }))
);

function triggerUploadSelect() {
  uploadInput.value?.click();
}

function startUploadForFolder(folderPath: string) {
  selectedUploadTarget.value = folderPath;
  triggerUploadSelect();
}

async function uploadFiles(files: File[]) {
  if (!files.length) {
    return;
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  if (selectedUploadTarget.value) {
    formData.append("target_dir", selectedUploadTarget.value);
  }

  try {
    uploading.value = true;
    uploadMessage.value = "";

    const { data } = await axios.post("/upload/batch", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const successful = Number(data?.uploaded_files?.length || 0);
    const failed = Number(data?.failed_files?.length || 0);

    uploadMessage.value = data?.message || `Uploaded ${successful} file(s).`;

    if (successful > 0) {
      new Notification(`Uploaded ${successful} file(s) successfully`, NotifType.Success);
    }

    if (failed > 0) {
      new Notification(`${failed} file(s) failed to upload`, NotifType.Error);
    }
  } catch (error: any) {
    const message = error?.response?.data?.message || "Upload failed";
    uploadMessage.value = message;
    new Notification(message, NotifType.Error);
  } finally {
    uploading.value = false;
  }
}

async function handleUploadInputChange(event: Event) {
  const element = event.target as HTMLInputElement;
  const files = Array.from(element.files || []);

  await uploadFiles(files);
  element.value = "";
}

async function triggerLibraryScan() {
  await triggerScan();
}

async function loadLibraryData() {
  const [playlistsResult, favoritesResult, artistsResult, rootDirsResult, uploadConfigResult] = await Promise.allSettled(
    [
      playlists.fetchAll(),
      getAllFavs(0, 8, 0),
      getFavArtists(0, 10),
      getRootDirs(),
      axios.get("/upload/config"),
    ]
  );

  if (favoritesResult.status === "fulfilled" && favoritesResult.value) {
    favoriteStats.value = favoritesResult.value.count || favoriteStats.value;
    favoriteAlbums.value = favoritesResult.value.albums || [];
  }

  if (artistsResult.status === "fulfilled" && artistsResult.value) {
    favoriteArtists.value = artistsResult.value.artists || [];
  }

  if (rootDirsResult.status === "fulfilled") {
    settings.setRootDirs(rootDirsResult.value);
  }

  if (uploadConfigResult.status === "fulfilled") {
    defaultUploadDirectory.value = uploadConfigResult.value.data?.upload_directory || "";
  }

  if (!selectedUploadTarget.value && rootFolders.value.length) {
    selectedUploadTarget.value = rootFolders.value[0].uploadTarget;
  }

  if (playlistsResult.status === "rejected") {
    new Notification("Failed to load playlists", NotifType.Error);
  }
}

onMounted(async () => {
  updatePageTitle("Your Library");
  await loadLibraryData();
});
</script>

<style lang="scss">
.library-view {
  --library-surface: linear-gradient(138deg, rgba(24, 35, 52, 0.78), rgba(12, 17, 28, 0.86));
  --library-border: rgba(135, 170, 224, 0.24);
  --library-accent: #7ee3d2;
  --library-accent-soft: rgba(126, 227, 210, 0.15);

  height: 100%;
  overflow: auto;
  padding-bottom: 1.5rem;
  font-family: "SFCompactDisplay-Regular", "Avenir Next", "Segoe UI", sans-serif;

  .card-shell {
    border: 1px solid var(--library-border);
    background: var(--library-surface);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 22px 44px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(6px);
  }

  .hero-strip {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 1rem;
    padding: 0 $medium;
    margin-top: $medium;
  }

  .hero-liked {
    padding: 1.4rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 12.5rem;
    background:
      radial-gradient(circle at 85% 12%, rgba(126, 227, 210, 0.33), rgba(126, 227, 210, 0)),
      linear-gradient(144deg, #102e4c, #18212f 62%, #101118);

    h1 {
      font-family: "SFCompactDisplay-Bold", "Avenir Next", "Segoe UI", sans-serif;
      letter-spacing: -0.03em;
      margin: 0.4rem 0 0.45rem;
      font-size: clamp(1.6rem, 2vw, 2.35rem);
    }

    p {
      margin: 0;
      color: rgba(255, 255, 255, 0.78);
      line-height: 1.45;
      max-width: 30ch;
    }
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.55);
  }

  .metric {
    margin-top: 0.95rem;
    font-weight: 700;
    color: var(--library-accent);
    font-size: 0.96rem;
  }

  .hero-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .metric-card {
    min-height: 12.5rem;
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    transition: border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(126, 227, 210, 0.48);
    }

    .value {
      margin-top: 0.9rem;
      font-family: "SFCompactDisplay-Semibold", "Avenir Next", "Segoe UI", sans-serif;
      font-size: clamp(2.05rem, 3vw, 2.9rem);
      line-height: 1;
      letter-spacing: -0.045em;
      color: #ffffff;
    }

    .caption {
      margin-top: 0.62rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.88rem;
    }
  }

  .upload-station {
    margin: 1rem $medium 0;
    padding: 1.15rem;

    h2 {
      margin: 0;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }

    p {
      margin: 0.35rem 0 0;
      color: rgba(255, 255, 255, 0.72);
      line-height: 1.45;
    }

    .upload-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .upload-status {
      align-self: flex-start;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--library-accent);
    }

    .upload-actions {
      display: grid;
      grid-template-columns: minmax(0, 2fr) repeat(2, auto);
      gap: 0.7rem;
      align-items: center;
    }

    select,
    button {
      min-height: 2.6rem;
      border-radius: 0.7rem;
      border: 1px solid rgba(255, 255, 255, 0.16);
      font-weight: 600;
      font-size: 0.86rem;
      letter-spacing: 0.01em;
    }

    select {
      background: rgba(9, 13, 20, 0.84);
      color: #f5f8ff;
      padding: 0 0.75rem;
    }

    button {
      padding: 0 1rem;
      cursor: pointer;
      transition: transform 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;

      &:disabled {
        opacity: 0.52;
        cursor: not-allowed;
      }
    }

    .primary {
      background: linear-gradient(138deg, #7ee3d2, #6a9cff);
      color: #061521;
      border-color: rgba(0, 0, 0, 0.28);

      &:hover:not(:disabled) {
        transform: translateY(-1px);
      }
    }

    .ghost {
      background: rgba(255, 255, 255, 0.05);
      color: #f3f7ff;

      &:hover:not(:disabled) {
        border-color: rgba(126, 227, 210, 0.4);
      }
    }

    .upload-result {
      margin-top: 0.8rem;
      color: rgba(255, 255, 255, 0.86);
      font-size: 0.88rem;
    }
  }

  .hidden-upload-input {
    display: none;
  }

  .folder-section {
    margin-top: 0.45rem;
    padding: 0 $medium 1.25rem;
  }

  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.7rem;

    h3 {
      margin: 0;
      font-size: 1.05rem;
    }

    a {
      color: rgba(255, 255, 255, 0.76);
      font-size: 0.86rem;
      text-decoration: underline;
      text-underline-offset: 0.2rem;
    }
  }

  .folder-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
  }

  .folder-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 7.15rem;
    padding: 0.9rem;
  }

  .folder-main {
    display: block;
  }

  .folder-name {
    font-size: 0.98rem;
    font-family: "SFCompactDisplay-Semibold", "Avenir Next", "Segoe UI", sans-serif;
    letter-spacing: -0.02em;
  }

  .folder-path {
    margin-top: 0.35rem;
    color: rgba(255, 255, 255, 0.67);
    font-size: 0.75rem;
    overflow-wrap: anywhere;
  }

  .folder-upload {
    margin-top: 0.9rem;
    min-height: 2.25rem;
    border-radius: 0.62rem;
    border: 1px solid rgba(126, 227, 210, 0.52);
    background: var(--library-accent-soft);
    color: #c8fff4;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba(126, 227, 210, 0.26);
      color: #ffffff;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .empty-folders {
    padding: 1rem;
    color: rgba(255, 255, 255, 0.72);
  }

  @include for-desktop-down {
    .hero-strip {
      grid-template-columns: 1fr;
    }

    .hero-metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .folder-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @include allPhones {
    .hero-metrics {
      grid-template-columns: 1fr;
    }

    .upload-station .upload-actions {
      grid-template-columns: 1fr;
    }

    .folder-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
