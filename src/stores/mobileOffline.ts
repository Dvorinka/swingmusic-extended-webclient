import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useMobileOfflineStore = defineStore('mobileOffline', () => {
  // State
  const devices = ref<{ device_id: string; [key: string]: unknown }[]>([])
  const currentDevice = ref<{ device_id: string; [key: string]: unknown } | null>(null)
  const offlineLibrary = ref<{ tracks?: unknown[]; storage_usage?: { usage_percentage: number } } | null>(null)
  const syncProgress = ref<{ downloading_items: number } | null>(null)
  const storageUsage = ref<{ usage_percentage: number } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasDevices = computed(() => devices.value.length > 0)
  const currentDeviceId = computed(() => currentDevice.value?.device_id || null)
  const isSyncing = computed(() => (syncProgress.value?.downloading_items ?? 0) > 0)
  const storagePercentage = computed(() => storageUsage.value?.usage_percentage || 0)

  // Actions
  const getUserDevices = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/mobile-offline/devices')
      devices.value = response.data.devices
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load devices'
      throw err
    } finally {
      loading.value = false
    }
  }

  const registerDevice = async (deviceInfo: { device_name?: string; device_type?: string; os_version?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post('/api/mobile-offline/devices/register', deviceInfo)
      
      // Refresh devices list
      await getUserDevices()
      
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to register device'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getDeviceInfo = async (deviceId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`/api/mobile-offline/devices/${deviceId}`)
      currentDevice.value = response.data.device
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to get device info'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateDeviceSettings = async (deviceId: string, settings: Record<string, unknown>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put(`/api/mobile-offline/devices/${deviceId}/settings`, settings)
      
      // Update current device if it's the one being updated
      if (currentDevice.value?.device_id === deviceId) {
        await getDeviceInfo(deviceId)
      }
      
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update device settings'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getOfflineLibrary = async (deviceId: string, options: Record<string, string> = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams({
        include_tracks: 'true',
        include_queue: 'true',
        include_storage: 'true',
        ...options
      })
      
      const response = await axios.get(`/api/mobile-offline/devices/${deviceId}/offline-library?${params}`)
      offlineLibrary.value = response.data.offline_library
      storageUsage.value = response.data.offline_library.storage_usage
      
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to get offline library'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addTracksToOffline = async (deviceId: string, trackIds: string[], quality: string | null = null) => {
    loading.value = true
    error.value = null
    
    try {
      const requestData: { track_ids: string[]; quality?: string } = { track_ids: trackIds }
      if (quality) {
        requestData.quality = quality
      }
      
      const response = await axios.post(`/api/mobile-offline/devices/${deviceId}/add-tracks`, requestData)
      
      // Refresh library and progress
      await Promise.all([
        getOfflineLibrary(deviceId),
        getSyncProgress(deviceId)
      ])
      
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to add tracks to offline library'
      throw err
    } finally {
      loading.value = false
    }
  }

  const syncPlaylistOffline = async (deviceId: string, playlistId: string, quality: string | null = null) => {
    loading.value = true
    error.value = null
    
    try {
      const requestData: { quality?: string } = {}
      if (quality) {
        requestData.quality = quality
      }
      
      const response = await axios.post(`/api/mobile-offline/devices/${deviceId}/sync-playlist/${playlistId}`, requestData)
      
      // Refresh library and progress
      await Promise.all([
        getOfflineLibrary(deviceId),
        getSyncProgress(deviceId)
      ])
      
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to sync playlist offline'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeTracksFromOffline = async (deviceId: string, trackIds: string[]) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`/api/mobile-offline/devices/${deviceId}/remove-tracks`, {
        track_ids: trackIds
      })
      
      // Refresh library
      await getOfflineLibrary(deviceId)
      
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to remove tracks from offline library'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getSyncProgress = async (deviceId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`/api/mobile-offline/devices/${deviceId}/sync-progress`)
      syncProgress.value = response.data.sync_progress
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to get sync progress'
      throw err
    } finally {
      loading.value = false
    }
  }

  const forceSyncNow = async (deviceId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`/api/mobile-offline/devices/${deviceId}/force-sync`)
      
      // Update device status and start polling progress
      if (currentDevice.value?.device_id === deviceId) {
        await getDeviceInfo(deviceId)
      }
      
      // Start progress polling
      startProgressPolling(deviceId)
      
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to force sync'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getStorageInfo = async (deviceId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`/api/mobile-offline/devices/${deviceId}/storage-info`)
      storageUsage.value = response.data.storage_info
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to get storage info'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cleanupStorage = async (deviceId: string, cleanupOptions: Record<string, unknown>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`/api/mobile-offline/devices/${deviceId}/cleanup`, cleanupOptions)
      
      // Refresh storage info and library
      await Promise.all([
        getStorageInfo(deviceId),
        getOfflineLibrary(deviceId)
      ])
      
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to cleanup storage'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getQualityPresets = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/mobile-offline/quality-presets')
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to get quality presets'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Progress polling
  let progressPollingInterval: ReturnType<typeof setInterval> | null = null

  const startProgressPolling = (deviceId: string) => {
    // Clear any existing polling
    stopProgressPolling()
    
    // Start polling every 2 seconds
    progressPollingInterval = setInterval(async () => {
      try {
        await getSyncProgress(deviceId)
        
        // Stop polling if sync is complete
        if (syncProgress.value?.downloading_items === 0) {
          stopProgressPolling()
          
          // Refresh device info
          if (currentDevice.value?.device_id === deviceId) {
            await getDeviceInfo(deviceId)
          }
        }
      } catch (error) {
        console.error('Error polling sync progress:', error)
        // Don't stop polling on error, just log it
      }
    }, 2000)
  }

  const stopProgressPolling = () => {
    if (progressPollingInterval) {
      clearInterval(progressPollingInterval)
      progressPollingInterval = null
    }
  }

  // Utility methods
  const setCurrentDevice = (device: { device_id: string; [key: string]: unknown } | null) => {
    currentDevice.value = device
  }

  const clearCurrentDevice = () => {
    currentDevice.value = null
    offlineLibrary.value = null
    syncProgress.value = null
    storageUsage.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    devices.value = []
    currentDevice.value = null
    offlineLibrary.value = null
    syncProgress.value = null
    storageUsage.value = null
    loading.value = false
    error.value = null
    stopProgressPolling()
  }

  // Auto-cleanup on unmount
  const cleanup = () => {
    stopProgressPolling()
  }

  return {
    // State
    devices,
    currentDevice,
    offlineLibrary,
    syncProgress,
    storageUsage,
    loading,
    error,
    
    // Getters
    hasDevices,
    currentDeviceId,
    isSyncing,
    storagePercentage,
    
    // Actions
    getUserDevices,
    registerDevice,
    getDeviceInfo,
    updateDeviceSettings,
    getOfflineLibrary,
    addTracksToOffline,
    syncPlaylistOffline,
    removeTracksFromOffline,
    getSyncProgress,
    forceSyncNow,
    getStorageInfo,
    cleanupStorage,
    getQualityPresets,
    
    // Utility methods
    setCurrentDevice,
    clearCurrentDevice,
    clearError,
    reset,
    cleanup,
    
    // Progress polling
    startProgressPolling,
    stopProgressPolling
  }
})
