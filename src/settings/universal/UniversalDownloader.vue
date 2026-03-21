<template>
  <div class="universal-downloader-settings">
    <div class="settings-group">
      <h3>Download Quality</h3>
      <div class="setting-item">
        <label>Default Quality</label>
        <select v-model="settings.defaultQuality">
          <option value="lossless">Lossless (FLAC)</option>
          <option value="high">High (320kbps)</option>
          <option value="medium">Medium (192kbps)</option>
          <option value="low">Low (128kbps)</option>
        </select>
      </div>
    </div>

    <div class="settings-group">
      <h3>Download Settings</h3>
      <div class="setting-item">
        <label>
          <input 
            v-model="settings.autoAddToLibrary" 
            type="checkbox"
          />
          Automatically add downloads to library
        </label>
      </div>
      <div class="setting-item">
        <label>Max Concurrent Downloads</label>
        <input 
          v-model="settings.maxConcurrentDownloads" 
          type="number"
          min="1"
          max="10"
        />
      </div>
    </div>

    <div class="settings-group">
      <h3>Supported Services</h3>
      <div class="services-list">
        <div 
          v-for="service in supportedServices" 
          :key="service.id"
          class="service-item"
        >
          <label>
            <input 
              v-model="service.enabled" 
              type="checkbox"
              @change="updateService(service)"
            />
            <span class="service-name">{{ service.name }}</span>
            <span class="service-status">{{ service.enabled ? 'Enabled' : 'Disabled' }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="settings-actions">
      <button class="save-button" @click="saveSettings">
        Save Settings
      </button>
      <button class="reset-button" @click="resetSettings">
        Reset to Defaults
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'UniversalDownloaderSettings',
  
  setup() {
    const settings = ref({
      defaultQuality: 'high',
      autoAddToLibrary: true,
      maxConcurrentDownloads: 3
    })
    
    const supportedServices = ref([
      { id: 'spotify', name: 'Spotify', enabled: true },
      { id: 'apple_music', name: 'Apple Music', enabled: false },
      { id: 'youtube', name: 'YouTube', enabled: true },
      { id: 'soundcloud', name: 'SoundCloud', enabled: false },
      { id: 'tidal', name: 'Tidal', enabled: false }
    ])
    
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/universal-downloader')
        const data = await response.json()
        if (data.success) {
          settings.value = { ...settings.value, ...data.settings }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    
    const saveSettings = async () => {
      try {
        const response = await fetch('/api/settings/universal-downloader', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings.value)
        })
        
        const data = await response.json()
        if (data.success) {
          // Show success message
          alert('Settings saved successfully!')
        } else {
          alert('Failed to save settings')
        }
      } catch (error) {
        console.error('Failed to save settings:', error)
        alert('Failed to save settings')
      }
    }
    
    const resetSettings = () => {
      settings.value = {
        defaultQuality: 'high',
        autoAddToLibrary: true,
        maxConcurrentDownloads: 3
      }
    }
    
    const updateService = (service) => {
      console.log(`Updated ${service.name}: ${service.enabled}`)
    }
    
    onMounted(() => {
      loadSettings()
    })
    
    return {
      settings,
      supportedServices,
      saveSettings,
      resetSettings,
      updateService
    }
  }
}
</script>

<style scoped>
.universal-downloader-settings {
  padding: 1rem;
  max-width: 600px;
}

.settings-group {
  margin-bottom: 2rem;
}

.settings-group h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}

.setting-item {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
}

.setting-item select,
.setting-item input[type="number"] {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  color: var(--text-primary);
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.service-item {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}

.service-item label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.service-name {
  font-weight: 500;
}

.service-status {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.settings-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.save-button,
.reset-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.save-button {
  background: var(--accent);
  color: white;
}

.reset-button {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.save-button:hover,
.reset-button:hover {
  opacity: 0.8;
}
</style>
