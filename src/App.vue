<template>
    <header
        v-if="isDesktopTauri"
        class="desktop-title-bar"
        @dblclick="toggleMaximizeWindow"
    >
        <div class="desktop-title-bar__brand">
            <img
                src="/logo-fill.light.svg"
                alt="SwingMusic"
                class="desktop-title-bar__logo"
            />
            <span class="desktop-title-bar__title">SwingMusic</span>
        </div>
        <div class="desktop-title-bar__controls">
            <button
                class="desktop-title-bar__btn"
                aria-label="Minimize"
                @click="minimizeWindow"
            >
                −
            </button>
            <button
                class="desktop-title-bar__btn"
                aria-label="Maximize"
                @click="toggleMaximizeWindow"
            >
                □
            </button>
            <button
                class="desktop-title-bar__btn desktop-title-bar__btn--close"
                aria-label="Close"
                @click="closeWindow"
            >
                ×
            </button>
        </div>
    </header>
    <div v-if="showDesktopConnectionGate" class="desktop-connection-gate">
        <div class="desktop-connection-gate__card rounded">
            <h2>Connect Desktop App</h2>
            <p>
                Connect to a running SwingMusic web server before continuing.
            </p>
            <label>
                Server URL
                <input
                    v-model="desktopServerUrl"
                    class="desktop-connection-gate__input rounded"
                    type="url"
                    placeholder="http://localhost:1970"
                    autocomplete="off"
                />
            </label>
            <div class="desktop-connection-gate__modes">
                <button
                    class="desktop-connection-gate__mode rounded"
                    :class="{ active: desktopAuthMode === 'pair' }"
                    @click="desktopAuthMode = 'pair'"
                >
                    Pair Code
                </button>
                <button
                    class="desktop-connection-gate__mode rounded"
                    :class="{ active: desktopAuthMode === 'manual' }"
                    @click="desktopAuthMode = 'manual'"
                >
                    Username & Password
                </button>
            </div>
            <template v-if="desktopAuthMode === 'pair'">
                <label>
                    Pair Code
                    <input
                        v-model="desktopPairCode"
                        class="desktop-connection-gate__input rounded"
                        type="text"
                        placeholder="ABC123"
                        autocomplete="off"
                    />
                </label>
            </template>
            <template v-else>
                <label>
                    Username
                    <input
                        v-model="desktopUsername"
                        class="desktop-connection-gate__input rounded"
                        type="text"
                        autocomplete="username"
                    />
                </label>
                <label>
                    Password
                    <input
                        v-model="desktopPassword"
                        class="desktop-connection-gate__input rounded"
                        type="password"
                        autocomplete="current-password"
                    />
                </label>
            </template>
            <button
                class="desktop-connection-gate__submit rounded"
                :disabled="desktopConnecting || !canConnectDesktop"
                @click="connectDesktopSession"
            >
                {{ desktopConnecting ? 'Connecting...' : 'Connect' }}
            </button>
            <p v-if="desktopConnectionError" class="desktop-connection-gate__error">
                {{ desktopConnectionError }}
            </p>
        </div>
    </div>
    <ContextMenu />
    <Modal />
    <Notification />
    <div id="drag-img" class="ellip2" style=""></div>
    <section
        id="app-grid"
        :class="{
            useSidebar: settings.use_sidebar && xl,
            NoSideBorders: settings.is_alt_layout || !xxl,
            extendWidth: settings.extend_width && settings.can_extend_width,
            is_alt_layout: settings.is_alt_layout,
            desktop_tauri: isDesktopTauri,
        }"
        :style="{
            maxWidth: `${settings.is_default_layout ? (content_height > 1080 ? '2220px' : '1760px') : ''}`,
        }"
    >
        <LeftSidebar v-if="settings.is_default_layout && !isMobile" />
        <NavBar />
        <div id="acontent" v-element-size="updateContentElemSize">
            <div id="contentresizer" ref="appcontent"></div>
            <BalancerProvider>
                <RouterView />
            </BalancerProvider>
        </div>
        <RightSideBar v-if="settings.use_sidebar && xl" />
        <BottomBar />
        <!-- <BubbleManager /> -->
    </section>
</template>

<script setup lang="ts">
// @libraries
import { vElementSize } from "@vueuse/components";
import { onStartTyping } from "@vueuse/core";
import { computed, onMounted, onUnmounted, Ref, ref } from "vue";
import { useRouter } from "vue-router";
import { BalancerProvider } from "vue-wrap-balancer";

// @stores
import useAuth from "@/stores/auth";
import { content_height, content_width, isMobile, resizer_width, updateCardWidth } from "@/stores/content-width";
import useLyrics from "@/stores/lyrics";
import useModal from "@/stores/modal";
import useQueue from "@/stores/queue";
import useSettings from "@/stores/settings";
import useTracker from "@/stores/tracker";

// @utils
import handleShortcuts from "@/helpers/useKeyboard";
import { xl, xxl } from "./composables/useBreakpoints";

// @small-components
import ContextMenu from "@/components/ContextMenu.vue";
import Modal from "@/components/modal.vue";
import Notification from "@/components/Notification.vue";

// @app-grid-components
import BottomBar from "@/components/BottomBar/BottomBar.vue";
import LeftSidebar from "@/components/LeftSidebar/index.vue";
import NavBar from "@/components/nav/NavBar.vue";
import RightSideBar from "@/components/RightSideBar/Main.vue";

import { getAllSettings } from "@/requests/settings";
import { getRootDirs } from "@/requests/settings/rootdirs";
import { setApiAuthToken, setBaseUrl } from "@/config";
import { getLoggedInUser } from "./requests/auth";
import { getSetupStatus } from "./requests/setup";
// import BubbleManager from "./components/bubbles/BinManager.vue";

const appcontent: Ref<HTMLLegendElement | null> = ref(null);
const isDesktopTauri = ref(false);
const desktopAuthenticated = ref(false);
const desktopConnecting = ref(false);
const desktopConnectionError = ref("");
const desktopServerUrl = ref("http://localhost:1970");
const desktopAuthMode = ref<"pair" | "manual">("pair");
const desktopPairCode = ref("");
const desktopUsername = ref("");
const desktopPassword = ref("");

const showDesktopConnectionGate = computed(
    () => isDesktopTauri.value && !desktopAuthenticated.value,
);

const canConnectDesktop = computed(() => {
    if (!desktopServerUrl.value.trim()) return false;
    if (desktopAuthMode.value === "pair") {
        return desktopPairCode.value.trim().length > 0;
    }
    return (
        desktopUsername.value.trim().length > 0 &&
        desktopPassword.value.length > 0
    );
});

interface DesktopConnectionResponse {
    connected: boolean;
    baseUrl: string;
    accessToken: string;
    refreshToken?: string | null;
    username: string;
}
const auth = useAuth();
const queue = useQueue();
const modal = useModal();
const lyrics = useLyrics();
const router = useRouter();
const settings = useSettings();
useTracker();

handleShortcuts(useQueue, useModal);

router.afterEach(() => {
    (document.getElementById("acontent") as HTMLElement).scrollTo(0, 0);
});

onStartTyping(() => {
    const elem = document.getElementById("globalsearch") as HTMLInputElement;
    elem.focus();
    elem.value = "";
});

function getContentSize() {
    const elem = document.getElementById("acontent") as HTMLElement;
    return {
        width: elem.offsetWidth,
        height: elem.offsetHeight,
    };
}

function updateContentElemSize({ width, height }: { width: number; height: number }) {
    // 1572 is the maxwidth of the #acontent. see app-grid.scss > $maxwidth
    const elem_width = appcontent.value?.offsetWidth || 0;

    content_width.value = elem_width;
    content_height.value = height;

    resizer_width.value = elem_width;
    updateCardWidth();
}

function handleRootDirsPrompt() {
    getRootDirs().then(dirs => {
        if (dirs.length === 0) {
            modal.showRootDirsPromptModal();
        } else {
            settings.setRootDirs(dirs);
        }
    });
}

async function initializeAuthenticatedApp() {
    const res = await getLoggedInUser();

    if (res.status == 200) {
        auth.setUser(res.data);
    } else {
        throw new Error("Authentication failed");
    }

    const setupRes = await getSetupStatus();
    if (setupRes.status === 200 && setupRes.data?.required) {
        modal.showLoginModal();
        return;
    }

    settings.initializeVolume();
    handleRootDirsPrompt();

    getAllSettings()
        .then(({ settings: data }) => {
            settings.mapDbSettings(data);
        })
        .then(() => {
            if (queue.currenttrack && !settings.use_lyrics_plugin) {
                lyrics.checkExists(queue.currenttrack.filepath, queue.currenttrack.trackhash);
            }
        });
}

async function connectDesktopSession() {
    if (!canConnectDesktop.value) return;

    desktopConnecting.value = true;
    desktopConnectionError.value = "";

    try {
        const { invoke } = await import("@tauri-apps/api/tauri");
        const response = await invoke<DesktopConnectionResponse>("connect_to_web_app", {
            request: {
                url: desktopServerUrl.value.trim(),
                pairingCode:
                    desktopAuthMode.value === "pair"
                        ? desktopPairCode.value.trim().toUpperCase()
                        : "",
                username:
                    desktopAuthMode.value === "manual"
                        ? desktopUsername.value.trim()
                        : null,
                password:
                    desktopAuthMode.value === "manual"
                        ? desktopPassword.value
                        : null,
            },
        });

        if (!response.connected || !response.baseUrl || !response.accessToken) {
            throw new Error("Connection response was invalid");
        }

        setBaseUrl(response.baseUrl);
        setApiAuthToken(response.accessToken);
        localStorage.setItem("desktop.webapp.url", response.baseUrl);

        desktopAuthenticated.value = true;
        desktopConnectionError.value = "";

        await initializeAuthenticatedApp();
    } catch (error) {
        desktopAuthenticated.value = false;
        desktopConnectionError.value = String(error);
    } finally {
        desktopConnecting.value = false;
    }
}

function handleDesktopAuthRequired() {
    if (!isDesktopTauri.value) return;
    desktopAuthenticated.value = false;
    setApiAuthToken();
    desktopConnectionError.value =
        "Session expired or unauthorized. Reconnect to continue.";
}

onMounted(async () => {
    isDesktopTauri.value = Boolean((window as any).__TAURI__);
    window.addEventListener("desktop-auth-required", handleDesktopAuthRequired);

    if (isDesktopTauri.value) {
        const lastUrl = localStorage.getItem("desktop.webapp.url");
        if (lastUrl) {
            desktopServerUrl.value = lastUrl;
        }
    }

    const { width, height } = getContentSize();
    updateContentElemSize({ width, height });

    if (isDesktopTauri.value) {
        return;
    }

    await initializeAuthenticatedApp();
});

onUnmounted(() => {
    window.removeEventListener("desktop-auth-required", handleDesktopAuthRequired);
});

async function minimizeWindow() {
    if (!isDesktopTauri.value) return;
    try {
        const { appWindow } = await import("@tauri-apps/api/window");
        await appWindow.minimize();
    } catch {
        // no-op: keep web shell responsive even if Tauri APIs are unavailable
    }
}

async function toggleMaximizeWindow() {
    if (!isDesktopTauri.value) return;
    try {
        const { appWindow } = await import("@tauri-apps/api/window");
        await appWindow.toggleMaximize();
    } catch {
        // no-op: keep web shell responsive even if Tauri APIs are unavailable
    }
}

async function closeWindow() {
    if (!isDesktopTauri.value) return;
    try {
        const { appWindow } = await import("@tauri-apps/api/window");
        await appWindow.close();
    } catch {
        // no-op: keep web shell responsive even if Tauri APIs are unavailable
    }
}
</script>

<script lang="ts">
// Detect OS & browser agents and add class
import { defineComponent } from "vue";
import usePlayer from "./composables/usePlayer";
export default defineComponent({
    name: "OsAndBrowserSpecificContent",
    mounted() {
        this.applyClassBasedOnAgent();
    },
    methods: {
        applyClassBasedOnAgent() {
            const userAgent = navigator.userAgent;
            const isWindows = /Win/.test(userAgent);
            const isLinux = /Linux/.test(userAgent) && !/Android/.test(userAgent);
            const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
            if ((isWindows || isLinux) && isChrome) {
                document.documentElement.classList.add("designatedOS");
            } else {
                document.documentElement.classList.add("otherOS");
            }
        },
    },
});
</script>

<style lang="scss">
@import "./assets/scss/mixins.scss";

.desktop-title-bar {
    position: sticky;
    top: 0;
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 2rem;
    padding: 0 0.35rem 0 0.6rem;
    background: $body;
    border-bottom: 1px solid $gray5;
    user-select: none;
    -webkit-app-region: drag;
}

.desktop-title-bar__brand {
    display: flex;
    align-items: center;
    gap: 0.45rem;
}

.desktop-title-bar__logo {
    width: 0.85rem;
    height: 0.85rem;
}

.desktop-title-bar__title {
    color: $gray1;
    font-size: 0.73rem;
    font-weight: 600;
}

.desktop-title-bar__controls {
    display: flex;
    gap: 0.2rem;
    -webkit-app-region: no-drag;
}

.desktop-title-bar__btn {
    width: 1.55rem;
    height: 1.4rem;
    border: none;
    border-radius: 0.35rem;
    background: transparent;
    color: $gray1;
    font-size: 0.92rem;
    line-height: 1;
    cursor: pointer;

    &:hover {
        background: $gray5;
        color: $white;
    }
}

.desktop-title-bar__btn--close:hover {
    background: $red;
    color: $white;
}

.desktop-connection-gate {
    position: fixed;
    inset: 2rem 0 0 0;
    z-index: 9500;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(10px);
}

.desktop-connection-gate__card {
    width: min(420px, 100%);
    padding: 1.1rem;
    background: $gray5;
    border: 1px solid $gray4;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    color: $white;

    h2 {
        margin: 0;
        font-size: 1.1rem;
    }

    p {
        margin: 0;
        font-size: 0.88rem;
        color: $gray1;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.34rem;
        font-size: 0.79rem;
        color: $gray1;
    }
}

.desktop-connection-gate__input {
    border: 1px solid $gray3;
    background: $gray4;
    color: $white;
    padding: 0.55rem 0.62rem;
    font-family: inherit;
    font-size: 0.86rem;
}

.desktop-connection-gate__modes {
    display: flex;
    gap: 0.5rem;
}

.desktop-connection-gate__mode {
    border: 1px solid $gray3;
    background: transparent;
    color: $gray1;
    padding: 0.5rem 0.7rem;
    cursor: pointer;
    font-size: 0.8rem;

    &.active {
        border-color: $orange;
        color: $white;
        background: rgba($orange, 0.15);
    }
}

.desktop-connection-gate__submit {
    margin-top: 0.25rem;
    border: none;
    background: $orange;
    color: $body;
    font-weight: 700;
    padding: 0.62rem;
    cursor: pointer;

    &:disabled {
        opacity: 0.55;
        cursor: default;
    }
}

.desktop-connection-gate__error {
    color: $red !important;
    font-size: 0.79rem !important;
}

#app-grid.desktop_tauri {
    height: calc(100% - 2rem);
}

.designatedOS .r-sidebar {
    &::-webkit-scrollbar {
        display: none;
    }
}
</style>
