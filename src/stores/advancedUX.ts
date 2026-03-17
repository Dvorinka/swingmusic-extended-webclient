import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAdvancedUXStore = defineStore('advancedUX', () => {
  // State
  const suggestions = ref([])
  const recommendations = ref([])
  const contextualSuggestions = ref([])
  const downloadSuggestions = ref([])
  const filters = ref([])
  const trendingContent = ref([])
  const userProfile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const hasSuggestions = computed(() => suggestions.value.length > 0)
  const hasRecommendations = computed(() => recommendations.value.length > 0)
  const hasTrendingContent = computed(() => trendingContent.value.length > 0)
  const isLoading = computed(() => loading.value)

  // Actions
  const getSearchSuggestions = async (query, context = 'general', limit = 10) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/search/suggestions', {
        params: { q: query, context, limit }
      })
      suggestions.value = response.data.suggestions
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get search suggestions'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getDiscoveryRecommendations = async (type = 'mixed', limit = 20) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/discovery/recommendations', {
        params: { type, limit }
      })
      recommendations.value = response.data.recommendations
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get discovery recommendations'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getContextualSuggestions = async (trackId, contextType = 'similar') => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/contextual/suggestions', {
        params: { track_id: trackId, context_type: contextType }
      })
      contextualSuggestions.value = response.data.suggestions
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get contextual suggestions'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getDownloadSuggestions = async (query = '', limit = 15) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/download/suggestions', {
        params: { q: query, limit }
      })
      downloadSuggestions.value = response.data.suggestions
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get download suggestions'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getEnhancedSearchFilters = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/search/filters')
      filters.value = response.data.filters
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get search filters'
      throw err
    } finally {
      loading.value = false
    }
  }

  const trackUserBehavior = async (type, data) => {
    try {
      const response = await axios.post('/api/ux/behavior/track', {
        type,
        data
      })
      return response.data
    } catch (err) {
      console.error('Error tracking user behavior:', err)
      // Don't throw error for behavior tracking
    }
  }

  const getUserBehaviorProfile = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/behavior/profile')
      userProfile.value = response.data.profile
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get user behavior profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getTrendingContent = async (type = 'mixed', limit = 20, timeframe = 'week') => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/trending/content', {
        params: { type, limit, timeframe }
      })
      trendingContent.value = response.data.trending
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get trending content'
      throw err
    } finally {
      loading.value = false
    }
  }

  const advancedSearch = async (searchData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post('/api/ux/search/advanced', searchData)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to perform advanced search'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getQuickSuggestions = async (type = 'search', limit = 5) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/suggestions/quick', {
        params: { type, limit }
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get quick suggestions'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPersonalizationPreferences = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/ux/personalization/preferences')
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get personalization preferences'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePersonalizationPreferences = async (preferences) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put('/api/ux/personalization/preferences', preferences)
      
      // Update user profile if available
      if (userProfile.value) {
        userProfile.value = { ...userProfile.value, ...preferences }
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update personalization preferences'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Utility methods
  const clearSuggestions = () => {
    suggestions.value = []
  }

  const clearRecommendations = () => {
    recommendations.value = []
  }

  const clearContextualSuggestions = () => {
    contextualSuggestions.value = []
  }

  const clearDownloadSuggestions = () => {
    downloadSuggestions.value = []
  }

  const clearTrendingContent = () => {
    trendingContent.value = []
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    suggestions.value = []
    recommendations.value = []
    contextualSuggestions.value = []
    downloadSuggestions.value = []
    filters.value = []
    trendingContent.value = []
    userProfile.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    suggestions,
    recommendations,
    contextualSuggestions,
    downloadSuggestions,
    filters,
    trendingContent,
    userProfile,
    loading,
    error,
    
    // Getters
    hasSuggestions,
    hasRecommendations,
    hasTrendingContent,
    isLoading,
    
    // Actions
    getSearchSuggestions,
    getDiscoveryRecommendations,
    getContextualSuggestions,
    getDownloadSuggestions,
    getEnhancedSearchFilters,
    trackUserBehavior,
    getUserBehaviorProfile,
    getTrendingContent,
    advancedSearch,
    getQuickSuggestions,
    getPersonalizationPreferences,
    updatePersonalizationPreferences,
    
    // Utility methods
    clearSuggestions,
    clearRecommendations,
    clearContextualSuggestions,
    clearDownloadSuggestions,
    clearTrendingContent,
    clearError,
    reset
  }
})
