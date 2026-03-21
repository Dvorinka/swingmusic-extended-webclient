import { defineStore } from "pinia";
import { Playlist } from "@/interfaces";
import { getAllPlaylists } from "@/requests/playlists";

export default defineStore("playlists", {
  state: () => ({
    playlists: <Playlist[]>[],
  }),
  actions: {
    /**
     * Fetch all playlists from the server
     */
    async fetchAll() {
      const playlists = await getAllPlaylists();
      this.playlists = playlists;
    },
    /**
     * Adds a single playlist to the store
     * @param playlist Playlist to add to the store
     * @returns void
     */
    addPlaylist(playlist: Playlist) {
      setTimeout(() => {
        this.playlists.unshift(playlist);
      }, 250);
    },
    /**
     * Updates the track count for a specific playlist
     * This is called when tracks are added to a playlist while viewing the PlaylistList page
     * @param playlistId The ID of the playlist to update
     * @param countDelta The number to add to the count (positive for additions, negative for removals)
     */
    updatePlaylistCount(playlistId: number, countDelta: number = 1) {
      const playlist = this.playlists.find(p => p.id === playlistId);
      if (playlist) {
        playlist.count = Math.max(0, playlist.count + countDelta);
      }
    },
    /**
     * Increments the track count for a playlist when a track is added
     * @param playlistId The ID of the playlist
     */
    incrementPlaylistCount(playlistId: number) {
      this.updatePlaylistCount(playlistId, 1);
    },
  },
});
