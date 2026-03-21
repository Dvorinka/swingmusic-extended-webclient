export type QualityTier = "low" | "high" | "max";

export interface QualityBadge {
  tier: QualityTier;
  label: string;
  shortLabel: string;
  accent: string;
  text: string;
  glow: string;
}

const QUALITY_BADGES: Record<QualityTier, QualityBadge> = {
  low: {
    tier: "low",
    label: "Low",
    shortLabel: "LOW",
    accent: "rgba(88, 160, 255, 0.26)",
    text: "#a7ccff",
    glow: "rgba(88, 160, 255, 0.18)",
  },
  high: {
    tier: "high",
    label: "High",
    shortLabel: "HIGH",
    accent: "rgba(120, 238, 169, 0.26)",
    text: "#a6f6c5",
    glow: "rgba(120, 238, 169, 0.16)",
  },
  max: {
    tier: "max",
    label: "Max",
    shortLabel: "MAX",
    accent: "rgba(248, 202, 80, 0.28)",
    text: "#f8d77b",
    glow: "rgba(248, 202, 80, 0.18)",
  },
};

export function getQualityTierFromBitrate(
  bitrate = 0,
  filetype = ""
): QualityTier {
  const normalizedType = filetype.toLowerCase();

  if (bitrate >= 1000 || normalizedType.includes("flac")) {
    return "max";
  }

  if (bitrate >= 320) {
    return "high";
  }

  return "low";
}

export function getQualityTierFromStreaming(
  streamingQuality = "original"
): QualityTier {
  if (streamingQuality === "original") {
    return "max";
  }

  const numeric = Number(streamingQuality);
  if (Number.isNaN(numeric)) {
    return "high";
  }

  if (numeric >= 320) {
    return "high";
  }

  return "low";
}

export function getEffectiveQualityTier(
  bitrate = 0,
  filetype = "",
  streamingQuality = "original"
): QualityTier {
  const byStream = getQualityTierFromStreaming(streamingQuality);

  if (byStream === "max") {
    return getQualityTierFromBitrate(bitrate, filetype);
  }

  return byStream;
}

export function getQualityBadge(tier: QualityTier): QualityBadge {
  return QUALITY_BADGES[tier];
}

export function getQualityLabelFromStreaming(streamingQuality: string): string {
  if (streamingQuality === "original") return "Original";
  if (streamingQuality === "320") return "320 kbps";
  if (streamingQuality === "128") return "128 kbps";
  if (streamingQuality === "96") return "96 kbps";
  return "Auto";
}
