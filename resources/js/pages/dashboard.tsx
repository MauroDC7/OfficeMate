import { Head, usePage } from '@inertiajs/react';

import { DashboardNotificationsPanel } from '@/components/dashboard/dashboard-notifications-panel';
import { EmployeeDashboardActionInbox } from '@/components/dashboard/employee-dashboard-action-inbox';
import { EmployeeDashboardSnapshot } from '@/components/dashboard/employee-dashboard-snapshot';
import { EmployeeDashboardTeam } from '@/components/dashboard/employee-dashboard-team';
import { EmployeeDashboardWeekHours } from '@/components/dashboard/employee-dashboard-week-hours';
import { AppLayout } from '@/layouts/app-layout';
import type { EmployeeDashboardProps } from '@/types/dashboard';

export default function Dashboard() {
    const {
        activeProjects,
        actionCount,
        pendingTimesheetCount,
        hoursThisWeekMinutes,
        pendingLeaveRequestCount,
        openLeaveDays,
        weeklyStatusReminderDue,
        weekStart,
        myLeaveThisWeek,
        teamLeaveThisWeek,
        hasOrganization,
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
                    Wat je nu moet doen, je uren en je team in één overzicht.
                </p>

                <div className="mt-5 space-y-6">
                    <EmployeeDashboardSnapshot
                        actionCount={actionCount}
                        hoursThisWeekMinutes={hoursThisWeekMinutes}
                        weekStart={weekStart}
                        pendingLeaveRequestCount={pendingLeaveRequestCount}
                        openLeaveDays={openLeaveDays}
                        activeProjectCount={activeProjects.length}
                    />

                    <EmployeeDashboardActionInbox
                        actionCount={actionCount}
                        pendingTimesheetCount={pendingTimesheetCount}
                        pendingLeaveRequestCount={pendingLeaveRequestCount}
                        weeklyStatusReminderDue={weeklyStatusReminderDue}
                        weekStart={weekStart}
                    />

                    <div>
                        <h2 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Deze week
                        </h2>
                        <div className="space-y-5">
                            <EmployeeDashboardWeekHours
                                hoursThisWeekMinutes={hoursThisWeekMinutes}
                                pendingTimesheetCount={pendingTimesheetCount}
                                myLeaveThisWeek={myLeaveThisWeek}
                                weekStart={weekStart}
                            />
                            <EmployeeDashboardTeam
                                teamLeaveThisWeek={teamLeaveThisWeek}
                                hasOrganization={hasOrganization}
                            />
                        </div>
                    </div>

                    {recentNotifications.length > 0 ? (
                        <DashboardNotificationsPanel
                            notifications={recentNotifications}
                        />
                    ) : null}
                </div>
            </main>
        </AppLayout>
    );
}
