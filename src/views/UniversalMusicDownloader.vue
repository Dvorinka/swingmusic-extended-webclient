<template>
  <div class="universal-downloader-view">
    <UniversalMusicDownloader />
  </div>
</template>

<script setup>
import UniversalMusicDownloader from '@/components/UniversalMusicDownloader.vue'
</script>

<style scoped>
.universal-downloader-view {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: var(--bg-primary);
}
</style>
