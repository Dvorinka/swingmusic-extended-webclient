import { SettingType } from "@/settings/enums";
import { Component } from "vue";

export interface SettingOption {
  title: string;
  value: any;
}

export interface Setting {
  title?: string;
  desc?: string;
  type: SettingType | "custom";
  options?: SettingOption[];
  inactive?: () => boolean;
  action?: (arg0?: any) => any;
  state?: (() => any) | null;
  button_text?: () => string;
  defaultAction?: () => void;
  show_if?: () => boolean;
  experimental?: boolean;
  new?: boolean;
  component?: Component;
}

export interface SettingGroup {
  title?: string;
  desc?: string;
  settings: Setting[];
  show_if?: () => boolean;
  experimental?: boolean;
  icon?: string;
}

export interface SettingCategory {
  title: string;
  groups: SettingGroup[];
  show_if?: () => boolean;
}
