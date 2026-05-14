import { Link, usePage } from '@inertiajs/react';

import { cn } from '@/lib/utils';
import {
    dashboard,
    leaveRequests,
    projects,
    settings,
    shiftPlanning,
    timesheets,
} from '@/routes';

const row = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition';

const links = [
    { label: 'Dashboard', route: dashboard, src: '/img/Dashboard Icon 24.png' },
    { label: 'Timesheets', route: timesheets, src: '/img/Timesheet Icon Collection.png' },
    { label: 'Projects', route: projects, src: '/img/Folder Icon 24.png' },
    { label: 'Leave requests', route: leaveRequests, src: '/img/Calendar Icons Material Outlined.png' },
    { label: 'Shift planning', route: shiftPlanning, src: '/img/Work Icons Material Outlined.png' },
    { label: 'Settings', route: settings, src: '/img/Settings Icon 24.png' },
] as const;

function pathOnly(url: string): string {
    const p = url.split('?')[0] ?? '/';

    return p === '' ? '/' : p;
}

export function AppSidebar() {
    const page = usePage();
    const here = pathOnly(page.url);
    const role = page.props.auth.user?.role;
    const roleLabel = role === 'admin' ? 'Beheerder' : role === 'employee' ? 'Medewerker' : null;

    return (
        <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-gray-100/90">
            <div className="shrink-0 border-b border-gray-200/80 px-5 py-6">
                <p className="text-base font-semibold tracking-tight text-gray-900">OfficeMate</p>
                {roleLabel !== null ? (
                    <p className="mt-1 text-xs font-medium text-red-600">{roleLabel}</p>
                ) : null}
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
    );
}
