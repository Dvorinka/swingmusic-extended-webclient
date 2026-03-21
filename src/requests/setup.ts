import { paths } from '@/config'
import useAxios from './useAxios'

export interface SetupStatusResponse {
    required: boolean
    setup_completed: boolean
    stage: 'owner' | 'directory' | 'indexing' | 'completed'
    needs_owner: boolean
    needs_directory: boolean
    needs_index: boolean
    owner_created: boolean
    owner_username: string | null
    directory_configured: boolean
    primary_music_dir: string | null
    index_state: string
    index_progress: number
    index_message: string | null
    initial_index_completed: boolean
    has_users: boolean
    user_count: number
}

export async function getSetupStatus() {
    return await useAxios({
        url: paths.api.setup.status,
        method: 'GET',
    })
}

export async function bootstrapSetup(username: string, password: string, rootDirs: string[] = []) {
    return await useAxios({
        url: paths.api.setup.bootstrap,
        props: {
            username,
            password,
            root_dirs: rootDirs,
        },
    })
}

export async function configureSetupDirectory(rootDirs: string[]) {
    return await useAxios({
        url: paths.api.setup.directory,
        props: {
            root_dirs: rootDirs,
        },
    })
}

export async function getSetupIndexProgress() {
    return await useAxios({
        url: paths.api.setup.indexProgress,
        method: 'GET',
    })
}

export async function startSetupIndex(force: boolean = false) {
    return await useAxios({
        url: paths.api.setup.indexStart,
        props: {
            force,
        },
    })
}
