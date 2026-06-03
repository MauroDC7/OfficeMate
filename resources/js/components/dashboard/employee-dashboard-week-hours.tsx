import { Link } from '@inertiajs/react';

import { formatLeavePeriod } from '@/components/leave-requests/leave-request-helpers';
import {
    dashboardSectionClassName,
    dashboardSectionLinkClassName,
} from '@/components/dashboard/dashboard-styles';
import { formatDayTotal } from '@/components/timesheets/timesheet-helpers';
import { timesheets } from '@/routes';
import type { TeamLeaveItem } from '@/types/leave-requests';

type EmployeeDashboardWeekHoursProps = {
    hoursThisWeekMinutes: number;
    pendingTimesheetCount: number;
    myLeaveThisWeek: TeamLeaveItem[];
    weekStart: string;
};

export function EmployeeDashboardWeekHours({
    hoursThisWeekMinutes,
    pendingTimesheetCount,
    myLeaveThisWeek,
    weekStart,
}: EmployeeDashboardWeekHoursProps) {
    const myLeaveSummary =
        myLeaveThisWeek.length === 0
            ? null
            : myLeaveThisWeek
                  .map((leave) => `${leave.type_label} (${formatLeavePeriod(leave)})`)
                  .join(' · ');

    return (
        <section className={dashboardSectionClassName}>
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                        Uren deze week
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Week vanaf {weekStart}
                        {pendingTimesheetCount > 0
                            ? ` · ${pendingTimesheetCount} voorstel${pendingTimesheetCount === 1 ? '' : 'len'} te bevestigen`
                            : ''}
                    </p>
                </div>
                <Link
                    href={timesheets.url({ query: { week: weekStart } })}
                    className={dashboardSectionLinkClassName}
                >
                    Naar timesheet
                </Link>
            </div>
            <div className="px-4 py-5 sm:px-5">
                {myLeaveSummary !== null ? (
                    <p className="mb-4 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-700">
                        Je bent deze week afwezig: {myLeaveSummary}
                    </p>
                ) : null}
                <p className="text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                    {formatDayTotal(hoursThisWeekMinutes)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                    {hoursThisWeekMinutes === 0
                        ? 'Nog geen uren geregistreerd deze week.'
                        : 'Bevestigde uren in je timesheet deze week.'}
                </p>
            </div>
        </section>
    );
}
