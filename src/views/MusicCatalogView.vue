<template>
  <div class="content-page utility-route">
    <MusicCatalogBrowser />
  </div>
</template>

<script setup lang="ts">
import MusicCatalogBrowser from "@/components/MusicCatalogBrowser.vue";
import { onMounted } from "vue";
import updatePageTitle from "@/utils/updatePageTitle";

onMounted(() => {
  updatePageTitle("Catalog");
});
</script>

<style lang="scss">
.utility-route {
  height: 100%;
  overflow: auto;
  padding-top: 0.25rem;
}
</style>
