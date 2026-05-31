import { Link } from '@inertiajs/react';

import { about, privacy } from '@/routes';

export type TrackerSettingsPayload = {
    is_connected: boolean;
    last_activity_at: string | null;
    last_activity_label: string | null;
    download_url: string | null;
};

type TrackerSettingsSectionProps = {
    tracker: TrackerSettingsPayload;
};

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

function ConnectionBadge({ tracker }: { tracker: TrackerSettingsPayload }) {
    if (tracker.is_connected) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/20">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                Gekoppeld
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
            <span className="size-1.5 rounded-full bg-gray-400" aria-hidden />
            Niet gekoppeld
        </span>
    );
}

export function TrackerSettingsSection({ tracker }: TrackerSettingsSectionProps) {
    const activityDetail =
        tracker.last_activity_label !== null
            ? `Laatste activiteit: ${tracker.last_activity_label}.`
            : tracker.is_connected
              ? 'Nog geen activiteit ontvangen sinds de koppeling.'
              : 'Log in op de desktop-app om activiteit te synchroniseren.';

    return (
        <section
            className="mt-5 w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6 sm:rounded-2xl lg:mt-7"
            aria-labelledby="tracker-settings-title"
        >
            <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
                <div className="flex items-start gap-2.5">
                    <IconDesktop className="mt-0.5 shrink-0 text-gray-700" />
                    <div>
                        <h2 id="tracker-settings-title" className="text-base font-semibold text-gray-900">
                            TimeTraq Tracker
                        </h2>
                        <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
                            Desktop-app die je werk registreert. Op de timesheet maak je daar AI-voorstellen van
                            die je zelf goedkeurt.
                        </p>
                    </div>
                </div>
                <ConnectionBadge tracker={tracker} />
            </div>

            <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
                <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{activityDetail}</p>
                </div>

                <ol className="space-y-4 text-sm text-gray-700">
                    <li className="flex gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                            1
                        </span>
                        <span className="pt-0.5 leading-relaxed">
                            {tracker.download_url !== null ? (
                                <>
                                    Installeer de{' '}
                                    <a
                                        href={tracker.download_url}
                                        className="font-medium text-red-600 underline decoration-red-600/30 underline-offset-2 hover:text-red-700"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        TimeTraq Tracker
                                    </a>{' '}
                                    op je computer.
                                </>
                            ) : (
                                <>Installeer de TimeTraq Tracker op je computer (link van je beheerder).</>
                            )}
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                            2
                        </span>
                        <span className="pt-0.5 leading-relaxed">
                            Log in met hetzelfde e-mailadres en wachtwoord als op deze website.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                            3
                        </span>
                        <span className="pt-0.5 leading-relaxed">
                            Ga naar Timesheets en klik op &ldquo;Genereer voor vandaag&rdquo; om voorstellen te
                            maken. Jij keurt alles goed of past het aan.
                        </span>
                    </li>
                </ol>

                <p className="text-xs leading-relaxed text-gray-500">
                    De tracker registreert venstertitels en sessieduur, geen toetsaanslagen. Meer uitleg op{' '}
                    <Link href={about.url()} className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900">
                        Over TimeTraq
                    </Link>{' '}
                    en in het{' '}
                    <Link href={privacy.url()} className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900">
                        privacybeleid
                    </Link>
                    .
                </p>
            </div>
        </section>
    );
}
