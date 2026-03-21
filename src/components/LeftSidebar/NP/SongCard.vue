<template>
  <Motion
    :key="q.currenttrack?.trackhash"
    :initial="{ opacity: 0, scale: 0.9 }"
    :animate="{
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'ease-in' },
    }"
    :exit="{ opacity: 0, scale: 0.9 }"
  >
    <div v-wave class="sidebar-songcard rounded-sm" @click="toggleFullscreen">
      <img
        :src="imguri + q.currenttrack?.image"
        alt=""
        class="l-image rounded-sm"
      />
      <Bitrate />
    </div>
  </Motion>
</template>

<script setup lang="ts">
import { Motion } from "motion/vue";
import { useRouter, useRoute } from "vue-router";

import { paths } from "@/config";
import useQueueStore from "@/stores/queue";

import Bitrate from "./Bitrate.vue";

const imguri = paths.images.thumb.medium;
const q = useQueueStore();
const router = useRouter();
const route = useRoute();

function toggleFullscreen() {
  // Toggle fullscreen mode by navigating to/away from now playing
  if (route.name === 'nowplaying') {
    // If already in now playing, go back to previous page or home
    router.go(-1);
  } else {
    // Navigate to now playing in fullscreen mode
    router.push({
      name: 'nowplaying',
      params: { tab: 'home' }
    });
  }
}
</script>

<style lang="scss">
.l-image {
  width: 100%;
}

.sidebar-songcard {
  width: 100%;
  position: relative;
  width: 13rem;

  img {
    cursor: pointer;
    width: 100%;
    height: auto;
  }
}
</style>
