import { SettingCategory } from "@/interfaces/settings";
import UniversalDownloaderSettings from "./UniversalDownloader.vue";

const universalDownloader: SettingCategory = {
  title: "Music Downloader",
  groups: [
    {
      title: "Music Downloader",
      desc: "Configure download preferences for Spotify, Apple Music, YouTube, and other services",
      settings: [
        {
          type: "custom",
          component: UniversalDownloaderSettings,
        }
      ]
    }
  ]
};

export default universalDownloader;
