import { paths } from '@/config'
import useAxios from './useAxios'
import { User, UserSimplified } from '@/interfaces'

export interface BootstrapStatusResponse {
    required: boolean
    has_users: boolean
    user_count: number
    owner_exists: boolean
    owner_username: string | null
}

export async function getAllUsers<T extends boolean>(simple: T = true as T): Promise<{ users: T extends true ? UserSimplified[] : User[]; settings: { [key: string]: unknown } }> {
    interface Response {
        users: T extends true ? UserSimplified[] : User[]
        settings: { [key: string]: any }
    }
    const res = await useAxios({
        url: paths.api.auth.allUsers + (simple ? '?simplified=true' : ''),
        method: 'GET',
    })

    if (res.status === 200) {
        return res.data as Response
    }

    if (res.status === 401) {
        const res = await logoutUser()

        if (res.status === 200) {
            return await getAllUsers(simple)
        }
    }

    return {
        users: [],
        settings: {},
    }
}

export async function loginUser(username: string, password: string) {
    const res = await useAxios({
        url: paths.api.auth.login,
        props: {
            username,
            password,
        },
    })

    return res
}

export async function getBootstrapStatus() {
    const setupRes = await useAxios({
        url: paths.api.setup.status,
        method: 'GET',
    })

    if (setupRes.status === 200) {
        return setupRes
    }

    return await useAxios({
        url: paths.api.auth.bootstrapStatus,
        method: 'GET',
    })
}

export async function bootstrapOwner(username: string, password: string, rootDirs: string[] = []) {
    const setupRes = await useAxios({
        url: paths.api.setup.bootstrap,
        props: {
            username,
            password,
            root_dirs: rootDirs,
        },
    })

    if (setupRes.status === 200) {
        return setupRes
    }

    return await useAxios({
        url: paths.api.auth.bootstrapOwner,
        props: {
            username,
            password,
            root_dirs: rootDirs,
        },
    })
}

export async function acceptInvite(token: string, username: string, password: string) {
    return await useAxios({
        url: paths.api.auth.inviteAccept,
        props: {
            token,
            username,
            password,
        },
    })
}

export async function logoutUser() {
    const res = await useAxios({
        url: paths.api.auth.logout,
        method: 'GET',
    })

    return res
}

export async function getLoggedInUser() {
    const res = await useAxios({
        url: paths.api.auth.currentUser,
        method: 'GET',
    })

    return res
}

export async function updateUserProfile(user: any) {
    const res = await useAxios({
        url: paths.api.auth.updateProfile,
        method: 'PUT',
        props: user,
    })

    return res
}

export async function addNewUser(user: any) {
    const res = await useAxios({
        url: paths.api.auth.addUser,
        method: 'POST',
        props: user,
    })

    return res
}

export async function addGuestUser() {
    return await useAxios({
        url: paths.api.auth.addGuestUser,
        method: 'POST',
    })
}

export async function deleteUser(username: string) {
    return await useAxios({
        url: paths.api.auth.deleteUser,
        method: 'DELETE',
        props: {
            username,
        },
    })
}

export async function sendPairRequest() {
    return await useAxios({
        url: paths.api.auth.pair,
        method: 'GET',
    })
}
