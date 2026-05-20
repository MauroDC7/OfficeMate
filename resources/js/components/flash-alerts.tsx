import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

import { useAlert } from '@/components/alert';

type ProposalsStatus = 'ready' | 'unconfigured' | 'no_activity' | 'error';

type FlashProps = {
    flash?: {
        authError?: string | null;
        status?: string | null;
        proposalsStatus?: ProposalsStatus | null;
        proposalsMessage?: string | null;
    };
};

export function FlashAlerts() {
    const { flash } = usePage<FlashProps>().props;
    const { error, success, info, warning } = useAlert();
    const shown = useRef<string | null>(null);

    useEffect(() => {
        const key = JSON.stringify(flash ?? {});

        if (key === '{}' || key === shown.current) {
            return;
        }

        shown.current = key;

        if (flash?.authError) {
            error(flash.authError);
        }

        if (flash?.status) {
            success(flash.status);
        }

        if (flash?.proposalsStatus) {
            const message =
                flash.proposalsMessage ?? 'Er ging iets mis bij het genereren.';

            const variants: Record<
                ProposalsStatus,
                typeof success | typeof warning | typeof info | typeof error
            > = {
                ready: success,
                unconfigured: warning,
                no_activity: info,
                error,
            };

            variants[flash.proposalsStatus](message);
        }
    }, [flash, error, success, info, warning]);

    return null;
}
