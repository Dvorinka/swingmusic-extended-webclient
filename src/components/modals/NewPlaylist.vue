<template>
  <form class="playlist-modal" @submit="create">
    <label for="name">Playlist name</label>
    <br />
    <input
      id="modal-playlist-name-input"
      type="search"
      class="rounded-sm"
      name="name"
      placeholder="Type a name..."
      spellcheck="false"
    />
    <br /><br />
    <button type="submit">Create</button>
  </form>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import {
  createNewPlaylist,
  saveAlbumAsPlaylist,
  saveArtistAsPlaylist,
  saveFolderAsPlaylist,
  saveTrackAsPlaylist,
} from "@/requests/playlists";

import { NotifType, Notification } from "@/stores/notification";
import usePlaylistStore from "@/stores/pages/playlists";
import useTracklist from "@/stores/queue/tracklist";

const props = defineProps<{
  trackhash?: string;
  path?: string;
  playlist_name?: string;
  albumhash?: string;
  artisthash?: string;
  is_queue?: boolean;
}>();

const store = usePlaylistStore();

onMounted(() => {
  const input_elem = document.getElementById("modal-playlist-name-input") as HTMLInputElement;
  input_elem.focus();
  input_elem.value = props.playlist_name || "";
});

const emit = defineEmits<{
  (e: "setTitle", title: string): void;
  (e: "hideModal"): void;
}>();

emit("setTitle", "New Playlist");

/**
 * Create a new playlist. If this modal is called with a track,
 * add the track to the new playlist.
 * @param {Event} e
 */
function create(e: Event) {
  e.preventDefault();
  const name = (e.target as any).elements["name"].value;

  if (!name.trim()) {
    new Notification("Playlist name can't be empty", NotifType.Error);
    return;
  }

  const createTrackPlaylist = () =>
    saveTrackAsPlaylist(name, props?.trackhash || "").then((res) => {
      if (res) {
        store.addPlaylist(res);
      }
      emit("hideModal");
    });

  const createEmptyPlaylist = () =>
    createNewPlaylist(name).then((res) => {
      if (res) {
        store.addPlaylist(res);
      }
      emit("hideModal");
    });

  const createFolderPlaylist = () => {
    saveFolderAsPlaylist(name, props.path as string).then((res) => {
      if (res) {
        store.addPlaylist(res);
      }
      emit("hideModal");
    });
  };

  const createAlbumPlaylist = () => {
    saveAlbumAsPlaylist(name, props.albumhash as string).then((res) => {
      if (res) {
        store.addPlaylist(res);
      }
      emit("hideModal");
    });
  };

  const createArtistPlaylist = () => {
    saveArtistAsPlaylist(name, props.artisthash as string).then((res) => {
      if (res) {
        store.addPlaylist(res);
      }
      emit("hideModal");
    });
  };

  const createQueuePlaylist = () => {
    const { tracklist } = useTracklist();
    const trackhashes = tracklist.map((track) => track.trackhash);
    const itemhash = trackhashes.join(",");

    saveTrackAsPlaylist(name, itemhash).then((res) => {
      if (res) {
        store.addPlaylist(res);
      }
      emit("hideModal");
    });
  };
  if (props.path) {
    createFolderPlaylist();
    return;
  }

  if (props.albumhash) {
    createAlbumPlaylist();
    return;
  }

  if (props.artisthash) {
    createArtistPlaylist();
    return;
  }

  if (props.trackhash) {
    createTrackPlaylist();
    return;
  }

  if (props.is_queue) {
    createQueuePlaylist();
    return;
  }

  createEmptyPlaylist();
}
</script>

<style lang="scss">
.playlist-modal {
  @include modal-base;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;

  label {
    display: block;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.5rem;
  }

  input {
    @include modal-input;
  }

  .submit {
    display: flex;
    justify-content: center;
    margin-top: 0.5rem;
  }

  button {
    @include modal-button-primary;
    min-width: 8rem;
  }
}
</style>
