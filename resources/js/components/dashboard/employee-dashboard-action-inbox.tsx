import { Link } from '@inertiajs/react';

import {
    dashboardSectionClassName,
    dashboardSectionLinkClassName,
} from '@/components/dashboard/dashboard-styles';
import { leaveRequests, projects, timesheets } from '@/routes';

type EmployeeDashboardActionInboxProps = {
    actionCount: number;
    pendingTimesheetCount: number;
    pendingLeaveRequestCount: number;
    weeklyStatusReminderDue: boolean;
    weekStart: string;
};

function ActionCategoryTile({
    title,
    count,
    href,
    statusLabel,
}: {
    title: string;
    count: number;
    href: string;
    statusLabel: string;
}) {
    return (
        <Link
            href={href}
            className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-3 transition hover:border-gray-300 hover:shadow-sm"
        >
            <p className="text-xs font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 tabular-nums">
                {count}
            </p>
            <p className="mt-0.5 text-[0.65rem] text-gray-500">{statusLabel}</p>
        </Link>
    );
}

export function EmployeeDashboardActionInbox({
    actionCount,
    pendingTimesheetCount,
    pendingLeaveRequestCount,
    weeklyStatusReminderDue,
    weekStart,
}: EmployeeDashboardActionInboxProps) {
    const categoryCount =
        (pendingTimesheetCount > 0 ? 1 : 0) + (weeklyStatusReminderDue ? 1 : 0);

    return (
        <section
            id="acties"
            className={`scroll-mt-4 ${dashboardSectionClassName}`}
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
                                  ? '1 taak wacht op je.'
                                  : `${actionCount} taken wachten op je.`}
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

                {categoryCount > 0 ? (
                    <div
                        className={`mt-4 grid gap-2 ${categoryCount === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
                    >
                        {pendingTimesheetCount > 0 ? (
                            <ActionCategoryTile
                                title="AI-voorstellen"
                                count={pendingTimesheetCount}
                                href={timesheets.url({ query: { week: weekStart } })}
                                statusLabel="Actie nodig"
                            />
                        ) : null}
                        {weeklyStatusReminderDue ? (
                            <ActionCategoryTile
                                title="Weekstatus"
                                count={1}
                                href={projects.url()}
                                statusLabel="Invullen"
                            />
                        ) : null}
                    </div>
                ) : null}
            </div>

            {pendingTimesheetCount > 0 ? (
                <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Timesheetvoorstellen bevestigen
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {pendingTimesheetCount === 1
                                    ? '1 voorstel voor deze week wacht op je goedkeuring.'
                                    : `${pendingTimesheetCount} voorstellen voor deze week wachten op je goedkeuring.`}
                            </p>
                        </div>
                        <Link
                            href={timesheets.url({ query: { week: weekStart } })}
                            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                        >
                            Naar timesheet
                        </Link>
                    </div>
                </div>
            ) : null}

            {weeklyStatusReminderDue ? (
                <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Weekstatus invullen
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Deel kort wat lastig was en wat je volgende week plant.
                            </p>
                        </div>
                        <Link href={projects.url()} className={dashboardSectionLinkClassName}>
                            Naar projecten
                        </Link>
                    </div>
                </div>
            ) : null}

            {pendingLeaveRequestCount > 0 ? (
                <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Verlof in behandeling
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {pendingLeaveRequestCount === 1
                                    ? '1 aanvraag wacht op goedkeuring door je beheerder.'
                                    : `${pendingLeaveRequestCount} aanvragen wachten op goedkeuring door je beheerder.`}
                            </p>
                        </div>
                        <Link href={leaveRequests.url()} className={dashboardSectionLinkClassName}>
                            Status bekijken
                        </Link>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
