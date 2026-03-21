import axios from 'axios';

const API_BASE = '/api';

export const downloadApi = {
  /**
   * Get all active downloads for the current user
   */
  async getActiveDownloads(): Promise<{
    downloads: Array<{
      download_id: string;
      trackhash: string;
      title: string;
      artist: string;
      status: 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
      progress_percent: number;
      bytes_downloaded: number;
      total_bytes: number;
      speed_bps: number;
      eta_seconds: number;
      started_at: number;
      updated_at: number;
      error_message?: string;
    }>;
  }> {
    const response = await axios.get(`${API_BASE}/downloads/active`);
    return response.data;
  },

  /**
   * Get download queue
   */
  async getQueue(): Promise<{
    queue: Array<{
      id: string;
      trackhash: string;
      title: string;
      artist: string;
      quality: string;
      added_at: string;
    }>;
  }> {
    const response = await axios.get(`${API_BASE}/downloads/queue`);
    return response.data;
  },

  /**
   * Cancel a download
   */
  async cancelDownload(downloadId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await axios.post(`${API_BASE}/downloads/${downloadId}/cancel`);
    return response.data;
  },

  /**
   * Add a track to download queue
   */
  async addToQueue(trackhash: string, quality?: string): Promise<{
    success: boolean;
    message: string;
    queue_id: string;
  }> {
    const response = await axios.post(`${API_BASE}/downloads/queue`, {
      trackhash,
      quality: quality || '320',
    });
    return response.data;
  },

  /**
   * Get download history
   */
  async getHistory(limit?: number): Promise<{
    history: Array<{
      id: string;
      trackhash: string;
      title: string;
      artist: string;
      status: string;
      completed_at: string;
      file_path: string;
    }>;
  }> {
    const params = limit ? { limit } : {};
    const response = await axios.get(`${API_BASE}/downloads/history`, { params });
    return response.data;
  },
};

export default downloadApi;
