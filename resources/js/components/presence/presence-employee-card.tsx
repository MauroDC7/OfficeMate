import { PresenceStatusBadge } from '@/components/presence/presence-status-badge';
import { UserAvatar } from '@/components/user-avatar';
import type { PresenceEmployee } from '@/types/presence';

function formatLeaveUntil(leaveEndsOn: string): string {
    const endsOn = new Date(`${leaveEndsOn}T00:00:00`);

    return `t/m ${endsOn.toLocaleDateString('nl-BE', {
        day: 'numeric',
        month: 'short',
    })}`;
}

type PresenceEmployeeCardProps = {
    employee: PresenceEmployee;
};

export function PresenceEmployeeCard({ employee }: PresenceEmployeeCardProps) {
    const teamsLabel =
        employee.teams.length === 0
            ? 'Geen team'
            : employee.teams.length === 1
              ? employee.teams[0]
              : `${employee.teams.length} teams`;

    return (
        <article className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <UserAvatar user={employee} className="size-11 text-sm" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{employee.name}</p>
                    <p className="truncate text-xs text-gray-500">{teamsLabel}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <PresenceStatusBadge label={employee.status_label} status={employee.status} />
                {employee.leave_ends_on !== null ? (
                    <span className="text-xs text-gray-500">
                        {formatLeaveUntil(employee.leave_ends_on)}
                    </span>
                ) : null}
            </div>
        </article>
    );
}
