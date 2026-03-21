import axios from 'axios';

const API_BASE = '/api';

export const recentlyPlayedApi = {
  /**
   * Get recently played tracks for the current user
   */
  async getRecentlyPlayed(limit?: number): Promise<{
    tracks: Array<{
      trackhash: string;
      title: string;
      artist: string;
      album: string;
      albumhash: string;
      duration: number;
      image: string;
      played_at: number;
    }>;
  }> {
    const params = limit ? { limit } : { limit: 20 };
    const response = await axios.get(`${API_BASE}/recently-played`, { params });
    return response.data;
  },

  /**
   * Clear recently played history
   */
  async clearRecentlyPlayed(): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await axios.delete(`${API_BASE}/recently-played`);
    return response.data;
  },
};

export default recentlyPlayedApi;
