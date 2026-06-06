import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { formatShortRelativeNl } from '@/components/timesheets/timesheet-helpers';
import type { DashboardNotification } from '@/types/dashboard';

export function AppNotificationsMenu() {
    const notifications =
        (usePage().props.recentNotifications as DashboardNotification[] | undefined) ??
        [];
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        function onPointerDown(event: MouseEvent): void {
            if (
                panelRef.current !== null &&
                !panelRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [open]);

    const unreadCount = notifications.length;

    return (
        <div ref={panelRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative inline-flex size-10 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                aria-label={
                    unreadCount > 0
                        ? `${unreadCount} notificaties`
                        : 'Notificaties'
                }
                aria-expanded={open}
            >
                <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden
                >
                    <path
                        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
                </svg>
                {unreadCount > 0 ? (
                    <span className="absolute end-1 top-1 flex size-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute end-0 z-50 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-gray-500">
                            Geen meldingen. Verlof en andere updates verschijnen
                            hier meteen.
                        </p>
                    ) : (
                        <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
                            {notifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className="px-4 py-3"
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
                                        {formatShortRelativeNl(
                                            notification.created_at,
                                        )}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </div>
    );
}
