<template>
  <div class="music-upload">
    <!-- Upload Header -->
    <div class="upload-header">
      <h2>
        <Upload class="upload-icon" />
        Upload Music Files
      </h2>
      <p class="upload-description">
        Upload your music files directly to your music library. Supports drag-and-drop and multiple file selection.
      </p>
    </div>

    <!-- Upload Configuration Info -->
    <div class="upload-info">
      <div class="info-item">
        <strong>Supported formats:</strong>
        <span class="formats-list">{{ formattedSupportedFormats }}</span>
      </div>
      <div class="info-item">
        <strong>Maximum file size:</strong> {{ uploadConfig.max_file_size_mb }}MB
      </div>
      <div class="info-item">
        <strong>Upload directory:</strong> {{ effectiveUploadDirectory }}
      </div>
    </div>

    <!-- Drop Zone -->
    <div 
      :class="['drop-zone', { 'drag-over': isDragOver, 'uploading': isUploading }]"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileSelect"
    >
      <input 
        ref="fileInput"
        type="file"
        multiple
        accept="audio/*"
        style="display: none"
        @change="handleFileSelect"
      />
      
      <!-- Drop Zone Content -->
      <div v-if="!isUploading" class="drop-zone-content">
        <UploadCloud class="drop-icon" />
        <h3>Drag & Drop Music Files Here</h3>
        <p>or click to browse your files</p>
        <div class="file-types">
          <span v-for="format in popularFormats" :key="format.ext" class="file-type-badge">
            {{ format.ext.toUpperCase() }}
          </span>
        </div>
      </div>
      
      <!-- Upload Progress -->
      <div v-else class="upload-progress">
        <Loader2 class="animate-spin" />
        <h3>Uploading files...</h3>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
        <p>{{ uploadStatus }}</p>
      </div>
    </div>

    <!-- Upload Results -->
    <div v-if="uploadResults.length > 0" class="upload-results">
      <h3>Upload Results</h3>
      
      <!-- Successful Uploads -->
      <div v-if="successfulUploads.length > 0" class="success-section">
        <h4>
          <CheckCircle class="success-icon" />
          Successfully Uploaded ({{ successfulUploads.length }})
        </h4>
        <div class="results-list">
          <div 
            v-for="result in successfulUploads" 
            :key="result.filename"
            class="result-item success"
          >
            <Music class="file-icon" />
            <div class="file-info">
              <span class="filename">{{ result.filename }}</span>
              <span class="file-size">{{ formatFileSize(result.size || 0) }}</span>
            </div>
            <CheckCircle class="status-icon success" />
          </div>
        </div>
      </div>
      
      <!-- Failed Uploads -->
      <div v-if="failedUploads.length > 0" class="error-section">
        <h4>
          <XCircle class="error-icon" />
          Failed Uploads ({{ failedUploads.length }})
        </h4>
        <div class="results-list">
          <div 
            v-for="error in failedUploads" 
            :key="error"
            class="result-item error"
          >
            <AlertCircle class="file-icon" />
            <span class="error-message">{{ error }}</span>
            <XCircle class="status-icon error" />
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="result-actions">
        <button class="btn-secondary" @click="clearResults">
          Clear Results
        </button>
        <button class="btn-primary" @click="triggerLibraryRescan">
          <RefreshCw class="btn-icon" />
          Rescan Library
        </button>
      </div>
    </div>

    <!-- Recent Uploads -->
    <div v-if="recentUploads.length > 0" class="recent-uploads">
      <h3>Recent Uploads</h3>
      <div class="recent-list">
        <div 
          v-for="upload in recentUploads.slice(0, 5)" 
          :key="upload.id"
          class="recent-item"
        >
          <Music class="recent-icon" />
          <div class="recent-info">
            <span class="recent-name">{{ upload.filename }}</span>
            <span class="recent-time">{{ formatTime(upload.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { 
  Upload, 
  UploadCloud, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Music, 
  RefreshCw 
} from 'lucide-vue-next'
import axios from 'axios'

const props = defineProps({
  targetDir: {
    type: String,
    default: ''
  }
})

// Reactive state
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const fileInput = ref(null)
const uploadResults = ref([])
const recentUploads = ref([])
const uploadConfig = reactive({
  allowed_extensions: [],
  max_file_size: 0,
  max_file_size_mb: 0,
  upload_directory: '',
  supported_formats: []
})

// Computed properties
const successfulUploads = computed(() => 
  uploadResults.value.filter(result => result.success)
)

const failedUploads = computed(() => 
  uploadResults.value.filter(result => !result.success).map(result => result.error || result.filename)
)

const popularFormats = computed(() => 
  uploadConfig.supported_formats.filter(format => 
    ['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg'].includes(format.ext)
  ).slice(0, 6)
)

const formattedSupportedFormats = computed(() => {
  const allFormats = uploadConfig.supported_formats.map(f => f.ext)
  return allFormats.length > 8 
    ? `${allFormats.slice(0, 8).join(', ').toUpperCase()}...`
    : allFormats.join(', ').toUpperCase()
})

const effectiveUploadDirectory = computed(() => {
  return props.targetDir || uploadConfig.upload_directory
})

// Methods
const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(event.dataTransfer.files)
  const audioFiles = files.filter(file => isAudioFile(file))
  
  if (audioFiles.length > 0) {
    uploadFiles(audioFiles)
  } else {
    showNotification('No valid audio files found', 'error')
  }
}

const triggerFileSelect = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    uploadFiles(files)
  }
}

const isAudioFile = (file) => {
  const audioTypes = [
    'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/flac',
    'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/wma', 'audio/opus'
  ]
  
  const extension = file.name.split('.').pop()?.toLowerCase()
  const isAllowedExtension = uploadConfig.allowed_extensions.includes(extension)
  const isAllowedMime = audioTypes.some(type => file.type.includes(type))
  
  return isAllowedExtension || isAllowedMime
}

const uploadFiles = async (files) => {
  isUploading.value = true
  uploadProgress.value = 0
  uploadResults.value = []
  
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  if (props.targetDir) {
    formData.append('target_dir', props.targetDir)
  }
  
  try {
    uploadStatus.value = 'Uploading files...'
    uploadProgress.value = 25
    
    const response = await axios.post('/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        uploadProgress.value = Math.min(progress, 90)
        uploadStatus.value = `Uploading... ${progress}%`
      }
    })
    
    uploadProgress.value = 100
    uploadStatus.value = 'Upload completed!'
    
    // Process results
    const data = response.data
    uploadResults.value = [
      ...data.uploaded_files.map(file => ({ ...file, success: true })),
      ...data.failed_files.map(error => ({ success: false, error }))
    ]
    
    // Add to recent uploads
    successfulUploads.value.forEach(upload => {
      recentUploads.value.unshift({
        id: Date.now() + Math.random(),
        filename: upload.filename,
        timestamp: new Date()
      })
    })
    
    // Keep only last 20 recent uploads
    if (recentUploads.value.length > 20) {
      recentUploads.value = recentUploads.value.slice(0, 20)
    }
    
    // Show notification
    if (successfulUploads.value.length > 0) {
      showNotification(
        `Successfully uploaded ${successfulUploads.value.length} file(s)`, 
        'success'
      )
    }
    
    if (failedUploads.value.length > 0) {
      showNotification(
        `${failedUploads.value.length} file(s) failed to upload`, 
        'warning'
      )
    }
    
  } catch (error) {
    console.error('Upload error:', error)
    uploadResults.value = [{
      success: false,
      error: `Upload failed: ${error.response?.data?.message || error.message}`
    }]
    showNotification('Upload failed. Please try again.', 'error')
  } finally {
    isUploading.value = false
    setTimeout(() => {
      uploadProgress.value = 0
      uploadStatus.value = ''
    }, 2000)
  }
}

const clearResults = () => {
  uploadResults.value = []
}

const triggerLibraryRescan = async () => {
  try {
    await axios.post('/upload/rescan')
    showNotification('Library rescan triggered successfully', 'success')
  } catch (error) {
    showNotification('Failed to trigger library rescan', 'error')
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (timestamp) => {
  const now = new Date()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hours ago`
  return `${days} days ago`
}

const showNotification = (message, type = 'info') => {
  // This would integrate with the existing notification system
  console.log(`[${type.toUpperCase()}] ${message}`)
}

// Lifecycle
onMounted(async () => {
  try {
    const response = await axios.get('/upload/config')
    Object.assign(uploadConfig, response.data)
  } catch (error) {
    console.error('Failed to load upload config:', error)
    showNotification('Failed to load upload configuration', 'error')
  }
})
</script>

<style scoped>
.music-upload {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.upload-header {
  text-align: center;
  margin-bottom: 2rem;
}

.upload-header h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.upload-icon {
  width: 2rem;
  height: 2rem;
  color: var(--accent-color);
}

.upload-description {
  color: var(--text-secondary);
  font-size: 1rem;
}

.upload-info {
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item strong {
  color: var(--text-primary);
  font-size: 0.875rem;
}

.formats-list {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.drop-zone:hover {
  border-color: var(--accent-color);
  background: var(--bg-hover);
}

.drop-zone.drag-over {
  border-color: var(--accent-color);
  background: rgba(var(--accent-color-rgb, 99, 102, 241), 0.1);
  transform: scale(1.02);
}

.drop-zone.uploading {
  border-color: var(--accent-color);
  background: var(--bg-secondary);
  cursor: not-allowed;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.drop-icon {
  width: 4rem;
  height: 4rem;
  color: var(--accent-color);
  opacity: 0.6;
}

.drop-zone-content h3 {
  color: var(--text-primary);
  font-size: 1.25rem;
  margin: 0;
}

.drop-zone-content p {
  color: var(--text-secondary);
  margin: 0;
}

.file-types {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.file-type-badge {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  max-width: 300px;
  height: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.upload-results {
  margin-top: 2rem;
}

.upload-results h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.success-section, .error-section {
  margin-bottom: 1.5rem;
}

.success-section h4, .error-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.success-icon {
  color: #10b981;
}

.error-icon {
  color: #ef4444;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: var(--bg-secondary);
}

.result-item.success {
  border-left: 3px solid #10b981;
}

.result-item.error {
  border-left: 3px solid #ef4444;
}

.file-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filename {
  color: var(--text-primary);
  font-weight: 500;
}

.file-size {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.error-message {
  color: var(--text-primary);
  flex: 1;
}

.status-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.status-icon.success {
  color: #10b981;
}

.status-icon.error {
  color: #ef4444;
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.recent-uploads {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.recent-uploads h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: var(--bg-secondary);
}

.recent-icon {
  width: 1rem;
  height: 1rem;
  color: var(--text-secondary);
}

.recent-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-name {
  color: var(--text-primary);
  font-size: 0.875rem;
}

.recent-time {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .music-upload {
    padding: 1rem;
  }
  
  .upload-info {
    grid-template-columns: 1fr;
  }
  
  .drop-zone {
    padding: 2rem 1rem;
  }
  
  .result-actions {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    justify-content: center;
  }
}
</style>
