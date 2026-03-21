<!--
EnhancedSearchInterface Component

This component provides an advanced search interface with:
- AI-powered search suggestions
- Enhanced filters and personalization
- Real-time search results
- Download integration
- Contextual recommendations
-->

<template>
  <div class="enhanced-search-interface">
    <!-- Search Header -->
    <div class="search-header">
      <div class="search-input-container">
        <div class="search-input-wrapper">
          <Icon name="search" class="search-icon" />
          <input 
            ref="searchInput"
            v-model="searchQuery" 
            type="text"
            placeholder="Search for tracks, artists, albums, or paste URLs..."
            class="search-input"
            @input="handleSearchInput" 
            @focus="showSuggestions = true"
            @blur="hideSuggestions"
            @keydown="handleKeyNavigation"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
            <Icon name="x" />
          </button>
        </div>
        
        <!-- Search Context Selector -->
        <div class="context-selector">
          <select v-model="searchContext" class="context-select" @change="updateSuggestions">
            <option value="general">General</option>
            <option value="discovery">Discovery</option>
            <option value="download">Downloads</option>
            <option value="playlist">Playlists</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <!-- Search Suggestions Dropdown -->
      <div v-if="showSuggestions && (suggestions.length > 0 || loading)" class="suggestions-dropdown">
        <div v-if="loading" class="suggestions-loading">
          <Icon name="loader-2" class="animate-spin" />
          <span>Searching...</span>
        </div>
        
        <div v-else class="suggestions-list">
          <!-- Group suggestions by type -->
          <div v-for="group in groupedSuggestions" :key="group.type" class="suggestion-group">
            <div class="suggestion-group-header">
              <Icon :name="getGroupIcon(group.type)" />
              <span>{{ getGroupTitle(group.type) }}</span>
            </div>
            <div 
              v-for="suggestion in group.items" 
              :key="suggestion.id"
              class="suggestion-item"
              :class="{ 'selected': selectedIndex === suggestion.index }"
              @mousedown="selectSuggestion(suggestion)"
            >
              <div class="suggestion-content">
                <img 
                  v-if="suggestion.image_url" 
                  :src="suggestion.image_url" 
                  :alt="suggestion.title"
                  class="suggestion-image"
                />
                <div v-else class="suggestion-placeholder">
                  <Icon :name="getSuggestionIcon(suggestion.type)" />
                </div>
                <div class="suggestion-info">
                  <div class="suggestion-title">{{ suggestion.title }}</div>
                  <div class="suggestion-subtitle">{{ suggestion.subtitle }}</div>
                  <div v-if="suggestion.metadata && suggestion.metadata.popularity" class="suggestion-meta">
                    <span class="popularity">★ {{ suggestion.metadata.popularity }}</span>
                  </div>
                </div>
                <div class="suggestion-actions">
                  <button 
                    v-if="searchContext === 'download' && suggestion.type === 'track'"
                    class="download-btn"
                    @click.stop="downloadTrack(suggestion)"
                  >
                    <Icon name="download" />
                  </button>
                  <button 
                    v-if="suggestion.type === 'track'"
                    class="play-btn"
                    @click.stop="playTrack(suggestion)"
                  >
                    <Icon name="play" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Filters -->
    <div v-if="showFilters" class="filters-section">
      <div class="filters-header">
        <h3>Filters</h3>
        <button class="toggle-filters-btn" @click="toggleFilters">
          <Icon name="chevron-up" />
        </button>
      </div>
      
      <div class="filters-content">
        <div v-for="filter in availableFilters" :key="filter.filter_id" class="filter-group">
          <div class="filter-header">
            <label class="filter-label">{{ filter.name }}</label>
            <button 
              v-if="filter.is_active" 
              class="clear-filter-btn"
              @click="clearFilter(filter.filter_id)"
            >
              <Icon name="x" />
            </button>
          </div>
          
          <!-- Multi-select filter -->
          <div v-if="filter.is_multi_select" class="multi-select-filter">
            <div class="filter-options">
              <label 
                v-for="option in filter.options.slice(0, showAllOptions[filter.filter_id] ? filter.options.length : 5)"
                :key="option.value"
                class="filter-option"
              >
                <input 
                  v-model="activeFilters[filter.filter_id]" 
                  type="checkbox"
                  :value="option.value"
                  class="filter-checkbox"
                  @change="applyFilters"
                />
                <span class="option-label">{{ option.label }}</span>
                <span v-if="option.count" class="option-count">({{ option.count }})</span>
              </label>
            </div>
            <button 
              v-if="filter.options.length > 5"
              class="show-more-btn"
              @click="toggleShowAll(filter.filter_id)"
            >
              {{ showAllOptions[filter.filter_id] ? 'Show Less' : `Show ${filter.options.length - 5} More` }}
            </button>
          </div>
          
          <!-- Single-select filter -->
          <div v-else class="single-select-filter">
            <select 
              v-model="activeFilters[filter.filter_id]"
              class="filter-select"
              @change="applyFilters"
            >
              <option value="">All {{ filter.name }}</option>
              <option 
                v-for="option in filter.options" 
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
                <span v-if="option.count">({{ option.count }})</span>
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0 || hasSearched" class="search-results">
      <div class="results-header">
        <h2>Search Results</h2>
        <div class="results-info">
          <span>{{ searchResults.length }} results</span>
          <select v-model="sortBy" class="sort-select" @change="sortResults">
            <option value="relevance">Relevance</option>
            <option value="popularity">Popularity</option>
            <option value="date">Date Added</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
          </select>
        </div>
      </div>
      
      <!-- Results Grid -->
      <div class="results-grid">
        <div 
          v-for="result in searchResults" 
          :key="result.id"
          class="result-item"
          :class="`result-${result.type}`"
        >
          <!-- Track Result -->
          <div v-if="result.type === 'track'" class="track-result">
            <img 
              :src="result.image_url || '/default-album.jpg'" 
              :alt="result.title"
              class="result-image"
            />
            <div class="result-info">
              <h3 class="result-title">{{ result.title }}</h3>
              <p class="result-artist">{{ result.subtitle }}</p>
              <div class="result-meta">
                <span v-if="result.metadata.duration" class="duration">
                  {{ formatDuration(result.metadata.duration) }}
                </span>
                <span v-if="result.metadata.play_count" class="play-count">
                  {{ result.metadata.play_count }} plays
                </span>
              </div>
            </div>
            <div class="result-actions">
              <button class="play-btn" @click="playTrack(result)">
                <Icon name="play" />
              </button>
              <button class="queue-btn" @click="addToQueue(result)">
                <Icon name="plus" />
              </button>
              <button class="download-btn" @click="downloadTrack(result)">
                <Icon name="download" />
              </button>
              <button class="favorite-btn" @click="addToFavorites(result)">
                <Icon name="heart" />
              </button>
            </div>
          </div>
          
          <!-- Artist Result -->
          <div v-else-if="result.type === 'artist'" class="artist-result">
            <img 
              :src="result.image_url || '/default-artist.jpg'" 
              :alt="result.title"
              class="result-image artist-image"
            />
            <div class="result-info">
              <h3 class="result-title">{{ result.title }}</h3>
              <p class="result-subtitle">{{ result.subtitle }}</p>
              <div class="result-meta">
                <span v-if="result.metadata.track_count" class="track-count">
                  {{ result.metadata.track_count }} tracks
                </span>
                <span v-if="result.metadata.album_count" class="album-count">
                  {{ result.metadata.album_count }} albums
                </span>
              </div>
            </div>
            <div class="result-actions">
              <button class="view-btn" @click="viewArtist(result)">
                <Icon name="eye" />
              </button>
              <button class="follow-btn" @click="followArtist(result)">
                <Icon name="user-plus" />
              </button>
              <button class="download-btn" @click="downloadArtist(result)">
                <Icon name="download" />
              </button>
            </div>
          </div>
          
          <!-- Album Result -->
          <div v-else-if="result.type === 'album'" class="album-result">
            <img 
              :src="result.image_url || '/default-album.jpg'" 
              :alt="result.title"
              class="result-image album-image"
            />
            <div class="result-info">
              <h3 class="result-title">{{ result.title }}</h3>
              <p class="result-artist">{{ result.subtitle }}</p>
              <div class="result-meta">
                <span v-if="result.metadata.total_tracks" class="track-count">
                  {{ result.metadata.total_tracks }} tracks
                </span>
                <span v-if="result.metadata.release_date" class="release-date">
                  {{ formatDate(result.metadata.release_date) }}
                </span>
              </div>
            </div>
            <div class="result-actions">
              <button class="play-btn" @click="playAlbum(result)">
                <Icon name="play" />
              </button>
              <button class="queue-btn" @click="addToQueue(result)">
                <Icon name="plus" />
              </button>
              <button class="download-btn" @click="downloadAlbum(result)">
                <Icon name="download" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Load More -->
      <div v-if="hasMoreResults" class="load-more">
        <button :disabled="loadingMore" class="load-more-btn" @click="loadMoreResults">
          <Icon name="loader-2" :class="{ 'animate-spin': loadingMore }" />
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>

    <!-- Recent Searches -->
    <div v-if="!searchQuery && recentSearches.length > 0" class="recent-searches">
      <h3>Recent Searches</h3>
      <div class="recent-searches-list">
        <div 
          v-for="search in recentSearches.slice(0, 5)" 
          :key="search.query"
          class="recent-search-item"
          @click="searchQuery = search.query; handleSearchInput()"
        >
          <Icon name="clock" />
          <span>{{ search.query }}</span>
          <span class="search-time">{{ formatRelativeTime(search.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- Trending Content -->
    <div v-if="!searchQuery && trendingContent.length > 0" class="trending-content">
      <h3>Trending Now</h3>
      <div class="trending-grid">
        <div 
          v-for="trend in trendingContent.slice(0, 8)" 
          :key="trend.id"
          class="trending-item"
          @click="selectSuggestion(trend)"
        >
          <img 
            :src="trend.image_url || '/default-album.jpg'" 
            :alt="trend.title"
            class="trending-image"
          />
          <div class="trending-info">
            <h4>{{ trend.title }}</h4>
            <p>{{ trend.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAdvancedUXStore } from '@/stores/advancedUX'

// Store
const advancedUXStore = useAdvancedUXStore()

// State
const searchQuery = ref('')
const searchContext = ref('general')
const showSuggestions = ref(false)
const suggestions = ref([])
const searchResults = ref([])
const recentSearches = ref([])
const trendingContent = ref([])
const loading = ref(false)
const hasSearched = ref(false)
const hasMoreResults = ref(false)
const loadingMore = ref(false)

// Filters
const showFilters = ref(false)
const availableFilters = ref([])
const activeFilters = ref({})
const showAllOptions = ref({})

// UI State
const selectedIndex = ref(-1)
const sortBy = ref('relevance')
const searchInput = ref(null)

// Computed
const groupedSuggestions = computed(() => {
  const groups = {}
  
  suggestions.value.forEach((suggestion, index) => {
    suggestion.index = index
    if (!groups[suggestion.type]) {
      groups[suggestion.type] = {
        type: suggestion.type,
        items: []
      }
    }
    groups[suggestion.type].items.push(suggestion)
  })
  
  return Object.values(groups)
})

// Methods
const handleSearchInput = async () => {
  if (searchQuery.value.length < 2) {
    suggestions.value = []
    return
  }
  
  loading.value = true
  
  try {
    const response = await advancedUXStore.getSearchSuggestions(
      searchQuery.value,
      searchContext.value,
      10
    )
    suggestions.value = response.suggestions
    selectedIndex.value = -1
  } catch (error) {
    console.error('Error getting suggestions:', error)
  } finally {
    loading.value = false
  }
}

const handleKeyNavigation = (event) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectSuggestion(suggestions.value[selectedIndex.value])
      } else {
        performSearch()
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedIndex.value = -1
      break
  }
}

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.title
  showSuggestions.value = false
  
  // Track selection for learning
  trackUserBehavior('search', {
    query: searchQuery.value,
    selected_suggestion: suggestion.id,
    suggestion_type: suggestion.type
  })
  
  // Perform search or navigate
  if (suggestion.url) {
    window.location.href = suggestion.url
  } else {
    performSearch()
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  loading.value = true
  hasSearched.value = true
  
  try {
    // Perform advanced search
    const searchData = {
      query: searchQuery.value,
      filters: activeFilters.value,
      sort_by: sortBy.value,
      sort_order: 'desc',
      limit: 20,
      offset: 0
    }
    
    const response = await advancedUXStore.advancedSearch(searchData)
    searchResults.value = response.results
    hasMoreResults.value = response.total_count > response.limit
    
    // Add to recent searches
    addToRecentSearches(searchQuery.value)
    
    // Track search behavior
    trackUserBehavior('search', {
      query: searchQuery.value,
      context: searchContext.value,
      result_count: response.total_count,
      filters_used: Object.keys(activeFilters.value).length
    })
    
  } catch (error) {
    console.error('Error performing search:', error)
  } finally {
    loading.value = false
  }
}

const loadMoreResults = async () => {
  loadingMore.value = true
  
  try {
    const searchData = {
      query: searchQuery.value,
      filters: activeFilters.value,
      sort_by: sortBy.value,
      sort_order: 'desc',
      limit: 20,
      offset: searchResults.value.length
    }
    
    const response = await advancedUXStore.advancedSearch(searchData)
    searchResults.value.push(...response.results)
    hasMoreResults.value = response.total_count > searchResults.value.length
    
  } catch (error) {
    console.error('Error loading more results:', error)
  } finally {
    loadingMore.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  suggestions.value = []
  searchResults.value = []
  hasSearched.value = false
  searchInput.value?.focus()
}

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const updateSuggestions = () => {
  if (searchQuery.value) {
    handleSearchInput()
  }
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const loadFilters = async () => {
  try {
    const response = await advancedUXStore.getEnhancedSearchFilters()
    availableFilters.value = response.filters
    
    // Initialize active filters
    response.filters.forEach(filter => {
      activeFilters.value[filter.filter_id] = filter.is_multi_select ? [] : ''
      showAllOptions.value[filter.filter_id] = false
    })
    
  } catch (error) {
    console.error('Error loading filters:', error)
  }
}

const applyFilters = async () => {
  if (searchQuery.value) {
    await performSearch()
  }
}

const clearFilter = (filterId) => {
  activeFilters.value[filterId] = availableFilters.value.find(f => f.filter_id === filterId)?.is_multi_select ? [] : ''
  applyFilters()
}

const toggleShowAll = (filterId) => {
  showAllOptions.value[filterId] = !showAllOptions.value[filterId]
}

const sortResults = () => {
  if (searchResults.value.length > 0) {
    // Re-sort current results
    performSearch()
  }
}

const loadTrendingContent = async () => {
  try {
    const response = await advancedUXStore.getTrendingContent('mixed', 20, 'week')
    trendingContent.value = response.trending
  } catch (error) {
    console.error('Error loading trending content:', error)
  }
}

const loadRecentSearches = () => {
  // Load from localStorage or store
  const stored = localStorage.getItem('recent_searches')
  if (stored) {
    recentSearches.value = JSON.parse(stored)
  }
}

const addToRecentSearches = (query) => {
  const search = {
    query,
    timestamp: new Date().toISOString()
  }
  
  recentSearches.value.unshift(search)
  recentSearches.value = recentSearches.value.slice(0, 10)
  
  localStorage.setItem('recent_searches', JSON.stringify(recentSearches.value))
}

const trackUserBehavior = (type, data) => {
  advancedUXStore.trackUserBehavior(type, data)
}

// Action methods
const playTrack = (track) => {
  // This would integrate with the music player
  console.log('Play track:', track.title)
  trackUserBehavior('play', { track_id: track.id, title: track.title })
}

const addToQueue = (item) => {
  console.log('Add to queue:', item.title)
}

const downloadTrack = (track) => {
  // This would integrate with universal downloader
  console.log('Download track:', track.title)
  trackUserBehavior('download', { track_id: track.id, title: track.title })
}

const addToFavorites = (track) => {
  console.log('Add to favorites:', track.title)
  trackUserBehavior('like', { track_id: track.id, title: track.title })
}

const viewArtist = (artist) => {
  window.location.href = `/artist/${artist.id}`
}

const followArtist = (artist) => {
  console.log('Follow artist:', artist.title)
}

const downloadArtist = (artist) => {
  console.log('Download artist:', artist.title)
}

const playAlbum = (album) => {
  console.log('Play album:', album.title)
}

const downloadAlbum = (album) => {
  console.log('Download album:', album.title)
}

// Utility methods
const getGroupIcon = (type) => {
  const icons = {
    'track': 'music',
    'artist': 'user',
    'album': 'disc',
    'playlist': 'list',
    'genre': 'tag',
    'mood': 'heart'
  }
  return icons[type] || 'search'
}

const getGroupTitle = (type) => {
  const titles = {
    'track': 'Tracks',
    'artist': 'Artists',
    'album': 'Albums',
    'playlist': 'Playlists',
    'genre': 'Genres',
    'mood': 'Moods'
  }
  return titles[type] || 'Other'
}

const getSuggestionIcon = (type) => {
  const icons = {
    'track': 'music',
    'artist': 'user',
    'album': 'disc',
    'playlist': 'list',
    'genre': 'tag',
    'mood': 'heart'
  }
  return icons[type] || 'search'
}

const formatDuration = (duration) => {
  if (!duration) return ''
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatDate = (dateString) => {
  return new Date(dateString).getFullYear()
}

const formatRelativeTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now - time
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// Watchers
watch(searchQuery, (newValue) => {
  if (newValue.length === 0) {
    suggestions.value = []
  }
})

// Lifecycle
onMounted(() => {
  loadFilters()
  loadTrendingContent()
  loadRecentSearches()
})
</script>

<style scoped>
.enhanced-search-interface {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-header {
  position: relative;
  margin-bottom: 2rem;
}

.search-input-container {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 1.25rem;
  height: 1.25rem;
  color: #6c757d;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: #f8f9fa;
}

.context-selector {
  min-width: 150px;
}

.context-select {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  background: white;
  font-size: 1rem;
  cursor: pointer;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 0.5rem;
}

.suggestions-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #6c757d;
}

.suggestion-group {
  border-bottom: 1px solid #f8f9fa;
}

.suggestion-group:last-child {
  border-bottom: none;
}

.suggestion-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.875rem;
  color: #495057;
  text-transform: uppercase;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: #f8f9fa;
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.suggestion-image {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.suggestion-placeholder {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.25rem;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-subtitle {
  font-size: 0.875rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-meta {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.popularity {
  color: #fbbf24;
}

.suggestion-actions {
  display: flex;
  gap: 0.5rem;
}

.download-btn,
.play-btn {
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.download-btn:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.play-btn:hover {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.filters-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-header h3 {
  margin: 0;
}

.toggle-filters-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.toggle-filters-btn:hover {
  background: #f8f9fa;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.filter-label {
  font-weight: 600;
  color: #495057;
}

.clear-filter-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.clear-filter-btn:hover {
  background: #f8d7da;
}

.multi-select-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.filter-option:hover {
  background: #f8f9fa;
}

.filter-checkbox {
  margin: 0;
}

.option-label {
  flex: 1;
  font-weight: 500;
}

.option-count {
  color: #6c757d;
  font-size: 0.875rem;
}

.show-more-btn {
  background: none;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #6366f1;
  transition: all 0.2s;
}

.show-more-btn:hover {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.single-select-filter {
  margin-top: 0.5rem;
}

.filter-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
}

.search-results {
  margin-bottom: 2rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.results-header h2 {
  margin: 0;
}

.results-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sort-select {
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.result-item {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.track-result,
.artist-result,
.album-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.25rem;
}

.artist-image,
.album-image {
  aspect-ratio: 1;
  border-radius: 50%;
}

.result-info {
  flex: 1;
}

.result-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.result-artist,
.result-subtitle {
  color: #6c757d;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.result-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.play-btn,
.queue-btn,
.download-btn,
.favorite-btn,
.view-btn,
.follow-btn {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex: 1;
}

.play-btn:hover {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.queue-btn:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.download-btn:hover {
  background: #f59e0b;
  border-color: #f59e0b;
  color: white;
}

.favorite-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.view-btn:hover {
  background: #8b5cf6;
  border-color: #8b5cf6;
  color: white;
}

.follow-btn:hover {
  background: #06b6d4;
  border-color: #06b6d4;
  color: white;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more-btn {
  padding: 1rem 2rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.load-more-btn:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.recent-searches,
.trending-content {
  margin-bottom: 2rem;
}

.recent-searches h3,
.trending-content h3 {
  margin-bottom: 1rem;
}

.recent-searches-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-search-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.recent-search-item:hover {
  background: #f8f9fa;
}

.search-time {
  margin-left: auto;
  font-size: 0.875rem;
  color: #6c757d;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.trending-item:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.trending-image {
  width: 3rem;
  height: 3rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.trending-info {
  flex: 1;
  min-width: 0;
}

.trending-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trending-info p {
  margin: 0;
  font-size: 0.75rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive Design */
@media (max-width: 768px) {
  .enhanced-search-interface {
    padding: 1rem;
  }
  
  .search-input-container {
    flex-direction: column;
  }
  
  .context-selector {
    min-width: auto;
  }
  
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .result-actions {
    flex-wrap: wrap;
  }
  
  .trending-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .suggestions-dropdown {
    max-height: 300px;
  }
  
  .result-item {
    padding: 1rem;
  }
  
  .result-actions {
    gap: 0.25rem;
  }
  
  .result-actions button {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
</style>
