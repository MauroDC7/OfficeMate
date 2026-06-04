import { Head, usePage } from '@inertiajs/react';

import { DashboardNotificationsPanel } from '@/components/dashboard/dashboard-notifications-panel';
import { EmployeeDashboardActionInbox } from '@/components/dashboard/employee-dashboard-action-inbox';
import { EmployeeDashboardSnapshot } from '@/components/dashboard/employee-dashboard-snapshot';
import { EmployeeDashboardToday } from '@/components/dashboard/employee-dashboard-today';
import { EmployeeDashboardTrackerBanner } from '@/components/dashboard/employee-dashboard-tracker-banner';
import { EmployeeDashboardWeekHours } from '@/components/dashboard/employee-dashboard-week-hours';
import { EmployeeDashboardWeekStatus } from '@/components/dashboard/employee-dashboard-week-status';
import { AppLayout } from '@/layouts/app-layout';
import type { DashboardNotification, EmployeeDashboardProps } from '@/types/dashboard';

export default function Dashboard() {
    const page = usePage<EmployeeDashboardProps>();
    const {
        actionCount,
        pendingTimesheetCount,
        hoursThisWeekMinutes,
        pendingLeaveRequestCount,
        openLeaveDays,
        weeklyStatus,
        weeklyStatusReminderDue,
        weekStart,
        myLeaveThisWeek,
        teamLeaveToday,
        taskAvailability,
        trackerIsConnected,
        hasOrganization,
    } = page.props;

    const recentNotifications =
        (page.props.recentNotifications as DashboardNotification[] | undefined) ??
        [];

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
                        pendingTimesheetCount={pendingTimesheetCount}
                        hoursThisWeekMinutes={hoursThisWeekMinutes}
                        weekStart={weekStart}
                        pendingLeaveRequestCount={pendingLeaveRequestCount}
                        openLeaveDays={openLeaveDays}
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
                            <EmployeeDashboardWeekStatus weeklyStatus={weeklyStatus} />
                            <EmployeeDashboardToday
                                taskAvailability={taskAvailability}
                                teamLeaveToday={teamLeaveToday}
                            />
                            <EmployeeDashboardTrackerBanner
                                show={hasOrganization && !trackerIsConnected}
                            />
                        </div>
                    </div>

                    <DashboardNotificationsPanel
                        notifications={recentNotifications}
                    />
                </div>
            </main>
        </AppLayout>
    );
}
