<template>
  <div class="settingspage content-page">
    <Content />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import useSettingsStore from "@/stores/settings";
import { getAllSettings } from "@/requests/settings";
import updatePageTitle from "@/utils/updatePageTitle";

import Content from "../components/SettingsView/Content.vue";

const store = useSettingsStore();

onMounted(() => {
  updatePageTitle("Settings");
  getAllSettings().then(({ settings }) => {
    store.mapDbSettings(settings);
  });
});
</script>

<style lang="scss" scoped>
.settingspage {
  height: 100%;
  overflow: auto;
  background: #020305;
  padding-top: 1.5rem;
}

@include mediumPhones {
  .settingspage {
    padding-top: 0.75rem;
  }
}
</style>
