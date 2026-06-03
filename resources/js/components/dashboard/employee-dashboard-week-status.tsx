import { Link } from '@inertiajs/react';

import {
    dashboardSectionClassName,
    dashboardSectionLinkClassName,
} from '@/components/dashboard/dashboard-styles';
import { projects } from '@/routes';
import type { EmployeeDashboardWeeklyStatus } from '@/types/dashboard';

type EmployeeDashboardWeekStatusProps = {
    weeklyStatus: EmployeeDashboardWeeklyStatus | null;
};

function isWeeklyStatusComplete(weeklyStatus: EmployeeDashboardWeeklyStatus): boolean {
    return (
        weeklyStatus.difficult_this_week !== null &&
        weeklyStatus.difficult_this_week.trim() !== ''
    );
}

export function EmployeeDashboardWeekStatus({
    weeklyStatus,
}: EmployeeDashboardWeekStatusProps) {
    if (weeklyStatus === null) {
        return null;
    }

    const isComplete = isWeeklyStatusComplete(weeklyStatus);

    return (
        <section className={dashboardSectionClassName}>
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Weekstatus</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {isComplete
                            ? 'Je hebt je weekstatus ingevuld.'
                            : weeklyStatus.reminder_due
                              ? 'Tijd om je week kort te delen met je team.'
                              : 'Deel wat lastig was en wat je volgende week plant.'}
                    </p>
                </div>
                <Link href={projects.url()} className={dashboardSectionLinkClassName}>
                    {isComplete ? 'Bekijken' : 'Invullen'}
                </Link>
            </div>
            <div className="px-4 py-4 sm:px-5">
                {isComplete ? (
                    <div className="space-y-3 text-sm text-gray-700">
                        {weeklyStatus.difficult_this_week !== null &&
                        weeklyStatus.difficult_this_week.trim() !== '' ? (
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">
                                    Lastig deze week
                                </p>
                                <p className="mt-1 line-clamp-3">{weeklyStatus.difficult_this_week}</p>
                            </div>
                        ) : null}
                        {weeklyStatus.plans_next_week !== null &&
                        weeklyStatus.plans_next_week.trim() !== '' ? (
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">
                                    Volgende week
                                </p>
                                <p className="mt-1 line-clamp-3">{weeklyStatus.plans_next_week}</p>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">
                        Nog niet ingevuld voor week vanaf {weeklyStatus.week_start}.
                    </p>
                )}
            </div>
        </section>
    );
}
