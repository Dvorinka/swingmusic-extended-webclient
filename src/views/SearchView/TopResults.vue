<template>
  <div class="search-page-top-results">
    <!-- Centered Search Input -->
    <div class="centered-search">
      <div class="search-input-container">
        <SearchSvg class="search-icon" />
        <input
          ref="searchInputRef"
          v-model="localQuery"
          type="text"
          placeholder="Search for songs, artists, albums..."
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <NoItems
      :title="'No results'"
      :description="'We can\'t find any results for your search.'"
      :icon="SearchSvg"
      :flag="!search.top_results.top_result || !search.top_results.top_result.type"
    />
    <div v-if="search.top_results.top_result && search.top_results.top_result.type" class="header">
      <div class="top">
        <h3>Top Result</h3>
        <TopItem />
      </div>
      <div class="tracks">
        <h3>Tracks</h3>
        <TopTracks />
      </div>
    </div>
    <RecentItems
      v-if="search.top_results.artists.length"
      :title="'Artists'"
      :items="
        search.top_results.artists.map((i) => ({
          type: 'artist',
          item: i,
        }))
      "
    />
    <RecentItems
      v-if="search.top_results.albums.length"
      :title="'Albums'"
      :items="
        search.top_results.albums.map((i) => ({
          type: 'album',
          item: i,
        }))
      "
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import useSearchStore from "@/stores/search";
import { useRoute, useRouter } from "vue-router";

import SearchSvg from "@/assets/icons/search.svg";
import TopItem from "@/components/RightSideBar/Search/Top/TopItem.vue";
import TopTracks from "@/components/RightSideBar/Search/Top/TopTracks.vue";
import RecentItems from "@/components/shared/CardScroller.vue";
import NoItems from "@/components/shared/NoItems.vue";

const search = useSearchStore();
const route = useRoute();
const router = useRouter();

const localQuery = ref("");
const searchInputRef = ref<HTMLInputElement | null>(null);

function handleSearch() {
  // Update search store and URL
  search.query = localQuery.value;
  router.replace({
    name: route.name || undefined,
    params: route.params,
    query: { q: localQuery.value },
  });
}

onMounted(async () => {
  // Set initial query from URL
  localQuery.value = (route.query.q as string) || "";
  search.query = localQuery.value;
  
  // Focus the search input
  await nextTick();
  if (searchInputRef.value) {
    searchInputRef.value.focus();
  }
});
</script>

<style lang="scss">
.search-page-top-results {
  height: 100%;
  overflow: auto;
  padding: 0 $padright $padbottom $padleft;

  // Centered Search Input
  .centered-search {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 0;
    margin-bottom: 1rem;

    .search-input-container {
      position: relative;
      width: 100%;
      max-width: 600px;

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1.2rem;
        height: 1.2rem;
        color: $gray1;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 1rem 1rem 1rem 3rem;
        font-size: 1.1rem;
        border: none;
        border-radius: 2rem;
        background-color: $gray3;
        color: white;
        outline: none;
        transition: background-color 0.2s ease;

        &::placeholder {
          color: $gray1;
        }

        &:focus {
          background-color: $gray4;
        }

        @include allPhones {
          font-size: 1rem;
          padding: 0.8rem 0.8rem 0.8rem 2.5rem;
        }
      }
    }
  }

  .header {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 1rem;

    .top > h3 {
      margin-left: $medium;
    }

    @include largePhones {
      grid-template-columns: 1fr;
    }
  }

  h3 {
    margin: $small;
  }

  .top-result-item {
    height: max-content;
    margin: 0;

    h3 {
      margin-left: 0;
    }

    @include largePhones {
      max-width: 100%;
    }

    @include mediumPhones {
      min-width: unset;
      max-width: 100%;
    }
  }

  .track-item {
    border-radius: $small;
    padding-left: $small;
    margin-top: $smaller;
  }

  .right-search-top-albums-or-artists {
    display: flex;
    width: calc(100% - 1.25rem);
    overflow-x: auto;

    @include hideScrollbars;
  }

  @include allPhones {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
