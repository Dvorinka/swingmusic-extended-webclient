import { Routes } from "@/router";
import useSearch from "@/stores/search";

import FolderSvg from "@/assets/icons/folder-1.svg";
import HeartSvg from "@/assets/icons/heart.svg";
import PlaylistSvg from "@/assets/icons/playlist-1.svg";
import SearchSvg from "@/assets/icons/search.svg";
import SettingsSvg from "@/assets/icons/settings.svg";
import HomeSvg from "@/assets/icons/home.svg";
import DownloadSvg from "@/assets/icons/add_to_queue.svg";
import RadioSvg from "@/assets/icons/radio.svg";

const library = {
  name: "Your Library",
  route_name: Routes.library,
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

export const menus = [
  home,
  library,
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
  {
    separator: true,
  },
  {
    name: "settings",
    route_name: Routes.settings,
    params: { tab: "general" },
    icon: SettingsSvg,
  },
];

export const topnavitems = [
  home,
  {
    name: "search",
    route_name: Routes.search,
    params: { page: "top" },
    query: () => ({ q: useSearch().query }),
    icon: SearchSvg,
  },
  library
];
