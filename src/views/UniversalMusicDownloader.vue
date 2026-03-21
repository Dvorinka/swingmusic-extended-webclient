<template>
  <div class="download-page content-page">
    <UniversalMusicDownloader />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import UniversalMusicDownloader from "@/components/UniversalMusicDownloader.vue";
import updatePageTitle from "@/utils/updatePageTitle";

onMounted(() => {
  updatePageTitle("Download Center");
});
</script>

<style lang="scss">
.download-page {
  height: 100%;
  overflow: auto;
}
</style>
