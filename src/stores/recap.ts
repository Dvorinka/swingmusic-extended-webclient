import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useRecapStore = defineStore('recap', () => {
  // State
  const availableYears = ref<number[]>([])
  const currentRecap = ref(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasRecap = computed(() => currentRecap.value !== null)
  const latestYear = computed(() => availableYears.value[0] || null)

  // Actions
  const getAvailableYears = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/recap/available-years')
      availableYears.value = response.data.available_years
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load available years'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getRecapSummary = async (year: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`/api/recap/summary/${year}`)
      return response.data.recap
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load recap summary'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getRecapDetails = async (year: number, options = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams({
        include_top_tracks: 'true',
        include_top_artists: 'true',
        include_top_albums: 'true',
        include_discoveries: 'true',
        include_milestones: 'true',
        ...options
      })
      
      const response = await axios.get(`/api/recap/details/${year}?${params}`)
      currentRecap.value = response.data.recap
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load recap details'
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateRecap = async (year: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`/api/recap/generate/${year}`)
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to generate recap'
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateRecapVideo = async (year: number, options = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`/api/recap/video/${year}`, options)
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to generate recap video'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createShareableLink = async (year: number, settings = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`/api/recap/share/${year}`, settings)
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create shareable link'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getSharedRecap = async (token: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`/api/recap/shared/${token}`)
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load shared recap'
      throw err
    } finally {
      loading.value = false
    }
  }

  const compareYears = async (year1: number, year2: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`/api/recap/compare/${year1}/${year2}`)
      return response.data
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to compare years'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    availableYears.value = []
    currentRecap.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    availableYears,
    currentRecap,
    loading,
    error,
    
    // Getters
    hasRecap,
    latestYear,
    
    // Actions
    getAvailableYears,
    getRecapSummary,
    getRecapDetails,
    generateRecap,
    generateRecapVideo,
    createShareableLink,
    getSharedRecap,
    compareYears,
    clearError,
    reset
  }
})
