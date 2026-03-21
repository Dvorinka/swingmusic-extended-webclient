<template>
  <div class="settingscontent">
    <header class="settings-header">
      <h1>Settings</h1>
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="tab"
          :class="{ active: activeTab === tab.key }"
          @click="openTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </header>

    <main class="settings-main">
      <template v-if="activeTab === 'general'">
        <AudioQualityPanel />
        <PlaybackPanel />

        <section class="legacy-section">
          <h2 class="section-title">More settings</h2>
          <div class="legacy-groups">
            <article
              v-for="(group, index) in generalGroups"
              :key="`general-${group.title || 'group'}-${index}`"
              class="legacy-group"
            >
              <div v-if="group.title || group.desc" class="legacy-head">
                <h3 v-if="group.title">{{ group.title }}</h3>
                <p v-if="group.desc">{{ group.desc }}</p>
              </div>
              <Group :group="group" />
            </article>
          </div>
        </section>
      </template>

      <template v-else-if="activeTab === 'account'">
        <section class="legacy-section">
          <h2 class="section-title">Account</h2>
          <div class="legacy-groups">
            <article
              v-for="(group, index) in accountGroups"
              :key="`account-${group.title || 'group'}-${index}`"
              class="legacy-group"
            >
              <div v-if="group.title || group.desc" class="legacy-head">
                <h3 v-if="group.title">{{ group.title }}</h3>
                <p v-if="group.desc">{{ group.desc }}</p>
              </div>
              <Group :group="group" />
            </article>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="legacy-section">
          <h2 class="section-title">About</h2>
          <div class="legacy-groups">
            <article
              v-for="(group, index) in aboutGroups"
              :key="`about-${group.title || 'group'}-${index}`"
              class="legacy-group"
            >
              <div v-if="group.title || group.desc" class="legacy-head">
                <h3 v-if="group.title">{{ group.title }}</h3>
                <p v-if="group.desc">{{ group.desc }}</p>
              </div>
              <Group :group="group" />
            </article>
          </div>
        </section>

        <div class="version">Swing Music v{{ settings.version }}</div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { Routes } from "@/router";
import { SettingCategory, SettingGroup } from "@/interfaces/settings";
import useSettings from "@/stores/settings";

import { general, library } from "@/settings/general";
import audio from "@/settings/audio";
import plugins from "@/settings/plugins";
import universal from "@/settings/universal";
import profile from "@/settings/accounts/profile";
import pairing from "@/settings/accounts/pairing";
import accounts from "@/settings/accounts";
import about from "@/settings/about";

import Group from "./Group.vue";
import AudioQualityPanel from "./Components/AudioQualityPanel.vue";
import PlaybackPanel from "./Components/PlaybackPanel.vue";

type SettingsTab = "general" | "account" | "about";

const tabs: {
  key: SettingsTab;
  label: string;
}[] = [
  { key: "general", label: "General" },
  { key: "account", label: "Account" },
  { key: "about", label: "About" },
];

const route = useRoute();
const router = useRouter();
const settings = useSettings();

const generalCategories = [general, library, audio, plugins, universal];
const accountCategories = [profile, pairing, accounts];
const aboutCategories = [about];

const activeTab = computed<SettingsTab>(() => {
  const tab = (route.params.tab || "general").toString().toLowerCase();
  if (tab === "account" || tab === "about") {
    return tab;
  }
  return "general";
});

const toRenderableGroups = (category: SettingCategory): SettingGroup[] => {
  if (category.show_if && !category.show_if()) {
    return [];
  }

  return category.groups.filter((group) => !group.show_if || group.show_if());
};

const generalGroups = computed(() =>
  generalCategories.flatMap((category) => toRenderableGroups(category as SettingCategory))
);

const accountGroups = computed(() =>
  accountCategories.flatMap((category) => toRenderableGroups(category as SettingCategory))
);

const aboutGroups = computed(() =>
  aboutCategories.flatMap((category) => toRenderableGroups(category as SettingCategory))
);

function openTab(tab: SettingsTab) {
  if (tab === activeTab.value) {
    return;
  }

  router.push({
    name: Routes.settings,
    params: { tab },
  });
}
</script>

<style lang="scss" scoped>
.settingscontent {
  --settings-border: rgba(255, 255, 255, 0.08);
  --settings-divider: rgba(255, 255, 255, 0.06);
  --settings-muted: rgba(255, 255, 255, 0.58);
  --settings-surface: linear-gradient(145deg, #090b13 0%, #07090f 45%, #080a11 100%);

  width: min(1120px, 100%);
  margin: 0 auto;
  padding-bottom: 3rem;
}

.settings-header {
  h1 {
    margin: 0;
    font-size: 3.75rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
  }
}

.tabs {
  display: flex;
  align-items: flex-end;
  gap: 2.3rem;
  margin-top: 2rem;
  border-bottom: 1px solid var(--settings-divider);
}

.tab {
  position: relative;
  border: none;
  background: transparent;
  color: rgba(215, 215, 225, 0.56);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  padding: 0 0 1.35rem;
  transition: color 0.2s ease;

  &:hover {
    color: rgba(236, 236, 242, 0.86);
  }

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    background: #fff;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.2s ease;
  }

  &.active {
    color: rgba(255, 255, 255, 0.98);

    &::after {
      transform: scaleX(1);
    }
  }
}

.settings-main {
  display: grid;
  gap: 2.5rem;
  margin-top: 2.35rem;
}

.legacy-section {
  display: grid;
  gap: 1.1rem;
}

.section-title {
  margin: 0;
  font-size: 2.05rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}

.legacy-groups {
  display: grid;
  gap: 1rem;
}

.legacy-group {
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.64);
  --surface: rgba(15, 18, 30, 0.92);
  --border: rgba(255, 255, 255, 0.12);
  --accent: #1db954;

  border-radius: 22px;
  border: 1px solid var(--settings-border);
  background: var(--settings-surface);
  overflow: hidden;
}

.legacy-head {
  padding: 1.35rem 1.3rem 0.3rem;

  h3 {
    margin: 0;
    font-size: 1.35rem;
    line-height: 1;
    letter-spacing: -0.02em;
    font-weight: 700;
  }

  p {
    margin: 0.4rem 0 0;
    color: var(--settings-muted);
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.3;
  }
}

.version {
  opacity: 0.5;
  font-size: 0.95rem;
  text-align: center;
  margin-top: 0.25rem;
}

.legacy-group :deep(.settingsgroup) {
  margin-top: 0;
  padding: 0;
}

.legacy-group :deep(.setting) {
  padding: 0;
}

.legacy-group :deep(.setting-item) {
  border-bottom: 1px solid var(--settings-divider);
  padding: 1.2rem 1.3rem;
}

.legacy-group :deep(.setting-item:first-child) {
  padding-top: 1.2rem;
}

.legacy-group :deep(.setting-item:last-child) {
  border-bottom: none;
  padding-bottom: 1.2rem;
}

.legacy-group :deep(.desc) {
  color: var(--settings-muted);
  font-size: 0.95rem;
  line-height: 1.3;
}

.legacy-group :deep(.switch) {
  width: 56px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.16);
  padding: 2px;

  .circle {
    width: 26px;
    height: 26px;
    left: 2px;
    background: #fff;
  }
}

.legacy-group :deep(.switch.toggled) {
  background: #f4f5f7;
  border-color: #f4f5f7;

  .circle {
    background: #060608;
    left: calc(100% - 28px);
  }
}

@media (max-width: 1100px) {
  .settings-header h1 {
    font-size: 2.6rem;
  }

  .tab {
    font-size: 1.25rem;
    padding-bottom: 1rem;
  }

  .section-title {
    font-size: 1.7rem;
  }
}

@include mediumPhones {
  .settingscontent {
    padding-bottom: 2rem;
  }

  .tabs {
    gap: 1.25rem;
    margin-top: 1.3rem;
  }

  .settings-main {
    margin-top: 1.65rem;
    gap: 1.7rem;
  }

  .legacy-head {
    padding: 1.1rem 1rem 0.15rem;
  }

  .legacy-group :deep(.setting-item) {
    padding: 1rem;
  }
}
</style>
