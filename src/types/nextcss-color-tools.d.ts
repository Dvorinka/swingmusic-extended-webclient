declare module '@nextcss/color-tools' {
  export function brightness(color: string): number;
  export function hexToRgb(hex: string): { r: number; g: number; b: number } | null;
  export function rgbToHex(r: number, g: number, b: number): string;
  export function getContrastColor(hex: string): string;
  export function lighten(hex: string, percent: number): string;
  export function darken(hex: string, percent: number): string;
}
