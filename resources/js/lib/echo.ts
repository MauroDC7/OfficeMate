import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo?: Echo<'reverb'>;
    }
}

let echoInstance: Echo<'reverb'> | null = null;

function readCsrfToken(): string {
    const tag = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return tag?.content ?? '';
}

/**
 * Returns a singleton Echo client configured for Laravel Reverb.
 *
 * Returns null when the required VITE_REVERB_* env vars are missing
 * (e.g. local dev without Reverb), so callers can no-op gracefully.
 */
export function getEcho(): Echo<'reverb'> | null {
    if (echoInstance !== null) {
        return echoInstance;
    }

    const key = import.meta.env.VITE_REVERB_APP_KEY;

    if (typeof key !== 'string' || key === '') {
        return null;
    }

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        auth: {
            headers: {
                'X-CSRF-TOKEN': readCsrfToken(),
            },
        },
    });

    window.Echo = echoInstance;

    return echoInstance;
}
