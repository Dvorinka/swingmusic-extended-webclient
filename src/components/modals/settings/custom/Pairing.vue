<template>
    <div class="pairing">
        <div class="qr_shell">
            <div
                v-if="qrLoaded"
                ref="qrcode"
                class="qrcode"
            ></div>
            <div
                v-if="!qrLoaded"
                class="loader"
            >
                <div class="spinner"></div>
            </div>
        </div>
        <p class="desc">
            Scan the QR code from the Swing Music app to pair with this server.
        </p>

        <div v-if="pairCode" class="manual">
            <div class="manual_head">
                <span>Pair code</span>
                <button class="copy_btn" @click="copyCode">
                    {{ copied ? 'Copied' : 'Copy' }}
                </button>
            </div>
            <div class="code rounded">{{ pairCode }}</div>
            <div v-if="expiresInLabel" class="expires">Expires in {{ expiresInLabel }}</div>
        </div>

        <button class="refresh rounded" :disabled="loading" @click="loadPairCode">
            {{ loading ? 'Generating...' : 'Refresh Pair Code' }}
        </button>

        <div class="serverurl rounded">{{ serverUrl }}</div>
        <p v-if="error" class="error">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { Ref, computed, onBeforeUnmount, onMounted, ref } from 'vue'
import QRCodeStyling from 'qr-code-styling'
import { sendPairRequest } from '@/requests/auth'

const qrLoaded = ref(false)
const loading = ref(false)
const copied = ref(false)
const error = ref('')
const pairCode = ref('')
const expiresAt = ref<number | null>(null)
const countdown = ref(0)
// @ts-expect-error
const qrcode: Ref<HTMLElement> = ref(null)
const serverUrl = ref(window.location.origin)
let ticker: ReturnType<typeof setInterval> | null = null

const expiresInLabel = computed(() => {
    const left = countdown.value
    if (!left || left <= 0) return ''
    const minutes = Math.floor(left / 60)
    const seconds = left % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

async function renderQrCode(payload: string) {
    if (!qrcode.value) return
    qrcode.value.innerHTML = ''

    const qrCode = new QRCodeStyling({
        width: 300,
        height: 300,
        type: 'svg',
        data: payload,
        image: '/logo-fill.light.svg',
        dotsOptions: {
            color: '#fff',
            type: 'extra-rounded',
        },
        backgroundOptions: {
            color: 'transparent',
        },
        imageOptions: {
            crossOrigin: 'anonymous',
            margin: 20,
        },
        margin: 20,
    })
    const svgBlob = await qrCode.getRawData('svg')
    if (!svgBlob) return
    const img = document.createElement('img')
    img.src = URL.createObjectURL(svgBlob)
    qrcode.value.appendChild(img)
}

function stopTicker() {
    if (!ticker) return
    clearInterval(ticker)
    ticker = null
}

function startTicker() {
    stopTicker()
    const update = () => {
        if (!expiresAt.value) {
            countdown.value = 0
            return
        }
        const remaining = Math.max(0, expiresAt.value - Math.floor(Date.now() / 1000))
        countdown.value = remaining
    }
    update()
    ticker = setInterval(update, 1000)
}

async function loadPairCode() {
    loading.value = true
    qrLoaded.value = false
    error.value = ''
    copied.value = false
    stopTicker()

    try {
        const res = await sendPairRequest()
        if (res.status !== 200) {
            error.value = 'Error fetching pairing code. Error code: ' + res.status
            return
        }

        const code = (res.data?.code || '').toString().trim().toUpperCase()
        if (!code) {
            error.value = 'Pairing code response was invalid.'
            return
        }

        const server = (res.data?.server_url || window.location.origin).toString().trim()
        pairCode.value = code
        serverUrl.value = server || window.location.origin

        const expires = Number(res.data?.expires_at || 0)
        expiresAt.value = expires > 0 ? expires : null
        startTicker()

        const payload =
            (res.data?.qr_payload || '').toString().trim() ||
            `${serverUrl.value} ${pairCode.value}`
        await renderQrCode(payload)
        qrLoaded.value = true
    } catch (e) {
        error.value = 'Could not reach server while generating pair code.'
    } finally {
        loading.value = false
    }
}

async function copyCode() {
    if (!pairCode.value) return
    try {
        await navigator.clipboard.writeText(pairCode.value)
        copied.value = true
        setTimeout(() => {
            copied.value = false
        }, 1600)
    } catch {
        copied.value = false
    }
}

onMounted(loadPairCode)
onBeforeUnmount(stopTicker)
</script>

<style lang="scss">
.pairing {
    text-align: center;

    .qr_shell {
        display: grid;
        place-items: center;
    }

    .qrcode,
    .loader {
        height: 300px;
    }

    .loader {
        display: grid;
        place-items: center;
    }

    .spinner {
        border-color: transparent;
        border-top-color: $gray1;
        margin: 0 auto;
    }

    .manual {
        margin: 0 auto $small;
        max-width: 300px;
    }

    .manual_head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: $gray2;
        font-size: 12px;
        margin-bottom: 6px;
    }

    .copy_btn {
        border: none;
        background: transparent;
        color: $orange;
        cursor: pointer;
        font-family: inherit;
        font-size: 12px;
    }

    .code {
        font-family: 'SF Mono';
        letter-spacing: 0.24em;
        font-size: 20px;
        color: $white;
        background: rgba($gray5, 0.9);
        padding: $small;
    }

    .expires {
        margin-top: 6px;
        color: $gray2;
        font-size: 12px;
    }

    .refresh {
        border: none;
        background: rgba($gray5, 0.9);
        color: $white;
        font-size: 12px;
        cursor: pointer;
        padding: $smaller $small;
    }

    .refresh[disabled] {
        cursor: default;
        opacity: 0.6;
    }

    .serverurl {
        width: fit-content;
        margin: 0 auto;
        padding: $smaller;
        font-size: 12px;
        font-family: 'SF Mono';
        color: $orange;
    }

    .error {
        color: $red;
        font-size: 12px;
        margin-top: $smaller;
    }
}
</style>
