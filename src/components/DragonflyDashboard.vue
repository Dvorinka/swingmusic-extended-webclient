<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { dragonflyApi } from '@/requests/dragonfly';

interface DragonflyStats {
  connected: boolean;
  latency_ms: number;
  memory_used: string;
  memory_peak: string;
  connected_clients: number;
  total_keys: number;
  uptime_seconds: number;
}

interface ServiceStats {
  name: string;
  key_count: number;
  hit_rate: number;
  last_updated: string;
}

interface KeyCount {
  namespace: string;
  count: number;
}

const stats = ref<DragonflyStats | null>(null);
const services = ref<ServiceStats[]>([]);
const keyCounts = ref<KeyCount[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const autoRefresh = ref(true);
const refreshInterval = ref<number | null>(null);

const statusColor = computed(() => {
  if (!stats.value) return 'gray';
  if (!stats.value.connected) return 'red';
  if (stats.value.latency_ms > 100) return 'yellow';
  return 'green';
});

const statusText = computed(() => {
  if (!stats.value) return 'Unknown';
  if (!stats.value.connected) return 'Disconnected';
  if (stats.value.latency_ms > 100) return 'Slow';
  return 'Healthy';
});

async function fetchStats() {
  try {
    loading.value = true;
    error.value = null;

    const [healthRes, statsRes, servicesRes, keysRes] = await Promise.all([
      dragonflyApi.getHealth(),
      dragonflyApi.getStats(),
      dragonflyApi.getServices(),
      dragonflyApi.getKeys(),
    ]);

    stats.value = {
      connected: healthRes.connected,
      latency_ms: healthRes.latency_ms,
      memory_used: statsRes.memory?.used_memory_human || '0B',
      memory_peak: statsRes.memory?.used_memory_peak_human || '0B',
      connected_clients: statsRes.clients?.connected_clients || 0,
      total_keys: statsRes.keyspace?.db0?.keys || 0,
      uptime_seconds: statsRes.server?.uptime_in_seconds || 0,
    };

    services.value = servicesRes.services || [];
    keyCounts.value = keysRes.keys || [];
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch DragonflyDB stats';
    stats.value = {
      connected: false,
      latency_ms: 0,
      memory_used: '0B',
      memory_peak: '0B',
      connected_clients: 0,
      total_keys: 0,
      uptime_seconds: 0,
    };
  } finally {
    loading.value = false;
  }
}

async function clearCache(namespace: string) {
  if (!confirm(`Clear all cache for ${namespace}?`)) return;
  
  try {
    await dragonflyApi.clearNamespace(namespace);
    await fetchStats();
  } catch (e: any) {
    error.value = e.message || 'Failed to clear cache';
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

onMounted(() => {
  fetchStats();
  
  if (autoRefresh.value) {
    refreshInterval.value = window.setInterval(fetchStats, 5000);
  }
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<template>
  <div class="dragonfly-dashboard">
    <div class="dashboard-header">
      <div class="header-left">
        <h2>DragonflyDB Cache Monitor</h2>
        <span class="badge" :class="statusColor">
          {{ statusText }}
        </span>
      </div>
      <div class="header-actions">
        <label class="auto-refresh">
          <input type="checkbox" v-model="autoRefresh" />
          Auto-refresh
        </label>
        <button @click="fetchStats" :disabled="loading" class="refresh-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="loading && !stats" class="loading-state">
      <div class="spinner"></div>
      <p>Loading cache statistics...</p>
    </div>

    <template v-else-if="stats">
      <!-- Overview Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon latency">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.latency_ms.toFixed(1) }}ms</span>
            <span class="stat-label">Latency</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon memory">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.memory_used }}</span>
            <span class="stat-label">Memory Used</span>
            <span class="stat-sub">Peak: {{ stats.memory_peak }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon keys">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.total_keys.toLocaleString() }}</span>
            <span class="stat-label">Cached Keys</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon uptime">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2v10l4.5 4.5"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatUptime(stats.uptime_seconds) }}</span>
            <span class="stat-label">Uptime</span>
          </div>
        </div>
      </div>

      <!-- Services Table -->
      <div class="section">
        <h3>Cache Services</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Keys</th>
                <th>Hit Rate</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="service in services" :key="service.name">
                <td class="service-name">{{ service.name }}</td>
                <td>{{ service.key_count.toLocaleString() }}</td>
                <td>
                  <div class="hit-rate">
                    <div class="hit-rate-bar">
                      <div class="hit-rate-fill" :style="{ width: `${service.hit_rate}%` }"></div>
                    </div>
                    <span>{{ service.hit_rate.toFixed(1) }}%</span>
                  </div>
                </td>
                <td>{{ service.last_updated }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Key Namespaces -->
      <div class="section">
        <h3>Cache Namespaces</h3>
        <div class="namespaces-grid">
          <div v-for="key in keyCounts" :key="key.namespace" class="namespace-card">
            <div class="namespace-info">
              <span class="namespace-name">{{ key.namespace }}</span>
              <span class="namespace-count">{{ key.count.toLocaleString() }} keys</span>
            </div>
            <button 
              @click="clearCache(key.namespace)" 
              class="clear-btn"
              title="Clear this cache"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dragonfly-dashboard {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.badge.green {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.badge.yellow {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.badge.red {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.badge.gray {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.auto-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #9ca3af;
  cursor: pointer;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-banner {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  margin-bottom: 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #9ca3af;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.stat-icon.latency {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon.memory {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.stat-icon.keys {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.stat-icon.uptime {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-sub {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.section {
  margin-bottom: 32px;
}

.section h3 {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.table-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
}

.data-table th {
  background: var(--bg-tertiary);
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
}

.service-name {
  font-weight: 500;
  color: var(--text-primary);
}

.hit-rate {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hit-rate-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.hit-rate-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #3b82f6);
  border-radius: 3px;
  transition: width 0.3s;
}

.namespaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.namespace-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.namespace-info {
  display: flex;
  flex-direction: column;
}

.namespace-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.namespace-count {
  font-size: 0.75rem;
  color: #9ca3af;
}

.clear-btn {
  padding: 6px;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
</style>
