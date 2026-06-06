import { Head, usePage } from '@inertiajs/react';

import { AdminDashboardActionInbox } from '@/components/dashboard/admin-dashboard-action-inbox';
import { AdminDashboardSnapshot } from '@/components/dashboard/admin-dashboard-snapshot';
import { AdminDashboardWeekAbsence } from '@/components/dashboard/admin-dashboard-week-absence';
import { AdminPresenceTeaser } from '@/components/presence/admin-presence-teaser';
import { AppLayout } from '@/layouts/app-layout';
import type { AdminDashboardProps } from '@/types/dashboard';

export default function AdminDashboard() {
    const {
        organizationName,
        memberCount,
        teamCount,
        pendingMembershipCount,
        pendingLeaveRequestCount,
        openInviteCount,
        hoursThisWeekMinutes,
        weekStart,
        pendingMemberships,
        pendingLeaveRequests,
        currentLeave,
        employmentSetupCount,
        employeesNeedingEmploymentSetup,
        presenceSummary,
    } = usePage<AdminDashboardProps>().props;

    const trimmedOrganizationName = organizationName.trim();

    const actionCount =
        pendingLeaveRequestCount +
        pendingMembershipCount +
        employmentSetupCount +
        openInviteCount;

    return (
        <AppLayout>
            <Head title="Dashboard — beheerder" />
            <main className="mx-auto box-border w-full max-w-5xl min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                    Beheerdersdashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    {trimmedOrganizationName !== ''
                        ? `Overzicht voor ${trimmedOrganizationName}.`
                        : 'Overzicht van je organisatie.'}
                </p>

                <div className="mt-5 space-y-6">
                    <AdminDashboardSnapshot
                        memberCount={memberCount}
                        teamCount={teamCount}
                        actionCount={actionCount}
                        pendingLeaveRequestCount={pendingLeaveRequestCount}
                        hoursThisWeekMinutes={hoursThisWeekMinutes}
                        weekStart={weekStart}
                        openInviteCount={openInviteCount}
                    />

                    <AdminDashboardActionInbox
                        pendingLeaveRequestCount={pendingLeaveRequestCount}
                        pendingLeaveRequests={pendingLeaveRequests}
                        pendingMembershipCount={pendingMembershipCount}
                        pendingMemberships={pendingMemberships}
                        employmentSetupCount={employmentSetupCount}
                        employeesNeedingEmploymentSetup={employeesNeedingEmploymentSetup}
                        openInviteCount={openInviteCount}
                    />

                    <div>
                        <h2 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Vandaag en deze week
                        </h2>
                        <div className="space-y-5">
                            <AdminPresenceTeaser summary={presenceSummary} />
                            <AdminDashboardWeekAbsence currentLeave={currentLeave} />
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
