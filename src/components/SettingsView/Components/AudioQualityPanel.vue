<template>
  <section class="audio-quality-panel">
    <h2 class="section-title">Audio quality</h2>

    <div class="quality-card">
      <div class="quality-levels">
        <div
          v-for="row in rows"
          :key="row.tier"
          class="quality-row"
          :class="{ active: selectedTier === row.tier }"
          :style="
            selectedTier === row.tier
              ? {
                  '--quality-accent': getQualityBadge(row.tier).accent,
                  '--quality-glow': getQualityBadge(row.tier).glow,
                  '--quality-text': getQualityBadge(row.tier).text,
                }
              : undefined
          "
          @click="setQualityTier(row.tier)"
        >
          <div class="indicator-wrap">
            <div class="indicator"></div>
          </div>

          <div class="copy">
            <div class="title">{{ row.title }}</div>
            <div class="description">{{ row.description }}</div>
          </div>

          <div v-if="row.tier === 'low'" class="bitrate-chooser">
            <select
              :value="selectedLowBitrate"
              class="bitrate-select"
              @click.stop
              @change="changeLowBitrate"
            >
              <option value="320">320 kbps</option>
              <option value="128">128 kbps</option>
              <option value="96">96 kbps</option>
            </select>
          </div>
        </div>
      </div>

      <div class="adaptive-row">
        <div class="adaptive-copy">
          <div class="adaptive-title">Adaptive streaming</div>
          <div class="adaptive-desc">
            Automatically adjust audio quality based on your network conditions
          </div>
        </div>
        <SettingsToggle
          :model-value="settings.adaptive_streaming"
          @toggle="settings.toggleAdaptiveStreaming()"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import useSettings from "@/stores/settings";
import {
  QualityTier,
  getQualityBadge,
  getQualityTierFromStreaming,
} from "@/utils/audio/qualityTier";

import SettingsToggle from "./SettingsToggle.vue";

const settings = useSettings();

const rows: {
  tier: QualityTier;
  title: string;
  description: string;
}[] = [
  {
    tier: "low",
    title: "Low",
    description: "Balance audio quality and data consumption",
  },
  {
    tier: "high",
    title: "High",
    description: "16-bit, 44.1 kHz",
  },
  {
    tier: "max",
    title: "Max",
    description: "Up to 24-bit, 192 kHz",
  },
];

const selectedTier = computed(() =>
  getQualityTierFromStreaming(settings.streaming_quality)
);

const selectedLowBitrate = computed(() => {
  const allowed = ["320", "128", "96"];
  return allowed.includes(settings.streaming_quality)
    ? settings.streaming_quality
    : "320";
});

function setQualityTier(tier: QualityTier) {
  if (tier === "max") {
    settings.setStreamingQuality("original");
    return;
  }

  if (tier === "high") {
    settings.setStreamingQuality("320");
    return;
  }

  settings.setStreamingQuality(selectedLowBitrate.value);
}

function changeLowBitrate(event: Event) {
  const target = event.target as HTMLSelectElement;
  settings.setStreamingQuality(target.value);
}
</script>

<style lang="scss" scoped>
.audio-quality-panel {
  width: 100%;
}

.section-title {
  margin: 0 0 1.1rem;
  font-size: 2.05rem;
  line-height: 1;
  letter-spacing: -0.03em;
  font-weight: 700;
}

.quality-card {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  background: linear-gradient(145deg, #090b13 0%, #07090f 45%, #080a11 100%);
}

.quality-levels {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.quality-row {
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  gap: 1.05rem;
  align-items: center;
  padding: 1.36rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  &.active {
    background:
      linear-gradient(90deg, var(--quality-accent), transparent 44%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 68%);

    .indicator {
      background: var(--quality-text);
      box-shadow: 0 0 0 8px var(--quality-glow);
    }
  }
}

.indicator-wrap {
  width: 1rem;
  height: 1rem;
  display: grid;
  place-items: center;
}

.indicator {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.copy {
  min-width: 0;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.description {
  margin-top: 0.45rem;
  color: rgba(255, 255, 255, 0.62);
  font-size: 1.34rem;
  line-height: 1.2;
  font-weight: 500;
}

.bitrate-chooser {
  width: 9.5rem;
}

.bitrate-select {
  width: 100%;
  height: 2.8rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(26, 27, 35, 0.95);
  color: rgba(255, 255, 255, 0.67);
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  appearance: none;
  outline: none;
  cursor: pointer;
}

.adaptive-row {
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 1rem;
  align-items: center;
  padding: 1.34rem 1.25rem;
}

.adaptive-title {
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.adaptive-desc {
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

  .title,
  .adaptive-title {
    font-size: 1.4rem;
  }

  .description,
  .adaptive-desc {
    font-size: 1rem;
  }
}

@include mediumPhones {
  .quality-row {
    grid-template-columns: max-content 1fr;
  }

  .bitrate-chooser {
    grid-column: 2;
    margin-top: 0.5rem;
    width: 8rem;
  }
}
</style>
