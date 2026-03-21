<template>
  <div
    v-if="$route.params.tab == 'home'"
    class="now-playing-view v-scroll-page fullscreen-mode"
    :class="{ isSmall, isMedium }"
  >
    <DynamicScroller
      :items="scrollerItems"
      :min-item-size="64"
      class="scroller"
      style="height: 100%"
    >
      <template #before>
        <Header />
      </template>
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.props]"
          :data-index="index"
        >
          <component
            :is="item.component"
            :key="index"
            v-bind="item.props"
            @playThis="playFromQueue(item.props.index - 1)"
          ></component>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { ScrollerItem } from "@/interfaces";

import useQueueStore from "@/stores/queue";
import useTracklist from "@/stores/queue/tracklist";
import { isMedium, isSmall } from "@/stores/content-width";

import Header from "@/components/NowPlaying/Header.vue";
import SongItem from "@/components/shared/SongItem.vue";
import updatePageTitle from "@/utils/updatePageTitle";


const queue = useQueueStore();
const store = useTracklist();

function playFromQueue(index: number) {
  queue.play(index);
}

const scrollerItems = computed(() => {
  const items: ScrollerItem[] = [];

  const trackComponents = store.tracklist.map((track, index) => {
    track.index = index; // used in context menu to remove from queue
    return {
      id: index,
      component: SongItem,
      props: {
        track,
        index: index + 1,
        isCurrent: index === queue.currentindex,
        isCurrentPlaying: index === queue.currentindex && queue.playing,
        isQueueTrack: true,
        source: store.from.type,
      },
    };
  });

  return items.concat(trackComponents);
});

onMounted(() => updatePageTitle("Now Playing"));
</script>

<style lang="scss">
.now-playing-view {
  height: 100%;
  
  // Fullscreen mode styles
  &.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: #000;
    
    // Hide bottom bar when in fullscreen mode
    :global(.b-bar) {
      display: none !important;
    }
    
    // Hide navigation when in fullscreen mode
    :global(.topnav) {
      display: none !important;
    }
    
    // Hide sidebar when in fullscreen mode  
    :global(.left-sidebar) {
      display: none !important;
    }
    
    // Hide right sidebar when in fullscreen mode
    :global(.right-sidebar) {
      display: none !important;
    }
    
    // Make content take full viewport
    .scroller {
      height: 100vh !important;
    }
  }
}
</style>
