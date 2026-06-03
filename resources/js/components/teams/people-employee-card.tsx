import { router } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { RowActionsMenu, type RowActionItem } from '@/components/leave-requests/row-actions-menu';
import { PresenceStatusBadge } from '@/components/presence/presence-status-badge';
import { TaskAvailabilityBadge } from '@/components/presence/task-availability-badge';
import { UserAvatar } from '@/components/user-avatar';
import { getUserDisplayFullName } from '@/lib/user-display';
import type { PresenceEmployee } from '@/types/presence';
import type { User } from '@/types/auth';
import { store as grantAdminRole } from '@/routes/settings/employees/admin-role';
import { destroy as removeOrganizationMember } from '@/routes/settings/employees';

type PeopleEmployeeCardProps = {
    employee: PresenceEmployee;
    currentUserId: number;
};

function formatLeaveUntil(isoDate: string): string {
    const date = new Date(`${isoDate}T12:00:00`);

    return `Tot ${date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}`;
}

function roleLabel(role: PresenceEmployee['role']): string {
    return role === 'admin' ? 'Beheerder' : 'Medewerker';
}

export function PeopleEmployeeCard({ employee, currentUserId }: PeopleEmployeeCardProps) {
    const { success, error } = useAlert();

    const teamsLabel =
        employee.teams.length === 0
            ? 'Geen team'
            : employee.teams.length === 1
              ? employee.teams[0]
              : `${employee.teams.length} teams`;

    const isSelf = employee.id === currentUserId;

    function reloadPeople() {
        router.reload({ only: ['people'], preserveScroll: true });
    }

    function grantAdmin() {
        router.post(grantAdminRole.url({ user: employee.id }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                success(`${getUserDisplayFullName(employee as User)} is nu beheerder.`);
                reloadPeople();
            },
            onError: () => {
                error('Beheerdersrechten toekennen mislukt. Probeer het opnieuw.');
            },
        });
    }

    function removeFromOrganization() {
        const name = getUserDisplayFullName(employee as User);

        if (
            !window.confirm(
                `${name} uit het bedrijf halen? Het account blijft bestaan, maar deze persoon verliest toegang tot teams en bedrijfsgegevens.`,
            )
        ) {
            return;
        }

        router.delete(removeOrganizationMember.url({ user: employee.id }), {
            preserveScroll: true,
            onSuccess: () => {
                success(`${name} is uit het bedrijf gehaald.`);
                reloadPeople();
            },
            onError: (errors) => {
                const message =
                    typeof errors.user === 'string'
                        ? errors.user
                        : 'Uit het bedrijf halen mislukt. Probeer het opnieuw.';
                error(message);
            },
        });
    }

    const actions: RowActionItem[] = [];

    if (!isSelf) {
        if (employee.role === 'employee') {
            actions.push({ label: 'Beheerder maken', onClick: grantAdmin });
        }

        actions.push({
            label: 'Uit bedrijf halen',
            onClick: removeFromOrganization,
            danger: true,
        });
    }

    return (
        <article className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <UserAvatar user={employee} className="size-11 text-sm" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{employee.name}</p>
                            <p className="truncate text-xs text-gray-500">{employee.email}</p>
                        </div>
                        {actions.length > 0 ? <RowActionsMenu items={actions} label="Medewerkeracties" /> : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500">{teamsLabel}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {roleLabel(employee.role)}
                </span>
                <TaskAvailabilityBadge
                    label={employee.task_availability_label}
                    availability={employee.task_availability}
                />
                <PresenceStatusBadge label={employee.status_label} status={employee.status} />
                {employee.leave_ends_on !== null ? (
                    <span className="text-xs text-gray-500">{formatLeaveUntil(employee.leave_ends_on)}</span>
                ) : null}
            </div>
        </article>
    );
}
