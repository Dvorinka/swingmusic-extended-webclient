<template>
  <div class="global-artist-view">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Loader />
      <p>Loading artist information...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <AlertCircle />
      <h3>Artist not found</h3>
      <p>{{ error }}</p>
      <button @click="goBack" class="back-button">Go Back</button>
    </div>
    
    <!-- Artist Content -->
    <div v-else-if="artist" class="artist-content">
      <!-- Artist Header -->
      <div class="artist-header">
        <div class="artist-image-section">
          <img 
            :src="artist.image_url || '/icons/artist-placeholder.svg'"
            :alt="artist.name"
            class="artist-image"
            @error="$event.target.src = '/icons/artist-placeholder.svg'"
          />
        </div>
        
        <div class="artist-info">
          <h1 class="artist-name">{{ artist.name }}</h1>
          <p class="followers">{{ formatFollowers(artist.followers) }} followers</p>
          
          <div class="artist-stats">
            <span class="stat">{{ artist.popularity }}/100 popularity</span>
            <span v-if="artist.genres?.length" class="genres">
              {{ artist.genres.slice(0, 3).join(', ') }}
            </span>
          </div>
          
          <div class="artist-actions">
            <button 
              @click="downloadTopTracks" 
              :disabled="downloadingTopTracks"
              class="primary-button"
            >
              <Download v-if="!downloadingTopTracks" />
              <Loader v-else class="small-loader" />
              {{ downloadingTopTracks ? 'Downloading...' : 'Download Top 15 Tracks' }}
            </button>
            
            <button 
              @click="toggleFollow" 
              :class="['secondary-button', { 'following': isFollowing }]"
            >
              <Heart :class="{ 'filled': isFollowing }" />
              {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
            
            <button @click="shareArtist" class="secondary-button">
              <Share2 />
              Share
            </button>
          </div>
        </div>
      </div>
      
      <!-- Popular Tracks Section -->
      <section v-if="artist.top_tracks?.length" class="top-tracks-section">
        <div class="section-header">
          <h2>Popular Tracks</h2>
          <button 
            @click="playAllTracks" 
            class="play-all-button"
          >
            <Play />
            Play All
          </button>
        </div>
        
        <TrackList 
          :tracks="topTracksWithSource"
          :show-download="true"
          :show-popularity="true"
          :show-track-number="true"
          :source-indicator="true"
          @download="downloadTrack"
          @play="playTrack"
        />
      </section>
      
      <!-- Discography Section -->
      <section v-if="artist.albums?.length" class="discography-section">
        <div class="section-header">
          <h2>Discography</h2>
          <select v-model="albumFilter" @change="filterAlbums" class="album-filter">
            <option value="all">All Albums</option>
            <option value="album">Albums</option>
            <option value="single">Singles</option>
            <option value="compilation">Compilations</option>
          </select>
        </div>
        
        <div class="albums-grid">
          <div 
            v-for="album in filteredAlbums" 
            :key="album.spotify_id"
            class="album-card"
            @click="viewAlbum(album)"
          >
            <div class="album-cover">
              <img 
                :src="album.image_url || '/icons/album-placeholder.svg'"
                :alt="album.title"
                @error="$event.target.src = '/icons/album-placeholder.svg'"
              />
              <div class="album-overlay">
                <button class="play-button" @click.stop="playAlbum(album)">
                  <Play />
                </button>
                <button 
                  class="download-overlay-button"
                  @click.stop="downloadAlbum(album)"
                >
                  <Download />
                </button>
              </div>
            </div>
            <div class="album-info">
              <h3 class="album-title">{{ album.title }}</h3>
              <p class="album-year">{{ album.release_date?.split('-')[0] }}</p>
              <p class="album-type">{{ album.data?.album_type || 'Album' }} • {{ album.data?.total_tracks || 0 }} tracks</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Related Artists Section -->
      <section v-if="artist.related_artists?.length" class="related-artists-section">
        <h2>Related Artists</h2>
        <div class="related-artists-grid">
          <div 
            v-for="relatedArtist in artist.related_artists" 
            :key="relatedArtist.id"
            class="related-artist-card"
            @click="viewArtist(relatedArtist)"
          >
            <img 
              :src="relatedArtist.image_url || '/icons/artist-placeholder.svg'"
              :alt="relatedArtist.name"
              class="related-artist-image"
              @error="$event.target.src = '/icons/artist-placeholder.svg'"
            />
            <h4 class="related-artist-name">{{ relatedArtist.name }}</h4>
            <p class="related-artist-popularity">{{ relatedArtist.popularity }}/100</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { usePlayer } from '@/composables/usePlayer'
import { useAuthStore } from '@/stores/auth'
import { 
  Loader, 
  AlertCircle, 
  Download, 
  Heart, 
  Share2, 
  Play 
} from 'lucide-vue-next'
import TrackList from '@/components/shared/TrackList.vue'

export default {
  name: 'GlobalArtistView',
  components: {
    Loader,
    AlertCircle,
    Download,
    Heart,
    Share2,
    Play,
    TrackList
  },
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { showToast } = useToast()
    const { playTrack: playTrackInPlayer, playTracks: playTracksInPlayer } = usePlayer()
    const authStore = useAuthStore()
    
    // State
    const artist = ref(null)
    const loading = ref(true)
    const error = ref('')
    const isFollowing = ref(false)
    const downloadingTopTracks = ref(false)
    const albumFilter = ref('all')
    
    // Computed
    const topTracksWithSource = computed(() => {
      return (artist.value?.top_tracks || []).map(track => ({
        ...track,
        source: 'global',
        id: track.spotify_id
      }))
    })
    
    const filteredAlbums = computed(() => {
      if (!artist.value?.albums) return []
      
      if (albumFilter.value === 'all') {
        return artist.value.albums
      }
      
      return artist.value.albums.filter(album => 
        album.data?.album_type === albumFilter.value
      )
    })
    
    // Methods
    const fetchArtistInfo = async () => {
      const artistId = route.params.id
      if (!artistId) {
        error.value = 'No artist ID provided'
        loading.value = false
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const params = new URLSearchParams({
          user_id: authStore.user?.id || ''
        })
        
        const response = await fetch(`/api/search/artist/${artistId}?${params}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            error.value = 'Artist not found'
          } else {
            throw new Error('Failed to fetch artist information')
          }
          return
        }
        
        const data = await response.json()
        artist.value = data
        
        // Check if user is following this artist (would need to implement)
        isFollowing.value = false // TODO: Implement follow status check
        
      } catch (err) {
        console.error('Error fetching artist:', err)
        error.value = 'Failed to load artist information'
      } finally {
        loading.value = false
      }
    }
    
    const downloadTrack = async (track) => {
      try {
        const response = await fetch('/api/spotify/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://open.spotify.com/track/${track.spotify_id}`,
            quality: 'flac'
          })
        })
        
        if (!response.ok) throw new Error('Download failed')
        
        showToast(`Added to download queue: ${track.title}`, 'success')
      } catch (error) {
        console.error('Download error:', error)
        showToast('Failed to add to download queue', 'error')
      }
    }
    
    const downloadTopTracks = async () => {
      if (!artist.value?.top_tracks?.length) return
      
      downloadingTopTracks.value = true
      
      try {
        const downloadPromises = artist.value.top_tracks.map(track => 
          fetch('/api/spotify/download', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: `https://open.spotify.com/track/${track.spotify_id}`,
              quality: 'flac'
            })
          })
        )
        
        const results = await Promise.allSettled(downloadPromises)
        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length
        
        if (successful > 0) {
          showToast(`Added ${successful} tracks to download queue`, 'success')
        }
        
        if (failed > 0) {
          showToast(`${failed} tracks failed to add to queue`, 'error')
        }
        
      } catch (error) {
        console.error('Batch download error:', error)
        showToast('Failed to add tracks to download queue', 'error')
      } finally {
        downloadingTopTracks.value = false
      }
    }
    
    const downloadAlbum = async (album) => {
      try {
        const response = await fetch('/api/spotify/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://open.spotify.com/album/${album.spotify_id}`,
            quality: 'flac'
          })
        })
        
        if (!response.ok) throw new Error('Download failed')
        
        showToast(`Added to download queue: ${album.title}`, 'success')
      } catch (error) {
        console.error('Download error:', error)
        showToast('Failed to add to download queue', 'error')
      }
    }
    
    const playTrack = (track) => {
      showToast('Download track to play it', 'info')
    }
    
    const playAllTracks = () => {
      showToast('Download tracks to play them', 'info')
    }
    
    const playAlbum = (album) => {
      showToast('Download album to play it', 'info')
    }
    
    const toggleFollow = () => {
      isFollowing.value = !isFollowing.value
      showToast(
        isFollowing.value ? 'Now following this artist' : 'Unfollowed this artist',
        'success'
      )
      // TODO: Implement follow/unfollow API call
    }
    
    const shareArtist = () => {
      const url = window.location.href
      if (navigator.share) {
        navigator.share({
          title: `${artist.value?.name} on SwingMusic`,
          text: `Check out ${artist.value?.name} on SwingMusic`,
          url: url
        })
      } else {
        navigator.clipboard.writeText(url)
        showToast('Artist link copied to clipboard', 'success')
      }
    }
    
    const viewAlbum = (album) => {
      router.push(`/global/album/${album.spotify_id}`)
    }
    
    const viewArtist = (relatedArtist) => {
      router.push(`/global/artist/${relatedArtist.id}`)
    }
    
    const goBack = () => {
      router.go(-1)
    }
    
    const filterAlbums = () => {
      // Triggered by select change, computed property handles filtering
    }
    
    const formatFollowers = (followers) => {
      if (!followers) return '0'
      if (followers >= 1000000) return `${(followers / 1000000).toFixed(1)}M`
      if (followers >= 1000) return `${(followers / 1000).toFixed(1)}K`
      return followers.toString()
    }
    
    // Lifecycle
    onMounted(() => {
      fetchArtistInfo()
    })
    
    // Watch for route changes
    watch(() => route.params.id, () => {
      fetchArtistInfo()
    })
    
    return {
      // State
      artist,
      loading,
      error,
      isFollowing,
      downloadingTopTracks,
      albumFilter,
      
      // Computed
      topTracksWithSource,
      filteredAlbums,
      
      // Methods
      downloadTrack,
      downloadTopTracks,
      downloadAlbum,
      playTrack,
      playAllTracks,
      playAlbum,
      toggleFollow,
      shareArtist,
      viewAlbum,
      viewArtist,
      goBack,
      filterAlbums,
      formatFollowers
    }
  }
}
</script>

<style scoped>
.global-artist-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  text-align: center;
}

.error-state h3 {
  color: var(--text-primary);
  margin: 0;
}

.back-button {
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: var(--accent-hover);
}

.artist-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
  align-items: flex-start;
}

.artist-image-section {
  flex-shrink: 0;
}

.artist-image {
  width: 240px;
  height: 240px;
  border-radius: 0.5rem;
  object-fit: cover;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.artist-info {
  flex: 1;
  min-width: 0;
}

.artist-name {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  line-height: 1.1;
}

.followers {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
}

.artist-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.stat {
  color: var(--text-secondary);
  font-weight: 500;
}

.genres {
  color: var(--accent);
  font-style: italic;
}

.artist-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.primary-button,
.secondary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.primary-button {
  background: var(--accent);
  color: white;
}

.primary-button:hover:not(:disabled) {
  background: var(--accent-hover);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
}

.secondary-button:hover {
  background: var(--hover);
  border-color: var(--accent);
}

.secondary-button.following {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.small-loader {
  width: 16px;
  height: 16px;
}

.top-tracks-section,
.discography-section,
.related-artists-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.play-all-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 600;
}

.play-all-button:hover {
  background: var(--accent-hover);
}

.album-filter {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  border-radius: 0.5rem;
  background: var(--background);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.album-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.album-card:hover {
  transform: translateY(-4px);
}

.album-cover {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.album-card:hover .album-overlay {
  opacity: 1;
}

.play-button,
.download-overlay-button {
  background: var(--accent);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.play-button:hover,
.download-overlay-button:hover {
  background: var(--accent-hover);
}

.album-info {
  text-align: center;
}

.album-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-year {
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.album-type {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.related-artists-section h2 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.related-artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
}

.related-artist-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.related-artist-card:hover {
  transform: translateY(-2px);
}

.related-artist-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.75rem;
  border: 3px solid var(--surface);
}

.related-artist-name {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.related-artist-popularity {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .global-artist-view {
    padding: 1rem;
  }
  
  .artist-header {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .artist-image {
    width: 200px;
    height: 200px;
    margin: 0 auto;
  }
  
  .artist-name {
    font-size: 2rem;
  }
  
  .artist-actions {
    justify-content: center;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .related-artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
  }
  
  .related-artist-image {
    width: 100px;
    height: 100px;
  }
}
</style>
