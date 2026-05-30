import { Head, router, usePage } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { formatDayTotal } from '@/components/timesheets/timesheet-helpers';
import { AppLayout } from '@/layouts/app-layout';
import { leaveRequests, settings, teams, timesheets } from '@/routes';
import { AdminPendingLeaveSection } from '@/components/leave-requests/admin-pending-leave-section';
import { approve, reject } from '@/routes/team-memberships';
import type {
    AdminDashboardCurrentLeave,
    AdminDashboardProps,
} from '@/types/dashboard';

function membersDetail(memberCount: number, teamCount: number): string {
    if (memberCount === 0) {
        return 'Nog geen leden in je organisatie';
    }

    const teamLabel = teamCount === 1 ? '1 team' : `${teamCount} teams`;

    return `Verdeeld over ${teamLabel}`;
}

function pendingMembershipsDetail(count: number): string {
    if (count === 0) {
        return 'Geen open teamaanvragen';
    }

    return count === 1
        ? '1 aanvraag wacht op goedkeuring'
        : `${count} aanvragen wachten op goedkeuring`;
}

function pendingLeaveDetail(count: number): string {
    if (count === 0) {
        return 'Geen open verlofaanvragen';
    }

    return count === 1
        ? '1 verlofaanvraag in behandeling'
        : `${count} verlofaanvragen in behandeling`;
}

function openInvitesDetail(count: number): string {
    if (count === 0) {
        return 'Geen openstaande uitnodigingen';
    }

    return count === 1
        ? '1 uitnodiging wacht op acceptatie'
        : `${count} uitnodigingen wachten op acceptatie`;
}

function pendingProposalsDetail(count: number): string {
    if (count === 0) {
        return 'Geen AI-voorstellen wachtend op medewerkers';
    }

    return count === 1
        ? '1 AI-voorstel wacht op bevestiging'
        : `${count} AI-voorstellen wachten op bevestiging`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'short',
});

function formatLeavePeriod(leave: AdminDashboardCurrentLeave): string {
    const start = DATE_FORMATTER.format(new Date(`${leave.starts_on}T12:00:00`));

    if (leave.ends_on === leave.starts_on) {
        return start;
    }

    const end = DATE_FORMATTER.format(new Date(`${leave.ends_on}T12:00:00`));

    return `${start} – ${end}`;
}

export default function AdminDashboard() {
    const {
        organizationName,
        memberCount,
        teamCount,
        pendingMembershipCount,
        pendingLeaveRequestCount,
        pendingProposalCount,
        openInviteCount,
        hoursThisWeekMinutes,
        weekStart,
        pendingMemberships,
        pendingLeaveRequests,
        currentLeave,
    } = usePage<AdminDashboardProps>().props;
    const { success } = useAlert();

    const trimmedOrganizationName = organizationName.trim();

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

                <div className="mt-5 space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <DashboardStatCard
                            label="Teamleden"
                            value={memberCount}
                            detail={membersDetail(memberCount, teamCount)}
                            href={teams.url()}
                        />
                        <DashboardStatCard
                            label="Open teamaanvragen"
                            value={pendingMembershipCount}
                            detail={pendingMembershipsDetail(
                                pendingMembershipCount,
                            )}
                            href={teams.url()}
                        />
                        <DashboardStatCard
                            label="Verlof in behandeling"
                            value={pendingLeaveRequestCount}
                            detail={pendingLeaveDetail(pendingLeaveRequestCount)}
                            href={leaveRequests.url()}
                        />
                        <DashboardStatCard
                            label="Open uitnodigingen"
                            value={openInviteCount}
                            detail={openInvitesDetail(openInviteCount)}
                            href={settings.url()}
                        />
                        <DashboardStatCard
                            label="AI-voorstellen"
                            value={pendingProposalCount}
                            detail={pendingProposalsDetail(pendingProposalCount)}
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

                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Open teamaanvragen
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Medewerkers die wachten om bij een team te
                                    horen.
                                </p>
                            </div>
                        </div>

                        {pendingMemberships.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                                Geen open aanvragen op dit moment.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {pendingMemberships.map((membership) => (
                                    <li
                                        key={membership.id}
                                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {membership.user.name}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                                {membership.user.email} ·{' '}
                                                {membership.team.name}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        approve.url({
                                                            team_membership:
                                                                membership.id,
                                                        }),
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () =>
                                                                success(
                                                                    'Lidmaatschap goedgekeurd.',
                                                                ),
                                                        },
                                                    )
                                                }
                                                className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 sm:flex-none sm:py-1.5 sm:text-xs"
                                            >
                                                Goedkeuren
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        reject.url({
                                                            team_membership:
                                                                membership.id,
                                                        }),
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () =>
                                                                success(
                                                                    'Lidmaatschap afgewezen.',
                                                                ),
                                                        },
                                                    )
                                                }
                                                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none sm:py-1.5 sm:text-xs"
                                            >
                                                Afwijzen
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <AdminPendingLeaveSection
                        requests={pendingLeaveRequests}
                        totalCount={pendingLeaveRequestCount}
                        onSuccess={(message) => success(message)}
                    />

                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                            <h2 className="text-sm font-semibold text-gray-900">
                                Afwezig deze week
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Goedgekeurd verlof dat loopt of deze week start.
                            </p>
                        </div>

                        {currentLeave.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                                Iedereen is deze week beschikbaar.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {currentLeave.map((leave) => (
                                    <li
                                        key={leave.id}
                                        className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {leave.user.name}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                                {leave.type_label}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-xs font-medium text-gray-600">
                                            {formatLeavePeriod(leave)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </AppLayout>
    );
}
