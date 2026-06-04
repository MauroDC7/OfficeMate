function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; index += 1) {
        outputArray[index] = rawData.charCodeAt(index);
    }

    return outputArray;
}

export function isWebPushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

export async function registerWebPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    return navigator.serviceWorker.register('/sw.js');
}

export async function getPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        return 'denied';
    }

    return Notification.permission;
}

export async function subscribeToWebPush(publicKey: string): Promise<PushSubscription | null> {
    if (!isWebPushSupported()) {
        return null;
    }

    const registration = await registerWebPushServiceWorker();

    if (registration === null) {
        return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        return null;
    }

    const existing = await registration.pushManager.getSubscription();

    if (existing !== null) {
        return existing;
    }

    return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
}

export async function unsubscribeFromWebPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription === null) {
        return null;
    }

    await subscription.unsubscribe();

    return subscription;
}

export function pushSubscriptionPayload(
    subscription: PushSubscription,
): { endpoint: string; keys: { p256dh: string; auth: string } } | null {
    const json = subscription.toJSON();

    if (
        typeof json.endpoint !== 'string' ||
        typeof json.keys?.p256dh !== 'string' ||
        typeof json.keys?.auth !== 'string'
    ) {
        return null;
    }

    return {
        endpoint: json.endpoint,
        keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
        },
    };
}
