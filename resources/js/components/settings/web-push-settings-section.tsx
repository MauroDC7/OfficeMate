import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

import { useAlert } from '@/components/alert';
import {
    getPushPermission,
    isWebPushSupported,
    pushSubscriptionPayload,
    subscribeToWebPush,
    unsubscribeFromWebPush,
} from '@/lib/web-push';
import {
    destroy as destroyPushSubscription,
    store as storePushSubscription,
} from '@/routes/settings/push-subscription';

type WebPushSettingsSectionProps = {
    publicKey: string;
    subscribed: boolean;
};

export function WebPushSettingsSection({
    publicKey,
    subscribed: initialSubscribed,
}: WebPushSettingsSectionProps) {
    const { success, error } = useAlert();
    const [subscribed, setSubscribed] = useState(initialSubscribed);
    const [busy, setBusy] = useState(false);

    const enable = useCallback(async () => {
        if (!isWebPushSupported()) {
            error('Pushmeldingen worden niet ondersteund in deze browser.');

            return;
        }

        setBusy(true);

        try {
            const permission = await getPushPermission();

            if (permission === 'denied') {
                error(
                    'Meldingen zijn geblokkeerd. Sta ze toe in de browser- of apparaatinstellingen.',
                );

                return;
            }

            const subscription = await subscribeToWebPush(publicKey);

            if (subscription === null) {
                error('Pushmeldingen konden niet worden ingeschakeld.');

                return;
            }

            const payload = pushSubscriptionPayload(subscription);

            if (payload === null) {
                error('Push-abonnement is ongeldig.');

                return;
            }

            router.post(storePushSubscription.url(), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setSubscribed(true);
                    success('Pushmeldingen ingeschakeld op dit apparaat.');
                },
                onError: () => {
                    error('Opslaan van push-abonnement mislukt.');
                },
            });
        } finally {
            setBusy(false);
        }
    }, [error, publicKey, success]);

    const disable = useCallback(async () => {
        setBusy(true);

        try {
            const subscription = await unsubscribeFromWebPush();
            const endpoint = subscription?.endpoint ?? '';

            router.delete(destroyPushSubscription.url(), {
                data: endpoint !== '' ? { endpoint } : {},
                preserveScroll: true,
                onSuccess: () => {
                    setSubscribed(false);
                    success('Pushmeldingen uitgeschakeld op dit apparaat.');
                },
                onError: () => {
                    error('Pushmeldingen uitschakelen mislukt.');
                },
            });
        } finally {
            setBusy(false);
        }
    }, [error, success]);

    return (
        <section
            id="push"
            className="mt-5 w-full min-w-0 scroll-mt-4 rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6 sm:rounded-2xl lg:mt-7"
        >
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                <h2 className="text-base font-semibold text-gray-900">Pushmeldingen</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Ontvang meldingen op dit apparaat bij verlofupdates. Op iPhone: voeg TimeTraq
                    toe aan je beginscherm en schakel meldingen daar in.
                </p>
            </div>
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-gray-700">
                    {subscribed
                        ? 'Pushmeldingen staan aan op dit apparaat.'
                        : 'Pushmeldingen staan uit op dit apparaat.'}
                </p>
                {subscribed ? (
                    <button
                        type="button"
                        onClick={() => void disable()}
                        disabled={busy}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {busy ? 'Bezig…' : 'Uitschakelen'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => void enable()}
                        disabled={busy}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {busy ? 'Bezig…' : 'Inschakelen'}
                    </button>
                )}
            </div>
        </section>
    );
}
