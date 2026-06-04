import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export type BroadcastingConfig = {
    key: string;
    cluster: string;
};

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo?: Echo<'pusher'>;
    }
}

let echoInstance: Echo<'pusher'> | null = null;
let echoSignature: string | null = null;

function readCsrfToken(): string {
    const tag = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return tag?.content ?? '';
}

function authorizeChannel(
    channelName: string,
    socketId: string,
): Promise<Record<string, unknown>> {
    const body = new URLSearchParams({
        socket_id: socketId,
        channel_name: channelName,
    });

    return fetch('/broadcasting/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'X-CSRF-TOKEN': readCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: body.toString(),
    }).then(async (response) => {
        if (!response.ok) {
            throw new Error(
                `Broadcast auth failed (${response.status}) for ${channelName}`,
            );
        }

        return (await response.json()) as Record<string, unknown>;
    });
}

/**
 * Pusher via server-side config (Inertia shared prop).
 */
export function getEcho(
    config: BroadcastingConfig | null | undefined,
): Echo<'pusher'> | null {
    if (config === null || config === undefined) {
        return null;
    }

    const key = config.key.trim();
    const cluster = config.cluster.trim();

    if (key === '' || cluster === '') {
        return null;
    }

    const signature = `${key}:${cluster}`;

    if (echoInstance !== null && echoSignature === signature) {
        return echoInstance;
    }

    if (echoInstance !== null) {
        echoInstance.disconnect();
        echoInstance = null;
    }

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: 'pusher',
        key,
        cluster,
        forceTLS: true,
        authorizer: (channel) => ({
            authorize: (socketId, callback) => {
                authorizeChannel(channel.name, socketId)
                    .then((data) => callback(null, data))
                    .catch((error: Error) => callback(error, null));
            },
        }),
    });

    echoSignature = signature;
    window.Echo = echoInstance;

    return echoInstance;
}
