import { useEffect } from 'react';

import { getEcho } from '@/lib/echo';

/**
 * Subscribes to a private Reverb channel for the lifetime of the component
 * and invokes `onEvent` with payloads for the given event name.
 *
 * - No-ops when Echo is not configured (e.g. missing VITE_REVERB_* vars).
 * - Skips when `channel` is null (e.g. unauthenticated user).
 */
export function usePrivateChannel<TPayload>(
    channel: string | null,
    eventName: string,
    onEvent: (payload: TPayload) => void,
): void {
    useEffect(() => {
        if (channel === null || channel === '') {
            return;
        }

        const echo = getEcho();

        if (echo === null) {
            return;
        }

        const subscription = echo.private(channel);
        subscription.listen(`.${eventName}`, onEvent);

        return () => {
            subscription.stopListening(`.${eventName}`, onEvent);
            echo.leave(`private-${channel}`);
        };
    }, [channel, eventName, onEvent]);
}
