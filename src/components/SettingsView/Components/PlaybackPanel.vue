<template>
  <section class="playback-panel">
    <h2 class="section-title">Playback</h2>

    <div class="playback-card">
      <div class="playback-row">
        <div class="copy">
          <div class="title">Normalize volume</div>
          <div class="description">Set the same volume level for all tracks.</div>
        </div>
        <SettingsToggle
          :model-value="settings.normalize_volume"
          @toggle="settings.toggleNormalizeVolume()"
        />
      </div>

      <div class="playback-row">
        <div class="copy">
          <div class="title">Autoplay</div>
          <div class="description">
            Automatically start the next track when the current one ends.
          </div>
        </div>
        <SettingsToggle
          :model-value="settings.autoplay"
          @toggle="settings.toggleAutoplay()"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import useSettings from "@/stores/settings";

import SettingsToggle from "./SettingsToggle.vue";

const settings = useSettings();
</script>

<style lang="scss" scoped>
.playback-panel {
  width: 100%;
}

.section-title {
  margin: 0 0 1.1rem;
  font-size: 2.05rem;
  line-height: 1;
  letter-spacing: -0.03em;
  font-weight: 700;
}

.playback-card {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(145deg, #090b13 0%, #07090f 45%, #080a11 100%);
  overflow: hidden;
}

.playback-row {
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 1rem;
  align-items: center;
  padding: 1.34rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.copy {
  min-width: 0;
}

.title {
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.description {
  margin-top: 0.4rem;
  color: rgba(255, 255, 255, 0.62);
  font-size: 1.28rem;
  line-height: 1.2;
  font-weight: 500;
}

@media (max-width: 1100px) {
  .section-title {
    font-size: 1.7rem;
  }

  .title {
    font-size: 1.4rem;
  }

  .description {
    font-size: 1rem;
  }
}
</style>
