<template>
  <div class="enhanced-virtual-list" ref="containerRef">
    <!-- Virtual scrolling container -->
    <div 
      class="virtual-scroll-viewport"
      :style="{ height: viewportHeight + 'px' }"
      @scroll="handleScroll"
      ref="viewportRef"
    >
      <!-- Spacer for total height -->
      <div 
        class="virtual-scroll-spacer"
        :style="{ height: totalHeight + 'px', position: 'relative' }"
      >
        <!-- Visible items -->
        <div 
          class="virtual-scroll-content"
          :style="{ 
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }"
        >
          <div
            v-for="item in visibleItems"
            :key="item.id"
            class="virtual-list-item"
            :class="{ 'item-loading': item.loaded }"
            :style="{ height: itemHeight + 'px' }"
            :data-index="item.index"
            ref="itemRefs"
          >
            <!-- Track item template -->
            <div v-if="item.item_type === 'track'" class="track-item">
              <div class="track-image">
                <img 
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.title"
                  class="track-cover"
                  @load="handleImageLoad(item)"
                  @error="handleImageError(item)"
                  loading="lazy"
                />
                <div v-else class="track-cover-placeholder">
                  <Music />
                </div>
              </div>
              
              <div class="track-info">
                <div class="track-title">{{ item.title }}</div>
                <div class="track-subtitle">{{ item.subtitle }}</div>
              </div>
              
              <div class="track-actions">
                <button @click="playTrack(item)" class="play-button">
                  <Play />
                </button>
                <button @click="addToQueue(item)" class="queue-button">
                  <Plus />
                </button>
                <button @click="showTrackMenu(item)" class="menu-button">
                  <MoreVertical />
                </button>
              </div>
            </div>
            
            <!-- Album item template -->
            <div v-else-if="item.item_type === 'album'" class="album-item">
              <div class="album-image">
                <img 
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.title"
                  class="album-cover"
                  @load="handleImageLoad(item)"
                  @error="handleImageError(item)"
                  loading="lazy"
                />
                <div v-else class="album-cover-placeholder">
                  <Disc />
                </div>
              </div>
              
              <div class="album-info">
                <div class="album-title">{{ item.title }}</div>
                <div class="album-subtitle">{{ item.subtitle }}</div>
              </div>
              
              <div class="album-actions">
                <button @click="playAlbum(item)" class="play-button">
                  <Play />
                </button>
                <button @click="downloadAlbum(item)" class="download-button">
                  <Download />
                </button>
              </div>
            </div>
            
            <!-- Artist item template -->
            <div v-else-if="item.item_type === 'artist'" class="artist-item">
              <div class="artist-image">
                <img 
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.title"
                  class="artist-avatar"
                  @load="handleImageLoad(item)"
                  @error="handleImageError(item)"
                  loading="lazy"
                />
                <div v-else class="artist-avatar-placeholder">
                  <User />
                </div>
              </div>
              
              <div class="artist-info">
                <div class="artist-name">{{ item.title }}</div>
                <div class="artist-subtitle">{{ item.subtitle }}</div>
              </div>
              
              <div class="artist-actions">
                <button @click="playArtist(item)" class="play-button">
                  <Play />
                </button>
                <button @click="followArtist(item)" class="follow-button">
                  <Heart />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="loading-indicator">
      <Loader class="loading-spinner" />
      <span>Loading...</span>
    </div>
    
    <!-- Performance metrics (development) -->
    <div v-if="showPerformanceMetrics" class="performance-metrics">
      <div class="metric">
        <span class="metric-label">FPS:</span>
        <span class="metric-value">{{ performanceMetrics.fps.toFixed(1) }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Render Time:</span>
        <span class="metric-value">{{ performanceMetrics.renderTime.toFixed(2) }}ms</span>
      </div>
      <div class="metric">
        <span class="metric-label">Visible Items:</span>
        <span class="metric-value">{{ visibleItems.length }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Total Items:</span>
        <span class="metric-value">{{ totalItems }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { 
  Music, Disc, User, Play, Plus, Download, Heart, MoreVertical, Loader 
} from 'lucide-vue-next'

// Props
interface Props {
  items: any[]
  itemHeight?: number
  viewportHeight?: number
  bufferSize?: number
  loading?: boolean
  showPerformanceMetrics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 60,
  viewportHeight: 600,
  bufferSize: 10,
  loading: false,
  showPerformanceMetrics: false
})

// Emits
const emit = defineEmits<{
  playTrack: [item: any]
  addToQueue: [item: any]
  showTrackMenu: [item: any]
  playAlbum: [item: any]
  downloadAlbum: [item: any]
  playArtist: [item: any]
  followArtist: [item: any]
}>()

// Refs
const containerRef = ref<HTMLElement>()
const viewportRef = ref<HTMLElement>()
const itemRefs = ref<HTMLElement[]>([])

// State
const scrollTop = ref(0)
const isScrolling = ref(false)
const scrollTimeout = ref<number>()
const lastScrollTime = ref(0)
const frameCount = ref(0)
const lastFrameTime = ref(performance.now())

// Performance metrics
const performanceMetrics = ref({
  fps: 0,
  renderTime: 0,
  visibleItems: 0,
  totalItems: 0
})

// Computed
const totalHeight = computed(() => props.items.length * props.itemHeight)
const totalItems = computed(() => props.items.length)

const visibleRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize)
  const end = Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + props.viewportHeight) / props.itemHeight) + props.bufferSize
  )
  return { start, end }
})

const visibleItems = computed(() => {
  const { start, end } = visibleRange.value
  return props.items.slice(start, end).map((item, index) => ({
    ...item,
    virtualIndex: start + index,
    loaded: false
  }))
})

const offsetY = computed(() => visibleRange.value.start * props.itemHeight)

// Methods
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  
  // Update scrolling state
  isScrolling.value = true
  clearTimeout(scrollTimeout.value)
  scrollTimeout.value = setTimeout(() => {
    isScrolling.value = false
  }, 150)
  
  // Update FPS
  updateFPS()
  
  // Throttled render
  throttledRender()
}

const updateFPS = () => {
  const now = performance.now()
  const delta = now - lastFrameTime.value
  
  if (delta >= 1000) {
    performanceMetrics.value.fps = (frameCount.value * 1000) / delta
    frameCount.value = 0
    lastFrameTime.value = now
  }
  
  frameCount.value++
}

const throttledRender = (() => {
  let lastCall = 0
  return () => {
    const now = performance.now()
    if (now - lastCall >= 16) { // 60fps
      lastCall = now
      renderVisibleItems()
    }
  }
})()

const renderVisibleItems = async () => {
  const startTime = performance.now()
  
  await nextTick()
  
  // Update visible items
  performanceMetrics.value.visibleItems = visibleItems.value.length
  performanceMetrics.value.totalItems = totalItems.value
  
  const endTime = performance.now()
  performanceMetrics.value.renderTime = endTime - startTime
}

const handleImageLoad = (item: any) => {
  item.loaded = true
}

const handleImageError = (item: any) => {
  item.loaded = true
  item.imageError = true
}

// Action handlers
const playTrack = (item: any) => {
  emit('playTrack', item)
}

const addToQueue = (item: any) => {
  emit('addToQueue', item)
}

const showTrackMenu = (item: any) => {
  emit('showTrackMenu', item)
}

const playAlbum = (item: any) => {
  emit('playAlbum', item)
}

const downloadAlbum = (item: any) => {
  emit('downloadAlbum', item)
}

const playArtist = (item: any) => {
  emit('playArtist', item)
}

const followArtist = (item: any) => {
  emit('followArtist', item)
}

// Intersection Observer for lazy loading
const setupIntersectionObserver = () => {
  if (!window.IntersectionObserver) return
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            delete img.dataset.src
          }
        }
      })
    },
    {
      root: viewportRef.value,
      rootMargin: `${props.itemHeight * 2}px`
    }
  )
  
  // Observe images in visible items
  nextTick(() => {
    const images = containerRef.value?.querySelectorAll('img[data-src]')
    images?.forEach(img => observer.observe(img))
  })
}

// Watch for items changes
watch(() => props.items, () => {
  nextTick(() => {
    setupIntersectionObserver()
    renderVisibleItems()
  })
}, { deep: true })

// Lifecycle
onMounted(() => {
  setupIntersectionObserver()
  renderVisibleItems()
  
  // Start FPS counter
  const fpsInterval = setInterval(updateFPS, 100)
  
  onUnmounted(() => {
    clearInterval(fpsInterval)
    clearTimeout(scrollTimeout.value)
  })
})
</script>

<style scoped>
.enhanced-virtual-list {
  position: relative;
  overflow: hidden;
}

.virtual-scroll-viewport {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-scroll-spacer {
  position: relative;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-list-item {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--background-color);
  transition: background-color 0.2s ease;
}

.virtual-list-item:hover {
  background: var(--hover-background);
}

/* Track item styles */
.track-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.track-image {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}

.track-cover,
.track-cover-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.track-cover-placeholder {
  background: var(--secondary-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary-text);
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-weight: 500;
  color: var(--primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-subtitle {
  font-size: 0.875rem;
  color: var(--secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.virtual-list-item:hover .track-actions {
  opacity: 1;
}

/* Album item styles */
.album-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.album-image {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
}

.album-cover,
.album-cover-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}

.album-cover-placeholder {
  background: var(--secondary-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary-text);
}

.album-info {
  flex: 1;
  min-width: 0;
}

.album-title {
  font-weight: 500;
  color: var(--primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-subtitle {
  font-size: 0.875rem;
  color: var(--secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Artist item styles */
.artist-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.artist-image {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
}

.artist-avatar,
.artist-avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.artist-avatar-placeholder {
  background: var(--secondary-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary-text);
}

.artist-info {
  flex: 1;
  min-width: 0;
}

.artist-name {
  font-weight: 500;
  color: var(--primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-subtitle {
  font-size: 0.875rem;
  color: var(--secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Button styles */
.play-button,
.queue-button,
.download-button,
.follow-button,
.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: var(--secondary-background);
  color: var(--primary-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-button:hover,
.queue-button:hover,
.download-button:hover,
.follow-button:hover,
.menu-button:hover {
  background: var(--primary-color);
  color: white;
}

/* Loading indicator */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--secondary-text);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Performance metrics */
.performance-metrics {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.75rem;
  z-index: 1000;
}

.metric {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.metric-label {
  color: #ccc;
}

.metric-value {
  color: #4CAF50;
  font-weight: bold;
}

/* Responsive design */
@media (max-width: 768px) {
  .virtual-list-item {
    padding: 0 12px;
  }
  
  .track-actions,
  .album-actions,
  .artist-actions {
    opacity: 1;
  }
  
  .performance-metrics {
    display: none;
  }
}
</style>
