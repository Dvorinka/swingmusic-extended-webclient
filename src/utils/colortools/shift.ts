
// @ts-ignore
import { colorShift, brightness } from "@nextcss/color-tools";
import rgb2Hex from "./rgb2Hex";

// Brightness level constants for consistent color manipulation
export const BrightnessLevel = {
  // Light colors (positive shift)
  SLIGHTLY_LIGHT: 20,
  LIGHT: 50,
  VERY_LIGHT: 80,
  // Dark colors (negative shift)
  SLIGHTLY_DARK: -20,
  DARK: -50,
  VERY_DARK: -80,
} as const;

/**
 * Shifts a color by a multiplier to get a lighter or darker color.
 * @param color rgb color
 * @param multipliers Two multipliers for the shift. First one is used when the color is light (positive), and the other when color is dark (negative)
 */
export function getShift(color: string, multipliers: number[]) {
  if (!color) return "";

  color = rgb2Hex(color);
  const is_light = brightness(color) > 50;

  return is_light
    ? colorShift(color, multipliers[0])
    : colorShift(color, multipliers[1]);
}

export function getTextColor(color: string) {
  return getShift(color, [BrightnessLevel.VERY_LIGHT, BrightnessLevel.VERY_DARK]);
}

export function getBackgroundColor(color: string) {
  return getShift(color, [BrightnessLevel.DARK, BrightnessLevel.LIGHT]);
}

/**
 * Get a slightly shifted color for subtle variations
 * @param color rgb color
 */
export function getSlightlyLighter(color: string) {
  return getShift(color, [BrightnessLevel.SLIGHTLY_LIGHT, BrightnessLevel.SLIGHTLY_DARK]);
}

/**
 * Get a moderately shifted color for medium variations
 * @param color rgb color
 */
export function getModerateShift(color: string) {
  return getShift(color, [BrightnessLevel.LIGHT, BrightnessLevel.DARK]);
}

/**
 * Get a strongly shifted color for high contrast
 * @param color rgb color
 */
export function getStrongShift(color: string) {
  return getShift(color, [BrightnessLevel.VERY_LIGHT, BrightnessLevel.VERY_DARK]);
}

export function addOpacity(rgbString: string, opacity = 1) {
  // Remove spaces and match RGB values
  const rgbValues = rgbString.replace(/\s/g, '').match(/^rgb\((\d+),(\d+),(\d+)\)$/);
  
  if (!rgbValues) {
      throw new Error('Invalid RGB string format. Expected format: rgb(r,g,b)');
  }
  
  // Convert opacity to a value between 0 and 1
  const validOpacity = Math.max(0, Math.min(1, opacity));
  
  return `rgba(${rgbValues[1]}, ${rgbValues[2]}, ${rgbValues[3]}, ${validOpacity})`;
}