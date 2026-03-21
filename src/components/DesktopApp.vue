<template>
  <div class="desktop-app">
    <!-- Custom Title Bar -->
    <div v-if="!isWeb" class="title-bar">
      <div class="title-bar-left">
        <img src="/logo-fill.light.svg" alt="SwingMusic" class="app-logo" />
        <span class="app-title">SwingMusic</span>
      </div>
      <div class="title-bar-right">
        <button class="title-bar-btn" @click="minimizeWindow">−</button>
        <button class="title-bar-btn" @click="maximizeWindow">□</button>
        <button class="title-bar-btn close" @click="closeWindow">×</button>
      </div>
    </div>

    <!-- Main App Content -->
    <div class="app-container" :class="{ 'with-title-bar': !isWeb }">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isWeb = ref(true)

// Check if running in Tauri
onMounted(() => {
  isWeb.value = !(window as any).__TAURI__
})

const minimizeWindow = async () => {
  if (!isWeb.value && (window as any).__TAURI__) {
    try {
      const { appWindow } = await import('@tauri-apps/api/window')
      await appWindow.minimize()
    } catch (error) {
      console.error('Failed to minimize window:', error)
    }
  }
}

const maximizeWindow = async () => {
  if (!isWeb.value && (window as any).__TAURI__) {
    try {
      const { appWindow, LogicalPosition } = await import('@tauri-apps/api/window')
      const { LogicalSize } = await import('@tauri-apps/api/window')
      
      // Simple toggle maximize/minimize
      await appWindow.toggleMaximize()
    } catch (error) {
      console.error('Failed to toggle maximize:', error)
    }
  }
}

const closeWindow = async () => {
  if (!isWeb.value && (window as any).__TAURI__) {
    try {
      const { appWindow } = await import('@tauri-apps/api/window')
      await appWindow.close()
    } catch (error) {
      console.error('Failed to close window:', error)
    }
  }
}
</script>

<style scoped>
.desktop-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-primary);
}

.title-bar {
  height: 32px;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  user-select: none;
  -webkit-app-region: drag;
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-logo {
  width: 16px;
  height: 16px;
}

.app-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.title-bar-right {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.title-bar-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.title-bar-btn:hover {
  background: var(--background-tertiary);
  color: var(--text-primary);
}

.title-bar-btn.close:hover {
  background: #ef4444;
  color: white;
}

.app-container {
  flex: 1;
  overflow: hidden;
}

.app-container.with-title-bar {
  height: calc(100vh - 32px);
}

.tray-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: var(--accent-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0.3;
  transition: opacity 0.3s;
  pointer-events: none;
}

.tray-indicator.active {
  opacity: 1;
}

.tray-indicator svg {
  width: 20px;
  height: 20px;
}
</style>
