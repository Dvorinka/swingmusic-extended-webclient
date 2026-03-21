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
import { onMounted, Ref, ref } from "vue";
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
import { getLoggedInUser } from "./requests/auth";
import { getSetupStatus } from "./requests/setup";
// import BubbleManager from "./components/bubbles/BinManager.vue";

const appcontent: Ref<HTMLLegendElement | null> = ref(null);
const isDesktopTauri = ref(false);
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

onMounted(async () => {
    isDesktopTauri.value = Boolean((window as any).__TAURI__);

    const { width, height } = getContentSize();
    updateContentElemSize({ width, height });

    const res = await getLoggedInUser();

    if (res.status == 200) {
        auth.setUser(res.data);
    } else {
        return;
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

#app-grid.desktop_tauri {
    height: calc(100% - 2rem);
}

.designatedOS .r-sidebar {
    &::-webkit-scrollbar {
        display: none;
    }
}
</style>
