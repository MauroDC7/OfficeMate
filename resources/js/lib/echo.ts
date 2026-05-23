import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

type EchoBroadcaster = 'reverb' | 'pusher';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo?: Echo<EchoBroadcaster>;
    }
}

let echoInstance: Echo<EchoBroadcaster> | null = null;

function readCsrfToken(): string {
    const tag = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return tag?.content ?? '';
}

function resolveBroadcastDriver(): EchoBroadcaster | null {
    const driver = import.meta.env.VITE_BROADCAST_DRIVER;

    if (driver === 'pusher' || driver === 'reverb') {
        return driver;
    }

    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;

    if (typeof pusherKey === 'string' && pusherKey !== '') {
        return 'pusher';
    }

    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;

    if (typeof reverbKey === 'string' && reverbKey !== '') {
        return 'reverb';
    }

    return null;
}

function createEcho(driver: EchoBroadcaster): Echo<EchoBroadcaster> | null {
    window.Pusher = Pusher;

    const auth = {
        headers: {
            'X-CSRF-TOKEN': readCsrfToken(),
        },
    };

    if (driver === 'pusher') {
        const key = import.meta.env.VITE_PUSHER_APP_KEY;
        const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

        if (typeof key !== 'string' || key === '') {
            return null;
        }

        if (typeof cluster !== 'string' || cluster === '') {
            return null;
        }

        return new Echo({
            broadcaster: 'pusher',
            key,
            cluster,
            forceTLS: true,
            auth,
        });
    }

    const key = import.meta.env.VITE_REVERB_APP_KEY;

    if (typeof key !== 'string' || key === '') {
        return null;
    }

    return new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        auth,
    });
}

/**
 * Returns a singleton Echo client (Pusher for shared hosting, Reverb for local).
 *
 * Returns null when the required VITE_* env vars are missing.
 */
export function getEcho(): Echo<EchoBroadcaster> | null {
    if (echoInstance !== null) {
        return echoInstance;
    }

    const driver = resolveBroadcastDriver();

    if (driver === null) {
        return null;
    }

    echoInstance = createEcho(driver);

    if (echoInstance === null) {
        return null;
    }

    window.Echo = echoInstance;

    return echoInstance;
}
