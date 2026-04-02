import axios from 'axios'

const development = import.meta.env.DEV
const backendPort = import.meta.env.VITE_SWINGMUSIC_BACKEND_PORT || '1970'
let runtimeBaseUrl = ''

function normalizeBaseUrl(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return trimmed.replace(/\/+$/, '')
}

function resolveInitialBaseUrl() {
    if (!development) {
        return ''
    }

    const baseUrl = window.location.origin
    const splits = baseUrl.split(':')
    return baseUrl.replace(splits[splits.length - 1], backendPort)
}

export function getBaseUrl() {
    return runtimeBaseUrl
}

export function setBaseUrl(baseUrl: string) {
    runtimeBaseUrl = normalizeBaseUrl(baseUrl)
    axios.defaults.baseURL = runtimeBaseUrl
}

export function setApiAuthToken(token?: string) {
    if (token && token.trim()) {
        axios.defaults.headers.common.Authorization = `Bearer ${token.trim()}`
        return
    }

    delete axios.defaults.headers.common.Authorization
}

setBaseUrl(resolveInitialBaseUrl())

function baseImgUrl() {
    const baseUrl = getBaseUrl()
    return `${baseUrl}/img`
}

const imageRoutes = {
    thumb: {
        large: '/thumbnail/',
        small: '/thumbnail/xsmall/',
        smallish: '/thumbnail/small/',
        medium: '/thumbnail/medium/',
    },
    artist: {
        large: '/artist/',
        small: '/artist/small/',
        medium: '/artist/medium/',
    },
    playlist: '/playlist/',
}

export const paths = {
    api: {
        favorites: '/favorites',
        get favAlbums() {
            return this.favorites + '/albums'
        },
        get favTracks() {
            return this.favorites + '/tracks'
        },
        get favArtists() {
            return this.favorites + '/artists'
        },
        get isFavorite() {
            return this.favorites + '/check'
        },
        get addFavorite() {
            return this.favorites + '/add'
        },
        get removeFavorite() {
            return this.favorites + '/remove'
        },
        artist: '/artist',
        lyrics: '/lyrics',
        plugins: '/plugins',
        get mixes() {
            return this.plugins + '/mixes'
        },

        // Single album
        album: '/album',
        get albumartists() {
            return this.album + '/artists'
        },
        get albumbio() {
            return this.album + '/bio'
        },
        get albumsByArtistUrl() {
            return this.album + '/from-artist'
        },
        get albumVersions() {
            return this.album + '/other-versions'
        },
        folder: {
            base: '/folder',
            showInFiles: '/folder/show-in-files',
        },
        dir_browser: '/folder/dir-browser',
        playlist: {
            base: '/playlists',
            get new() {
                return this.base + '/new'
            },
            get artists() {
                return this.base + '/artists'
            },
        },
        collections: {
            base: '/collections',
        },
        search: {
            base: '/search',
            get top() {
                return this.base + '/top?q='
            },
            get tracks() {
                return this.base + '/tracks?q='
            },
            get albums() {
                return this.base + '/albums?q='
            },
            get artists() {
                return this.base + '/artists?q='
            },
            get load() {
                return this.base + '/loadmore'
            },
        },
        logger: {
            base: '/logger',
            get logTrack() {
                return this.base + '/track/log'
            },
        },
        getall: {
            base: '/getall',
            get albums() {
                return this.base + '/albums'
            },
            get artists() {
                return this.base + '/artists'
            },
        },
        colors: {
            base: '/colors',
            get album() {
                return this.base + '/album'
            },
        },
        settings: {
            base: '/notsettings',
            get get_root_dirs() {
                return this.base + '/get-root-dirs'
            },
            get add_root_dir() {
                return this.base + '/add-root-dirs'
            },
            get remove_root_dir() {
                return this.base + '/remove-root-dirs'
            },
            get trigger_scan() {
                return this.base + '/trigger-scan'
            },
            get updateConfig() {
                return this.base + '/update'
            },
        },
        files: '/file',
        home: {
            base: '/nothome',
            get recentlyAdded() {
                return this.base + '/recents/added'
            },
            get recentlyPlayed() {
                return this.base + '/recents/played'
            },
        },
        auth: {
            base: '/auth',
            get login() {
                return this.base + '/login'
            },
            get bootstrapStatus() {
                return this.base + '/bootstrap/status'
            },
            get bootstrapOwner() {
                return this.base + '/bootstrap/owner'
            },
            get inviteAccept() {
                return this.base + '/invite/accept'
            },
            get logout() {
                return this.base + '/logout'
            },
            get allUsers() {
                return this.base + '/users'
            },
            get currentUser() {
                return this.base + '/user'
            },
            get addUser() {
                return this.base + '/profile/create'
            },
            get addGuestUser() {
                return this.base + '/profile/guest/create'
            },
            get updateProfile() {
                return this.base + '/profile/update'
            },
            get deleteUser() {
                return this.base + '/profile/delete'
            },
            get pair() {
                return this.base + '/getpaircode'
            },
        },
        setup: {
            base: '/setup',
            get status() {
                return this.base + '/status'
            },
            get bootstrap() {
                return this.base + '/bootstrap'
            },
            get directory() {
                return this.base + '/directory'
            },
            get indexProgress() {
                return this.base + '/index-progress'
            },
            get indexStart() {
                return this.base + '/index/start'
            },
        },
        backups: {
            base: '/backup',
            get get_backups() {
                return this.base + '/list'
            },
            get create_backup() {
                return this.base + '/create'
            },
            get restore_backup() {
                return this.base + '/restore'
            },
            get delete_backup() {
                return this.base + '/delete'
            },
        },
        stats: {
            base: '/logger',
            get topArtists() {
                return this.base + '/top-artists'
            },
            get topAlbums() {
                return this.base + '/top-albums'
            },
            get topTracks() {
                return this.base + '/top-tracks'
            },
        },
    },
    images: {
        thumb: {
            get small() {
                return baseImgUrl() + imageRoutes.thumb.small
            },
            get smallish() {
                return baseImgUrl() + imageRoutes.thumb.smallish
            },
            get large() {
                return baseImgUrl() + imageRoutes.thumb.large
            },
            get medium() {
                return baseImgUrl() + imageRoutes.thumb.medium
            },
        },
        artist: {
            get small() {
                return baseImgUrl() + imageRoutes.artist.small
            },
            get large() {
                return baseImgUrl() + imageRoutes.artist.large
            },
            get medium() {
                return baseImgUrl() + imageRoutes.artist.medium
            },
        },
        get playlist() {
            return baseImgUrl() + imageRoutes.playlist
        },
        mix: {
            get medium() {
                return baseImgUrl() + '/mix/medium/'
            },
            get small() {
                return baseImgUrl() + '/mix/small/'
            },
        },
    },
}
