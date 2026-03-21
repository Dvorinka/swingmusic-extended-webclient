import axios from 'axios';

const API_BASE = '/dragonfly';

export const dragonflyApi = {
  /**
   * Get DragonflyDB connection health and latency
   */
  async getHealth(): Promise<{
    connected: boolean;
    latency_ms: number;
    message: string;
  }> {
    const response = await axios.get(`${API_BASE}/health`);
    return response.data;
  },

  /**
   * Get DragonflyDB statistics (memory, clients, keyspace)
   */
  async getStats(): Promise<Record<string, any>> {
    const response = await axios.get(`${API_BASE}/stats`);
    return response.data;
  },

  /**
   * Get per-service cache statistics
   */
  async getServices(): Promise<{
    services: Array<{
      name: string;
      key_count: number;
      hit_rate: number;
      last_updated: string;
    }>;
  }> {
    const response = await axios.get(`${API_BASE}/services`);
    return response.data;
  },

  /**
   * Get key counts by namespace
   */
  async getKeys(): Promise<{
    keys: Array<{
      namespace: string;
      count: number;
    }>;
  }> {
    const response = await axios.get(`${API_BASE}/keys`);
    return response.data;
  },

  /**
   * Clear a specific cache namespace
   */
  async clearNamespace(namespace: string): Promise<{
    success: boolean;
    message: string;
    cleared_count: number;
  }> {
    const response = await axios.post(`${API_BASE}/clear/${namespace}`);
    return response.data;
  },

  /**
   * Clear all caches (use with caution)
   */
  async clearAll(): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await axios.post(`${API_BASE}/clear-all`);
    return response.data;
  },
};

export default dragonflyApi;
