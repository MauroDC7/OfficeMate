import { formatShortRelativeNl } from '@/components/timesheets/timesheet-helpers';
import type { DashboardNotification } from '@/types/dashboard';

type DashboardNotificationsPanelProps = {
    notifications: DashboardNotification[];
};

export function DashboardNotificationsPanel({
    notifications,
}: DashboardNotificationsPanelProps) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900">
                        Notificaties
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Je vijf meest recente meldingen.
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex w-full shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 sm:w-auto"
                >
                    Alle notificaties
                </button>
            </div>

            {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    Meldingen uit TimeTraq verschijnen hier zodra ze
                    beschikbaar zijn.
                </p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                        <li
                            key={notification.id}
                            className="px-4 py-3 sm:px-5"
                        >
                            <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                            </p>
                            {notification.message !== '' ? (
                                <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
                                    {notification.message}
                                </p>
                            ) : null}
                            <p className="mt-1 text-xs text-gray-400">
                                {formatShortRelativeNl(notification.created_at)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
