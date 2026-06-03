import { Link } from '@inertiajs/react';

import { formatLeavePeriod } from '@/components/leave-requests/leave-request-helpers';
import {
    dashboardSectionClassName,
    dashboardSectionLinkClassName,
} from '@/components/dashboard/dashboard-styles';
import { leaveRequests } from '@/routes';
import type { TeamLeaveItem } from '@/types/leave-requests';

type EmployeeDashboardTeamProps = {
    teamLeaveThisWeek: TeamLeaveItem[];
    hasOrganization: boolean;
};

export function EmployeeDashboardTeam({
    teamLeaveThisWeek,
    hasOrganization,
}: EmployeeDashboardTeamProps) {
    return (
        <section className={dashboardSectionClassName}>
            <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                        Team deze week
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Goedgekeurd verlof van collega&apos;s deze week.
                    </p>
                </div>
                <Link href={leaveRequests.url()} className={dashboardSectionLinkClassName}>
                    Mijn verlof
                </Link>
            </div>

            {!hasOrganization ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    Koppel aan een organisatie om verlof van collega&apos;s te zien.
                </p>
            ) : teamLeaveThisWeek.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    Geen collega&apos;s met goedgekeurd verlof deze week.
                </p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {teamLeaveThisWeek.map((item) => (
                        <li
                            key={item.id}
                            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">
                                    {item.user.name}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                    {item.type_label}
                                </p>
                            </div>
                            <p className="shrink-0 text-xs font-medium text-gray-600 tabular-nums">
                                {formatLeavePeriod(item)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
