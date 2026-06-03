import { Link, router } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { useAlert } from '@/components/alert';
import { adminDashboardSectionLinkClassName } from '@/components/dashboard/admin-dashboard-section-link';
import { formatLeavePeriod } from '@/components/leave-requests/leave-request-helpers';
import { leaveRequests as adminLeaveRequests } from '@/routes/admin';
import { settings, teams } from '@/routes';
import { approve, reject } from '@/routes/team-memberships';
import type {
    AdminDashboardEmployeeNeedingEmploymentSetup,
    AdminDashboardPendingMembership,
    AdminDashboardPendingLeave,
} from '@/types/dashboard';

type AdminDashboardActionInboxProps = {
    pendingLeaveRequestCount: number;
    pendingLeaveRequests: AdminDashboardPendingLeave[];
    pendingMembershipCount: number;
    pendingMemberships: AdminDashboardPendingMembership[];
    employmentSetupCount: number;
    employeesNeedingEmploymentSetup: AdminDashboardEmployeeNeedingEmploymentSetup[];
    openInviteCount: number;
};

type ActionCategory = {
    id: string;
    title: string;
    count: number;
    href: string;
    hrefLabel: string;
};

function ActionCategoryTile({
    title,
    count,
    href,
}: {
    title: string;
    count: number;
    href: string;
}) {
    const hasItems = count > 0;

    return (
        <Link
            href={href}
            className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-3 transition hover:border-gray-300 hover:shadow-sm"
        >
            <p className="text-xs font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 tabular-nums">
                {count}
            </p>
            <p className="mt-0.5 text-[0.65rem] text-gray-500">
                {hasItems ? 'Actie nodig' : 'Niets open'}
            </p>
        </Link>
    );
}

function InboxSection({
    title,
    count,
    href,
    hrefLabel,
    children,
}: {
    title: string;
    count: number;
    href: string;
    hrefLabel: string;
    children: ReactNode;
}) {
    return (
        <div className="border-t border-gray-100">
            <div className="flex items-center justify-between gap-3 bg-gray-50/60 px-4 py-3 sm:px-5">
                <h3 className="text-sm font-semibold text-gray-900">
                    {title}
                    <span className="ms-1.5 font-normal text-gray-500">({count})</span>
                </h3>
                <Link href={href} className={adminDashboardSectionLinkClassName}>
                    {hrefLabel}
                </Link>
            </div>
            {children}
        </div>
    );
}

export function AdminDashboardActionInbox({
    pendingLeaveRequestCount,
    pendingLeaveRequests,
    pendingMembershipCount,
    pendingMemberships,
    employmentSetupCount,
    employeesNeedingEmploymentSetup,
    openInviteCount,
}: AdminDashboardActionInboxProps) {
    const { success } = useAlert();

    const actionCount =
        pendingLeaveRequestCount +
        pendingMembershipCount +
        employmentSetupCount +
        openInviteCount;

    const categories: ActionCategory[] = [
        {
            id: 'leave',
            title: 'Verlof',
            count: pendingLeaveRequestCount,
            href: adminLeaveRequests.url({ query: { status: 'pending' } }),
            hrefLabel: 'Beheren',
        },
        {
            id: 'teams',
            title: 'Teams',
            count: pendingMembershipCount,
            href: teams.url(),
            hrefLabel: 'Naar teams',
        },
        {
            id: 'contract',
            title: 'Contract',
            count: employmentSetupCount,
            href: `${settings.url()}#employment-exception`,
            hrefLabel: 'Instellingen',
        },
        {
            id: 'invites',
            title: 'Uitnodigingen',
            count: openInviteCount,
            href: settings.url(),
            hrefLabel: 'Beheren',
        },
    ];

    return (
        <section
            id="acties"
            className="scroll-mt-4 rounded-xl border border-gray-200 border-s-4 border-s-red-600 bg-white shadow-sm"
        >
            <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">
                            Wat vraagt aandacht
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {actionCount === 0
                                ? 'Geen openstaande taken — alles is bijgewerkt.'
                                : actionCount === 1
                                  ? '1 taak wacht op je beslissing.'
                                  : `${actionCount} taken wachten op je beslissing.`}
                        </p>
                    </div>
                    {actionCount > 0 ? (
                        <span className="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                            {actionCount} open
                        </span>
                    ) : (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200 ring-inset">
                            Alles bijgewerkt
                        </span>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {categories.map((category) => (
                        <ActionCategoryTile
                            key={category.id}
                            title={category.title}
                            count={category.count}
                            href={category.href}
                        />
                    ))}
                </div>
            </div>

            {pendingLeaveRequestCount > 0 ? (
                <InboxSection
                    title="Verlofaanvragen"
                    count={pendingLeaveRequestCount}
                    href={adminLeaveRequests.url({ query: { status: 'pending' } })}
                    hrefLabel="Alles beheren"
                >
                    <ul className="divide-y divide-gray-100">
                        {pendingLeaveRequests.map((leave) => (
                            <li
                                key={leave.id}
                                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                        {leave.user.name}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {leave.type_label} · {formatLeavePeriod(leave)}
                                    </p>
                                </div>
                                <Link
                                    href={adminLeaveRequests.url({
                                        query: { status: 'pending' },
                                    })}
                                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                                >
                                    Behandelen
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {pendingLeaveRequestCount > pendingLeaveRequests.length ? (
                        <p className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-500 sm:px-5">
                            Toon {pendingLeaveRequests.length} van {pendingLeaveRequestCount}.{' '}
                            <Link
                                href={adminLeaveRequests.url({
                                    query: { status: 'pending' },
                                })}
                                className="font-medium text-gray-700 underline underline-offset-2"
                            >
                                Alle aanvragen
                            </Link>
                        </p>
                    ) : null}
                </InboxSection>
            ) : null}

            {pendingMembershipCount > 0 ? (
                <InboxSection
                    title="Teamaanvragen"
                    count={pendingMembershipCount}
                    href={teams.url()}
                    hrefLabel="Naar teams"
                >
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
                                        {membership.user.email} · {membership.team.name}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.post(
                                                approve.url({
                                                    team_membership: membership.id,
                                                }),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        success('Lidmaatschap goedgekeurd.'),
                                                },
                                            )
                                        }
                                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                    >
                                        Goedkeuren
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.post(
                                                reject.url({
                                                    team_membership: membership.id,
                                                }),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        success('Lidmaatschap afgewezen.'),
                                                },
                                            )
                                        }
                                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Afwijzen
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </InboxSection>
            ) : null}

            {employmentSetupCount > 0 ? (
                <InboxSection
                    title="Contract instellen"
                    count={employmentSetupCount}
                    href={`${settings.url()}#employment-exception`}
                    hrefLabel="Naar instellingen"
                >
                    <ul className="divide-y divide-gray-100">
                        {employeesNeedingEmploymentSetup.map((employee) => (
                            <li
                                key={employee.id}
                                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                        {employee.name}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {employee.email}
                                    </p>
                                </div>
                                <Link
                                    href={`${settings.url({
                                        query: { employee: employee.id },
                                    })}#employment-exception`}
                                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                >
                                    Contract instellen
                                </Link>
                            </li>
                        ))}
                    </ul>
                </InboxSection>
            ) : null}

            {openInviteCount > 0 ? (
                <InboxSection
                    title="Open uitnodigingen"
                    count={openInviteCount}
                    href={settings.url()}
                    hrefLabel="Uitnodigingen beheren"
                >
                    <p className="px-4 py-4 text-sm text-gray-600 sm:px-5">
                        {openInviteCount === 1
                            ? '1 uitnodiging wacht op acceptatie.'
                            : `${openInviteCount} uitnodigingen wachten op acceptatie.`}
                    </p>
                </InboxSection>
            ) : null}
        </section>
    );
}
