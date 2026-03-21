import { createRouter, createWebHashHistory, RouterOptions } from 'vue-router'

import state from '@/composables/state'
import useAlbumPageStore from '@/stores/pages/album'
import useFolderPageStore from '@/stores/pages/folder'
import usePlaylistPageStore from '@/stores/pages/playlist'
import usePlaylistListPageStore from '@/stores/pages/playlists'
import useArtistPageStore from '@/stores/pages/artist'

import HomeView from '@/views/HomeView'
const Lyrics = () => import('@/views/LyricsView')
const ArtistView = () => import('@/views/ArtistView')
const NotFound = () => import('@/views/NotFound.vue')
const NowPlaying = () => import('@/views/NowPlaying')
const SearchView = () => import('@/views/SearchView')
const AlbumList = () => import('@/views/AlbumListView')
const FolderView = () => import('@/views/FolderView.vue')
const FavoritesView = () => import('@/views/Favorites.vue')
const SettingsView = () => import('@/views/SettingsView.vue')
const AlbumView = () => import('@/views/AlbumView/index.vue')
const ArtistTracksView = () => import('@/views/ArtistTracks.vue')
const PlaylistListView = () => import('@/views/PlaylistList.vue')
const FavoriteTracks = () => import('@/views/FavoriteTracks.vue')
const PlaylistView = () => import('@/views/PlaylistView/index.vue')
const ArtistDiscographyView = () => import('@/views/ArtistDiscography.vue')
const FavoriteCardScroller = () => import('@/views/FavoriteCardScroller.vue')
const StatsView = () => import('@/views/Stats/main.vue')
const MixView = () => import('@/views/MixView.vue')
const MixListView = () => import('@/views/MixListView.vue')
const Collection = () => import('@/views/Collections/Collection.vue')
const UniversalMusicDownloader = () => import('@/views/UniversalMusicDownloader.vue')
const LibraryView = () => import('@/views/LibraryView.vue')
const MusicCatalogBrowser = () => import('@/components/MusicCatalogBrowser.vue')
const GlobalArtistView = () => import('@/components/GlobalArtistView.vue')
const GlobalAlbumView = () => import('@/views/GlobalAlbumView.vue')
const GlobalPlaylistView = () => import('@/views/GlobalPlaylistView.vue')
const DragonflyDashboard = () => import('@/components/DragonflyDashboard.vue')

const folder = {
    path: '/folder/:path',
    name: 'FolderView',
    component: FolderView,
    beforeEnter: async (to: any) => {
        state.loading.value = true
        await useFolderPageStore()
            .fetchAll(to.params.path, true)
            .then(() => {
                state.loading.value = false
            })
    },
}

const playlists = {
    path: '/playlists',
    name: 'PlaylistList',
    component: PlaylistListView,
    beforeEnter: async () => {
        state.loading.value = true
        await usePlaylistListPageStore()
            .fetchAll()
            .then(() => {
                state.loading.value = false
            })
    },
}

const playlistView = {
    path: '/playlist/:pid',
    name: 'PlaylistView',
    component: PlaylistView,
    beforeEnter: async (to: any) => {
        state.loading.value = true
        await usePlaylistPageStore()
            .fetchAll(to.params.pid)
            .then(() => {
                state.loading.value = false
            })
    },
}

const albumView = {
    path: '/albums/:albumhash',
    name: 'AlbumView',
    component: AlbumView,
    beforeEnter: async (to: any) => {
        state.loading.value = true
        const store = useAlbumPageStore()

        await store.fetchTracksAndArtists(to.params.albumhash).then(() => {
            state.loading.value = false
        })
    },
}

const artistView = {
    path: '/artists/:hash',
    name: 'ArtistView',
    component: ArtistView,
    beforeEnter: async (to: any) => {
        state.loading.value = true

        await useArtistPageStore()
            .getData(to.params.hash)
            .then(() => {
                state.loading.value = false
            })
    },
}

const NowPlayingView = {
    path: '/nowplaying/:tab',
    name: 'NowPlaying',
    component: NowPlaying,
}

const LyricsView = {
    path: '/lyrics',
    name: 'LyricsView',
    component: Lyrics,
}

const ArtistTracks = {
    path: '/artists/:hash/tracks',
    name: 'ArtistTracks',
    component: ArtistTracksView,
}

const artistDiscography = {
    path: '/artists/:hash/discography/:type',
    name: 'ArtistDiscographyView',
    component: ArtistDiscographyView,
}

const settings = {
    path: '/settings/:tab?',
    name: 'SettingsView',
    component: SettingsView,
    beforeEnter: (to: any) => {
        const allowedTabs = ['general', 'account', 'about']
        const tab = (to.params.tab || '').toString().toLowerCase()

        if (!tab || !allowedTabs.includes(tab)) {
            return {
                name: 'SettingsView',
                params: {
                    tab: 'general',
                },
            }
        }

        return true
    },
}

const search = {
    path: '/search/:page',
    name: 'SearchView',
    component: SearchView,
}

const favorites = {
    path: '/favorites',
    name: 'FavoritesView',
    component: FavoritesView,
}

const favoriteAlbums = {
    path: '/favorites/albums',
    name: 'FavoriteAlbums',
    component: FavoriteCardScroller,
}

const favoriteArtists = {
    path: '/favorites/artists',
    name: 'FavoriteArtists',
    component: FavoriteCardScroller,
}

const favoriteTracks = {
    path: '/favorites/tracks',
    name: 'FavoriteTracks',
    component: FavoriteTracks,
}

const notFound = {
    name: 'NotFound',
    path: '/:pathMatch(.*)',
    component: NotFound,
}

const Home = {
    path: '/',
    name: 'Home',
    component: HomeView,
}

const Library = {
    path: '/library',
    name: 'LibraryView',
    component: LibraryView,
}

const AlbumListView = {
    path: '/albums',
    name: 'AlbumListView',
    component: AlbumList,
}

const Stats = {
    path: '/stats',
    name: 'StatsView',
    component: StatsView,
}

const ArtistListView = {
    ...AlbumListView,
    path: '/artists',
    name: 'ArtistListView',
}

const Mix = {
    path: '/mix/:mixid',
    name: 'MixView',
    component: MixView,
}

const MixList = {
    path: '/mixes/:type',
    name: 'MixListView',
    component: MixListView,
}

const PageView = {
    path: '/collections/:collection',
    name: 'Collection',
    component: Collection,
}

const universalDownloader = {
    path: '/music-downloader',
    name: 'UniversalMusicDownloader',
    component: UniversalMusicDownloader,
}

const spotifyDownloader = {
    path: '/spotify-downloader',
    name: 'spotify-downloader',
    component: UniversalMusicDownloader,
}

const spotifyTrack = {
    path: '/spotify/track/:id',
    name: 'spotify-track',
    component: UniversalMusicDownloader,
}

const spotifyPlaylist = {
    path: '/spotify/playlist/:id',
    name: 'spotify-playlist',
    component: UniversalMusicDownloader,
}

const musicCatalog = {
    path: '/catalog',
    name: 'MusicCatalogBrowser',
    component: MusicCatalogBrowser,
}

const globalArtist = {
    path: '/global/artist/:id',
    name: 'global-artist',
    component: GlobalArtistView,
}

const globalAlbum = {
    path: '/global/album/:id',
    name: 'global-album',
    component: GlobalAlbumView,
}

const globalPlaylist = {
    path: '/global/playlist/:id',
    name: 'global-playlist',
    component: GlobalPlaylistView,
}

const dragonflyDashboard = {
    path: '/dragonfly',
    name: 'DragonflyDashboard',
    component: DragonflyDashboard,
}

const routes = [
    folder,
    playlists,
    playlistView,
    albumView,
    artistView,
    artistDiscography,
    settings,
    search,
    notFound,
    ArtistTracks,
    favorites,
    favoriteAlbums,
    favoriteTracks,
    favoriteArtists,
    NowPlayingView,
    Home,
    Library,
    AlbumListView,
    ArtistListView,
    LyricsView,
    Stats,
    Mix,
    MixList,
    PageView,
    universalDownloader,
    spotifyDownloader,
    spotifyTrack,
    spotifyPlaylist,
    musicCatalog,
    globalArtist,
    globalAlbum,
    globalPlaylist,
    dragonflyDashboard,
]

const Routes = {
    folder: folder.name,
    playlists: playlists.name,
    playlist: playlistView.name,
    album: albumView.name,
    artist: artistView.name,
    artistDiscography: artistDiscography.name,
    settings: settings.name,
    search: search.name,
    notFound: notFound.name,
    artistTracks: ArtistTracks.name,
    favorites: favorites.name,
    favoriteAlbums: favoriteAlbums.name,
    favoriteTracks: favoriteTracks.name,
    favoriteArtists: favoriteArtists.name,
    nowPlaying: NowPlayingView.name,
    Home: Home.name,
    library: Library.name,
    AlbumList: AlbumListView.name,
    ArtistList: ArtistListView.name,
    Lyrics: LyricsView.name,
    Stats: Stats.name,
    Mix: Mix.name,
    MixList: MixList.name,
    Page: PageView.name,
    UniversalMusicDownloader: universalDownloader.name,
    spotifyDownloader: spotifyDownloader.name,
    spotifyTrack: spotifyTrack.name,
    spotifyPlaylist: spotifyPlaylist.name,
    MusicCatalogBrowser: musicCatalog.name,
    globalArtist: globalArtist.name,
    globalAlbum: globalAlbum.name,
    globalPlaylist: globalPlaylist.name,
    DragonflyDashboard: dragonflyDashboard.name,
}

const router = createRouter({
    mode: 'hash',
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
} as RouterOptions)

export { router, Routes }
