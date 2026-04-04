<template>
  <div v-auto-animate class="loginmodal">
    <div class="modal-header" :class="{ 'has-back': !!selected && !bootstrapRequired }">
      <button
        v-if="!bootstrapRequired && shownUsers.length > 1 && selected"
        class="back-btn"
        title="Back to selection"
        @click="resetSelected"
      >
        <ArrowSvg />
        <span>Back</span>
      </button>
      <div class="logo-wrap">
        <Logo />
      </div>
      <div class="back-spacer"></div>
    </div>

    <div class="modal-content">
      <!-- Bootstrap/Setup Flow -->
      <template v-if="bootstrapRequired">
        <!-- Owner Account Creation -->
        <template v-if="setupStage === 'owner'">
          <div class="setup-header">
            <div class="setup-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 class="setup-title">Welcome to Swing Music</h2>
            <p class="setup-subtitle">Create your owner account and set up your music library</p>
          </div>

          <form class="setup-form" @submit.prevent="createOwner">
            <!-- Account Section -->
            <div class="form-section">
              <div class="section-label">Account Details</div>
              <div class="input-group">
                <div class="input-wrap">
                  <input
                    id="bootstrap-user"
                    type="text"
                    class="modal-input"
                    placeholder="Username"
                    :value="bootstrapUsername"
                    @input="(e) => (bootstrapUsername = (e.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="input-row">
                  <div class="input-wrap">
                    <input
                      id="bootstrap-pass"
                      type="password"
                      class="modal-input"
                      placeholder="Password"
                      :value="bootstrapPassword"
                      @input="(e) => (bootstrapPassword = (e.target as HTMLInputElement).value)"
                    />
                  </div>
                  <div class="input-wrap">
                    <input
                      id="bootstrap-pass-confirm"
                      type="password"
                      class="modal-input"
                      placeholder="Confirm password"
                      :value="bootstrapPasswordConfirm"
                      @input="(e) => (bootstrapPasswordConfirm = (e.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Music Library Section -->
            <div class="form-section">
              <div class="section-label">Music Library Paths</div>
              <p class="section-help">Add one or more folders where your music is stored</p>
              
              <div class="paths-list">
                <div
                  v-for="(path, index) in parsedRootDirs"
                  :key="index"
                  class="path-item"
                >
                  <div class="path-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    class="path-input"
                    :value="path"
                    @input="(e) => updatePath(index, (e.target as HTMLInputElement).value)"
                  />
                  <button
                    type="button"
                    class="path-remove"
                    @click="removePath(index)"
                    title="Remove path"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                
                <button
                  type="button"
                  class="add-path-btn"
                  @click="addNewPath"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  <span>Add another folder</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="submit-btn primary"
              :disabled="creatingOwner || !isFormValid"
            >
              <span v-if="creatingOwner" class="btn-loading">
                <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                  <path d="M12 2a10 10 0 0110 10"/>
                </svg>
                Creating account...
              </span>
              <span v-else>Create Account & Start Indexing</span>
            </button>
          </form>
        </template>

        <!-- Directory Configuration -->
        <template v-else-if="setupStage === 'directory'">
          <div class="setup-header">
            <div class="setup-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
              </svg>
            </div>
            <h2 class="setup-title">Configure Music Directory</h2>
            <p class="setup-subtitle">Set up your music library folders to start indexing</p>
          </div>

          <form class="setup-form" @submit.prevent="configureDirectory">
            <div class="form-section">
              <div class="section-label">Music Library Paths</div>
              <p class="section-help">Add one or more folders where your music is stored</p>
              
              <div class="paths-list">
                <div
                  v-for="(path, index) in parsedRootDirs"
                  :key="index"
                  class="path-item"
                >
                  <div class="path-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    class="path-input"
                    :value="path"
                    @input="(e) => updatePath(index, (e.target as HTMLInputElement).value)"
                  />
                  <button
                    type="button"
                    class="path-remove"
                    @click="removePath(index)"
                    title="Remove path"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                
                <button
                  type="button"
                  class="add-path-btn"
                  @click="addNewPath"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  <span>Add another folder</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="submit-btn primary"
              :disabled="configuringDirectory || parsedRootDirs.length === 0"
            >
              <span v-if="configuringDirectory" class="btn-loading">
                <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                  <path d="M12 2a10 10 0 0110 10"/>
                </svg>
                Saving...
              </span>
              <span v-else>Save & Start Indexing</span>
            </button>
          </form>
        </template>

        <!-- Indexing Progress -->
        <template v-else>
          <div class="setup-header">
            <div class="setup-icon" :class="setupIndexState">
              <svg v-if="setupIndexState === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <svg v-else-if="setupIndexState === 'failed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
              <svg v-else class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <h2 class="setup-title">
              {{ setupIndexState === 'completed' ? 'Indexing Complete!' : setupIndexState === 'failed' ? 'Indexing Failed' : 'Indexing Music Library' }}
            </h2>
            <p class="setup-subtitle">
              {{ setupIndexState === 'completed' ? 'Your music library is ready to use' : setupIndexState === 'failed' ? 'Something went wrong during indexing' : 'The server is preparing your catalog. This may take a few minutes.' }}
            </p>
          </div>

          <div class="progress-section">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${setupProgress}%` }"></div>
            </div>
            <div class="progress-meta">
              <span class="progress-percent">{{ setupProgress.toFixed(0) }}%</span>
              <span class="progress-state" :class="setupIndexState">{{ setupIndexState }}</span>
            </div>
            <p class="progress-message">{{ setupIndexMessage || 'Waiting for index worker...' }}</p>
            
            <div class="progress-actions">
              <button v-if="setupFailed" class="submit-btn secondary" @click="retryIndexing">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                </svg>
                Retry Indexing
              </button>
              <button v-if="setupCompleted" class="submit-btn primary" @click="continueToLogin">
                Continue to Login
              </button>
            </div>
          </div>
        </template>
      </template>

      <!-- Normal Login Flow -->
      <template v-else>
        <div v-if="!selected" class="login-header">
          <h2 class="login-title">Welcome back</h2>
          <p class="login-subtitle">Select your account to continue</p>
        </div>
        
        <div v-if="selected" class="selected-user">
          <User
            :user="selected.username === '' ? { id: 0, username: username, firstname: '' } : selected"
            :selected="true"
          />
        </div>

        <div v-else v-auto-animate class="user-grid">
          <User v-for="user in shownUsers" :key="user.id" :user="user" @click="setUser(user)" />
        </div>
        
        <form v-if="selected" v-auto-animate class="login-form" @submit.prevent="loginSelectedUser">
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
          <button class="submit-btn primary" :disabled="!password">
            Login
          </button>
        </form>
      </template>
    </div>
    
    <div v-if="guestAllowed && !bootstrapRequired" class="guest-option" @click="() => guestLogin()">
      <span>Continue as guest</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
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

// Parse root dirs into array for better UI management
const parsedRootDirs = computed({
  get: () => {
    if (!bootstrapRootDirsInput.value.trim()) return ['']
    return bootstrapRootDirsInput.value
      .split(/\n|,/g)
      .map(item => item.trim())
      .filter(Boolean)
  },
  set: (paths: string[]) => {
    bootstrapRootDirsInput.value = paths.filter(Boolean).join('\n')
  }
})

// Form validation
const isFormValid = computed(() => {
  return (
    bootstrapUsername.value.trim().length >= 2 &&
    bootstrapPassword.value.length >= 4 &&
    bootstrapPassword.value === bootstrapPasswordConfirm.value &&
    parsedRootDirs.value.some(p => p.trim().length > 0)
  )
})

// Path management methods
function addNewPath() {
  const paths = [...parsedRootDirs.value, '']
  parsedRootDirs.value = paths
}

function removePath(index: number) {
  const paths = parsedRootDirs.value.filter((_, i) => i !== index)
  parsedRootDirs.value = paths.length ? paths : ['']
}

function updatePath(index: number, value: string) {
  const paths = [...parsedRootDirs.value]
  paths[index] = value
  parsedRootDirs.value = paths
}

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
@import "@/assets/scss/_modal.scss";

.loginmodal {
  @include modal-base;
  display: flex;
  flex-direction: column;
  min-height: 28rem;
  max-height: calc(100vh - 4rem);
  width: 100%;
  max-width: 32rem;
  margin: 0 auto;

  // Header
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;

    &.has-back {
      justify-content: space-between;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      svg {
        width: 1rem;
        height: 1rem;
        transform: rotate(180deg);
      }

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
      }
    }

    .logo-wrap {
      display: flex;
      align-items: center;
    }

    .back-spacer {
      width: 5rem;
    }
  }

  // Content
  .modal-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1.5rem 1.25rem;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
  }

  // Setup Header
  .setup-header {
    text-align: center;
    margin-bottom: 1.75rem;

    .setup-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1rem;
      background: linear-gradient(135deg, rgba(0, 110, 255, 0.15), rgba(0, 110, 255, 0.05));
      border: 1px solid rgba(0, 110, 255, 0.25);
      border-radius: 1rem;

      svg {
        width: 2rem;
        height: 2rem;
        color: $highlight-blue;
      }

      &.completed {
        background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05));
        border-color: rgba(74, 222, 128, 0.25);

        svg {
          color: #4ade80;
        }
      }

      &.failed {
        background: linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.05));
        border-color: rgba(248, 113, 113, 0.25);

        svg {
          color: #f87171;
        }
      }
    }

    .setup-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: rgba(255, 255, 255, 0.96);
      letter-spacing: -0.02em;
    }

    .setup-subtitle {
      margin: 0;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.5;
    }
  }

  // Setup Form
  .setup-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 28rem;
    margin: 0 auto;

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .section-label {
        @include modal-section-title;
      }

      .section-help {
        @include modal-help-text;
        margin: 0;
      }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .input-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.625rem;
    }

    .input-wrap {
      display: flex;
    }
  }

  // Modal Input
  .modal-input {
    @include modal-input;
  }

  // Paths List
  .paths-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .path-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.625rem;
    transition: all 0.2s ease;

    &:focus-within {
      border-color: rgba(0, 110, 255, 0.4);
      background: rgba(0, 110, 255, 0.05);
    }

    .path-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.5rem;
      flex-shrink: 0;

      svg {
        width: 1rem;
        height: 1rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .path-input {
      flex: 1;
      min-width: 0;
      padding: 0.5rem 0.75rem;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-family: 'SF Mono', monospace;
      outline: none;

      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }
    }

    .path-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      background: transparent;
      border: none;
      border-radius: 0.375rem;
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;

      svg {
        width: 0.875rem;
        height: 0.875rem;
      }

      &:hover {
        background: rgba(248, 113, 113, 0.15);
        color: #f87171;
      }
    }
  }

  .add-path-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: transparent;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 0.625rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      width: 1rem;
      height: 1rem;
    }

    &:hover {
      border-color: rgba(0, 110, 255, 0.4);
      background: rgba(0, 110, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
    }
  }

  // Submit Button
  .submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &.primary {
      @include modal-button-primary;
    }

    &.secondary {
      @include modal-button-secondary;
    }

    svg {
      width: 1rem;
      height: 1rem;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  .btn-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg.spin {
      animation: spin 1s linear infinite;
    }
  }

  // Progress Section
  .progress-section {
    max-width: 28rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .progress-bar {
    @include modal-progress-bar;
    height: 0.625rem;
  }

  .progress-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .progress-percent {
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
    }

    .progress-state {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);

      &.completed {
        background: rgba(74, 222, 128, 0.15);
        color: #4ade80;
      }

      &.failed {
        background: rgba(248, 113, 113, 0.15);
        color: #f87171;
      }

      &.indexing {
        background: rgba(0, 110, 255, 0.15);
        color: $highlight-blue;
      }
    }
  }

  .progress-message {
    margin: 0;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.55);
    text-align: center;
  }

  .progress-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 0.5rem;

    .submit-btn {
      width: auto;
      min-width: 10rem;
    }
  }

  // Login Flow
  .login-header {
    text-align: center;
    margin-bottom: 1.5rem;

    .login-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: rgba(255, 255, 255, 0.96);
    }

    .login-subtitle {
      margin: 0;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .selected-user {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .user-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    max-width: 16rem;
    margin: 0 auto;
  }

  // Guest Option
  .guest-option {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      width: 1rem;
      height: 1rem;
      transition: transform 0.2s ease;
    }

    &:hover {
      color: rgba(255, 255, 255, 0.75);

      svg {
        transform: translateX(0.25rem);
      }
    }
  }
}

// Spin animation
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Responsive
@include allPhones {
  .loginmodal {
    max-width: 100%;

    .setup-form {
      .input-row {
        grid-template-columns: 1fr;
      }
    }

    .login-form {
      max-width: 100%;
    }
  }
}
</style>
