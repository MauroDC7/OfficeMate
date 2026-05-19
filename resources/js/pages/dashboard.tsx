import { Head, usePage } from '@inertiajs/react';

import { DashboardNotificationsPanel } from '@/components/dashboard/dashboard-notifications-panel';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { formatDayTotal } from '@/components/timesheets/timesheet-helpers';
import { AppLayout } from '@/layouts/app-layout';
import { projects, timesheets } from '@/routes';
import type { EmployeeDashboardProps } from '@/types/dashboard';

function projectDetail(projects: EmployeeDashboardProps['activeProjects']): string {
    if (projects.length === 0) {
        return 'Geen actieve projecten';
    }

    const preview = projects
        .slice(0, 3)
        .map((project) =>
            project.client_name !== null
                ? `${project.name} (${project.client_name})`
                : project.name,
        )
        .join(' · ');

    if (projects.length > 3) {
        return `${preview} · +${projects.length - 3}`;
    }

    return preview;
}

function pendingDetail(count: number): string {
    if (count === 0) {
        return 'Geen voorstellen om te bevestigen';
    }

    if (count === 1) {
        return '1 AI-voorstel wacht op goedkeuring';
    }

    return `${count} AI-voorstellen wachten op goedkeuring`;
}

export default function Dashboard() {
    const {
        activeProjects,
        pendingTimesheetCount,
        hoursThisWeekMinutes,
        weekStart,
        recentNotifications,
    } = usePage<EmployeeDashboardProps>().props;

    return (
        <AppLayout>
            <Head title="Dashboard — medewerker" />
            <main className="mx-auto box-border w-full max-w-5xl min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                    Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Overzicht van je projecten, timesheets en meldingen.
                </p>

                <div className="mt-5 space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <DashboardStatCard
                            label="Actieve projecten"
                            value={activeProjects.length}
                            detail={projectDetail(activeProjects)}
                            href={projects.url()}
                        />
                        <DashboardStatCard
                            label="Te bevestigen"
                            value={pendingTimesheetCount}
                            detail={pendingDetail(pendingTimesheetCount)}
                            href={timesheets.url()}
                        />
                        <DashboardStatCard
                            label="Uren deze week"
                            value={formatDayTotal(hoursThisWeekMinutes)}
                            detail={`Week vanaf ${weekStart}`}
                            href={timesheets.url({
                                query: { week: weekStart },
                            })}
                        />
                    </div>

                    <DashboardNotificationsPanel
                        notifications={recentNotifications}
                    />
                </div>
            </main>
        </AppLayout>
    );
}
