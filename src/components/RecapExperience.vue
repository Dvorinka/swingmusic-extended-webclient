<!--
RecapExperience Component

This component provides a comprehensive year-in-review experience including:
- Recap generation and display
- Interactive data visualization
- Video generation and sharing
- Year comparison features
- Milestone celebrations
-->

<template>
  <div class="recap-experience">
    <!-- Header -->
    <div class="recap-header">
      <div class="header-content">
        <h1 class="recap-title">
          <Icon name="calendar" class="title-icon" />
          Your Music Year in Review
        </h1>
        <p class="recap-subtitle">Discover your listening journey and celebrate your music personality</p>
      </div>
      
      <!-- Year Selector -->
      <div class="year-selector">
        <label class="selector-label">Select Year:</label>
        <select v-model="selectedYear" class="year-select" @change="loadRecap">
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <button 
          v-if="!hasRecap" 
          :disabled="generating" 
          class="generate-btn"
          @click="generateRecap"
        >
          <Icon name="sparkles" />
          Generate Recap
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="generating" class="loading-state">
      <div class="loading-content">
        <Icon name="loader-2" class="animate-spin loading-icon" />
        <h2>Creating Your {{ selectedYear }} Recap</h2>
        <p>Analyzing your listening history and generating insights...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: generationProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- No Recap State -->
    <div v-else-if="!hasRecap && !generating" class="no-recap-state">
      <div class="no-recap-content">
        <Icon name="calendar-x" class="no-recap-icon" />
        <h2>No Recap Available for {{ selectedYear }}</h2>
        <p>Generate your year-in-review to discover your music journey and celebrate your listening habits.</p>
        <button class="generate-primary-btn" @click="generateRecap">
          <Icon name="sparkles" />
          Generate {{ selectedYear }} Recap
        </button>
      </div>
    </div>

    <!-- Recap Content -->
    <div v-else-if="recapData" class="recap-content">
      <!-- Hero Section with Personality -->
      <section class="hero-section">
        <div class="hero-background">
          <div class="hero-particles"></div>
        </div>
        <div class="hero-content">
          <div class="personality-card">
            <div class="personality-icon">
              <Icon :name="getPersonalityIcon(recapData.personality.personality_type)" />
            </div>
            <h2 class="personality-type">{{ recapData.personality.personality_type }}</h2>
            <p class="personality-description">{{ recapData.personality.description }}</p>
            <div class="personality-traits">
              <span 
                v-for="trait in recapData.personality.traits" 
                :key="trait"
                class="trait-badge"
              >
                {{ trait }}
              </span>
            </div>
          </div>
          
          <div class="year-stats">
            <div class="stat-item">
              <div class="stat-number">{{ formatMinutes(recapData.stats.total_minutes) }}</div>
              <div class="stat-label">Minutes Listened</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ recapData.stats.total_tracks.toLocaleString() }}</div>
              <div class="stat-label">Tracks Played</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ recapData.stats.unique_tracks.toLocaleString() }}</div>
              <div class="stat-label">Unique Tracks</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ recapData.stats.listening_streak }}</div>
              <div class="stat-label">Day Streak</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Top Tracks Section -->
      <section class="top-section">
        <div class="section-header">
          <h2>Your Top Tracks</h2>
          <p>Your most played tracks from {{ selectedYear }}</p>
        </div>
        <div class="tracks-grid">
          <div 
            v-for="(track, index) in recapData.top_tracks.slice(0, 10)" 
            :key="track.id"
            class="track-card"
            :class="{ 'top-3': index < 3 }"
          >
            <div class="track-rank">{{ index + 1 }}</div>
            <div class="track-info">
              <img 
                :src="track.image || '/default-album.jpg'" 
                :alt="track.title"
                class="track-image"
              />
              <div class="track-details">
                <h4 class="track-title">{{ track.title }}</h4>
                <p class="track-artist">{{ track.artist }}</p>
                <p class="track-album">{{ track.album }}</p>
              </div>
            </div>
            <div class="track-stats">
              <div class="play-count">
                <Icon name="play" />
                {{ track.play_count }} plays
              </div>
              <div class="duration">
                <Icon name="clock" />
                {{ formatMinutes(track.total_duration) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Top Artists Section -->
      <section class="top-section">
        <div class="section-header">
          <h2>Your Top Artists</h2>
          <p>Your favorite artists from {{ selectedYear }}</p>
        </div>
        <div class="artists-grid">
          <div 
            v-for="(artist, index) in recapData.top_artists.slice(0, 8)" 
            :key="artist.name"
            class="artist-card"
            :class="{ 'top-3': index < 3 }"
          >
            <div class="artist-rank">{{ index + 1 }}</div>
            <div class="artist-info">
              <div class="artist-avatar">
                <Icon name="user" />
              </div>
              <div class="artist-details">
                <h4 class="artist-name">{{ artist.name }}</h4>
                <p class="artist-stats">{{ artist.unique_tracks }} tracks • {{ formatMinutes(artist.total_duration) }}</p>
              </div>
            </div>
            <div class="artist-plays">
              <Icon name="play" />
              {{ artist.play_count }}
            </div>
          </div>
        </div>
      </section>

      <!-- Monthly Breakdown Chart -->
      <section class="chart-section">
        <div class="section-header">
          <h2>Your Year in Music</h2>
          <p>Monthly listening breakdown for {{ selectedYear }}</p>
        </div>
        <div class="chart-container">
          <div class="monthly-chart">
            <div 
              v-for="month in recapData.monthly_breakdown" 
              :key="month.month"
              class="month-bar"
            >
              <div class="bar-container">
                <div 
                  class="bar-fill"
                  :style="{ 
                    height: getBarHeight(month.total_minutes, recapData.monthly_breakdown) + '%'
                  }"
                ></div>
              </div>
              <div class="month-label">{{ month.month_name.slice(0, 3) }}</div>
              <div class="month-minutes">{{ formatMinutes(month.total_minutes) }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Milestones Section -->
      <section v-if="recapData.milestones.length > 0" class="milestones-section">
        <div class="section-header">
          <h2>Your Achievements</h2>
          <p>Milestones you reached in {{ selectedYear }}</p>
        </div>
        <div class="milestones-grid">
          <div 
            v-for="milestone in recapData.milestones" 
            :key="milestone.type"
            class="milestone-card"
            :class="milestone.level"
          >
            <div class="milestone-icon">
              <Icon :name="milestone.icon" />
            </div>
            <h3 class="milestone-title">{{ milestone.title }}</h3>
            <p class="milestone-description">{{ milestone.description }}</p>
            <div class="milestone-level">{{ milestone.level }}</div>
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <section class="actions-section">
        <div class="actions-grid">
          <button :disabled="generatingVideo" class="action-btn primary" @click="generateVideo">
            <Icon name="video" />
            {{ generatingVideo ? 'Generating Video...' : 'Generate Recap Video' }}
          </button>
          <button class="action-btn secondary" @click="shareRecap">
            <Icon name="share-2" />
            Share Recap
          </button>
          <button class="action-btn secondary" @click="compareYears">
            <Icon name="git-compare" />
            Compare Years
          </button>
          <button class="action-btn secondary" @click="downloadRecap">
            <Icon name="download" />
            Download Data
          </button>
        </div>
      </section>
    </div>

    <!-- Share Modal -->
    <div v-if="showShareModal" class="modal-overlay" @click="showShareModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Share Your {{ selectedYear }} Recap</h3>
          <button class="close-btn" @click="showShareModal = false">
            <Icon name="x" />
          </button>
        </div>
        <div class="modal-body">
          <div class="share-options">
            <label class="share-option">
              <input v-model="shareSettings.includePersonalData" type="checkbox" />
              Include personal data
            </label>
            <div class="share-setting">
              <label>Expires in:</label>
              <select v-model="shareSettings.expiresInDays">
                <option :value="7">7 days</option>
                <option :value="30">30 days</option>
                <option :value="90">90 days</option>
                <option :value="365">1 year</option>
              </select>
            </div>
          </div>
          <div v-if="shareLink" class="share-result">
            <input 
              :value="shareLink" 
              readonly 
              class="share-link-input"
              @click="copyShareLink"
            />
            <button class="copy-btn" @click="copyShareLink">
              <Icon name="copy" />
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button :disabled="creatingShareLink" class="primary-btn" @click="createShareLink">
            {{ creatingShareLink ? 'Creating...' : 'Create Share Link' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Compare Modal -->
    <div v-if="showCompareModal" class="modal-overlay" @click="showCompareModal = false">
      <div class="modal-content compare-modal" @click.stop>
        <div class="modal-header">
          <h3>Compare Years</h3>
          <button class="close-btn" @click="showCompareModal = false">
            <Icon name="x" />
          </button>
        </div>
        <div class="modal-body">
          <div class="compare-selector">
            <div class="year-compare">
              <label>First Year:</label>
              <select v-model="compareYear1">
                <option v-for="year in availableYears" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
            <div class="year-compare">
              <label>Second Year:</label>
              <select v-model="compareYear2">
                <option v-for="year in availableYears" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
          </div>
          <button :disabled="comparing" class="compare-btn" @click="performComparison">
            {{ comparing ? 'Comparing...' : 'Compare Years' }}
          </button>
          
          <div v-if="comparisonData" class="comparison-results">
            <div class="comparison-item">
              <h4>Listening Time</h4>
              <div class="comparison-change">
                <span :class="getChangeClass(comparisonData.listening_time_change.percentage)">
                  {{ formatChange(comparisonData.listening_time_change.percentage) }}
                </span>
                <p>{{ formatMinutes(comparisonData.listening_time_change.absolute) }} change</p>
              </div>
            </div>
            <div class="comparison-item">
              <h4>Tracks Played</h4>
              <div class="comparison-change">
                <span :class="getChangeClass(comparisonData.tracks_change.percentage)">
                  {{ formatChange(comparisonData.tracks_change.percentage) }}
                </span>
                <p>{{ comparisonData.tracks_change.absolute }} tracks change</p>
              </div>
            </div>
            <div class="comparison-item">
              <h4>Personality</h4>
              <div class="personality-change">
                <span class="from-personality">{{ comparisonData.personality_change.from }}</span>
                <Icon name="arrow-right" />
                <span class="to-personality">{{ comparisonData.personality_change.to }}</span>
                <span v-if="comparisonData.personality_change.changed" class="changed-badge">
                  Changed!
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRecapStore } from '@/stores/recap'

// Store
const recapStore = useRecapStore()

// State
const selectedYear = ref(new Date().getFullYear() - 1)
const availableYears = ref<number[]>([])
const recapData = ref(null)
const generating = ref(false)
const generationProgress = ref(0)
const generatingVideo = ref(false)

// Modal states
const showShareModal = ref(false)
const showCompareModal = ref(false)
const shareLink = ref('')
const creatingShareLink = ref(false)
const comparing = ref(false)
const comparisonData = ref(null)

// Settings
const shareSettings = ref({
  includePersonalData: false,
  expiresInDays: 30
})

const compareYear1 = ref(new Date().getFullYear() - 2)
const compareYear2 = ref(new Date().getFullYear() - 1)

// Computed
const hasRecap = computed(() => recapData.value !== null)

// Methods
const loadAvailableYears = async () => {
  try {
    const years = await recapStore.getAvailableYears()
    availableYears.value = years.available_years
    
    // Select most recent year if available
    if (years.available_years.length > 0) {
      selectedYear.value = years.available_years[0]
    }
  } catch (error) {
    console.error('Error loading available years:', error)
  }
}

const loadRecap = async () => {
  if (!selectedYear.value) return
  
  try {
    const recap = await recapStore.getRecapSummary(selectedYear.value)
    if (recap) {
      // Load full details
      const details = await recapStore.getRecapDetails(selectedYear.value)
      recapData.value = details.recap
    } else {
      recapData.value = null
    }
  } catch (error) {
    console.error('Error loading recap:', error)
  }
}

const generateRecap = async () => {
  if (!selectedYear.value) return
  
  generating.value = true
  generationProgress.value = 0
  
  // Simulate progress
  const progressInterval = setInterval(() => {
    generationProgress.value = Math.min(generationProgress.value + 10, 90)
  }, 200)
  
  try {
    await recapStore.generateRecap(selectedYear.value)
    clearInterval(progressInterval)
    generationProgress.value = 100
    
    // Load the generated recap
    setTimeout(() => {
      loadRecap()
      generating.value = false
      generationProgress.value = 0
    }, 500)
  } catch (error) {
    clearInterval(progressInterval)
    generating.value = false
    console.error('Error generating recap:', error)
  }
}

const generateVideo = async () => {
  if (!selectedYear.value || !recapData.value) return
  
  generatingVideo.value = true
  
  try {
    await recapStore.generateRecapVideo(selectedYear.value, {
      theme: 'modern',
      include_audio: true
    })
    
    // Show success message
    alert('Video generation started! Check back in a few minutes.')
  } catch (error) {
    console.error('Error generating video:', error)
  } finally {
    generatingVideo.value = false
  }
}

const shareRecap = () => {
  showShareModal.value = true
  shareLink.value = ''
}

const createShareLink = async () => {
  if (!selectedYear.value || !recapData.value) return
  
  creatingShareLink.value = true
  
  try {
    const share = await recapStore.createShareableLink(selectedYear.value, shareSettings.value)
    shareLink.value = `${window.location.origin}/recap/shared/${share.share_token}`
  } catch (error) {
    console.error('Error creating share link:', error)
  } finally {
    creatingShareLink.value = false
  }
}

const copyShareLink = () => {
  navigator.clipboard.writeText(shareLink.value)
}

const compareYears = () => {
  showCompareModal.value = true
  comparisonData.value = null
}

const performComparison = async () => {
  if (compareYear1.value === compareYear2.value) return
  
  comparing.value = true
  
  try {
    const comparison = await recapStore.compareYears(compareYear1.value, compareYear2.value)
    comparisonData.value = comparison.comparison
  } catch (error) {
    console.error('Error comparing years:', error)
  } finally {
    comparing.value = false
  }
}

const downloadRecap = () => {
  if (!recapData.value) return
  
  const dataStr = JSON.stringify(recapData.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `recap_${selectedYear.value}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Utility functions
const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

const getPersonalityIcon = (type: string) => {
  const icons = {
    'Explorer': 'compass',
    'Balanced': 'scale',
    'Loyalist': 'heart'
  }
  return icons[type] || 'music'
}

const getBarHeight = (minutes: number, allMonths: any[]) => {
  const maxMinutes = Math.max(...allMonths.map(m => m.total_minutes))
  return maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0
}

const getChangeClass = (percentage: number) => {
  if (percentage > 0) return 'positive'
  if (percentage < 0) return 'negative'
  return 'neutral'
}

const formatChange = (percentage: number) => {
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

// Lifecycle
onMounted(() => {
  loadAvailableYears()
  loadRecap()
})
</script>

<style scoped>
.recap-experience {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.recap-header {
  padding: 2rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
}

.recap-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.title-icon {
  width: 3rem;
  height: 3rem;
}

.recap-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.year-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.year-select {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
}

.generate-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.generate-btn:hover {
  transform: translateY(-2px);
}

.loading-state, .no-recap-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.loading-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 2rem;
}

.progress-bar {
  width: 300px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin: 2rem auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ee5a24);
  transition: width 0.3s ease;
}

.no-recap-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 2rem;
  opacity: 0.5;
}

.generate-primary-btn {
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  border: none;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s;
  margin: 0 auto;
}

.generate-primary-btn:hover {
  transform: translateY(-2px);
}

.hero-section {
  position: relative;
  padding: 4rem 2rem;
  text-align: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
}

.hero-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: float 20s infinite linear;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.personality-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
}

.personality-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.personality-type {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.personality-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
}

.personality-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.trait-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.9rem;
}

.year-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.top-section {
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.section-header p {
  font-size: 1.1rem;
  opacity: 0.8;
}

.tracks-grid, .artists-grid {
  display: grid;
  gap: 1rem;
}

.tracks-grid {
  grid-template-columns: 1fr;
}

.artists-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.track-card, .artist-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.track-card:hover, .artist-card:hover {
  transform: translateY(-2px);
}

.track-card.top-3, .artist-card.top-3 {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(238, 90, 36, 0.2));
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.track-rank, .artist-rank {
  font-size: 1.5rem;
  font-weight: bold;
  min-width: 2rem;
  text-align: center;
}

.track-info, .artist-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.track-image {
  width: 3rem;
  height: 3rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.track-details, .artist-details {
  flex: 1;
}

.track-title, .artist-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.track-artist, .track-album, .artist-stats {
  font-size: 0.9rem;
  opacity: 0.8;
}

.track-stats, .artist-plays {
  text-align: right;
}

.play-count, .duration, .artist-plays {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.artist-avatar {
  width: 3rem;
  height: 3rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-section {
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.chart-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
}

.monthly-chart {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 200px;
  gap: 0.5rem;
}

.month-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: end;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.bar-fill {
  width: 60%;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border-radius: 0.25rem 0.25rem 0 0;
  min-height: 4px;
  transition: height 0.5s ease;
}

.month-label {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 0.25rem;
}

.month-minutes {
  font-size: 0.7rem;
  opacity: 0.6;
}

.milestones-section {
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.milestones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.milestone-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.milestone-card.gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 193, 7, 0.2));
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.milestone-card.silver {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(169, 169, 169, 0.2));
  border: 1px solid rgba(192, 192, 192, 0.3);
}

.milestone-card.bronze {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(184, 115, 51, 0.2));
  border: 1px solid rgba(205, 127, 50, 0.3);
}

.milestone-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.milestone-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.milestone-description {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 1rem;
}

.milestone-level {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.actions-section {
  padding: 3rem 2rem;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.primary {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.share-setting {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.share-result {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.share-link-input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.copy-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
}

.modal-footer {
  text-align: right;
}

.primary-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.compare-modal {
  max-width: 600px;
}

.compare-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.year-compare {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.year-compare select {
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.compare-btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 1.5rem;
}

.comparison-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comparison-item h4 {
  margin-bottom: 0.5rem;
}

.comparison-change span {
  font-size: 1.2rem;
  font-weight: bold;
  margin-right: 0.5rem;
}

.comparison-change .positive {
  color: #4ade80;
}

.comparison-change .negative {
  color: #f87171;
}

.comparison-change .neutral {
  color: #fbbf24;
}

.personality-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.from-personality, .to-personality {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.changed-badge {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .year-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .milestones-grid {
    grid-template-columns: 1fr;
  }
  
  .monthly-chart {
    gap: 0.25rem;
  }
  
  .bar-fill {
    width: 80%;
  }
}

@media (max-width: 480px) {
  .recap-title {
    font-size: 2rem;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
  
  .track-card, .artist-card {
    flex-direction: column;
    text-align: center;
  }
  
  .track-info, .artist-info {
    flex-direction: column;
  }
  
  .track-stats, .artist-plays {
    text-align: center;
  }
}
</style>
