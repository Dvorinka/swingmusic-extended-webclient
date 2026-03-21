<template>
    <Profile v-if="showAddUser" :adding_user="true" @user-added="userAdded" />
    <div v-else class="accountsettings">
        <div class="asettings">
            <ToggleSetting
                v-for="s in account_settings"
                :key="s.title"
                :title="s.title"
                :value="s.value.value"
                :desc="s.desc"
                @click="s.action"
            />
        </div>
        <div class="storagesettings rounded">
            <div class="h2">My Storage Roots</div>
            <p class="subtext">
                Downloads and imports for your account will use these folders first.
            </p>
            <textarea
                v-model="storageRootsInput"
                class="rootdirs"
                rows="3"
                placeholder="One path per line"
            />
            <div class="storage-actions">
                <button class="save" :disabled="savingRoots" @click="saveStorageRoots">
                    {{ savingRoots ? 'Saving...' : 'Save Storage Roots' }}
                </button>
            </div>
        </div>
        <div class="ahead">
            <div class="h2">All users</div>
            <button class="adduser" @click="showAddUser = true">
                <PlusSvg />
                New user
            </button>
        </div>
        <TransitionGroup name="list">
            <div
                v-for="(user, index) in users"
                :key="user.id"
                v-auto-animate
                class="usercard rounded"
                :class="{
                    selected: user.id === selectedUser,
                    secondchild: index == 1,
                }"
            >
                <div class="userinfo" @click="() => selectUser(user.id)">
                    <Avatar :name="user.username" :size="47" />
                    <div class="details">
                        <div class="name">
                            {{ user.firstname || user.username }}
                        </div>
                        <div class="roles">
                            <span v-for="role in user.roles" :key="`${user.id}-${role}`" class="role">{{ role }}</span>
                        </div>
                    </div>
                    <DeleteSvg
                        v-if="auth.user.username !== user.username"
                        class="delete"
                        @click.stop="() => deleteUser(user)"
                    />
                </div>
                <div v-if="user.id === selectedUser" class="usettins">
                    <ToggleSetting
                        v-for="setting in usettings"
                        :key="setting.title"
                        :title="setting.title"
                        :desc="setting.desc"
                        :value="setting.value(user.roles)"
                        :class="{
                            disabled:
                                setting.title === 'Admin' &&
                                users.filter(u => u.roles.includes('admin')).length === 1 &&
                                user.roles.includes('admin') &&
                                user.username === auth.user.username,
                        }"
                        @click="() => setting.action(user)"
                    />
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { User } from '@/interfaces'
import { getAllUsers } from '@/requests/auth'
import { updateConfig } from '@/requests/settings'
import { SettingType } from '@/settings/enums'
import { onMounted, ref } from 'vue'

import useAuth from '@/stores/auth'
import { useToast } from '@/stores/notification'

import DeleteSvg from '@/assets/icons/delete.svg'
import PlusSvg from '@/assets/icons/plus.svg'
import Avatar from '@/components/shared/Avatar.vue'
import Profile from '../Profile.vue'
import ToggleSetting from './ToggleSetting.vue'

const auth = useAuth()
const toast = useToast()

const selectedUser = ref(0)
const users = ref(<User[]>[])
const showAddUser = ref(false)
const storageRootsInput = ref('')
const savingRoots = ref(false)

const settingsMap = {
    enableGuest: ref(false),
    usersOnLogin: ref(false),
} as { [key: string]: { value: boolean } }

const account_settings = [
    {
        title: 'Enable guest access',
        desc: 'Allow users to access the site without an account',
        type: SettingType.binary,
        value: settingsMap.enableGuest,
        action: async () => {
            if (settingsMap.enableGuest.value) {
                const success = await auth.deleteUser('guest')

                if (success) {
                    settingsMap.enableGuest.value = !settingsMap.enableGuest.value
                }
                return
            }

            settingsMap.enableGuest.value = await auth.addGuestUser()
        },
    },
    {
        title: 'Show users on login',
        desc: 'Show a list of users on your server when logging in',
        type: SettingType.binary,
        value: settingsMap.usersOnLogin,
        action: async () => {
            const res = await updateConfig('usersOnLogin', !settingsMap.usersOnLogin.value)

            if (res.status === 200) {
                settingsMap.usersOnLogin.value = !settingsMap.usersOnLogin.value
                return
            }

            if (res.data.msg) {
                return toast.showError(res.data.msg)
            }

            toast.showGenericError()
        },
    },
]

const usettings = [
    {
        title: 'Admin',
        desc: 'Can do anything',
        value: (roles: string[]) => {
            return roles.includes('admin')
        },
        action: async (user: User) => {
            let initialRoles = [...user.roles]
            let roles = [...user.roles]

            if (roles.includes('admin')) {
                roles = roles.filter(r => r !== 'admin')
            } else {
                roles.push('admin')
            }

            const success = await auth.updateProfile({
                id: user.id,
                roles: roles,
            })

            if (success) {
                user.roles = roles
            } else {
                user.roles = initialRoles
            }
        },
    },
]

async function deleteUser(user: User) {
    if (user.username === auth.user.username) {
        return toast.showError('Sorry! You cannot delete yourself')
    }

    const success = await auth.deleteUser(user.username)

    if (success) {
        setTimeout(() => {
            users.value = users.value.filter(u => u.id !== user.id)
        }, 500)
    }
}

function userAdded(user: User) {
    showAddUser.value = false

    setTimeout(() => {
        // insert user after last admin
        const lastAdmin = users.value.findIndex(u => u.roles.includes('admin'))
        users.value.splice(lastAdmin + 1, 0, user)
    }, 250)
}

function selectUser(id: number) {
    if (selectedUser.value === id) {
        selectedUser.value = 0
        return
    }

    selectedUser.value = id
}

function parseStorageRoots(input: string) {
    return input
        .split(/\n|,/g)
        .map(item => item.trim())
        .filter(Boolean)
}

async function loadStorageRoots() {
    try {
        const { data } = await axios.get('/api/downloads/storage/roots')
        const roots = data?.owned_roots || data?.effective_roots || []
        storageRootsInput.value = roots.join('\n')
    } catch {
        storageRootsInput.value = ''
    }
}

async function saveStorageRoots() {
    if (savingRoots.value) {
        return
    }

    savingRoots.value = true
    try {
        const rootDirs = parseStorageRoots(storageRootsInput.value)
        const { data } = await axios.post('/api/downloads/storage/roots', {
            root_dirs: rootDirs,
        })

        if (!data?.success) {
            toast.showError(data?.error || 'Failed to save storage roots')
            return
        }

        const savedRoots = data?.owned_roots || data?.effective_roots || []
        storageRootsInput.value = savedRoots.join('\n')
        toast.show('Storage roots updated')
    } catch (error: any) {
        const message = error?.response?.data?.error || 'Failed to save storage roots'
        toast.showError(message)
    } finally {
        savingRoots.value = false
    }
}

onMounted(async () => {
    const res = await getAllUsers(false)

    if (res.users) {
        // remove guest user from list
        res.users = res.users.filter(u => u.username !== 'guest')
        users.value = res.users
    }

    if (Object.keys(res.settings).length) {
        // loop through settings
        // find keys that match the settingsMap keys
        // and set values

        for (const key in res.settings) {
            if (settingsMap[key]) {
                // @ts-expect-error
                settingsMap[key].value = res.settings[key]
            }
        }
    }

    await loadStorageRoots()
})
</script>

<style lang="scss">
.accountsettings {
    width: 100%;

    /* apply transition to moving elements */
    .list-move,
    .list-leave-active {
        // moving elements
        // eg. when expanding a userinfo card
        transition: all 0.1s ease;
    }

    .list-enter-active {
        // first entrance
        transition: all 0.5s ease;
    }

    .list-enter-from,
    .list-leave-to {
        opacity: 0;
        transform: translateY(15px);
    }

    /* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
    .list-leave-active {
        position: absolute;
    }

    .adduser svg {
        height: 75%;
    }

    .asettings {
        margin: 0 0 1rem 0;
        padding-bottom: 1rem;
        border-bottom: solid 1px $gray5;
    }

    .storagesettings {
        border: solid 1px $gray5;
        padding: 0.9rem;
        margin-bottom: 1rem;

        .h2 {
            padding-left: 0;
            margin-bottom: 0.3rem;
        }

        .subtext {
            margin: 0;
            color: $gray2;
            font-size: 0.9rem;
        }

        .rootdirs {
            margin-top: 0.65rem;
            width: 100%;
            min-height: 4.5rem;
            resize: vertical;
            border: none;
            outline: none;
            background-color: $gray5;
            color: $white;
            padding: 0.65rem 0.75rem;
            font-family: inherit;
        }

        .storage-actions {
            margin-top: 0.65rem;
            display: flex;
            justify-content: flex-end;
        }

        .save {
            padding: 0.45rem 0.8rem;
            border-radius: 0.5rem;
            background-color: $darkblue;
        }
    }

    .ahead {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-right: $smaller;

        > button.adduser {
            padding-right: $medium;
        }
    }

    .h2 {
        padding-left: $smaller;
        font-size: 1.15rem;
        font-weight: bold;
    }

    .usercard {
        width: 100%;
        padding: 1rem;
        padding-bottom: 0;
        margin-top: 1rem;
        border: solid 1px $gray5;
        cursor: pointer;

        &:hover {
            background-color: $gray5;
        }

        .userinfo {
            display: grid;
            grid-template-columns: max-content 1fr max-content;
            align-items: center;
            // gap: 1rem;
            padding-bottom: 1rem;
        }

        .details {
            display: flex;
            justify-content: space-between;
            padding-left: 1rem;
            width: 100%;
        }

        .delete {
            cursor: pointer;
            color: $white;
            margin-left: 1rem;
            transition: all 0.25s ease;

            &:hover {
                color: rgb(248, 115, 115);
            }
        }

        .delete {
            height: 1.5rem;
            color: $gray1;
        }
    }

    .usercard.secondchild {
        margin-top: 1.75rem !important;

        &::before {
            content: '';
            position: absolute;
            top: -1rem;
            left: 45%;
            width: 10%;
            height: 1px;
            background-color: $gray5;
        }
    }

    .usercard.selected {
        padding-bottom: 1rem;

        .usettins {
            border-top: solid 1px $gray4;
        }
    }

    .usettins {
        padding-top: $small;

        .label {
            color: $gray1;
            font-size: 14px;
            margin-top: $small;
        }

        .togglesetting:last-child {
            padding-bottom: 0;
        }
    }
}
</style>

<!--
CHECKPOINT

TRYING TO KEEP THE CURRENT USER CARD AT THE BEGINNING OF THE USERS LIST
ADDING A BORDER BOTTOM TO THE FIRST CARD
-->
