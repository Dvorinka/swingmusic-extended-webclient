<!--
Audio Quality Dashboard Component

This component provides a comprehensive dashboard for managing audio quality settings,
including quality comparison, format analysis, enhancement controls, and adaptive streaming.
-->

<template>
  <div class="audio-quality-dashboard">
    <!-- Header with current quality status -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2 class="dashboard-title">
          <Icon name="settings" class="title-icon" />
          Audio Quality
        </h2>
        <div class="header-actions">
          <button 
            :disabled="loading" 
            class="refresh-btn"
            title="Refresh quality status"
            @click="refreshStatus"
          >
            <Icon name="refresh-cw" :class="{ 'animate-spin': loading }" />
          </button>
          <button 
            class="advanced-btn"
            title="Advanced settings"
            @click="showAdvancedSettings = !showAdvancedSettings"
          >
            <Icon name="sliders" />
          </button>
        </div>
      </div>
      
      <!-- Current quality status -->
      <div class="quality-status">
        <div class="status-item">
          <span class="status-label">Streaming Quality:</span>
          <span class="status-value" :class="currentQuality.streaming_quality">
            {{ formatQualityLevel(currentQuality.streaming_quality) }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">Download Format:</span>
          <span class="status-value">{{ currentQuality.download_format.toUpperCase() }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Network Status:</span>
          <span class="status-value" :class="networkStatus.quality">
            {{ networkStatus.speed }} Mbps ({{ networkStatus.quality }})
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">Device Type:</span>
          <span class="status-value">{{ deviceInfo.type || 'Unknown' }}</span>
        </div>
      </div>
    </div>
    
    <!-- Quality presets -->
    <div class="quality-presets">
      <div class="section-header">
        <h3>Quality Presets</h3>
        <p class="section-description">Quick presets for different use cases</p>
      </div>
      
      <div class="presets-grid">
        <div 
          v-for="preset in qualityPresets" 
          :key="preset.key"
          class="preset-card"
          :class="{ 'active': activePreset === preset.key }"
          @click="applyPreset(preset.key)"
        >
          <div class="preset-header">
            <Icon :name="preset.icon" class="preset-icon" />
            <h4 class="preset-name">{{ preset.name }}</h4>
          </div>
          <p class="preset-description">{{ preset.description }}</p>
          <div class="preset-details">
            <span class="detail-item">
              <Icon name="wifi" />
              {{ preset.settings.streaming_quality }}
            </span>
            <span class="detail-item">
              <Icon name="download" />
              {{ preset.settings.download_format }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Advanced settings panel -->
    <div v-if="showAdvancedSettings" class="advanced-settings">
      <div class="settings-header">
        <h3>Advanced Audio Settings</h3>
        <button class="close-btn" @click="showAdvancedSettings = false">
          <Icon name="x" />
        </button>
      </div>
      
      <div class="settings-grid">
        <!-- Streaming Settings -->
        <div class="settings-section">
          <h4>Streaming Quality</h4>
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.adaptive_quality" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              Adaptive Quality
            </label>
            <p class="setting-description">Automatically adjust quality based on network conditions</p>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.network_aware_quality" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              Network-Aware Quality
            </label>
            <p class="setting-description">Optimize quality based on current network speed</p>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.device_specific_quality" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              Device-Specific Quality
            </label>
            <p class="setting-description">Optimize quality for your device capabilities</p>
          </div>
        </div>
        
        <!-- Download Settings -->
        <div class="settings-section">
          <h4>Download Quality</h4>
          <div class="setting-group">
            <label class="setting-label">Format</label>
            <select 
              v-model="settings.download_format" 
              class="setting-select"
              @change="updateSettings"
            >
              <option v-for="format in supportedFormats" :key="format.key" :value="format.key">
                {{ format.name }} ({{ format.description }})
              </option>
            </select>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">Sample Rate</label>
            <select 
              v-model="settings.download_sample_rate" 
              class="setting-select"
              @change="updateSettings"
            >
              <option value="44.1kHz">44.1 kHz (CD Quality)</option>
              <option value="48kHz">48 kHz (Professional)</option>
              <option value="96kHz">96 kHz (High-Res)</option>
              <option value="192kHz">192 kHz (Ultra High-Res)</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">Bit Depth</label>
            <select 
              v-model="settings.download_bit_depth" 
              class="setting-select"
              @change="updateSettings"
            >
              <option value="16bit">16-bit</option>
              <option value="24bit">24-bit</option>
              <option value="32bit">32-bit</option>
            </select>
          </div>
        </div>
        
        <!-- Audio Enhancements -->
        <div class="settings-section">
          <h4>Audio Enhancements</h4>
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.enable_loudness_normalization" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              Loudness Normalization
            </label>
            <p class="setting-description">Normalize volume to consistent levels</p>
            <div v-if="settings.enable_loudness_normalization" class="sub-setting">
              <label class="sub-label">Target Loudness (LUFS)</label>
              <input 
                v-model="settings.target_loudness" 
                type="range" 
                min="-23" 
                max="-8" 
                step="0.5"
                class="setting-range"
                @change="updateSettings"
              />
              <span class="range-value">{{ settings.target_loudness }} LUFS</span>
            </div>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.enable_adaptive_eq" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              Adaptive EQ
            </label>
            <p class="setting-description">Intelligent equalization based on content</p>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.enable_spatial_audio_processing" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              Spatial Audio Processing
            </label>
            <p class="setting-description">Enhanced spatial audio effects</p>
            <div v-if="settings.enable_spatial_audio_processing" class="sub-setting">
              <label class="sub-label">Spatial Format</label>
              <select 
                v-model="settings.spatial_audio_format" 
                class="setting-select"
                @change="updateSettings"
              >
                <option value="stereo">Stereo</option>
                <option value="binaural">Binaural</option>
                <option value="dolby_atmos">Dolby Atmos</option>
                <option value="sony_360">Sony 360 Reality Audio</option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- Playback Settings -->
        <div class="settings-section">
          <h4>Playback Settings</h4>
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.enable_crossfade" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              Crossfade
            </label>
            <div v-if="settings.enable_crossfade" class="sub-setting">
              <label class="sub-label">Duration (seconds)</label>
              <input 
                v-model="settings.crossfade_duration" 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.5"
                class="setting-range"
                @change="updateSettings"
              />
              <span class="range-value">{{ settings.crossfade_duration }}s</span>
            </div>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.enable_gapless_playback" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              Gapless Playback
            </label>
            <p class="setting-description">Seamless transitions between tracks</p>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="settings.enable_replaygain" 
                type="checkbox"
                class="setting-checkbox"
                @change="updateSettings"
              />
              ReplayGain
            </label>
            <p class="setting-description">Volume normalization using ReplayGain metadata</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quality Comparison Tool -->
    <div class="quality-comparison">
      <div class="section-header">
        <h3>Quality Comparison Tool</h3>
        <p class="section-description">Compare different audio formats and quality settings</p>
      </div>
      
      <div class="comparison-tool">
        <div class="file-input-section">
          <label class="file-input-label">Select Audio File for Comparison</label>
          <div class="file-input-area" @click="selectFile" @drop="handleFileDrop" @dragover.prevent>
            <Icon name="upload" class="upload-icon" />
            <p v-if="!selectedFile">Click to select or drag and drop an audio file</p>
            <p v-else class="selected-file">{{ selectedFile.name }}</p>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="audio/*" 
            style="display: none" 
            @change="handleFileSelect"
          />
        </div>
        
        <div v-if="selectedFile" class="comparison-options">
          <label class="options-label">Compare Formats:</label>
          <div class="format-checkboxes">
            <label v-for="format in availableFormats" :key="format.key" class="format-checkbox">
              <input 
                v-model="selectedFormats" 
                type="checkbox" 
                :value="format.key"
                class="checkbox-input"
              />
              <span class="checkbox-label">{{ format.name }}</span>
            </label>
          </div>
          
          <button 
            :disabled="selectedFormats.length === 0 || comparing" 
            class="compare-btn primary"
            @click="startComparison"
          >
            <Icon v-if="!comparing" name="bar-chart" />
            <div v-else class="loading-spinner"></div>
            {{ comparing ? 'Comparing...' : 'Start Comparison' }}
          </button>
        </div>
        
        <div v-if="comparisonResults" class="comparison-results">
          <h4>Comparison Results</h4>
          
          <!-- Format Comparison Table -->
          <div class="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Format</th>
                  <th>File Size</th>
                  <th>Quality Score</th>
                  <th>Transparency</th>
                  <th>Compatibility</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(result, format) in comparisonResults.formats" :key="format">
                  <td class="format-name">{{ format.toUpperCase() }}</td>
                  <td class="file-size">{{ formatFileSize(result.file_size) }}</td>
                  <td class="quality-score">
                    <div class="score-bar">
                      <div 
                        class="score-fill" 
                        :style="{ width: comparisonResults.quality_score[format] + '%' }"
                      ></div>
                      <span class="score-text">{{ comparisonResults.quality_score[format].toFixed(1) }}</span>
                    </div>
                  </td>
                  <td class="transparency">
                    <div class="score-bar">
                      <div 
                        class="score-fill" 
                        :style="{ width: comparisonResults.transparency_score[format] + '%' }"
                      ></div>
                      <span class="score-text">{{ comparisonResults.transparency_score[format].toFixed(1) }}</span>
                    </div>
                  </td>
                  <td class="compatibility">
                    <span class="compatibility-badge" :class="getCompatibilityClass(format)">
                      {{ getCompatibilityLevel(format) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Recommendation -->
          <div class="recommendation">
            <div class="recommendation-header">
              <Icon name="star" class="recommendation-icon" />
              <h5>Recommended Format</h5>
            </div>
            <div class="recommendation-content">
              <p class="recommended-format">{{ comparisonResults.recommended_format.toUpperCase() }}</p>
              <p class="recommendation-reason">{{ comparisonResults.recommended_reason }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Audio Analysis -->
    <div class="audio-analysis">
      <div class="section-header">
        <h3>Audio Analysis</h3>
        <p class="section-description">Detailed analysis of audio characteristics</p>
      </div>
      
      <div v-if="!audioAnalysis" class="analysis-placeholder">
        <Icon name="activity" class="placeholder-icon" />
        <p>Select a file to analyze its audio characteristics</p>
        <button class="primary-btn" @click="selectFile">
          Select File
        </button>
      </div>
      
      <div v-else class="analysis-results">
        <!-- Basic Info -->
        <div class="analysis-section">
          <h4>Basic Information</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Format:</span>
              <span class="info-value">{{ audioAnalysis.format }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Duration:</span>
              <span class="info-value">{{ formatDuration(audioAnalysis.duration) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sample Rate:</span>
              <span class="info-value">{{ audioAnalysis.sample_rate }} Hz</span>
            </div>
            <div class="info-item">
              <span class="info-label">Bit Depth:</span>
              <span class="info-value">{{ audioAnalysis.bit_depth }} bit</span>
            </div>
            <div class="info-item">
              <span class="info-label">Bitrate:</span>
              <span class="info-value">{{ audioAnalysis.bitrate }} kbps</span>
            </div>
            <div class="info-item">
              <span class="info-label">Channels:</span>
              <span class="info-value">{{ audioAnalysis.channels }}</span>
            </div>
          </div>
        </div>
        
        <!-- Audio Characteristics -->
        <div class="analysis-section">
          <h4>Audio Characteristics</h4>
          <div class="characteristics-grid">
            <div class="characteristic-item">
              <div class="characteristic-header">
                <span class="characteristic-name">Dynamic Range</span>
                <span class="characteristic-value">{{ audioAnalysis.dynamic_range.toFixed(1) }} dB</span>
              </div>
              <div class="characteristic-bar">
                <div 
                  class="characteristic-fill" 
                  :style="{ width: Math.min(100, (audioAnalysis.dynamic_range / 30) * 100) + '%' }"
                ></div>
              </div>
            </div>
            
            <div class="characteristic-item">
              <div class="characteristic-header">
                <span class="characteristic-name">Peak Level</span>
                <span class="characteristic-value">{{ audioAnalysis.peak_level.toFixed(1) }} dB</span>
              </div>
              <div class="characteristic-bar">
                <div 
                  class="characteristic-fill" 
                  :style="{ width: Math.max(0, ((audioAnalysis.peak_level + 20) / 20) * 100) + '%' }"
                ></div>
              </div>
            </div>
            
            <div class="characteristic-item">
              <div class="characteristic-header">
                <span class="characteristic-name">Loudness</span>
                <span class="characteristic-value">{{ audioAnalysis.loudness.toFixed(1) }} LUFS</span>
              </div>
              <div class="characteristic-bar">
                <div 
                  class="characteristic-fill" 
                  :style="{ width: Math.max(0, ((audioAnalysis.loudness + 23) / 15) * 100) + '%' }"
                ></div>
              </div>
            </div>
            
            <div class="characteristic-item">
              <div class="characteristic-header">
                <span class="characteristic-name">Signal-to-Noise Ratio</span>
                <span class="characteristic-value">{{ audioAnalysis.signal_to_noise_ratio.toFixed(1) }} dB</span>
              </div>
              <div class="characteristic-bar">
                <div 
                  class="characteristic-fill" 
                  :style="{ width: Math.min(100, (audioAnalysis.signal_to_noise_ratio / 80) * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Frequency Response -->
        <div class="analysis-section">
          <h4>Frequency Response</h4>
          <div class="frequency-chart">
            <div class="frequency-bars">
              <div 
                v-for="(value, freq) in audioAnalysis.frequency_response" 
                :key="freq"
                class="frequency-bar"
              >
                <div class="frequency-label">{{ freq }}Hz</div>
                <div class="frequency-bar-container">
                  <div 
                    class="frequency-fill" 
                    :style="{ height: Math.abs(value) * 10 + '%' }"
                  ></div>
                </div>
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
import { useToast } from '@/composables/useToast'
import { useFetch } from '@/composables/useFetch'
import Icon from '@/components/shared/Icon.vue'

const toast = useToast()
const { $get, $post } = useFetch()

// Reactive state
const loading = ref(false)
const comparing = ref(false)
const showAdvancedSettings = ref(false)

// Data
const currentQuality = ref({
  streaming_quality: 'high',
  download_format: 'flac'
})

const networkStatus = ref({
  speed: 0,
  quality: 'unknown'
})

const deviceInfo = ref({
  type: 'desktop'
})

const settings = ref({
  adaptive_quality: true,
  network_aware_quality: true,
  device_specific_quality: true,
  download_format: 'flac',
  download_bitrate: null,
  download_sample_rate: '44.1kHz',
  download_bit_depth: '16bit',
  enable_loudness_normalization: true,
  target_loudness: -14.0,
  enable_adaptive_eq: true,
  enable_spatial_audio_processing: false,
  spatial_audio_format: 'stereo',
  enable_crossfade: false,
  crossfade_duration: 2.0,
  enable_gapless_playback: true,
  enable_replaygain: true,
  prioritize_fidelity: true,
  prioritize_file_size: false,
  prioritize_compatibility: false,
  custom_ffmpeg_params: {},
  enable_experimental_codecs: false,
  cache_transcoded_files: true
})

const qualityPresets = ref([
  {
    key: 'audiophile',
    name: 'Audiophile',
    description: 'Maximum quality for critical listening',
    icon: 'headphones',
    settings: {
      streaming_quality: 'lossless',
      download_format: 'flac',
      download_sample_rate: '96kHz',
      download_bit_depth: '24bit'
    }
  },
  {
    key: 'portable',
    name: 'Portable',
    description: 'Balanced quality for mobile devices',
    icon: 'smartphone',
    settings: {
      streaming_quality: 'high',
      download_format: 'aac_256',
      adaptive_quality: true,
      network_aware_quality: true
    }
  },
  {
    key: 'data_saver',
    name: 'Data Saver',
    description: 'Minimal bandwidth usage',
    icon: 'wifi-off',
    settings: {
      streaming_quality: 'data_saver',
      download_format: 'mp3_128',
      prioritize_file_size: true
    }
  },
  {
    key: 'studio',
    name: 'Studio',
    description: 'Professional quality for production',
    icon: 'mic',
    settings: {
      streaming_quality: 'lossless',
      download_format: 'wav',
      download_sample_rate: '192kHz',
      download_bit_depth: '32bit'
    }
  },
  {
    key: 'gaming',
    name: 'Gaming',
    description: 'Low latency with good quality',
    icon: 'gamepad-2',
    settings: {
      streaming_quality: 'medium',
      download_format: 'mp3_256',
      enable_crossfade: false,
      enable_gapless_playback: true
    }
  },
  {
    key: 'podcast',
    name: 'Podcast',
    description: 'Optimized for speech content',
    icon: 'podcast',
    settings: {
      streaming_quality: 'medium',
      download_format: 'aac_128',
      target_loudness: -16.0,
      enable_adaptive_eq: true
    }
  }
])

const supportedFormats = ref([
  { key: 'flac', name: 'FLAC', description: 'Lossless' },
  { key: 'alac', name: 'ALAC', description: 'Apple Lossless' },
  { key: 'wav', name: 'WAV', description: 'Uncompressed' },
  { key: 'mp3_320', name: 'MP3 320', description: 'High Quality' },
  { key: 'mp3_256', name: 'MP3 256', description: 'Good Quality' },
  { key: 'mp3_192', name: 'MP3 192', description: 'Standard Quality' },
  { key: 'mp3_128', name: 'MP3 128', description: 'Space Saver' },
  { key: 'aac_256', name: 'AAC 256', description: 'Efficient' },
  { key: 'aac_192', name: 'AAC 192', description: 'Balanced' },
  { key: 'aac_128', name: 'AAC 128', description: 'Compact' },
  { key: 'ogg_vorbis', name: 'Ogg Vorbis', description: 'Open Source' },
  { key: 'ogg_opus', name: 'Opus', description: 'Modern Codec' }
])

const availableFormats = ref([
  { key: 'flac', name: 'FLAC' },
  { key: 'mp3_320', name: 'MP3 320' },
  { key: 'mp3_256', name: 'MP3 256' },
  { key: 'aac_256', name: 'AAC 256' }
])

// Comparison tool state
const selectedFile = ref(null)
const selectedFormats = ref(['flac', 'mp3_320'])
const comparisonResults = ref(null)

// Audio analysis state
const audioAnalysis = ref(null)

// Active preset
const activePreset = ref('portable')

// File input ref
const fileInput = ref(null)

// Methods
const loadQualitySettings = async () => {
  try {
    const response = await $get('/api/audio-quality/settings')
    const data = response.data.settings
    
    // Update settings
    Object.assign(settings.value, data)
    
    // Update current quality
    currentQuality.value = {
      streaming_quality: data.streaming_quality,
      download_format: data.download_format
    }
    
  } catch (error) {
    console.error('Error loading quality settings:', error)
  }
}

const loadNetworkStatus = async () => {
  try {
    const response = await $get('/api/audio-quality/network/status')
    networkStatus.value = response.data.network_status
  } catch (error) {
    console.error('Error loading network status:', error)
  }
}

const loadDeviceInfo = async () => {
  try {
    const response = await $get('/api/audio-quality/device/info')
    deviceInfo.value = response.data.device_info
  } catch (error) {
    console.error('Error loading device info:', error)
  }
}

const updateSettings = async () => {
  try {
    await $post('/api/audio-quality/settings', settings.value)
    toast.success('Audio quality settings updated')
    
    // Refresh current quality
    await loadQualitySettings()
    
  } catch (error) {
    console.error('Error updating settings:', error)
    toast.error('Failed to update settings')
  }
}

const applyPreset = async (presetKey) => {
  try {
    await $post('/api/audio-quality/apply-preset', { preset_name: presetKey })
    
    activePreset.value = presetKey
    toast.success(`Applied ${presetKey} preset`)
    
    // Refresh settings
    await loadQualitySettings()
    
  } catch (error) {
    console.error('Error applying preset:', error)
    toast.error('Failed to apply preset')
  }
}

const refreshStatus = async () => {
  loading.value = true
  
  try {
    await Promise.all([
      loadQualitySettings(),
      loadNetworkStatus(),
      loadDeviceInfo()
    ])
    
    toast.success('Quality status refreshed')
    
  } catch (error) {
    toast.error('Failed to refresh status')
  } finally {
    loading.value = false
  }
}

// File handling
const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    analyzeFile(file)
  }
}

const handleFileDrop = (event) => {
  event.preventDefault()
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('audio/')) {
    selectedFile.value = file
    analyzeFile(file)
  }
}

const analyzeFile = async (file) => {
  try {
    // In a real implementation, you would upload the file to the server
    // For now, we'll create mock analysis data
    audioAnalysis.value = {
      file_path: file.name,
      format: 'FLAC',
      duration: 240.5,
      sample_rate: 44100,
      bit_depth: 16,
      bitrate: 0,
      channels: 2,
      codec: 'flac',
      dynamic_range: 18.5,
      peak_level: -1.2,
      rms_level: -14.8,
      loudness: -15.2,
      frequency_response: {
        '20': -6.0,
        '60': -3.0,
        '250': 0.0,
        '1000': 0.0,
        '4000': -2.0,
        '16000': -8.0,
        '20000': -12.0
      },
      spectral_centroid: 2100.0,
      spectral_rolloff: 18500.0,
      signal_to_noise_ratio: 75.0,
      total_harmonic_distortion: 0.008
    }
    
    toast.success('File analyzed successfully')
    
  } catch (error) {
    console.error('Error analyzing file:', error)
    toast.error('Failed to analyze file')
  }
}

const startComparison = async () => {
  if (!selectedFile.value || selectedFormats.value.length === 0) return
  
  comparing.value = true
  
  try {
    // In a real implementation, you would upload the file and start comparison
    // For now, we'll create mock comparison results
    
    await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate processing
    
    comparisonResults.value = {
      original_file: selectedFile.value.name,
      formats: {
        flac: {
          file_size: 45000000,
          analysis: {}
        },
        mp3_320: {
          file_size: 12000000,
          analysis: {}
        },
        mp3_256: {
          file_size: 9600000,
          analysis: {}
        },
        aac_256: {
          file_size: 8800000,
          analysis: {}
        }
      },
      size_difference: {
        flac: 0,
        mp3_320: -73.3,
        mp3_256: -78.7,
        aac_256: -80.4
      },
      quality_score: {
        flac: 100,
        mp3_320: 85,
        mp3_256: 75,
        aac_256: 78
      },
      transparency_score: {
        flac: 100,
        mp3_320: 85,
        mp3_256: 70,
        aac_256: 75
      },
      recommended_format: 'flac',
      recommended_reason: 'Best quality for archival purposes with perfect transparency'
    }
    
    toast.success('Comparison completed')
    
  } catch (error) {
    console.error('Error comparing formats:', error)
    toast.error('Failed to compare formats')
  } finally {
    comparing.value = false
  }
}

// Utility functions
const formatQualityLevel = (level) => {
  const levels = {
    'lossless': 'Lossless',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    'data_saver': 'Data Saver'
  }
  return levels[level] || level
}

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getCompatibilityLevel = (format) => {
  const levels = {
    'flac': 'High',
    'mp3_320': 'Very High',
    'mp3_256': 'Very High',
    'aac_256': 'High'
  }
  return levels[format] || 'Medium'
}

const getCompatibilityClass = (format) => {
  const classes = {
    'flac': 'high',
    'mp3_320': 'very-high',
    'mp3_256': 'very-high',
    'aac_256': 'high'
  }
  return classes[format] || 'medium'
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadQualitySettings(),
    loadNetworkStatus(),
    loadDeviceInfo()
  ])
})
</script>

<style scoped>
.audio-quality-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Styles */
.dashboard-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.title-icon {
  width: 2rem;
  height: 2rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn,
.advanced-btn {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--background-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover,
.advanced-btn:hover {
  background: var(--background-hover);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.quality-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.status-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.status-value {
  font-weight: 600;
  color: var(--text-primary);
}

.status-value.lossless {
  color: var(--success-color);
}

.status-value.high {
  color: var(--accent-color);
}

.status-value.medium {
  color: var(--warning-color);
}

.status-value.low,
.status-value.data_saver {
  color: var(--error-color);
}

.status-value.excellent {
  color: var(--success-color);
}

.status-value.good {
  color: var(--accent-color);
}

.status-value.fair {
  color: var(--warning-color);
}

.status-value.poor {
  color: var(--error-color);
}

/* Quality Presets */
.quality-presets {
  margin-bottom: 2rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.section-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.preset-card {
  padding: 1.5rem;
  background: var(--background-secondary);
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-card:hover {
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.preset-card.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
}

.preset-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.preset-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.preset-name {
  margin: 0;
  font-weight: 600;
  font-size: 1.125rem;
}

.preset-description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  opacity: 0.8;
}

.preset-details {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  opacity: 0.9;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Advanced Settings */
.advanced-settings {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.settings-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.close-btn:hover {
  background: var(--background-hover);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.settings-section h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-weight: 600;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.setting-checkbox {
  width: 1rem;
  height: 1rem;
}

.setting-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.sub-setting {
  margin-top: 0.75rem;
  padding-left: 1.5rem;
}

.sub-label {
  display: block;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.setting-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-primary);
  color: var(--text-primary);
}

.setting-range {
  width: 100%;
  margin: 0.5rem 0;
}

.range-value {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Quality Comparison */
.quality-comparison {
  margin-bottom: 2rem;
}

.comparison-tool {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.file-input-section {
  margin-bottom: 2rem;
}

.file-input-label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.file-input-area {
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-input-area:hover {
  border-color: var(--accent-color);
  background: var(--background-hover);
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.selected-file {
  color: var(--text-primary);
  font-weight: 500;
}

.comparison-options {
  margin-bottom: 2rem;
}

.options-label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.format-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.format-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-input {
  width: 1rem;
  height: 1rem;
}

.checkbox-label {
  color: var(--text-primary);
  font-size: 0.875rem;
}

.compare-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--accent-color);
  border-radius: 0.5rem;
  background: var(--accent-color);
  color: white;
  cursor: pointer;
  font-weight: 500;
}

.compare-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.comparison-results {
  margin-top: 2rem;
}

.comparison-results h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.comparison-table {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.comparison-table th {
  background: var(--background-hover);
  font-weight: 600;
  color: var(--text-primary);
}

.format-name {
  font-weight: 600;
  color: var(--text-primary);
}

.file-size {
  color: var(--text-secondary);
}

.quality-score,
.transparency {
  width: 150px;
}

.score-bar {
  position: relative;
  height: 1rem;
  background: var(--background-hover);
  border-radius: 0.25rem;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.compatibility-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.compatibility-badge.very-high {
  background: var(--success-color);
  color: white;
}

.compatibility-badge.high {
  background: var(--accent-color);
  color: white;
}

.compatibility-badge.medium {
  background: var(--warning-color);
  color: white;
}

.recommendation {
  background: var(--background-hover);
  border: 1px solid var(--accent-color);
  border-radius: 0.5rem;
  padding: 1rem;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.recommendation-icon {
  color: var(--accent-color);
}

.recommendation-header h5 {
  margin: 0;
  color: var(--text-primary);
}

.recommended-format {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-color);
  margin: 0;
}

.recommendation-reason {
  margin: 0.25rem 0 0 0;
  color: var(--text-secondary);
}

/* Audio Analysis */
.audio-analysis {
  margin-bottom: 2rem;
}

.analysis-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
}

.placeholder-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.analysis-results {
  display: grid;
  gap: 2rem;
}

.analysis-section h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
}

.info-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.characteristics-grid {
  display: grid;
  gap: 1rem;
}

.characteristic-item {
  padding: 1rem;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.characteristic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.characteristic-name {
  color: var(--text-primary);
  font-weight: 500;
}

.characteristic-value {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.characteristic-bar {
  height: 0.5rem;
  background: var(--background-hover);
  border-radius: 0.25rem;
  overflow: hidden;
}

.characteristic-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.frequency-chart {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
}

.frequency-bars {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  height: 150px;
  align-items: flex-end;
}

.frequency-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.frequency-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.frequency-bar-container {
  flex: 1;
  width: 100%;
  background: var(--background-hover);
  border-radius: 0.25rem;
  position: relative;
}

.frequency-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--accent-color);
  border-radius: 0.25rem;
  transition: height 0.3s ease;
}

/* Button Styles */
.primary-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--accent-color);
  border-radius: 0.5rem;
  background: var(--accent-color);
  color: white;
  cursor: pointer;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 768px) {
  .audio-quality-dashboard {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .quality-status {
    grid-template-columns: 1fr;
  }
  
  .presets-grid {
    grid-template-columns: 1fr;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .format-checkboxes {
    grid-template-columns: 1fr;
  }
  
  .comparison-table {
    font-size: 0.875rem;
  }
  
  .frequency-bars {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
