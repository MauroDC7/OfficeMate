import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

import type { BroadcastingConfig } from '@/lib/echo';
import { usePrivateChannel } from '@/lib/use-private-channel';

type PageProps = {
    auth: { user: { id: number } | null };
    broadcasting: BroadcastingConfig | null;
};

/**
 * Ververs meldingen (en huidige pagina-data) zodra Pusher een database-notificatie signaleert.
 */
export function useInAppNotificationRealtime(): void {
    const page = usePage<PageProps>();
    const userId = page.props.auth.user?.id ?? null;
    const broadcasting = page.props.broadcasting;
    const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const refresh = useCallback(() => {
        if (reloadTimerRef.current !== null) {
            clearTimeout(reloadTimerRef.current);
        }

        reloadTimerRef.current = setTimeout(() => {
            reloadTimerRef.current = null;
            router.reload({ preserveState: true, preserveScroll: true });
        }, 200);
    }, []);

    useEffect(() => {
        return () => {
            if (reloadTimerRef.current !== null) {
                clearTimeout(reloadTimerRef.current);
            }
        };
    }, []);

    usePrivateChannel(
        broadcasting,
        userId !== null ? `user.${userId}` : null,
        'notification.changed',
        refresh,
    );

    useEffect(() => {
        if (broadcasting !== null) {
            return;
        }

        const interval = window.setInterval(refresh, 30_000);

        return () => {
            window.clearInterval(interval);
        };
    }, [broadcasting, refresh]);
}
