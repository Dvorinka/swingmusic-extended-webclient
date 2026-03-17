import { Routes } from "@/router";
import useDialog from "@/stores/modal";
import useSearch from "@/stores/search";

import FolderSvg from "@/assets/icons/folder-1.svg";
import HeartSvg from "@/assets/icons/heart.svg";
import PlaylistSvg from "@/assets/icons/playlist-1.svg";
import SearchSvg from "@/assets/icons/search.svg";
import SettingsSvg from "@/assets/icons/settings.svg";
import HomeSvg from "@/assets/icons/home.svg";
import DownloadSvg from "@/assets/icons/add_to_queue.svg";
import RadioSvg from "@/assets/icons/radio.svg";
import UploadSvg from "@/assets/icons/upload.svg";

const folder = {
  name: "folders",
  route_name: Routes.folder,
  params: { path: "$home" },
  icon: FolderSvg,
};

const favorites = {
  name: "favorites",
  route_name: Routes.favorites,
  icon: HeartSvg,
};

const playlists = {
  name: "playlists",
  route_name: Routes.playlists,
  icon: PlaylistSvg,
};

const home = {
  name: "home",
  route_name: Routes.Home,
  icon: HomeSvg,
};

const universalDownloader = {
  name: "Music Downloader",
  route_name: Routes.UniversalMusicDownloader,
  icon: DownloadSvg,
};

const musicCatalog = {
  name: "Music Catalog",
  route_name: Routes.MusicCatalogBrowser,
  icon: RadioSvg,
};

const musicUpload = {
  name: "Upload Music",
  route_name: Routes.MusicUpload,
  icon: UploadSvg,
};

export const menus = [
  home,
  folder,
  {
    name: "search",
    route_name: Routes.search,
    params: { page: "top" },
    query: () => ({ q: useSearch().query }),
    icon: SearchSvg,
  },
  {
    separator: true,
  },
  favorites,
  playlists,
  universalDownloader,
  musicCatalog,
  musicUpload,
  {
    separator: true,
  },
  {
    name: "settings",
    route_name: null,
    icon: SettingsSvg,
    action: () => {
      useDialog().showSettingsModal()
    }
  },
];

export const topnavitems = [home, folder, favorites, playlists, universalDownloader, musicCatalog, musicUpload];
