import { FetchProps } from '@/interfaces'
import axios from 'axios'
import useModal from '@/stores/modal'

import useLoaderStore from '@/stores/loader'
import { logoutUser } from './auth'
import { getBaseUrl } from '@/config'

const isDesktopTauri = Boolean((window as any).__TAURI__)

if (window.location.protocol === 'https:') {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = 'upgrade-insecure-requests';
    document.head.appendChild(meta);
}

// Configure axios defaults
const baseURL = getBaseUrl()
if (baseURL) {
    axios.defaults.baseURL = baseURL
}

export default async (args: FetchProps, withCredentials: boolean = true) => {
    const on_ngrok = args.url.includes('ngrok')
    const ngrok_config = {
        'ngrok-skip-browser-warning': 'stupid-SOAB!',
    }

    const { startLoading, stopLoading } = useLoaderStore()
    startLoading()

    try {
        const res = await axios({
            url: args.url,
            data: args.props,
            // INFO: Most requests use POST
            method: args.method || 'POST',
            // INFO: Add ngrok header and provided headers
            headers: { ...args.headers, ...(on_ngrok ? ngrok_config : {}) },
            withCredentials: isDesktopTauri ? false : withCredentials,
        })

        stopLoading()
        return {
            data: res.data,
            status: res.status,
        }
    } catch (error: any) {
        stopLoading()

        // was unauthorized
        if (error.response?.status === 401) {
            if (isDesktopTauri) {
                window.dispatchEvent(new CustomEvent('desktop-auth-required'))
            } else {
                useModal().showLoginModal()
            }
        }

        if (error.response?.status === 423 && error.response?.data?.error === 'setup_incomplete') {
            useModal().showLoginModal()
        }

        // server config folder nuked which can
        // can cause a signature mismatch error
        // console.log(error.response.data.msg == "Signature verification failed")
        let isSignatureError = false

        try {
            isSignatureError = error.response.data.msg == 'Signature verification failed'
        } catch (error) {
            console.error('Error:', error)
        }

        if (error.response?.status === 422 && isSignatureError) {
            await logoutUser()
            useModal().showLoginModal()
        }

        return {
            error: error.message,
            data: error.response?.data,
            status: error.response?.status,
        }
    }
}
