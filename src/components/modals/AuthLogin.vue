<template>
  <div v-auto-animate class="loginmodal">
    <div class="head" :class="{ selected: !!selected && !bootstrapRequired }">
      <button
        class="back rounded-sm"
        title="Back to selection"
        :style="{
          visibility: !bootstrapRequired && shownUsers.length > 1 && selected ? 'visible' : 'hidden',
        }"
        @click="resetSelected"
      >
        <span>back</span> <ArrowSvg />
      </button>
      <Logo />
      <button class="back back2 rounded-sm" title="Back to selection"><span>back</span> <ArrowSvg /></button>
    </div>

    <div class="alcontent">
      <template v-if="bootstrapRequired">
        <template v-if="setupStage === 'owner'">
          <div class="helptext">
            <div class="h2">Create Owner Account</div>
            <p>First run detected. Create the owner account and choose your primary music folder.</p>
          </div>

          <form class="passinput bootstrap" @submit.prevent="createOwner">
            <Input
              placeholder="Owner username"
              input-id="bootstrap-user"
              @input="(input: string) => (bootstrapUsername = input)"
            />
            <Input
              type="password"
              placeholder="Owner password"
              input-id="bootstrap-pass"
              @input="(input: string) => (bootstrapPassword = input)"
            />
            <Input
              type="password"
              placeholder="Confirm password"
              input-id="bootstrap-pass-confirm"
              @input="(input: string) => (bootstrapPasswordConfirm = input)"
            />

            <textarea
              class="rootdirs"
              :value="bootstrapRootDirsInput"
              placeholder="Primary library folders (one path per line)"
              rows="3"
              @input="(event: Event) => (bootstrapRootDirsInput = (event.target as HTMLTextAreaElement).value)"
            />

            <button class="submit long" :disabled="creatingOwner">
              {{ creatingOwner ? 'Creating Owner...' : 'Continue to Indexing' }}
            </button>
          </form>
        </template>

        <template v-else-if="setupStage === 'directory'">
          <div class="helptext">
            <div class="h2">Configure Music Directory</div>
            <p>Setup found an owner account, but no primary music folder is configured yet.</p>
          </div>

          <form class="passinput bootstrap" @submit.prevent="configureDirectory">
            <textarea
              class="rootdirs"
              :value="bootstrapRootDirsInput"
              placeholder="Primary library folders (one path per line)"
              rows="3"
              @input="(event: Event) => (bootstrapRootDirsInput = (event.target as HTMLTextAreaElement).value)"
            />

            <button class="submit long" :disabled="configuringDirectory">
              {{ configuringDirectory ? 'Saving...' : 'Save Directory and Start Indexing' }}
            </button>
          </form>
        </template>

        <template v-else>
          <div class="helptext">
            <div class="h2">Indexing Music Library</div>
            <p>The server is preparing your catalog. This may take a few minutes on first boot.</p>
          </div>
          <div class="setup-progress-wrap">
            <div class="setup-progress">
              <div class="setup-progress-fill" :style="{ width: `${setupProgress}%` }"></div>
            </div>
            <div class="setup-meta">
              <span>{{ setupProgress.toFixed(0) }}%</span>
              <span class="state" :class="setupIndexState">{{ setupIndexState }}</span>
            </div>
            <p class="setup-message">{{ setupIndexMessage || 'Waiting for index worker...' }}</p>
            <div class="setup-actions">
              <button v-if="setupFailed" class="submit long" @click="retryIndexing">Retry Index</button>
              <button v-if="setupCompleted" class="submit long" @click="continueToLogin">Continue to Login</button>
            </div>
          </div>
        </template>
      </template>

      <template v-else>
        <div v-if="!selected" class="helptext">
          <div class="h2">Welcome back</div>
        </div>
        <div v-if="selected" class="selected-user">
          <User
            :user="selected.username === '' ? { id: 0, username: username, firstname: '' } : selected"
            :selected="true"
          />
        </div>

        <div v-else v-auto-animate class="userlist">
          <User v-for="user in shownUsers" :key="user.id" :user="user" @click="setUser(user)" />
        </div>
        <form v-if="selected" v-auto-animate class="passinput" @submit.prevent="loginSelectedUser">
          <Input
            v-if="selected.username === ''"
            placeholder="Enter username"
            input-id="loginuserinput"
            @input="(input: string) => (username = input)"
          />
          <Input
            type="password"
            placeholder="Enter password"
            input-id="loginpassinput"
            @input="(input: string) => (password = input)"
          />
          <button class="submit" :class="{ long: selected.username !== '' }">Login</button>
        </form>
      </template>
    </div>
    <div v-if="guestAllowed && !bootstrapRequired" class="guestlink" @click="() => guestLogin()">
      <span>Or continue as guest </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ref, computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { UserSimplified } from '@/interfaces'
import { getAllUsers, getBootstrapStatus } from '@/requests/auth'
import { configureSetupDirectory, getSetupIndexProgress, startSetupIndex } from '@/requests/setup'
import useAuth from '@/stores/auth'

import ArrowSvg from '../../assets/icons/expand.svg'
import Logo from '../Logo.vue'
import Input from '../shared/Input.vue'
import User from '../shared/LoginUserCard.vue'

const auth = useAuth()

const username = ref('')
const password = ref('')

const users: Ref<UserSimplified[]> = ref([])
const shownUsers = computed(() => users.value.filter(user => user.username !== 'guest'))
const selected = ref<UserSimplified | null>(null)

const guestAllowed = computed(() => users.value.some(user => user.username === 'guest'))
const bootstrapRequired = ref(false)
const setupStage = ref<'owner' | 'directory' | 'indexing'>('owner')
const setupProgress = ref(0)
const setupIndexState = ref('idle')
const setupIndexMessage = ref('')
const creatingOwner = ref(false)
const configuringDirectory = ref(false)
const bootstrapUsername = ref('')
const bootstrapPassword = ref('')
const bootstrapPasswordConfirm = ref('')
const bootstrapRootDirsInput = ref('')

let setupPoller: number | null = null

const setupFailed = computed(() => setupIndexState.value === 'failed')
const setupCompleted = computed(() => setupIndexState.value === 'completed')

function stopSetupPolling() {
    if (setupPoller !== null) {
        window.clearInterval(setupPoller)
        setupPoller = null
    }
}

async function loadUsers() {
    const res = await getAllUsers()

    if (res.users.length === 0 || (res.users.length === 1 && res.users[0].username === 'guest')) {
        setUser({ id: 0, username: '', firstname: '' })
    }

    if (res.users.filter(user => user.username !== 'guest').length === 1) {
        setTimeout(() => {
            setUser(res.users[0])
        }, 250)
    }

    users.value = res.users
}

async function setUser(user: UserSimplified) {
    selected.value = user
    username.value = user.username

    await nextTick()
    if (user.username === '') {
        document.getElementById('loginuserinput')?.focus()
    } else {
        document.getElementById('loginpassinput')?.focus()
    }
}

function resetSelected() {
    selected.value = null
}

async function loginSelectedUser() {
    if (!password.value) {
        return
    }

    await auth.login(username.value, password.value)
}

function parseRootDirsInput(input: string) {
    return input
        .split(/\n|,/g)
        .map(item => item.trim())
        .filter(Boolean)
}

async function refreshSetupProgress() {
    const progressRes = await getSetupIndexProgress()
    if (progressRes.status !== 200) {
        return
    }

    setupIndexState.value = progressRes.data?.index_state || 'idle'
    setupProgress.value = Math.max(0, Math.min(100, Number(progressRes.data?.index_progress || 0)))
    setupIndexMessage.value = progressRes.data?.index_message || ''

    if (setupCompleted.value) {
        stopSetupPolling()
        if (bootstrapUsername.value && bootstrapPassword.value) {
            await auth.login(bootstrapUsername.value, bootstrapPassword.value)
            return
        }

        bootstrapRequired.value = false
        await loadUsers()
    }
}

async function startSetupPolling() {
    setupStage.value = 'indexing'
    await refreshSetupProgress()
    if (!setupCompleted.value) {
        stopSetupPolling()
        setupPoller = window.setInterval(() => {
            refreshSetupProgress()
        }, 2000)
    }
}

async function retryIndexing() {
    await startSetupIndex(true)
    await startSetupPolling()
}

async function continueToLogin() {
    bootstrapRequired.value = false
    stopSetupPolling()
    await loadUsers()
}

async function createOwner() {
    if (!bootstrapUsername.value || !bootstrapPassword.value) {
        return
    }

    if (bootstrapPassword.value !== bootstrapPasswordConfirm.value) {
        auth.showError('Passwords do not match')
        return
    }

    const rootDirs = parseRootDirsInput(bootstrapRootDirsInput.value)
    if (rootDirs.length === 0) {
        auth.showError('Please provide at least one primary music directory')
        return
    }

    creatingOwner.value = true
    try {
        const ok = await auth.bootstrapOwner(bootstrapUsername.value, bootstrapPassword.value, rootDirs)
        if (ok) {
            await startSetupPolling()
        }
    } finally {
        creatingOwner.value = false
    }
}

async function configureDirectory() {
    const rootDirs = parseRootDirsInput(bootstrapRootDirsInput.value)
    if (rootDirs.length === 0) {
        auth.showError('Please provide at least one primary music directory')
        return
    }

    configuringDirectory.value = true
    try {
        const res = await configureSetupDirectory(rootDirs)
        if (res.status !== 200) {
            auth.showError(res.data?.error || 'Failed to configure primary directory')
            return
        }

        await startSetupPolling()
    } finally {
        configuringDirectory.value = false
    }
}

async function guestLogin(username: string = 'guest', password: string = 'guest') {
    await auth.login(username, password)
}

onMounted(async () => {
    const bootstrapRes = await getBootstrapStatus()
    bootstrapRequired.value = bootstrapRes.status === 200 && !!bootstrapRes.data?.required

    if (bootstrapRequired.value) {
        if (bootstrapRes.data?.needs_index || (bootstrapRes.data?.owner_created && bootstrapRes.data?.directory_configured)) {
            await startSetupPolling()
        } else if (bootstrapRes.data?.needs_directory || bootstrapRes.data?.owner_created) {
            setupStage.value = 'directory'
        } else {
            setupStage.value = 'owner'
            selected.value = { id: 0, username: '', firstname: '' }
        }
        return
    }

    await loadUsers()
})

onBeforeUnmount(() => {
    stopSetupPolling()
})
</script>

<style lang="scss">
.loginmodal {
    height: 35rem;
    display: grid;
    grid-template-rows: max-content 1fr max-content;

    max-height: calc(100vh - 4rem);

    .alcontent {
        padding-bottom: 2rem;
        overflow: auto;
        overflow-x: hidden;
        scrollbar-gutter: stable;
        -webkit-overflow-scrolling: touch;
    }

    .guestlink {
        padding: 1rem;
        width: fit-content;
        margin: 0 auto;
        color: $gray2;
        display: flex;
        text-decoration: underline;

        & > * {
            cursor: pointer;
        }
    }

    .helptext {
        padding: 0 $small;
        text-align: center;
        margin: 1.5rem 0;
        color: $white;

        .h2 {
            font-size: 2rem;
            font-weight: bold;
            margin-top: 0;
        }
    }

    .head {
        text-align: center;
        border-bottom: solid 1px $gray5;
        padding: 1rem;
        user-select: none;

        display: flex;
        justify-content: space-between;
        align-items: center;

        .back {
            background: none;
            transform: rotate(180deg);
            opacity: 0;

            span {
                transform: rotate(180deg);
            }
        }

        .back2 {
            // NOTE: This element is used to center the Swing Music logo
            visibility: hidden;
        }
    }

    .head.selected .back {
        opacity: 1;
        transition: all 0.25s;
    }

    .swing-logo {
        width: max-content;
        padding: $small 2rem;
        background: none;
        border: none;
        pointer-events: none;

        svg {
            transform: scale(0.85);
        }
    }

    .selected-user {
        display: grid;
        place-items: center;
        margin-top: 2rem;
    }

    .setup-progress-wrap {
        width: min(90%, 30rem);
        margin: 0 auto;
        display: grid;
        gap: 0.6rem;
    }

    .setup-progress {
        width: 100%;
        height: 0.6rem;
        background-color: $gray5;
        border-radius: 999px;
        overflow: hidden;
    }

    .setup-progress-fill {
        height: 100%;
        background-color: $darkblue;
        transition: width 0.25s ease-out;
    }

    .setup-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: $gray2;
    }

    .setup-meta .state {
        text-transform: capitalize;
    }

    .setup-message {
        margin: 0;
        color: $gray1;
        font-size: 0.9rem;
    }

    .userlist {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
        padding: 1rem 0;
    }

    form {
        width: 60%;
        margin: 0 auto;
        margin-top: 1rem;
        display: grid;
        align-items: center;
        gap: 0.5rem;

        input {
            font-size: 1rem;
            width: 100%;
            height: 3rem;
            padding: 1rem;
            border: none;
            outline: none;
            background-color: $gray5;
            color: $white;
            text-align: center;
        }

        textarea.rootdirs {
            font-size: 0.95rem;
            width: 100%;
            padding: 0.75rem 1rem;
            border: none;
            outline: none;
            background-color: $gray5;
            color: $white;
            resize: vertical;
            min-height: 4.75rem;
        }

        .submit {
            width: 7rem;
            border-radius: 4rem;
            margin: 0 auto;
            height: 3rem;
            background-color: $darkblue;
            margin-top: 1rem;
            transition: color 0.2s ease-out;

            &:hover {
                color: #ffffff;
            }
        }

        .submit.long {
            width: 100%;
            border-radius: $small;
        }
    }

    form.bootstrap {
        width: min(90%, 30rem);
    }
}
</style>
