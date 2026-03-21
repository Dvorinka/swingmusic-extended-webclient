<template>
  <div class="content-page utility-route">
    <MusicUpload />
  </div>
</template>

<script setup lang="ts">
import MusicUpload from "@/components/MusicUpload.vue";
import { onMounted } from "vue";
import updatePageTitle from "@/utils/updatePageTitle";

onMounted(() => {
  updatePageTitle("Upload Music");
});
</script>

<style lang="scss">
.utility-route {
  height: 100%;
  overflow: auto;
  padding-top: 0.25rem;
}
</style>
