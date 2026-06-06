import { Link } from '@inertiajs/react';

import { dashboardSnapshotCardClassName } from '@/components/dashboard/dashboard-styles';
import { formatDayTotal } from '@/components/timesheets/timesheet-helpers';
import { leaveRequests as adminLeaveRequests } from '@/routes/admin';
import { settings, teams, timesheets } from '@/routes';

type AdminDashboardSnapshotProps = {
    memberCount: number;
    teamCount: number;
    actionCount: number;
    pendingLeaveRequestCount: number;
    hoursThisWeekMinutes: number;
    weekStart: string;
    openInviteCount: number;
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

export function AdminDashboardSnapshot({
    memberCount,
    teamCount,
    actionCount,
    pendingLeaveRequestCount,
    hoursThisWeekMinutes,
    weekStart,
    openInviteCount,
}: AdminDashboardSnapshotProps) {
    const membersDetail =
        memberCount === 0
            ? 'Nog geen leden'
            : teamCount === 1
              ? `${memberCount} leden · 1 team`
              : `${memberCount} leden · ${teamCount} teams`;

    const actionDetail =
        actionCount === 0
            ? 'Alles bijgewerkt'
            : actionCount === 1
              ? '1 openstaande taak'
              : `${actionCount} openstaande taken`;

    const leaveDetail =
        pendingLeaveRequestCount === 0
            ? 'Geen aanvragen wachtend'
            : pendingLeaveRequestCount === 1
              ? '1 aanvraag te beoordelen'
              : `${pendingLeaveRequestCount} aanvragen te beoordelen`;

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <SnapshotCard
                label="Open acties"
                value={String(actionCount)}
                detail={actionDetail}
                href="#acties"
            />
            <SnapshotCard
                label="Team"
                value={String(memberCount)}
                detail={membersDetail}
                href={teams.url()}
            />
            <SnapshotCard
                label="Uren deze week"
                value={formatDayTotal(hoursThisWeekMinutes)}
                detail={`Week vanaf ${weekStart}`}
                href={timesheets.url({ query: { week: weekStart } })}
            />
            <SnapshotCard
                label="Verlof"
                value={String(pendingLeaveRequestCount)}
                detail={leaveDetail}
                href={adminLeaveRequests.url({ query: { status: 'pending' } })}
            />
            {openInviteCount > 0 ? (
                <div className="col-span-2 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-700 lg:col-span-4">
                    <span className="font-semibold text-gray-900">{openInviteCount}</span>{' '}
                    {openInviteCount === 1
                        ? 'open uitnodiging'
                        : 'open uitnodigingen'}
                    {' — '}
                    <Link
                        href={settings.url()}
                        className="font-medium text-red-600 underline decoration-red-600/30 underline-offset-2 hover:text-red-700"
                    >
                        Beheren in instellingen
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
