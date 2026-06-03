import { Form, Link } from '@inertiajs/react';
import { useState } from 'react';

import { useAlert } from '@/components/alert';
import { SettingsSwitch } from '@/components/settings/settings-switch';
import { about, privacy, timesheets } from '@/routes';
import TrackerSettingsController from '@/actions/App/Http/Controllers/Settings/TrackerSettingsController';

export type TrackerSettingsPayload = {
    is_connected: boolean;
    is_active: boolean;
    last_activity_at: string | null;
    last_activity_label: string | null;
    use_ai_for_proposals: boolean;
    tracking_enabled: boolean;
    blocklist: string[];
    download_url: string | null;
    is_admin: boolean;
};

type TrackerSettingsSectionProps = {
    tracker: TrackerSettingsPayload;
};

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

const primaryButtonClass =
    'rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButtonClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60';

function IconDesktop({ className }: { className?: string }) {
    return (
        <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-9.149V11a2.25 2.25 0 01-2.25 2.25h-13.5A2.25 2.25 0 013 11V8.101m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v2.101m18 0V6.375c0 .621-.504 1.125-1.125 1.125H4.125C3.504 7.5 3 7.004 3 6.375V6.101"
            />
        </svg>
    );
}

function trackerConnectionStatusLabel(tracker: TrackerSettingsPayload): string {
    if (!tracker.tracking_enabled) {
        return 'Tracking uit';
    }

    if (tracker.is_active) {
        return 'Actief';
    }

    if (tracker.is_connected) {
        return 'Gekoppeld';
    }

    return 'Niet gekoppeld';
}

export function TrackerSettingsSection({ tracker }: TrackerSettingsSectionProps) {
    const { success } = useAlert();
    const [useAi, setUseAi] = useState(tracker.use_ai_for_proposals);
    const [trackingEnabled, setTrackingEnabled] = useState(tracker.tracking_enabled);
    const [blocklist, setBlocklist] = useState<string[]>(tracker.blocklist);
    const [newBlockEntry, setNewBlockEntry] = useState('');

    const addBlockEntry = (): void => {
        const trimmed = newBlockEntry.trim();

        if (trimmed === '' || blocklist.includes(trimmed)) {
            return;
        }

        setBlocklist((current) => [...current, trimmed]);
        setNewBlockEntry('');
    };

    const removeBlockEntry = (entry: string): void => {
        setBlocklist((current) => current.filter((item) => item !== entry));
    };

    return (
        <section
            id="tracker"
            className="mt-5 w-full min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6 sm:rounded-2xl lg:mt-7"
            aria-labelledby="tracker-settings-title"
        >
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-start gap-2.5">
                    <IconDesktop className="mt-0.5 shrink-0 text-gray-700" />
                    <div>
                        <h2 id="tracker-settings-title" className="text-base font-semibold text-gray-900">
                            TimeTraq Tracker
                        </h2>
                        <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
                            Desktop-app voor timesheet-voorstellen. Stel hier je voorkeuren in.
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-sm text-gray-600">
                    {!trackingEnabled ? (
                        'Tracking staat uit in je voorkeuren. De desktop-app verstuurt geen nieuwe activiteit naar TimeTraq.'
                    ) : tracker.is_active ? (
                        <>
                            De tracker stuurt nu activiteit door.
                            {tracker.last_activity_label !== null
                                ? ` Laatste sync: ${tracker.last_activity_label}.`
                                : null}
                        </>
                    ) : tracker.is_connected ? (
                        <>
                            Ingelogd, maar geen recente activiteit. Laat de app op je computer draaien.
                            {tracker.last_activity_label !== null
                                ? ` Laatst gezien: ${tracker.last_activity_label}.`
                                : null}
                        </>
                    ) : (
                        'Nog niet gekoppeld. Installeer de app en log in met dit account.'
                    )}
                </p>

                <Form
                    {...TrackerSettingsController.form.patch()}
                    options={{ preserveScroll: true }}
                    onSuccess={() => success('Tracker-instellingen opgeslagen.')}
                    className="mt-6 space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="tracker_use_ai_for_proposals" value={useAi ? '1' : '0'} />
                            <input type="hidden" name="tracker_tracking_enabled" value={trackingEnabled ? '1' : '0'} />

                            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                                <SettingsSwitch
                                    id="tracker-tracking-enabled"
                                    checked={trackingEnabled}
                                    onChange={setTrackingEnabled}
                                    label="Tracker mag activiteit ontvangen"
                                    description="Uit = niets nieuws wordt opgeslagen. De desktop-app kan nog draaien, maar TimeTraq negeert nieuwe syncs."
                                />
                                {errors.tracker_tracking_enabled !== undefined ? (
                                    <p className="text-sm text-red-600">{errors.tracker_tracking_enabled}</p>
                                ) : null}

                                <SettingsSwitch
                                    id="tracker-use-ai"
                                    checked={useAi}
                                    onChange={setUseAi}
                                    label="Timesheet-voorstellen met AI"
                                    description="Uit = je kunt nog steeds op Genereer klikken; je krijgt dan ruwe werkblokken zonder AI-samenvatting."
                                />
                                {errors.tracker_use_ai_for_proposals !== undefined ? (
                                    <p className="text-sm text-red-600">{errors.tracker_use_ai_for_proposals}</p>
                                ) : null}
                            </div>

                            <fieldset className="rounded-lg border border-gray-200 p-4">
                                <legend className="px-1 text-sm font-medium text-gray-900">Blocklist</legend>
                                <p className="mt-2 text-sm text-gray-500">
                                    Apps of vensters die TimeTraq moet negeren (bijv. Spotify, WhatsApp). Ze worden niet
                                    opgeslagen en tellen niet mee bij voorstellen.
                                </p>

                                {blocklist.map((entry, index) => (
                                    <input
                                        key={entry}
                                        type="hidden"
                                        name={`tracker_blocklist[${index}]`}
                                        value={entry}
                                    />
                                ))}

                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                                    <div className="min-w-0 flex-1">
                                        <label htmlFor="tracker-blocklist-entry" className="sr-only">
                                            Nieuw blocklist-item
                                        </label>
                                        <input
                                            id="tracker-blocklist-entry"
                                            type="text"
                                            value={newBlockEntry}
                                            onChange={(event) => setNewBlockEntry(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    addBlockEntry();
                                                }
                                            }}
                                            placeholder="bijv. Netflix"
                                            className={inputClass}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addBlockEntry}
                                        className={secondaryButtonClass}
                                    >
                                        Toevoegen
                                    </button>
                                </div>

                                {blocklist.length > 0 ? (
                                    <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
                                        {blocklist.map((entry) => (
                                            <li
                                                key={entry}
                                                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                                            >
                                                <span className="text-gray-800">{entry}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeBlockEntry(entry)}
                                                    className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                                                >
                                                    Verwijderen
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-3 text-sm text-gray-500">Geen items op de blocklist.</p>
                                )}

                                {errors.tracker_blocklist !== undefined ? (
                                    <p className="mt-2 text-sm text-red-600">{errors.tracker_blocklist}</p>
                                ) : null}
                            </fieldset>

                            <details className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3">
                                <summary className="cursor-pointer text-sm font-medium text-gray-900">
                                    Meer info over de tracker
                                </summary>
                                <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">
                                    <p>
                                        <strong className="font-medium text-gray-800">Status:</strong>{' '}
                                        {trackerConnectionStatusLabel({
                                            ...tracker,
                                            tracking_enabled: trackingEnabled,
                                        })}
                                    </p>
                                    <p>
                                        <strong className="font-medium text-gray-800">Installatie:</strong>{' '}
                                        {tracker.download_url !== null ? (
                                            <a
                                                href={tracker.download_url}
                                                className="text-red-600 underline underline-offset-2 hover:text-red-700"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Download de tracker
                                            </a>
                                        ) : (
                                            'Vraag de downloadlink aan je beheerder.'
                                        )}
                                        , log in met dit account en laat de app draaien.
                                    </p>
                                    <p>
                                        <strong className="font-medium text-gray-800">Timesheets:</strong> ga naar{' '}
                                        <Link
                                            href={timesheets.url()}
                                            className="font-medium text-gray-800 underline underline-offset-2"
                                        >
                                            timesheets
                                        </Link>{' '}
                                        en kies &ldquo;Genereer voor vandaag&rdquo;.
                                    </p>
                                    <p>
                                        <strong className="font-medium text-gray-800">Privacy:</strong> venstertitels en
                                        sessieduur, geen toetsaanslagen. Zie{' '}
                                        <Link href={about.url()} className="underline underline-offset-2">
                                            Over TimeTraq
                                        </Link>{' '}
                                        en het{' '}
                                        <Link href={privacy.url()} className="underline underline-offset-2">
                                            privacybeleid
                                        </Link>
                                        .
                                    </p>
                                </div>
                            </details>

                            <button type="submit" disabled={processing} className={primaryButtonClass}>
                                {processing ? 'Opslaan…' : 'Tracker-instellingen opslaan'}
                            </button>
                        </>
                    )}
                </Form>
            </div>
        </section>
    );
}
