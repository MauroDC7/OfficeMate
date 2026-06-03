import { Link } from '@inertiajs/react';

import { adminDashboardSectionLinkClassName } from '@/components/dashboard/admin-dashboard-section-link';
import { formatLeavePeriod } from '@/components/leave-requests/leave-request-helpers';
import { leaveRequests as adminLeaveRequests } from '@/routes/admin';
import type { AdminDashboardCurrentLeave } from '@/types/dashboard';

type AdminDashboardWeekAbsenceProps = {
    currentLeave: AdminDashboardCurrentLeave[];
};

export function AdminDashboardWeekAbsence({
    currentLeave,
}: AdminDashboardWeekAbsenceProps) {
    return (
        <section className="rounded-xl border border-gray-200 border-s-4 border-s-red-600 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                        Afwezig deze week
                        {currentLeave.length > 0 ? (
                            <span className="ms-1.5 font-normal text-gray-500">
                                ({currentLeave.length})
                            </span>
                        ) : null}
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Goedgekeurd verlof dat loopt of deze week start.
                    </p>
                </div>
                <Link
                    href={adminLeaveRequests.url({ query: { status: 'approved' } })}
                    className={adminDashboardSectionLinkClassName}
                >
                    Verlofbeheer
                </Link>
            </div>

            {currentLeave.length === 0 ? (
                <div className="px-4 py-10 text-center sm:px-5">
                    <p className="text-sm font-medium text-gray-700">
                        Iedereen is deze week beschikbaar
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Geen goedgekeurd verlof in de huidige week.
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {currentLeave.map((leave) => (
                        <li
                            key={leave.id}
                            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">
                                    {leave.user.name}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                    {leave.type_label}
                                </p>
                            </div>
                            <p className="shrink-0 rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 tabular-nums ring-1 ring-gray-200/80">
                                {formatLeavePeriod(leave)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
