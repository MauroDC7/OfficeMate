import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';
import {
    dashboard,
    leaveRequests,
    projects,
    settings,
    teams,
    timesheets,
} from '@/routes';

const row = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition';

const links = [
    { label: 'Dashboard', route: dashboard, src: '/img/Dashboard Icon 24.png' },
    { label: 'Timesheets', route: timesheets, src: '/img/Timesheet Icon Collection.png' },
    { label: 'Projects', route: projects, src: '/img/Folder Icon 24.png' },
    { label: 'Teams', route: teams, src: '/img/Work Icons Material Outlined.png' },
    { label: 'Leave requests', route: leaveRequests, src: '/img/Calendar Icons Material Outlined.png' },
    { label: 'Settings', route: settings, src: '/img/Settings Icon 24.png' },
] as const;

function pathOnly(url: string): string {
    const p = url.split('?')[0] ?? '/';

    return p === '' ? '/' : p;
}

type AppSidebarProps = {
    isMobileOpen: boolean;
    onCloseMobile: () => void;
};

export function AppSidebar({ isMobileOpen, onCloseMobile }: AppSidebarProps) {
    const page = usePage();
    const here = pathOnly(page.url);
    const role = page.props.auth.user?.role;
    const roleLabel = role === 'admin' ? 'Beheerder' : role === 'employee' ? 'Medewerker' : null;

    useEffect(() => {
        if (!isMobileOpen) {
            return;
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onCloseMobile();
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isMobileOpen, onCloseMobile]);

    return (
        <>
            <button
                type="button"
                aria-hidden={!isMobileOpen}
                tabIndex={isMobileOpen ? 0 : -1}
                onClick={onCloseMobile}
                className={cn(
                    'fixed inset-0 z-40 bg-gray-900/50 transition-opacity md:hidden',
                    isMobileOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
                aria-label="Menu sluiten"
            />

            <aside
                aria-label="Hoofdnavigatie"
                aria-hidden={!isMobileOpen ? undefined : false}
                className={cn(
                    'fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-hidden border-e border-gray-200 bg-gray-100/95 shadow-xl transition-transform duration-200 ease-out',
                    'md:static md:z-auto md:w-64 md:max-w-none md:shrink-0 md:translate-x-0 md:bg-gray-100/90 md:shadow-none',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200/80 px-5 py-5 sm:py-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <img
                            src="/img/logoTransparent.png"
                            alt=""
                            aria-hidden
                            className="size-9 shrink-0 object-contain"
                            width={36}
                            height={36}
                            decoding="async"
                            draggable={false}
                        />
                        <div className="min-w-0">
                            <p className="text-base font-semibold tracking-tight text-gray-900">TimeTraq</p>
                            {roleLabel !== null ? (
                                <p className="mt-0.5 text-xs font-medium text-red-600">{roleLabel}</p>
                            ) : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCloseMobile}
                        className="-me-2 inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-200/80 hover:text-gray-800 md:hidden"
                        aria-label="Menu sluiten"
                    >
                        <svg
                            width={20}
                            height={20}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                        >
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav
                    className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
                    aria-label="Navigatie"
                >
                    {links.map(({ label, route, src }) => {
                        const href = route.url();
                        const active = here === pathOnly(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    row,
                                    active
                                        ? 'bg-sky-100/90 text-sky-800'
                                        : 'text-gray-700 hover:bg-gray-200/80',
                                )}
                                aria-current={active ? 'page' : undefined}
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className="size-5 shrink-0 object-contain"
                                    width={20}
                                    height={20}
                                    decoding="async"
                                    draggable={false}
                                />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
