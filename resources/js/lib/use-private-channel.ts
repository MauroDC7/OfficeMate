import { useEffect, useRef } from 'react';

import { getEcho, type BroadcastingConfig } from '@/lib/echo';

/**
 * Subscribes to a private broadcast channel for the lifetime of the component.
 */
export function usePrivateChannel<TPayload>(
    broadcasting: BroadcastingConfig | null | undefined,
    channel: string | null,
    eventName: string,
    onEvent: (payload: TPayload) => void,
): void {
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        if (channel === null || channel === '') {
            return;
        }

        const echo = getEcho(broadcasting);

        if (echo === null) {
            return;
        }

        const handler = (payload: TPayload): void => {
            onEventRef.current(payload);
        };

        const subscription = echo.private(channel);
        subscription.listen(`.${eventName}`, handler);

        return () => {
            subscription.stopListening(`.${eventName}`, handler);
            echo.leave(`private-${channel}`);
        };
    }, [broadcasting, channel, eventName]);
}
