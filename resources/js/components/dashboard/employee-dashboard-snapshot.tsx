import { Link } from '@inertiajs/react';

import { dashboardSnapshotCardClassName } from '@/components/dashboard/dashboard-styles';
import { formatDayTotal } from '@/components/timesheets/timesheet-helpers';
import { leaveRequests, projects, timesheets } from '@/routes';

type EmployeeDashboardSnapshotProps = {
    actionCount: number;
    hoursThisWeekMinutes: number;
    weekStart: string;
    pendingLeaveRequestCount: number;
    openLeaveDays: number;
    activeProjectCount: number;
};

type SnapshotCardProps = {
    label: string;
    value: string;
    detail: string;
    href: string;
};

function SnapshotCard({ label, value, detail, href }: SnapshotCardProps) {
    return (
        <Link href={href} className={dashboardSnapshotCardClassName}>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
                {value}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{detail}</p>
        </Link>
    );
}

export function EmployeeDashboardSnapshot({
    actionCount,
    hoursThisWeekMinutes,
    weekStart,
    pendingLeaveRequestCount,
    openLeaveDays,
    activeProjectCount,
}: EmployeeDashboardSnapshotProps) {
    const actionDetail =
        actionCount === 0
            ? 'Alles bijgewerkt'
            : actionCount === 1
              ? '1 openstaande taak'
              : `${actionCount} openstaande taken`;

    const leaveValue =
        pendingLeaveRequestCount > 0
            ? String(pendingLeaveRequestCount)
            : String(openLeaveDays);

    const leaveDetail =
        pendingLeaveRequestCount > 0
            ? pendingLeaveRequestCount === 1
                ? '1 aanvraag in behandeling'
                : `${pendingLeaveRequestCount} aanvragen in behandeling`
            : openLeaveDays === 0
              ? 'Geen goedgekeurd verlof gepland'
              : openLeaveDays === 1
                ? '1 verlofdag gepland'
                : `${openLeaveDays} verlofdagen gepland`;

    const projectDetail =
        activeProjectCount === 0
            ? 'Geen projecten beschikbaar'
            : activeProjectCount === 1
              ? '1 project om op te boeken'
              : `${activeProjectCount} projecten om op te boeken`;

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <SnapshotCard
                label="Open acties"
                value={String(actionCount)}
                detail={actionDetail}
                href="#acties"
            />
            <SnapshotCard
                label="Uren deze week"
                value={formatDayTotal(hoursThisWeekMinutes)}
                detail={`Week vanaf ${weekStart}`}
                href={timesheets.url({ query: { week: weekStart } })}
            />
            <SnapshotCard
                label="Verlof"
                value={leaveValue}
                detail={leaveDetail}
                href={leaveRequests.url()}
            />
            <SnapshotCard
                label="Projecten"
                value={String(activeProjectCount)}
                detail={projectDetail}
                href={projects.url()}
            />
        </div>
    );
}
